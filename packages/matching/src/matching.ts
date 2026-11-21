import {
  calculateUrgency,
  DEFAULT_SAFETY_BUFFER_MINUTES,
  toEpochMs,
} from "./urgency.ts";
import type { Instant, UrgencyLevel } from "./urgency.ts";

export const STORAGE_RANK = {
  ambient: 0,
  chilled: 1,
  frozen: 2,
} as const;

export type StorageType = keyof typeof STORAGE_RANK;

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface TimeWindow {
  start: Instant;
  end: Instant;
}

export interface DonationCandidate {
  id: string;
  location: GeoPoint;
  categories: readonly string[];
  /** Storage the food requires after pickup. */
  storage: StorageType;
  totalServings: number;
  /** Servings still unclaimed. */
  availableServings: number;
  totalWeightKg: number;
  foodExpiryAt?: Instant | null;
  pickupDeadlineAt?: Instant | null;
}

export interface RecipientRequest {
  id: string;
  location: GeoPoint;
  /** Accepted food categories. Empty means no category preference. */
  needs: readonly string[];
  requiredServings: number;
  /** Best storage the recipient can provide. */
  storage: StorageType;
  transportCapacityKg: number;
  volunteerAvailability: readonly TimeWindow[];
}

export interface MatchingWeights {
  urgency: number;
  distance: number;
  quantity: number;
  needs: number;
  availability: number;
  logistics: number;
}

export const DEFAULT_MATCHING_WEIGHTS: MatchingWeights = {
  urgency: 0.3,
  distance: 0.25,
  quantity: 0.15,
  needs: 0.15,
  availability: 0.1,
  logistics: 0.05,
};

export interface MatchingConfig {
  /** Missing keys fall back to DEFAULT_MATCHING_WEIGHTS. */
  weights?: Partial<MatchingWeights>;
  /** Hard distance limit in kilometres. Defaults to 25. */
  maxDistanceKm?: number;
  /** Used to derive travel time from the haversine distance. Defaults to 25. */
  averageSpeedKmh?: number;
  /** Handling time passed to the urgency calculation. Defaults to 10. */
  handlingTimeMinutes?: number;
  /** Safety buffer passed to the urgency calculation. Defaults to 15. */
  bufferMinutes?: number;
  /** When false, a donation must cover the full need. Defaults to true. */
  allowPartialClaims?: boolean;
}

export type ExclusionReason =
  | "expired"
  | "infeasible"
  | "unknown-deadline"
  | "distance"
  | "storage"
  | "quantity"
  | "needs"
  | "transport-capacity";

export interface ComponentScore {
  /** Normalized 0–100. */
  score: number;
  /** Normalized weight, summing to 1 across all components. */
  weight: number;
  /** weight × score, on the 0–100 total scale. */
  contribution: number;
}

export interface MatchExplanation {
  urgency: ComponentScore & {
    level: UrgencyLevel;
    remainingMinutes: number;
    travelTimeMinutes: number;
  };
  distance: ComponentScore & { distanceKm: number };
  quantity: ComponentScore & { claimableServings: number };
  needs: ComponentScore & { matchedCategories: string[] };
  availability: ComponentScore & { availableNow: boolean };
  logistics: ComponentScore & {
    claimedWeightKg: number;
    transportCapacityKg: number;
  };
}

export interface EligibleMatch {
  eligible: true;
  donationId: string;
  recipientId: string;
  totalScore: number;
  claimableServings: number;
  explanation: MatchExplanation;
}

export interface ExcludedMatch {
  eligible: false;
  donationId: string;
  recipientId: string;
  reasons: ExclusionReason[];
}

export interface MatchResult {
  /** Eligible matches, best first. */
  matches: EligibleMatch[];
  excluded: ExcludedMatch[];
}

const WEIGHT_KEYS = [
  "urgency",
  "distance",
  "quantity",
  "needs",
  "availability",
  "logistics",
] as const;

type WeightKey = (typeof WEIGHT_KEYS)[number];

/** Urgency is a deterministic level, so its 0–100 score is a fixed mapping. */
const URGENCY_SCORE: Record<UrgencyLevel, number> = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25,
};

const EARTH_RADIUS_KM = 6371.0088;

interface ResolvedConfig {
  weights: MatchingWeights;
  maxDistanceKm: number;
  averageSpeedKmh: number;
  handlingTimeMinutes: number;
  bufferMinutes: number;
  allowPartialClaims: boolean;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function assertPositive(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new TypeError(`${field} must be a positive finite number`);
  }
  return value;
}

function assertNonNegative(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError(`${field} must be a non-negative finite number`);
  }
  return value;
}

