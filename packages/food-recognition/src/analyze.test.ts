import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { analyzeDonationImage, type AnalyzeDeps } from "./analyze.ts";
import type { FoodRecognitionProvider } from "./provider.ts";
import type { AiAnalysis } from "./types.ts";

const fixedNow = () => new Date("2026-01-01T00:00:00Z");
const allow = { tryAcquire: () => true };

function makeStore() {
  const saved: AiAnalysis[] = [];
  return { saved, save(a: AiAnalysis) { saved.push(a); } };
}

function okProvider(confidence: number): FoodRecognitionProvider {
  return {
    name: "mock",
    model: "mock-1",
    recognize: async () => ({
      suggestions: [{ category: "produce", name: "apple", confidence }],
      provider: "mock",
      model: "mock-1",
    }),
  };
}

function deps(provider: FoodRecognitionProvider, extra: Partial<AnalyzeDeps> = {}, store = makeStore()): AnalyzeDeps {
  return { provider, limiter: allow, store, newId: () => "id-1", now: fixedNow, ...extra };
}

const input = { donationId: "d1", imageUrl: "https://example.test/a.jpg" };

describe("analyzeDonationImage", () => {
  it("returns suggested on high confidence and saves once", async () => {
    const store = makeStore();
    const res = await analyzeDonationImage(input, deps(okProvider(0.9), {}, store));
    assert.equal(res.status, "suggested");
    assert.equal(res.provider, "mock");
    assert.equal(res.model, "mock-1");
    assert.equal(res.source, "ai");
    assert.equal(res.confirmedByDonor, false);
    assert.equal(res.suggestions.length, 1);
    assert.equal(store.saved.length, 1);
  });

  it("returns low_confidence and keeps suggestions", async () => {
    const res = await analyzeDonationImage(input, deps(okProvider(0.2)));
    assert.equal(res.status, "low_confidence");
    assert.equal(res.suggestions.length, 1);
  });

  it("returns failed when the provider rejects", async () => {
    const provider: FoodRecognitionProvider = {
      name: "mock",
      model: "mock-1",
      recognize: async () => {
        throw new Error("boom");
      },
    };
    const res = await analyzeDonationImage(input, deps(provider));
    assert.equal(res.status, "failed");
    assert.deepEqual(res.suggestions, []);
  });

  it("returns failed when the provider times out", async () => {
    const provider: FoodRecognitionProvider = {
      name: "mock",
      model: "mock-1",
      recognize: (_input, { signal }) =>
        new Promise((_, reject) => signal.addEventListener("abort", () => reject(new Error("aborted")))),
    };
    const res = await analyzeDonationImage(input, deps(provider, { timeoutMs: 20 }));
    assert.equal(res.status, "failed");
  });

  it("returns failed without calling the provider when rate limited", async () => {
    let calls = 0;
    const provider: FoodRecognitionProvider = {
      name: "mock",
      model: "mock-1",
      recognize: async () => {
        calls++;
        return { suggestions: [], provider: "mock", model: "mock-1" };
      },
    };
    const res = await analyzeDonationImage(input, deps(provider, { limiter: { tryAcquire: () => false } }));
    assert.equal(res.status, "failed");
    assert.equal(calls, 0);
  });

  it("does not throw when the store fails", async () => {
    const store = {
      save() {
        throw new Error("db down");
      },
    };
    const res = await analyzeDonationImage(input, deps(okProvider(0.9), {}, store));
    assert.equal(res.status, "suggested");
  });
});

