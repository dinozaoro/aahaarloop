import assert from "node:assert/strict";
import test from "node:test";

import {
  analyzeDonationImage,
  getAuthenticity,
} from "../src/lib/uploads/authenticity.ts";

test("without credentials the check is unavailable and makes no request", async () => {
  const original = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return new Response("{}");
  };
  try {
    const result = await analyzeDonationImage("don-1", "https://x/y.jpg", {});
    assert.deepEqual(result, { status: "unavailable", signal: null });
    assert.equal(called, false);
  } finally {
    globalThis.fetch = original;
  }
});

test("a provider score becomes a stored suspicious signal", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({ status: "success", type: { ai_generated: 0.95 } }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  try {
    const result = await analyzeDonationImage("don-2", "https://x/y.jpg", {
      SIGHTENGINE_API_USER: "user",
      SIGHTENGINE_API_SECRET: "secret",
    });
    assert.equal(result.status, "suspicious");
    assert.equal(result.signal.provider, "sightengine");
    assert.equal(getAuthenticity("don-2").signal.score, 0.95);
  } finally {
    globalThis.fetch = original;
  }
});