function assertGeoPoint(point: GeoPoint, field: string): void {
  if (
    !Number.isFinite(point.latitude) ||
    point.latitude < -90 ||
    point.latitude > 90
  ) {
    throw new TypeError(`${field}.latitude must be between -90 and 90`);
  }
  if (
    !Number.isFinite(point.longitude) ||
    point.longitude < -180 ||
    point.longitude > 180
  ) {
    throw new TypeError(`${field}.longitude must be between -180 and 180`);
  }
}

function assertStorage(value: StorageType, field: string): void {
  if (!Object.hasOwn(STORAGE_RANK, value)) {
    throw new TypeError(`${field} must be ambient, chilled or frozen`);
  }
}

function resolveWeights(
  overrides: Partial<MatchingWeights> | undefined,
): MatchingWeights {
  const merged = { ...DEFAULT_MATCHING_WEIGHTS, ...overrides };
  let total = 0;

  for (const key of WEIGHT_KEYS) {
    const value = merged[key];
    if (!Number.isFinite(value) || value < 0) {
      throw new TypeError(
        `weights.${key} must be a non-negative finite number`,
      );
    }
    total += value;
  }

  if (total <= 0) {
    throw new TypeError("weights must have a positive sum");
  }

  const normalized = {} as MatchingWeights;
  for (const key of WEIGHT_KEYS) {
    normalized[key] = merged[key] / total;
  }
  return normalized;
}

function resolveConfig(config: MatchingConfig | undefined): ResolvedConfig {
  const input = config ?? {};
  return {
    weights: resolveWeights(input.weights),
    maxDistanceKm: assertPositive(input.maxDistanceKm ?? 25, "maxDistanceKm"),
    averageSpeedKmh: assertPositive(
      input.averageSpeedKmh ?? 25,
      "averageSpeedKmh",
    ),
    handlingTimeMinutes: assertNonNegative(
      input.handlingTimeMinutes ?? 10,
      "handlingTimeMinutes",
    ),
    bufferMinutes: assertNonNegative(
      input.bufferMinutes ?? DEFAULT_SAFETY_BUFFER_MINUTES,
      "bufferMinutes",
    ),
    allowPartialClaims: input.allowPartialClaims ?? true,
  };
}

function parseWindows(
  windows: readonly TimeWindow[],
): Array<{ start: number; end: number }> {
  return windows.map((window, index) => {
    const start = toEpochMs(
      window.start,
      `volunteerAvailability[${index}].start`,
    );
    const end = toEpochMs(window.end, `volunteerAvailability[${index}].end`);
    if (end <= start) {
      throw new TypeError(
        `volunteerAvailability[${index}] must end after it starts`,
      );
    }
    return { start, end };
  });
}

function score(value: number, weight: number): ComponentScore {
  const normalizedScore = round2(clamp(value));
  return {
    score: normalizedScore,
    weight: round4(weight),
    contribution: round2(normalizedScore * weight),
  };
}

function componentScore(explanation: MatchExplanation, key: WeightKey): number {
  return explanation[key].contribution;
}

