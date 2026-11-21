// Algorithm and worked example: ../../../docs/matching-algorithms.md
export type UrgencyLevel = "low" | "medium" | "high" | "critical";
export type UrgencyStatus = "active" | "expired" | "infeasible" | "unknown";
export type Instant = Date | string;

export interface UrgencyInput {
  /** Earliest applicable food expiry across the donation items. */
  foodExpiryAt?: Instant | null;
  /** Operational pickup deadline. */
  pickupDeadlineAt?: Instant | null;
  /** Reference instant. Required so the calculation stays deterministic. */
  now: Instant;
  /** Estimated travel time in minutes. Defaults to 0. */
  travelTimeMinutes?: number;
  /** Estimated handling time in minutes. Defaults to 0. */
  handlingTimeMinutes?: number;
  /** Safety and logistics buffer in minutes. Defaults to 15. */
  bufferMinutes?: number;
}

export interface UrgencyResult {
  status: UrgencyStatus;
  level: UrgencyLevel | null;
  claimable: boolean;
  /** Earliest of the food expiry and pickup deadline, as an ISO 8601 UTC string. */
  effectiveDeadlineAt: string | null;
  /** Deadline minus now, travel, handling and buffer, in minutes. */
  remainingMinutes: number | null;
}

export const DEFAULT_SAFETY_BUFFER_MINUTES = 15;

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const ISO_WITH_OFFSET =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:?\d{2})$/;

export function toEpochMs(value: Instant, field: string): number {
  if (value instanceof Date) {
    const ms = value.getTime();
    if (Number.isNaN(ms)) {
      throw new TypeError(`${field} must be a valid Date`);
    }
    return ms;
  }

  if (typeof value !== "string" || !ISO_WITH_OFFSET.test(value)) {
    throw new TypeError(
      `${field} must be a Date or an ISO 8601 string with an explicit timezone offset`,
    );
  }

  const ms = Date.parse(value);
  if (Number.isNaN(ms)) {
    throw new TypeError(`${field} must be a valid date`);
  }
  return ms;
}

function toNonNegativeMinutes(
  value: number | undefined,
  field: string,
  fallback: number,
): number {
  if (value === undefined) {
    return fallback;
  }
  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError(`${field} must be a non-negative finite number`);
  }
  return value;
}

function classify(remainingMs: number): UrgencyLevel {
  if (remainingMs > 12 * HOUR_MS) {
    return "low";
  }
  if (remainingMs >= 6 * HOUR_MS) {
    return "medium";
  }
  if (remainingMs >= 3 * HOUR_MS) {
    return "high";
  }
  return "critical";
}

/**
 * Calculates urgency from the earliest operational deadline.
 *
 * `best_before_at` is deliberately not an input: it is a quality date, not a
 * safety deadline. All calculations use epoch milliseconds, so the result does
 * not depend on the host timezone.
 */
export function calculateUrgency(input: UrgencyInput): UrgencyResult {
  const nowMs = toEpochMs(input.now, "now");
  const travelMs =
    toNonNegativeMinutes(input.travelTimeMinutes, "travelTimeMinutes", 0) *
    MINUTE_MS;
  const handlingMs =
    toNonNegativeMinutes(input.handlingTimeMinutes, "handlingTimeMinutes", 0) *
    MINUTE_MS;
  const bufferMs =
    toNonNegativeMinutes(
      input.bufferMinutes,
      "bufferMinutes",
      DEFAULT_SAFETY_BUFFER_MINUTES,
    ) * MINUTE_MS;

  const foodExpiryMs =
    input.foodExpiryAt == null
      ? null
      : toEpochMs(input.foodExpiryAt, "foodExpiryAt");
  const pickupDeadlineMs =
    input.pickupDeadlineAt == null
      ? null
      : toEpochMs(input.pickupDeadlineAt, "pickupDeadlineAt");

  const deadlines = [foodExpiryMs, pickupDeadlineMs].filter(
    (value): value is number => value !== null,
  );

  if (deadlines.length === 0) {
    return {
      status: "unknown",
      level: null,
      claimable: false,
      effectiveDeadlineAt: null,
      remainingMinutes: null,
    };
  }

  const effectiveDeadlineMs = Math.min(...deadlines);
  const effectiveDeadlineAt = new Date(effectiveDeadlineMs).toISOString();
  const rawRemainingMs = effectiveDeadlineMs - nowMs;
  const remainingMs = rawRemainingMs - travelMs - handlingMs - bufferMs;
  const remainingMinutes = remainingMs / MINUTE_MS;

  if (rawRemainingMs <= 0) {
    return {
      status: "expired",
      level: "critical",
      claimable: false,
      effectiveDeadlineAt,
      remainingMinutes,
    };
  }

  if (remainingMs <= 0) {
    return {
      status: "infeasible",
      level: "critical",
      claimable: false,
      effectiveDeadlineAt,
      remainingMinutes,
    };
  }

  return {
    status: "active",
    level: classify(remainingMs),
    claimable: true,
    effectiveDeadlineAt,
    remainingMinutes,
  };
}
