import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calculateUrgency as publicCalculateUrgency } from "./index.ts";
import { calculateUrgency, DEFAULT_SAFETY_BUFFER_MINUTES } from "./urgency.ts";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const NOW = new Date("2026-11-21T10:00:00.000Z");

function at(offsetMs: number): Date {
  return new Date(NOW.getTime() + offsetMs);
}

function calculate(
  overrides: Partial<Parameters<typeof calculateUrgency>[0]> = {},
) {
  return calculateUrgency({
    now: NOW,
    travelTimeMinutes: 0,
    handlingTimeMinutes: 0,
    bufferMinutes: 0,
    ...overrides,
  });
}

describe("calculateUrgency boundaries", () => {
  it("returns low above 12 hours", () => {
    const result = calculate({ pickupDeadlineAt: at(12 * HOUR_MS + 1) });

    assert.equal(result.status, "active");
    assert.equal(result.level, "low");
    assert.equal(result.claimable, true);
  });

  it("returns medium at exactly 12 hours", () => {
    const result = calculate({ pickupDeadlineAt: at(12 * HOUR_MS) });

    assert.equal(result.level, "medium");
  });

  it("returns medium above 6 hours", () => {
    const result = calculate({ pickupDeadlineAt: at(6 * HOUR_MS + 1) });

    assert.equal(result.level, "medium");
  });

  it("returns medium at exactly 6 hours", () => {
    const result = calculate({ pickupDeadlineAt: at(6 * HOUR_MS) });

    assert.equal(result.level, "medium");
  });

  it("returns high below 6 hours", () => {
    const result = calculate({ pickupDeadlineAt: at(6 * HOUR_MS - 1) });

    assert.equal(result.level, "high");
  });

  it("returns high at exactly 3 hours", () => {
    const result = calculate({ pickupDeadlineAt: at(3 * HOUR_MS) });

    assert.equal(result.level, "high");
  });

  it("returns critical below 3 hours", () => {
    const result = calculate({ pickupDeadlineAt: at(3 * HOUR_MS - 1) });

    assert.equal(result.level, "critical");
  });

  it("returns critical for a one-millisecond margin", () => {
    const result = calculate({ pickupDeadlineAt: at(1) });

    assert.equal(result.status, "active");
    assert.equal(result.level, "critical");
    assert.equal(result.claimable, true);
  });
});

describe("calculateUrgency expired and infeasible", () => {
  it("marks a deadline at now as expired", () => {
    const result = calculate({ pickupDeadlineAt: NOW });

    assert.equal(result.status, "expired");
    assert.equal(result.level, "critical");
    assert.equal(result.claimable, false);
    assert.equal(result.remainingMinutes, 0);
  });

  it("marks a past deadline as expired", () => {
    const result = calculate({ pickupDeadlineAt: at(-1) });

    assert.equal(result.status, "expired");
    assert.equal(result.claimable, false);
    assert.ok(result.remainingMinutes !== null && result.remainingMinutes < 0);
  });

  it("marks a future deadline as infeasible when travel consumes the margin", () => {
    const result = calculate({
      pickupDeadlineAt: at(HOUR_MS),
      travelTimeMinutes: 60,
    });

    assert.equal(result.status, "infeasible");
    assert.equal(result.level, "critical");
    assert.equal(result.claimable, false);
    assert.equal(result.remainingMinutes, 0);
  });

  it("subtracts travel, handling and the default buffer", () => {
    const result = calculateUrgency({
      now: NOW,
      pickupDeadlineAt: at(10 * HOUR_MS),
      travelTimeMinutes: 60,
      handlingTimeMinutes: 30,
    });

    assert.equal(result.remainingMinutes, 495);
    assert.equal(result.level, "medium");
  });

  it("applies the 15-minute default buffer", () => {
    const result = calculateUrgency({
      now: NOW,
      pickupDeadlineAt: at(15 * MINUTE_MS),
    });

    assert.equal(result.status, "infeasible");
    assert.equal(result.remainingMinutes, 0);
    assert.equal(DEFAULT_SAFETY_BUFFER_MINUTES, 15);
  });

  it("applies a custom buffer", () => {
    const result = calculate({
      pickupDeadlineAt: at(2 * HOUR_MS),
      bufferMinutes: 30,
    });

    assert.equal(result.remainingMinutes, 90);
    assert.equal(result.level, "critical");
  });
});

