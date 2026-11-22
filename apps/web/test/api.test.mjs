import assert from "node:assert/strict";
import { test } from "node:test";

import { z } from "zod";

import {
  ApiError,
  errorResponse,
  toErrorResponse,
} from "../src/lib/api/errors.ts";
import { withApiHandler } from "../src/lib/api/handler.ts";
import { createIdempotencyStore } from "../src/lib/api/idempotency.ts";
import { paginate, parsePagination } from "../src/lib/api/pagination.ts";
import { createRateLimiter } from "../src/lib/api/rate-limit.ts";

const request = (path, init) =>
  new Request(`https://example.test${path}`, init);

const post = (body, headers = {}) =>
  request("/api/claims", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

test("error envelope uses stable codes and hides unknown errors", async () => {
  const forbidden = toErrorResponse(
    new ApiError("forbidden", "no access"),
    "req-1",
  );
  assert.equal(forbidden.status, 403);
  assert.deepEqual(await forbidden.json(), {
    error: {
      code: "forbidden",
      message: "no access",
      request_id: "req-1",
    },
  });

  const envelope = errorResponse("not_found", "Missing", "req-2");
  assert.equal(envelope.status, 404);

  const leaked = new Error("postgres://user:secret@host/db");
  const internal = toErrorResponse(leaked, "req-3");
  assert.equal(internal.status, 500);
  const body = await internal.text();
  assert.match(body, /Internal server error/);
  assert.doesNotMatch(body, /secret|postgres/);
});

test("Zod validation failures return 400 with field paths and no values", async () => {
  const logs = [];
  const handler = withApiHandler(
    {
      bodySchema: z.object({
        email: z.string().email(),
        servings: z.number().int().positive(),
      }),
      log: (entry) => logs.push(entry),
    },
    async () => Response.json({ ok: true }),
  );

  const response = await handler(
    post({ email: "not-an-email", servings: -1, password: "do-not-log-me" }),
  );
  assert.equal(response.status, 400);
  const { error } = await response.json();
  assert.equal(error.code, "validation_error");
  assert.deepEqual(
    error.details.map((issue) => issue.path),
    ["email", "servings"],
  );
  const text = JSON.stringify(logs) + JSON.stringify(error);
  assert.doesNotMatch(text, /do-not-log-me|not-an-email|-1/);
  assert.equal(logs[0].request_id, response.headers.get("x-request-id"));
  assert.equal(logs[0].status, 400);
});

test("idempotent POST replay returns the original result", async () => {
  const store = createIdempotencyStore();
  let calls = 0;
  const handler = withApiHandler({ idempotency: store }, async () =>
    Response.json({ calls: ++calls }),
  );

  const first = await handler(post({}, { "idempotency-key": "key-1" }));
  const replay = await handler(post({}, { "idempotency-key": "key-1" }));
  const other = await handler(post({}, { "idempotency-key": "key-2" }));

  assert.deepEqual(await first.json(), { calls: 1 });
  assert.deepEqual(await replay.json(), { calls: 1 });
  assert.equal(replay.status, first.status);
  assert.deepEqual(await other.json(), { calls: 2 });
  assert.notEqual(
    first.headers.get("x-request-id"),
    replay.headers.get("x-request-id"),
  );
});

test("logs carry a request id and never contain secrets from thrown errors", async () => {
  const logs = [];
  const handler = withApiHandler(
    { log: (entry) => logs.push(entry) },
    async () => {
      throw new Error("Authorization: Bearer super-secret-token");
    },
  );

  const response = await handler(post({ token: "super-secret-token" }));
  const text = await response.text();
  assert.equal(response.status, 500);
  assert.doesNotMatch(text, /super-secret-token|Bearer/);
  assert.doesNotMatch(JSON.stringify(logs), /super-secret-token|Bearer/);
  assert.equal(logs.length, 1);
  assert.equal(logs[0].request_id, response.headers.get("x-request-id"));
  assert.equal(logs[0].code, "internal_error");
});

test("rate limit hook rejects requests above the window", async () => {
  const handler = withApiHandler(
    {
      rateLimit: createRateLimiter({
        maxRequests: 1,
        windowMs: 1000,
        now: () => 0,
      }),
    },
    async () => Response.json({ ok: true }),
  );
  const headers = { "x-forwarded-for": "203.0.113.8" };
  const first = await handler(post({}, headers));
  const second = await handler(post({}, headers));
  assert.equal(first.status, 200);
  assert.equal(second.status, 429);
  assert.equal((await second.json()).error.code, "rate_limited");
});

test("pagination parses, clamps and slices", () => {
  assert.deepEqual(parsePagination(new URLSearchParams()), {
    page: 1,
    limit: 20,
    offset: 0,
  });
  assert.deepEqual(parsePagination(new URLSearchParams("page=3&limit=999")), {
    page: 3,
    limit: 100,
    offset: 200,
  });
  assert.deepEqual(parsePagination(new URLSearchParams("page=abc&limit=-5")), {
    page: 1,
    limit: 20,
    offset: 0,
  });

  const items = [1, 2, 3, 4, 5];
  assert.deepEqual(paginate(items, new URLSearchParams("page=2&limit=2")), {
    page: 2,
    limit: 2,
    offset: 2,
    total: 5,
    data: [3, 4],
  });
});
