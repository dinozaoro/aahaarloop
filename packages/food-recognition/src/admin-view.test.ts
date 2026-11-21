import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { toViewerAnalysis } from "./admin-view.ts";
import type { AiAnalysis } from "./types.ts";

const analysis: AiAnalysis = {
  id: "a1",
  donationId: "d1",
  status: "suggested",
  provider: "test",
  model: "m1",
  suggestions: [{ category: "bakery", name: "bread", confidence: 0.9 }],
  source: "ai",
  confirmedByDonor: false,
  createdAt: "2024-01-01T00:00:00.000Z",
  confirmation: null,
  imageAuthenticity: { status: "suspicious", signal: { provider: "sightengine", score: 0.95, signals: { ai_generated: 0.95 } } },
};

describe("toViewerAnalysis", () => {
  it("keeps imageAuthenticity for admins", () => {
    const view = toViewerAnalysis(analysis, "admin");
    assert.deepEqual(view.imageAuthenticity, analysis.imageAuthenticity);
    assert.equal(view, analysis);
  });

  it("removes imageAuthenticity for donors", () => {
    const view = toViewerAnalysis(analysis, "donor");
    assert.equal(view.imageAuthenticity, undefined);
    assert.equal(view.id, analysis.id);
  });

  it("removes imageAuthenticity for the public", () => {
    const view = toViewerAnalysis(analysis, "public");
    assert.equal(view.imageAuthenticity, undefined);
  });

  it("does not mutate the original analysis", () => {
    toViewerAnalysis(analysis, "donor");
    assert.ok(analysis.imageAuthenticity !== undefined);
  });
});
