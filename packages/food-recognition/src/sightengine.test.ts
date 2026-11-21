import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { checkImageAuthenticity, buildSightengineRequestUrl } from "./sightengine.ts";
import type { SightengineClient, SightengineResponse } from "./sightengine.ts";
import type { RateLimiter } from "./rate-limit.ts";

const allowAll: RateLimiter = { tryAcquire: () => true };
const denyAll: RateLimiter = { tryAcquire: () => false };

function clientReturning(response: SightengineResponse): SightengineClient {
  return { check: async () => response };
}

const input = { donationId: "d1", imageUrl: "https://x/y.jpg" };

describe("checkImageAuthenticity", () => {
  it("flags a high ai_generated score as suspicious", async () => {
    const result = await checkImageAuthenticity(input, {
      client: clientReturning({ status: "success", type: { ai_generated: 0.95 } }),
      limiter: allowAll,
    });
    assert.equal(result.status, "suspicious");
    assert.equal(result.signal?.score, 0.95);
    assert.equal(result.signal?.signals.ai_generated, 0.95);
  });

  it("marks a low ai_generated score as clean", async () => {
    const result = await checkImageAuthenticity(input, {
      client: clientReturning({ status: "success", type: { ai_generated: 0.1 } }),
      limiter: allowAll,
    });
    assert.equal(result.status, "clean");
    assert.equal(result.signal?.score, 0.1);
  });

  it("returns unavailable and logs when the client rejects", async () => {
    const events: string[] = [];
    const client: SightengineClient = { check: async () => { throw new Error("network down"); } };
    const result = await checkImageAuthenticity(input, {
      client,
      limiter: allowAll,
      log: (event) => { events.push(event); },
    });
    assert.equal(result.status, "unavailable");
    assert.equal(result.signal, null);
    assert.ok(events.includes("sightengine.failed"));
  });

  it("returns unavailable when the provider status is failure", async () => {
    const result = await checkImageAuthenticity(input, {
      client: clientReturning({ status: "failure" }),
      limiter: allowAll,
    });
    assert.equal(result.status, "unavailable");
    assert.equal(result.signal, null);
  });

  it("skips the client entirely when rate limited", async () => {
    let calls = 0;
    const client: SightengineClient = {
      check: async () => { calls++; return { status: "success", type: { ai_generated: 0.1 } }; },
    };
    const result = await checkImageAuthenticity(input, { client, limiter: denyAll });
    assert.equal(result.status, "unavailable");
    assert.equal(calls, 0);
  });

  it("returns unavailable when the client never resolves before the timeout", async () => {
    const client: SightengineClient = {
      check: (_input, options) => new Promise<SightengineResponse>((_resolve, reject) => {
        options.signal.addEventListener("abort", () => reject(new Error("aborted")));
      }),
    };
    const result = await checkImageAuthenticity(input, { client, limiter: allowAll, timeoutMs: 20 });
    assert.equal(result.status, "unavailable");
    assert.equal(result.signal, null);
  });
});

describe("buildSightengineRequestUrl", () => {
  it("builds an encoded request URL", () => {
    const url = buildSightengineRequestUrl("u", "s", "https://x/y.jpg");
    assert.ok(url.startsWith("https://api.sightengine.com/1.0/check.json?"));
    assert.ok(url.includes("models=genai"));
    assert.ok(url.includes("url=https%3A%2F%2Fx%2Fy.jpg"));
  });
});
