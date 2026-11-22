import {
  DEFAULT_MATCHING_WEIGHTS,
  DEFAULT_SAFETY_BUFFER_MINUTES,
  DEFAULT_URGENCY_THRESHOLDS,
  type MatchingConfig,
  type MatchingWeights,
  type UrgencyThresholds,
} from "@aahaarloop/matching";

import { ApiError } from "../api/errors.ts";

export interface AdminConfig {
  city: string;
  donorSegment: string;
  urgencyThresholds: UrgencyThresholds;
  matchingWeights: MatchingWeights;
  safetyBufferMinutes: number;
}

export type AdminConfigPatch = {
  city?: string;
  donorSegment?: string;
  safetyBufferMinutes?: number;
  urgencyThresholds?: Partial<UrgencyThresholds>;
  matchingWeights?: Partial<MatchingWeights>;
};

/** Documented defaults: Bengaluru, all donors, 3/6/12h, engine defaults, 15m. */
export const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  city: "Bengaluru",
  donorSegment: "all",
  urgencyThresholds: { ...DEFAULT_URGENCY_THRESHOLDS },
  matchingWeights: { ...DEFAULT_MATCHING_WEIGHTS },
  safetyBufferMinutes: DEFAULT_SAFETY_BUFFER_MINUTES,
};

const WEIGHT_KEYS = Object.keys(DEFAULT_MATCHING_WEIGHTS) as Array<keyof MatchingWeights>;

function invalid(message: string): never {
  throw new ApiError("validation_error", message);
}

/** Validates the full config; partial patches are merged before validation. */
export function validateAdminConfig(value: AdminConfig): AdminConfig {
  if (typeof value.city !== "string" || value.city.trim() === "") {
    invalid("city must be a non-empty string");
  }
  if (typeof value.donorSegment !== "string" || value.donorSegment.trim() === "") {
    invalid("donorSegment must be a non-empty string");
  }

  const t = value.urgencyThresholds;
  if (
    !t ||
    !Number.isFinite(t.criticalHours) ||
    !Number.isFinite(t.highHours) ||
    !Number.isFinite(t.mediumHours) ||
    t.criticalHours <= 0 ||
    t.criticalHours >= t.highHours ||
    t.highHours >= t.mediumHours
  ) {
    invalid("urgencyThresholds must satisfy 0 < criticalHours < highHours < mediumHours");
  }

  const w = value.matchingWeights;
  if (!w) invalid("matchingWeights are required");
  let sum = 0;
  for (const key of WEIGHT_KEYS) {
    const weight = w[key];
    if (!Number.isFinite(weight) || weight < 0) {
      invalid(`matchingWeights.${key} must be a non-negative finite number`);
    }
    sum += weight;
  }
  if (sum <= 0) invalid("matchingWeights must have a positive sum");

  if (
    !Number.isFinite(value.safetyBufferMinutes) ||
    value.safetyBufferMinutes < 0
  ) {
    invalid("safetyBufferMinutes must be a non-negative finite number");
  }

  return {
    city: value.city.trim(),
    donorSegment: value.donorSegment.trim(),
    urgencyThresholds: {
      criticalHours: t.criticalHours,
      highHours: t.highHours,
      mediumHours: t.mediumHours,
    },
    matchingWeights: {
      urgency: w.urgency,
      distance: w.distance,
      quantity: w.quantity,
      needs: w.needs,
      availability: w.availability,
      logistics: w.logistics,
    },
    safetyBufferMinutes: value.safetyBufferMinutes,
  };
}

/** Maps the admin config into the matching engine's config shape. */
export function toMatchingConfig(config: AdminConfig): MatchingConfig {
  return {
    weights: { ...config.matchingWeights },
    bufferMinutes: config.safetyBufferMinutes,
    urgencyThresholds: { ...config.urgencyThresholds },
  };
}

export type ConfigListener = (config: AdminConfig) => void;

let current: AdminConfig = validateAdminConfig(DEFAULT_ADMIN_CONFIG);
let version = 1;
const listeners = new Set<ConfigListener>();

export function getAdminConfig(): AdminConfig {
  return current;
}

export function getConfigVersion(): number {
  return version;
}

export function onConfigChange(listener: ConfigListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Applies a validated patch and notifies dependents so caches can be cleared. */
export function updateAdminConfig(patch: AdminConfigPatch): AdminConfig {
  const merged: AdminConfig = {
    ...current,
    ...(patch.city !== undefined ? { city: patch.city } : {}),
    ...(patch.donorSegment !== undefined ? { donorSegment: patch.donorSegment } : {}),
    ...(patch.safetyBufferMinutes !== undefined
      ? { safetyBufferMinutes: patch.safetyBufferMinutes }
      : {}),
    urgencyThresholds: {
      ...current.urgencyThresholds,
      ...(patch.urgencyThresholds ?? {}),
    },
    matchingWeights: {
      ...current.matchingWeights,
      ...(patch.matchingWeights ?? {}),
    },
  };
  const next = validateAdminConfig(merged);
  if (JSON.stringify(next) === JSON.stringify(current)) return current;
  current = next;
  version += 1;
  for (const listener of listeners) listener(next);
  return next;
}
