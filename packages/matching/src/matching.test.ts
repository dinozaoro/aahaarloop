import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_MATCHING_WEIGHTS,
  haversineDistanceKm,
  matchDonationsForRecipient,
} from "./matching.ts";
import { matchDonationsForRecipient as publicMatch } from "./index.ts";
import type {
  DonationCandidate,
  MatchingConfig,
  MatchingWeights,
  RecipientRequest,
} from "./matching.ts";

const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;
const NOW = new Date("2026-11-21T10:00:00.000Z");

function at(offsetMs: number): Date {
  return new Date(NOW.getTime() + offsetMs);
}

function donation(
  overrides: Partial<DonationCandidate> = {}
): DonationCandidate {
  return {
    id: "donation-1",
    location: { latitude: 0, longitude: 0 },
    categories: ["produce"],
    storage: "ambient",
    totalServings: 100,
    availableServings: 100,
    totalWeightKg: 100,
    pickupDeadlineAt: at(24 * HOUR_MS),
    ...overrides,
  };
}

function recipient(
  overrides: Partial<RecipientRequest> = {}
): RecipientRequest {
  return {
    id: "recipient-1",
    location: { latitude: 0, longitude: 0 },
    needs: ["produce"],
    requiredServings: 100,
    storage: "ambient",
    transportCapacityKg: 1000,
    volunteerAvailability: [
      { start: at(-HOUR_MS), end: at(HOUR_MS) },
    ],
    ...overrides,
  };
}

function match(
  donations: readonly DonationCandidate[],
  options: { config?: MatchingConfig; recipient?: Partial<RecipientRequest> } = {}
) {
  return matchDonationsForRecipient(recipient(options.recipient), donations, {
    now: NOW,
    config: options.config,
  });
}

function only(weight: keyof MatchingWeights): MatchingConfig {
  return {
    weights: {
      urgency: 0,
      distance: 0,
      quantity: 0,
      needs: 0,
      availability: 0,
      logistics: 0,
      [weight]: 1,
    },
  };
}

function reasonsFor(result: ReturnType<typeof match>, donationId = "donation-1") {
  return result.excluded.find((entry) => entry.donationId === donationId)?.reasons;
}

describe("haversineDistanceKm", () => {
  it("returns zero for the same point", () => {
    assert.equal(
      haversineDistanceKm(
        { latitude: 10, longitude: 20 },
        { latitude: 10, longitude: 20 }
      ),
      0
    );
  });

  it("matches the known distance of one degree of latitude", () => {
    const distance = haversineDistanceKm(
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 1 }
    );

    assert.ok(Math.abs(distance - 111.195) < 0.01);
  });

  it("is symmetric", () => {
    const a = { latitude: -18.8792, longitude: 47.5079 };
    const b = { latitude: -20.1667, longitude: 57.5 };

    assert.equal(haversineDistanceKm(a, b), haversineDistanceKm(b, a));
  });
});