describe("calculateUrgency effective deadline", () => {
  it("uses the earlier food expiry", () => {
    const result = calculate({
      foodExpiryAt: at(2 * HOUR_MS),
      pickupDeadlineAt: at(8 * HOUR_MS),
    });

    assert.equal(result.effectiveDeadlineAt, at(2 * HOUR_MS).toISOString());
    assert.equal(result.level, "critical");
  });

  it("uses the earlier pickup deadline", () => {
    const result = calculate({
      foodExpiryAt: at(8 * HOUR_MS),
      pickupDeadlineAt: at(2 * HOUR_MS),
    });

    assert.equal(result.effectiveDeadlineAt, at(2 * HOUR_MS).toISOString());
    assert.equal(result.level, "critical");
  });

  it("uses the only deadline provided", () => {
    const result = calculate({ foodExpiryAt: at(5 * HOUR_MS) });

    assert.equal(result.effectiveDeadlineAt, at(5 * HOUR_MS).toISOString());
    assert.equal(result.level, "high");
  });

  it("treats equal deadlines as one deadline", () => {
    const result = calculate({
      foodExpiryAt: at(4 * HOUR_MS),
      pickupDeadlineAt: at(4 * HOUR_MS),
    });

    assert.equal(result.effectiveDeadlineAt, at(4 * HOUR_MS).toISOString());
    assert.equal(result.level, "high");
  });

  it("returns expired when the food expiry is already past", () => {
    const result = calculate({
      foodExpiryAt: at(-HOUR_MS),
      pickupDeadlineAt: at(5 * HOUR_MS),
    });

    assert.equal(result.status, "expired");
    assert.equal(result.claimable, false);
  });

  it("returns unknown when no deadline is provided", () => {
    const result = calculate();

    assert.deepEqual(result, {
      status: "unknown",
      level: null,
      claimable: false,
      effectiveDeadlineAt: null,
      remainingMinutes: null,
    });
  });
});

describe("calculateUrgency timezones", () => {
  it("treats equivalent instants identically", () => {
    const utc = calculate({
      now: "2026-11-21T10:00:00Z",
      pickupDeadlineAt: "2026-11-21T16:00:00Z",
    });
    const offset = calculate({
      now: "2026-11-21T15:30:00+05:30",
      pickupDeadlineAt: "2026-11-21T21:30:00+05:30",
    });

    assert.deepEqual(utc, offset);
    assert.equal(utc.effectiveDeadlineAt, "2026-11-21T16:00:00.000Z");
  });

  it("accepts offsets without a colon", () => {
    const withColon = calculate({
      pickupDeadlineAt: "2026-11-21T16:00:00+05:30",
    });
    const withoutColon = calculate({
      pickupDeadlineAt: "2026-11-21T16:00:00+0530",
    });

    assert.deepEqual(withColon, withoutColon);
  });

  it("rejects an ISO string without an explicit offset", () => {
    assert.throws(
      () => calculate({ pickupDeadlineAt: "2026-11-21T16:00:00" }),
      /explicit timezone offset/,
    );
  });

  it("rejects an invalid Date", () => {
    assert.throws(
      () => calculate({ pickupDeadlineAt: new Date(Number.NaN) }),
      /valid Date/,
    );
  });

  it("rejects an impossible ISO date", () => {
    assert.throws(
      () => calculate({ pickupDeadlineAt: "2026-13-01T00:00:00Z" }),
      /valid date/,
    );
  });
});

describe("calculateUrgency input validation", () => {
  it("rejects negative durations", () => {
    assert.throws(
      () => calculate({ travelTimeMinutes: -1 }),
      /travelTimeMinutes/,
    );
    assert.throws(
      () => calculate({ handlingTimeMinutes: -1 }),
      /handlingTimeMinutes/,
    );
    assert.throws(() => calculate({ bufferMinutes: -1 }), /bufferMinutes/);
  });

  it("rejects non-finite durations", () => {
    assert.throws(
      () => calculate({ travelTimeMinutes: Number.NaN }),
      /travelTimeMinutes/,
    );
    assert.throws(
      () => calculate({ bufferMinutes: Number.POSITIVE_INFINITY }),
      /bufferMinutes/,
    );
  });

  it("rejects an invalid now", () => {
    assert.throws(() => calculateUrgency({ now: "not-a-date" }), /now/);
  });
});

describe("calculateUrgency determinism and public API", () => {
  it("returns the same result for the same inputs", () => {
    const input = {
      now: NOW,
      foodExpiryAt: at(4 * HOUR_MS),
      pickupDeadlineAt: at(9 * HOUR_MS),
      travelTimeMinutes: 20,
      handlingTimeMinutes: 10,
      bufferMinutes: 5,
    };

    assert.deepEqual(calculateUrgency(input), calculateUrgency(input));
  });

  it("is exported from the package entry point", () => {
    assert.equal(publicCalculateUrgency, calculateUrgency);
  });
});
