import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { ConfirmationError, confirmSuggestion, isSaveable } from "./confirm.ts";
import type { AiAnalysis } from "./types.ts";

const now = () => new Date("2026-01-01T00:00:00Z");

function makeAnalysis(overrides: Partial<AiAnalysis> = {}): AiAnalysis {
  return {
    id: "id-1",
    donationId: "d1",
    status: "suggested",
    provider: "mock",
    model: "mock-1",
    suggestions: [
      { category: "produce", name: "apple", confidence: 0.9 },
      { category: "bakery", name: "bread", confidence: 0.6 },
    ],
    source: "ai",
    confirmedByDonor: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    confirmation: null,
    ...overrides,
  };
}

describe("confirmSuggestion", () => {
  it("accepts a suggestion without mutating the input", () => {
    const analysis = makeAnalysis();
    assert.equal(isSaveable(analysis), false);
    const confirmed = confirmSuggestion(analysis, { acceptedIndex: 0 }, now);
    assert.equal(confirmed.confirmedByDonor, true);
    assert.equal(confirmed.confirmation?.name, "apple");
    assert.equal(confirmed.confirmation?.acceptedIndex, 0);
    assert.equal(isSaveable(confirmed), true);
    assert.equal(analysis.confirmedByDonor, false);
  });

  it("throws on an out-of-range index", () => {
    assert.throws(() => confirmSuggestion(makeAnalysis(), { acceptedIndex: 5 }, now), ConfirmationError);
  });

  it("throws on a failed analysis", () => {
    const analysis = makeAnalysis({ status: "failed", suggestions: [] });
    assert.throws(() => confirmSuggestion(analysis, { acceptedIndex: 0 }, now), ConfirmationError);
  });

  it("throws on an empty edited name", () => {
    const decision = { edited: { category: "other" as const, name: "   " } };
    assert.throws(() => confirmSuggestion(makeAnalysis(), decision, now), ConfirmationError);
  });

  it("sets acceptedIndex to null for a valid edit", () => {
    const decision = { edited: { category: "snack" as const, name: "  cookies " } };
    const confirmed = confirmSuggestion(makeAnalysis(), decision, now);
    assert.equal(confirmed.confirmation?.acceptedIndex, null);
    assert.equal(confirmed.confirmation?.name, "cookies");
    assert.equal(confirmed.confirmation?.category, "snack");
  });
});
