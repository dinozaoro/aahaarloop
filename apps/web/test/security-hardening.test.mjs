import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { DonationInputSchema } from "@aahaarloop/shared";

import { withApiHandler } from "../src/lib/api/handler.ts";
import { createDonationService } from "../src/lib/donations/service.ts";
import {
  isCrossOriginRequest,
  isUnsafeMethod,
} from "../src/lib/security/csrf.ts";
import { securityHeaders } from "../src/lib/security/headers.ts";

const req = (method, url, headers = {}) => new Request(url, { method, headers });

const donationInput = {
  title: "Surplus rice",
  total_servings: 10,
  available_servings: 10,
  food_expiry_at: "2026-11-23T18:00:00+03:00",
  pickup_deadline_at: "2026-11-22T20:00:00+03:00",
  pickup_location: {
    address: "12 MG Road, Bengaluru",
    point: { latitude: 12.97, longitude: 77.59 },
  },
  items: [
    {
      name: "Rice",
      category: "prepared",
      quantity: 10,
      unit: "serving",
      storage: "chilled",
      dietary_flags: [],
      allergens: [],
    },
  ],
};

function donationSetup() {
  const rows = [];
  const repo = {
    all: () => rows,
    find: (id) => rows.find((row) => row.id === id),
    save: (donation) => {
      const index = rows.findIndex((row) => row.id === donation.id);
      if (index === -1) rows.push(donation);
      else rows[index] = donation;
    },
  };
  const service = createDonationService(repo, () => "2026-11-21T12:00:00Z");
  return { rows, service };
}

test("security headers are present on all responses, HSTS only in production", () => {
  const dev = new Map(securityHeaders(false).map((header) => [header.key, header.value]));
  const prod = new Map(securityHeaders(true).map((header) => [header.key, header.value]));

  assert.equal(dev.get("X-Content-Type-Options"), "nosniff");
  assert.equal(dev.get("Referrer-Policy"), "strict-origin-when-cross-origin");
  assert.equal(dev.get("X-Frame-Options"), "DENY");
  assert.equal(dev.has("Strict-Transport-Security"), false);
  assert.match(prod.get("Strict-Transport-Security"), /max-age=31536000/);
  assert.match(prod.get("Permissions-Policy"), /camera=\(\)/);
});

test("next.config applies the security headers to every path", async () => {
  const source = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
  assert.match(source, /securityHeaders\(process\.env\.NODE_ENV === "production"\)/);
  assert.match(source, /source: "\/:path\*"/);
});

test("only state-changing methods are CSRF-sensitive", () => {
  for (const method of ["POST", "PUT", "PATCH", "DELETE", "post"]) {
    assert.equal(isUnsafeMethod(method), true, method);
  }
  for (const method of ["GET", "HEAD", "OPTIONS"]) {
    assert.equal(isUnsafeMethod(method), false, method);
  }
});

test("cross-origin detection matches same-origin and trusted proxy hosts", () => {
  const same = req("POST", "https://example.test/api/claims", { origin: "https://example.test" });
  assert.equal(isCrossOriginRequest(same), false);

  const proxied = req("POST", "http://localhost:3000/api/claims", {
    origin: "https://aahaarloop.example",
    "x-forwarded-host": "aahaarloop.example",
  });
  assert.equal(isCrossOriginRequest(proxied), false);

  const attacker = req("POST", "https://example.test/api/claims", { origin: "https://evil.test" });
  assert.equal(isCrossOriginRequest(attacker), true);

  const fakeOrigin = req("POST", "https://example.test/api/claims", { origin: "not-a-url" });
  assert.equal(isCrossOriginRequest(fakeOrigin), true);

  const noOrigin = req("POST", "https://example.test/api/claims");
  assert.equal(isCrossOriginRequest(noOrigin), false);
});

test("the API wrapper rejects cross-origin writes but allows reads", async () => {
  const handler = withApiHandler({}, async () => Response.json({ ok: true }));

  const blocked = await handler(
    req("POST", "https://example.test/api/claims", { origin: "https://evil.test" }),
  );
  assert.equal(blocked.status, 403);
  assert.equal((await blocked.json()).error.code, "forbidden");

  const allowed = await handler(
    req("POST", "https://example.test/api/claims", { origin: "https://example.test" }),
  );
  assert.equal(allowed.status, 200);

  const read = await handler(
    req("GET", "https://example.test/api/claims", { origin: "https://evil.test" }),
  );
  assert.equal(read.status, 200);
});

test("IDOR: a donation in another organization cannot be read, edited or published", async () => {
  const { service } = donationSetup();
  const donation = await service.create(DonationInputSchema.parse(donationInput), "org-a", "user-a");

  await assert.rejects(() => service.get(donation.id, "org-b"), /not found/);
  await assert.rejects(
    () => service.update(donation.id, "org-b", "attacker", { title: "stolen" }),
    /another organization/,
  );
  await assert.rejects(
    () => service.publish(donation.id, "org-b", "attacker"),
    /another organization/,
  );

  // The rightful organization still has full access.
  assert.equal((await service.get(donation.id, "org-a")).id, donation.id);
  assert.equal(
    (await service.update(donation.id, "org-a", "user-a", { title: "Fixed" })).title,
    "Fixed",
  );
});

test("protected API routes enforce a server-side guard", async () => {
  for (const file of [
    "../src/app/api/admin/audit/route.ts",
    "../src/app/api/admin/config/route.ts",
    "../src/app/api/admin/reports/route.ts",
    "../src/app/api/claims/route.ts",
    "../src/app/api/matches/route.ts",
    "../src/app/api/pickups/tasks/[id]/assign/route.ts",
  ]) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.match(source, /forbidUnlessRole|session\.user\.id/, file);
  }
});

test("abuse cases: report and upload routes are rate limited and uploads validated", async () => {
  const reports = await readFile(new URL("../src/app/api/reports/route.ts", import.meta.url), "utf8");
  assert.match(reports, /rateLimit: reportLimit/);
  const sign = await readFile(new URL("../src/app/api/uploads/sign/route.ts", import.meta.url), "utf8");
  assert.match(sign, /rateLimit: signLimit/);

  const upload = await readFile(new URL("../src/lib/uploads/cloudinary.ts", import.meta.url), "utf8");
  assert.match(upload, /mimeType: z\.enum\(ALLOWED_IMAGE_TYPES\)/);
  assert.match(upload, /MAX_IMAGE_BYTES/);
});
