import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { publishDonation } from "./publish.ts";
import type { FoodRecognitionProvider } from "./provider.ts";

const limiter = { tryAcquire: () => true };
const store = { save() {} };
const now = () => new Date("2026-01-01T00:00:00Z");
const input = { donationId: "d1", imageUrl: "https://example.test/a.jpg" };

function provider(fail: boolean): FoodRecognitionProvider {
  return {
    name: "mock",
    model: "mock-1",
    recognize: async () => {
      if (fail) throw new Error("boom");
      return {
        suggestions: [{ category: "produce", name: "apple", confidence: 0.9 }],
        provider: "mock",
        model: "mock-1",
      };
    },
  };
}

function deps(p: FoodRecognitionProvider, published: string[]) {
  return {
    publish: async (id: string) => {
      published.push(id);
    },
    analyze: { provider: p, limiter, store, newId: () => "id-1", now },
  };
}

describe("publishDonation", () => {
  it("publishes even when analysis fails", async () => {
    const published: string[] = [];
    const res = await publishDonation(input, deps(provider(true), published));
    assert.equal(res.published, true);
    assert.equal(res.analysis.status, "failed");
    assert.deepEqual(published, ["d1"]);
  });

  it("publishes when analysis succeeds", async () => {
    const published: string[] = [];
    const res = await publishDonation(input, deps(provider(false), published));
    assert.equal(res.published, true);
    assert.equal(res.analysis.status, "suggested");
    assert.deepEqual(published, ["d1"]);
  });
});