export function haversineDistanceKm(a: GeoPoint, b: GeoPoint): number {
  assertGeoPoint(a, "a");
  assertGeoPoint(b, "b");

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const deltaLat = toRadians(b.latitude - a.latitude);
  const deltaLng = toRadians(b.longitude - a.longitude);

  const h =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Ranks donations for one recipient.
 *
 * Hard filters (time feasibility, distance, storage, quantity, needs and
 * transport capacity) run before scoring. Every remaining donation receives a
 * 0–100 score per component and an explanation payload. The function is pure
 * and does not use an LLM.
 */
export function matchDonationsForRecipient(
  recipient: RecipientRequest,
  donations: readonly DonationCandidate[],
  options: { now: Instant; config?: MatchingConfig },
): MatchResult {
  const config = resolveConfig(options.config);
  const nowMs = toEpochMs(options.now, "now");

  assertGeoPoint(recipient.location, "recipient.location");
  assertStorage(recipient.storage, "recipient.storage");
  const requiredServings = assertPositive(
    recipient.requiredServings,
    "recipient.requiredServings",
  );
  const transportCapacityKg = assertNonNegative(
    recipient.transportCapacityKg,
    "recipient.transportCapacityKg",
  );
  const availability = parseWindows(recipient.volunteerAvailability);
  const needs = [...new Set(recipient.needs)];
  const needsSet = new Set(needs);

  const matches: EligibleMatch[] = [];
  const excluded: ExcludedMatch[] = [];

  for (const donation of donations) {
    assertGeoPoint(donation.location, `donation ${donation.id} location`);
    assertStorage(donation.storage, `donation ${donation.id} storage`);
    const totalServings = assertPositive(
      donation.totalServings,
      `donation ${donation.id} totalServings`,
    );
    const availableServings = assertNonNegative(
      donation.availableServings,
      `donation ${donation.id} availableServings`,
    );
    if (availableServings > totalServings) {
      throw new TypeError(
        `donation ${donation.id} availableServings cannot exceed totalServings`,
      );
    }
    const totalWeightKg = assertPositive(
      donation.totalWeightKg,
      `donation ${donation.id} totalWeightKg`,
    );

    const reasons: ExclusionReason[] = [];

    const distanceKm = haversineDistanceKm(
      recipient.location,
      donation.location,
    );
    if (distanceKm > config.maxDistanceKm) {
      reasons.push("distance");
    }

    if (STORAGE_RANK[donation.storage] > STORAGE_RANK[recipient.storage]) {
      reasons.push("storage");
    }

    const claimableServings = Math.min(availableServings, requiredServings);
    if (claimableServings <= 0) {
      reasons.push("quantity");
    } else if (
      !config.allowPartialClaims &&
      availableServings < requiredServings
    ) {
      reasons.push("quantity");
    }

    const matchedCategories = [
      ...new Set(
        donation.categories.filter((category) => needsSet.has(category)),
      ),
    ];
    if (needs.length > 0 && matchedCategories.length === 0) {
      reasons.push("needs");
    }

    const travelTimeMinutes = (distanceKm / config.averageSpeedKmh) * 60;
    const urgency = calculateUrgency({
      now: options.now,
      foodExpiryAt: donation.foodExpiryAt,
      pickupDeadlineAt: donation.pickupDeadlineAt,
      travelTimeMinutes,
      handlingTimeMinutes: config.handlingTimeMinutes,
      bufferMinutes: config.bufferMinutes,
    });

    if (urgency.status === "expired") {
      reasons.push("expired");
    } else if (urgency.status === "infeasible") {
      reasons.push("infeasible");
    } else if (urgency.status === "unknown") {
      reasons.push("unknown-deadline");
    }

    const claimedWeightKg = (totalWeightKg * claimableServings) / totalServings;
    if (claimedWeightKg > transportCapacityKg) {
      reasons.push("transport-capacity");
    }

    if (reasons.length > 0) {
      excluded.push({
        eligible: false,
        donationId: donation.id,
        recipientId: recipient.id,
        reasons,
      });
      continue;
    }

    const availableNow = availability.some(
      (window) => nowMs >= window.start && nowMs <= window.end,
    );

    const explanation: MatchExplanation = {
      urgency: {
        ...score(
          URGENCY_SCORE[urgency.level ?? "critical"],
          config.weights.urgency,
        ),
        level: urgency.level ?? "critical",
        remainingMinutes: round2(urgency.remainingMinutes ?? 0),
        travelTimeMinutes: round2(travelTimeMinutes),
      },
      distance: {
        ...score(
          (1 - distanceKm / config.maxDistanceKm) * 100,
          config.weights.distance,
        ),
        distanceKm: round2(distanceKm),
      },
      quantity: {
        ...score(
          (claimableServings / requiredServings) * 100,
          config.weights.quantity,
        ),
        claimableServings,
      },
      needs: {
        ...score(
          needs.length === 0
            ? 100
            : (matchedCategories.length / needs.length) * 100,
          config.weights.needs,
        ),
        matchedCategories,
      },
      availability: {
        ...score(availableNow ? 100 : 0, config.weights.availability),
        availableNow,
      },
      logistics: {
        ...score(
          transportCapacityKg === 0
            ? 0
            : (claimedWeightKg / transportCapacityKg) * 100,
          config.weights.logistics,
        ),
        claimedWeightKg: round2(claimedWeightKg),
        transportCapacityKg,
      },
    };

    const totalScore = round2(
      WEIGHT_KEYS.reduce(
        (sum, key) => sum + componentScore(explanation, key),
        0,
      ),
    );

    matches.push({
      eligible: true,
      donationId: donation.id,
      recipientId: recipient.id,
      totalScore,
      claimableServings,
      explanation,
    });
  }

  matches.sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    const distanceA = a.explanation.distance.distanceKm;
    const distanceB = b.explanation.distance.distanceKm;
    if (distanceA !== distanceB) {
      return distanceA - distanceB;
    }
    return a.donationId < b.donationId
      ? -1
      : a.donationId > b.donationId
        ? 1
        : 0;
  });

  return { matches, excluded };
}
