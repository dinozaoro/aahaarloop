// Volunteer profile and mission eligibility rules. The web and mobile apps
// reuse these instead of each defining their own availability arithmetic.
import { haversineDistanceKm } from "./matching.ts";
import type { GeoPoint, RecipientRequest, TimeWindow } from "./matching.ts";
import type { Instant } from "./urgency.ts";
import { toEpochMs } from "./urgency.ts";

export type TransportMode =
  | "walking"
  | "bicycle"
  | "motorcycle"
  | "car"
  | "van";

export const TRANSPORT_MODES: readonly TransportMode[] = [
  "walking",
  "bicycle",
  "motorcycle",
  "car",
  "van",
];

export const TRANSPORT_MODE_LABELS: Record<TransportMode, string> = {
  walking: "Walking",
  bicycle: "Bicycle",
  motorcycle: "Motorcycle",
  car: "Car",
  van: "Van",
};

export interface ServiceArea {
  center: GeoPoint;
  radiusKm: number;
}

export interface VolunteerProfile {
  id: string;
  displayName: string;
  transportMode: TransportMode;
  transportCapacityKg: number;
  serviceArea: ServiceArea;
  availability: readonly TimeWindow[];
  /** Set by the platform, never by the profile form. */
  verified: boolean;
  createdAt: Instant;
  updatedAt: Instant;
}

export interface VolunteerProfileInput {
  displayName: string;
  transportMode: TransportMode;
  transportCapacityKg: number;
  serviceArea: ServiceArea;
  availability: readonly TimeWindow[];
}

export interface VolunteerValidationError {
  field: string;
  message: string;
}

export interface MissionRequirement {
  pickupLocation: GeoPoint;
  weightKg: number;
  /** A volunteer must be free for the whole pickup window. */
  pickupWindow: TimeWindow;
}

function validateGeoPoint(
  point: GeoPoint,
  field: string,
  errors: VolunteerValidationError[],
): void {
  if (
    !Number.isFinite(point?.latitude) ||
    point.latitude < -90 ||
    point.latitude > 90
  ) {
    errors.push({ field: `${field}.latitude`, message: "Latitude must be between -90 and 90" });
  }
  if (
    !Number.isFinite(point?.longitude) ||
    point.longitude < -180 ||
    point.longitude > 180
  ) {
    errors.push({
      field: `${field}.longitude`,
      message: "Longitude must be between -180 and 180",
    });
  }
}

function validateWindow(
  window: TimeWindow,
  field: string,
  errors: VolunteerValidationError[],
): void {
  try {
    const start = toEpochMs(window.start, `${field}.start`);
    const end = toEpochMs(window.end, `${field}.end`);
    if (end <= start) {
      errors.push({ field, message: `${field} must end after it starts` });
    }
  } catch (error) {
    errors.push({
      field,
      message: error instanceof Error ? error.message : "Invalid window",
    });
  }
}

export function validateVolunteerProfile(
  input: VolunteerProfileInput,
): VolunteerValidationError[] {
  const errors: VolunteerValidationError[] = [];

  if (!input.displayName?.trim()) {
    errors.push({ field: "displayName", message: "Display name is required" });
  }
  if (!TRANSPORT_MODES.includes(input.transportMode)) {
    errors.push({
      field: "transportMode",
      message: "Choose a supported transport mode",
    });
  }
  if (
    !Number.isFinite(input.transportCapacityKg) ||
    input.transportCapacityKg <= 0
  ) {
    errors.push({
      field: "transportCapacityKg",
      message: "Capacity must be a positive number of kilograms",
    });
  }
  if (
    !Number.isFinite(input.serviceArea?.radiusKm) ||
    input.serviceArea.radiusKm <= 0
  ) {
    errors.push({
      field: "serviceArea.radiusKm",
      message: "Service radius must be a positive number of kilometres",
    });
  }
  validateGeoPoint(input.serviceArea?.center, "serviceArea.center", errors);
  input.availability.forEach((window, index) =>
    validateWindow(window, `availability[${index}]`, errors),
  );

  return errors;
}

export function createVolunteerProfile(
  input: VolunteerProfileInput,
  now: Instant,
): { profile: VolunteerProfile | null; errors: VolunteerValidationError[] } {
  const errors = validateVolunteerProfile(input);
  if (errors.length > 0) {
    return { profile: null, errors };
  }
  const timestamp = new Date(toEpochMs(now, "now")).toISOString();
  return {
    profile: {
      id: `volunteer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      displayName: input.displayName.trim(),
      transportMode: input.transportMode,
      transportCapacityKg: input.transportCapacityKg,
      serviceArea: input.serviceArea,
      availability: input.availability,
      verified: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    errors: [],
  };
}

export function editVolunteerProfile(
  profile: VolunteerProfile,
  input: VolunteerProfileInput,
  now: Instant,
): { profile: VolunteerProfile | null; errors: VolunteerValidationError[] } {
  const errors = validateVolunteerProfile(input);
  if (errors.length > 0) {
    return { profile: null, errors };
  }
  return {
    profile: {
      ...profile,
      displayName: input.displayName.trim(),
      transportMode: input.transportMode,
      transportCapacityKg: input.transportCapacityKg,
      serviceArea: input.serviceArea,
      availability: input.availability,
      updatedAt: new Date(toEpochMs(now, "now")).toISOString(),
    },
    errors: [],
  };
}

/** The matching engine reads capacity and windows from the recipient request. */
export function getMatchingVolunteerFields(
  profile: VolunteerProfile,
): Pick<RecipientRequest, "transportCapacityKg" | "volunteerAvailability"> {
  return {
    transportCapacityKg: profile.transportCapacityKg,
    volunteerAvailability: profile.availability,
  };
}

export function isVolunteerAvailable(
  profile: VolunteerProfile,
  at: Instant,
): boolean {
  const atMs = toEpochMs(at, "at");
  return profile.availability.some((window) => {
    const start = toEpochMs(window.start, "availability.start");
    const end = toEpochMs(window.end, "availability.end");
    return atMs >= start && atMs <= end;
  });
}

/**
 * Mission assignment gate used by the mission list. Verification, capacity,
 * the full pickup window and the pickup location must all be covered.
 */
export function canAcceptMission(
  profile: VolunteerProfile,
  mission: MissionRequirement,
): boolean {
  if (!profile.verified || !Number.isFinite(mission.weightKg)) {
    return false;
  }
  if (mission.weightKg <= 0 || mission.weightKg > profile.transportCapacityKg) {
    return false;
  }

  try {
    const pickupStart = toEpochMs(mission.pickupWindow.start, "pickupWindow.start");
    const pickupEnd = toEpochMs(mission.pickupWindow.end, "pickupWindow.end");
    if (pickupEnd <= pickupStart) {
      return false;
    }
    const coversWindow = profile.availability.some((window) => {
      const start = toEpochMs(window.start, "availability.start");
      const end = toEpochMs(window.end, "availability.end");
      return start <= pickupStart && end >= pickupEnd;
    });
    if (!coversWindow) {
      return false;
    }
  } catch {
    return false;
  }

  return (
    haversineDistanceKm(
      profile.serviceArea.center,
      mission.pickupLocation,
    ) <= profile.serviceArea.radiusKm
  );
}