describe("matching components", () => {
  it("maps urgency levels to 100, 75, 50 and 25", () => {
    const cases = [
      { hours: 2, level: "critical", score: 100 },
      { hours: 4, level: "high", score: 75 },
      { hours: 8, level: "medium", score: 50 },
      { hours: 24, level: "low", score: 25 },
    ] as const;

    for (const entry of cases) {
      const result = match(
        [donation({ pickupDeadlineAt: at(entry.hours * HOUR_MS) })],
        { config: only("urgency") }
      );
      const best = result.matches[0];

      assert.ok(best, `expected an eligible match at ${entry.hours}h`);
      assert.equal(best.explanation.urgency.level, entry.level);
      assert.equal(best.totalScore, entry.score);
    }
  });

  it("normalizes distance between 0 and 100", () => {
    const near = match([donation()], { config: only("distance") });
    assert.equal(near.matches[0]?.totalScore, 100);

    const result = match(
      [donation({ location: { latitude: 0, longitude: 0.5 } })],
      { config: { ...only("distance"), maxDistanceKm: 100 } }
    );
    const best = result.matches[0];

    assert.ok(best);
    const expected = 100 * (1 - haversineDistanceKm(
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 0.5 }
    ) / 100);
    assert.ok(Math.abs(best.totalScore - expected) < 0.02);
  });

  it("scores partial quantity coverage", () => {
    const result = match([donation({ availableServings: 40 })], {
      config: only("quantity"),
    });
    const best = result.matches[0];

    assert.ok(best);
    assert.equal(best.claimableServings, 40);
    assert.equal(best.totalScore, 40);
  });

  it("scores full quantity coverage as 100", () => {
    const result = match([donation()], { config: only("quantity") });

    assert.equal(result.matches[0]?.totalScore, 100);
  });

  it("scores category coverage against recipient needs", () => {
    const result = match([donation({ categories: ["produce", "dairy"] })], {
      config: only("needs"),
      recipient: { needs: ["produce", "bakery"] },
    });
    const best = result.matches[0];

    assert.ok(best);
    assert.equal(best.totalScore, 50);
    assert.deepEqual(best.explanation.needs.matchedCategories, ["produce"]);
  });

  it("treats an empty needs list as fully compatible", () => {
    const result = match([donation({ categories: [] })], {
      config: only("needs"),
      recipient: { needs: [] },
    });

    assert.equal(result.matches[0]?.totalScore, 100);
  });

  it("scores volunteer availability at the reference instant", () => {
    const available = match([donation()], {
      config: only("availability"),
    });
    assert.equal(available.matches[0]?.totalScore, 100);
    assert.equal(
      available.matches[0]?.explanation.availability.availableNow,
      true
    );

    const unavailable = match([donation()], {
      config: only("availability"),
      recipient: {
        volunteerAvailability: [
          { start: at(24 * HOUR_MS), end: at(25 * HOUR_MS) },
        ],
      },
    });
    assert.equal(unavailable.matches[0]?.totalScore, 0);
    assert.equal(
      unavailable.matches[0]?.explanation.availability.availableNow,
      false
    );
  });

  it("scores transport capacity utilization", () => {
    const result = match([donation()], {
      config: only("logistics"),
      recipient: { transportCapacityKg: 200 },
    });
    const best = result.matches[0];

    assert.ok(best);
    assert.equal(best.totalScore, 50);
    assert.equal(best.explanation.logistics.claimedWeightKg, 100);
  });

  it("uses proportional weight for partial claims", () => {
    const result = match(
      [donation({ availableServings: 40, totalWeightKg: 100 })],
      { config: only("logistics"), recipient: { transportCapacityKg: 200 } }
    );
    const best = result.matches[0];

    assert.ok(best);
    assert.equal(best.claimableServings, 40);
    assert.equal(best.explanation.logistics.claimedWeightKg, 40);
    assert.equal(best.totalScore, 20);
  });
});

describe("weighted total", () => {
  it("computes the documented weighted score", () => {
    const result = match([donation()]);

    assert.equal(result.matches[0]?.totalScore, 73);
    assert.deepEqual(
      result.matches[0]?.explanation.urgency.weight,
      DEFAULT_MATCHING_WEIGHTS.urgency
    );
  });

  it("changes the ranking when weights change", () => {
    const urgent = donation({
      id: "urgent",
      location: { latitude: 0, longitude: 0.1 },
      pickupDeadlineAt: at(2 * HOUR_MS),
    });
    const near = donation({ id: "near" });

    assert.equal(match([urgent, near]).matches[0]?.donationId, "urgent");
    assert.equal(
      match([urgent, near], { config: only("urgency") }).matches[0]
        ?.donationId,
      "urgent"
    );
    assert.equal(
      match([urgent, near], { config: only("distance") }).matches[0]
        ?.donationId,
      "near"
    );
  });

  it("normalizes custom weights that do not sum to one", () => {
    const result = match([donation()], {
      config: { weights: { urgency: 2 } },
    });

    assert.ok(
      Math.abs(
        (result.matches[0]?.explanation.urgency.weight ?? 0) - 2 / 2.7
      ) < 0.0001
    );
  });
});

