import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { createRateLimiter } from "./rate-limit.ts";

describe("createRateLimiter", () => {
  it("limits per window and resets after windowMs", () => {
    let t = 0;
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 1000, now: () => t });
    assert.equal(limiter.tryAcquire("a"), true);
    assert.equal(limiter.tryAcquire("a"), true);
    assert.equal(limiter.tryAcquire("a"), false);
    t += 1000;
    assert.equal(limiter.tryAcquire("a"), true);
  });

  it("tracks keys independently", () => {
    let t = 0;
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 1000, now: () => t });
    assert.equal(limiter.tryAcquire("a"), true);
    assert.equal(limiter.tryAcquire("a"), false);
    assert.equal(limiter.tryAcquire("b"), true);
  });
});