describe("hard filters", () => {
  it("excludes expired deadlines", () => {
    const result = match([
      donation({ pickupDeadlineAt: at(-HOUR_MS) }),
    ]);

    assert.equal(result.matches.length, 0);
    assert.deepEqual(reasonsFor(result), ["expired"]);
  });

  it("excludes deadlines consumed by handling and buffer", () => {
    const result = match([
      donation({ pickupDeadlineAt: at(20 * MINUTE_MS) }),
    ]);

    assert.equal(result.matches.length, 0);
    assert.deepEqual(reasonsFor(result), ["infeasible"]);
  });

  it("excludes donations without a deadline", () => {
    const result = match([
      donation({ pickupDeadlineAt: null, foodExpiryAt: null }),
    ]);

    assert.equal(result.matches.length, 0);
    assert.deepEqual(reasonsFor(result), ["unknown-deadline"]);
  });

  it("excludes donations beyond the distance limit", () => {
    const result = match([
      donation({ location: { latitude: 0, longitude: 1 } }),
    ]);

    assert.equal(result.matches.length, 0);
    assert.deepEqual(reasonsFor(result), ["distance"]);
  });

  it("excludes storage the recipient cannot provide", () => {
    const result = match([donation({ storage: "frozen" })]);

    assert.equal(result.matches.length, 0);
    assert.deepEqual(reasonsFor(result), ["storage"]);
  });

  it("excludes donations with no available servings", () => {
    const result = match([donation({ availableServings: 0 })]);

    assert.equal(result.matches.length, 0);
    assert.deepEqual(reasonsFor(result), ["quantity"]);
  });

  it("excludes partial claims when partial claims are disabled", () => {
    const result = match([donation({ availableServings: 40 })], {
      config: { allowPartialClaims: false },
    });

    assert.equal(result.matches.length, 0);
    assert.deepEqual(reasonsFor(result), ["quantity"]);
  });

  it("excludes donations that match no recipient need", () => {
    const result = match([donation({ categories: ["dairy"] })]);

    assert.equal(result.matches.length, 0);
    assert.deepEqual(reasonsFor(result), ["needs"]);
  });

  it("excludes donations heavier than the transport capacity", () => {
    const result = match([donation()], {
      recipient: { transportCapacityKg: 50 },
    });

    assert.equal(result.matches.length, 0);
    assert.deepEqual(reasonsFor(result), ["transport-capacity"]);
  });

  it("collects every failed hard filter", () => {
    const result = match([
      donation({
        location: { latitude: 0, longitude: 1 },
        storage: "frozen",
        pickupDeadlineAt: at(-HOUR_MS),
      }),
    ]);

    assert.equal(result.matches.length, 0);
    assert.deepEqual(reasonsFor(result), ["distance", "storage", "expired"]);
  });
});

describe("ordering and determinism", () => {
  it("breaks score ties by distance then donation id", () => {
    const result = match([
      donation({ id: "b" }),
      donation({ id: "a" }),
    ]);

    assert.deepEqual(
      result.matches.map((entry) => entry.donationId),
      ["a", "b"]
    );
  });

  it("returns the same result for the same inputs", () => {
    const donations = [
      donation({ id: "a" }),
      donation({ id: "b", location: { latitude: 0, longitude: 0.1 } }),
    ];
    const input = { now: NOW, config: { weights: { distance: 0.4 } } };

    assert.deepEqual(
      matchDonationsForRecipient(recipient(), donations, input),
      matchDonationsForRecipient(recipient(), donations, input)
    );
  });

  it("is exported from the package entry point", () => {
    assert.equal(publicMatch, matchDonationsForRecipient);
  });
});

describe("input validation", () => {
  it("rejects weights that are all zero", () => {
    assert.throws(
      () =>
        match([donation()], {
          config: {
            weights: {
              urgency: 0,
              distance: 0,
              quantity: 0,
              needs: 0,
              availability: 0,
              logistics: 0,
            },
          },
        }),
      /positive sum/
    );
  });

  it("rejects negative weights", () => {
    assert.throws(
      () => match([donation()], { config: { weights: { urgency: -1 } } }),
      /weights.urgency/
    );
  });

  it("rejects invalid config numbers", () => {
    assert.throws(
      () => match([donation()], { config: { maxDistanceKm: 0 } }),
      /maxDistanceKm/
    );
    assert.throws(
      () => match([donation()], { config: { averageSpeedKmh: 0 } }),
      /averageSpeedKmh/
    );
    assert.throws(
      () => match([donation()], { config: { handlingTimeMinutes: -1 } }),
      /handlingTimeMinutes/
    );
  });

  it("rejects invalid recipient values", () => {
    assert.throws(
      () => match([donation()], { recipient: { requiredServings: 0 } }),
      /requiredServings/
    );
    assert.throws(
      () => match([donation()], { recipient: { transportCapacityKg: -1 } }),
      /transportCapacityKg/
    );
    assert.throws(
      () =>
        match([donation()], {
          recipient: { location: { latitude: 91, longitude: 0 } },
        }),
      /latitude/
    );
  });

  it("rejects invalid donation values", () => {
    assert.throws(
      () => match([donation({ availableServings: 101 })]),
      /availableServings/
    );
    assert.throws(
      () => match([donation({ totalWeightKg: 0 })]),
      /totalWeightKg/
    );
    assert.throws(
      () => match([donation({ storage: "room" as never })]),
      /storage/
    );
  });

  it("rejects invalid availability windows", () => {
    assert.throws(
      () =>
        match([donation()], {
          recipient: {
            volunteerAvailability: [
              { start: at(HOUR_MS), end: at(HOUR_MS) },
            ],
          },
        }),
      /volunteerAvailability/
    );
  });

  it("rejects an ambiguous now", () => {
    assert.throws(
      () =>
        matchDonationsForRecipient(recipient(), [donation()], {
          now: "2026-11-21T10:00:00",
        }),
      /explicit timezone offset/
    );
  });
});
