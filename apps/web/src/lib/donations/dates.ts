import type { StorageType } from "../domain/types.ts";

export const DEMO_TIME_ZONE = "Asia/Kolkata";

export const STORAGE_OPTIONS: readonly StorageType[] = [
  "ambient",
  "chilled",
  "frozen",
];

/** The six allergens seeded in the demo database. */
export const ALLERGEN_OPTIONS = [
  "peanut",
  "gluten",
  "milk",
  "egg",
  "soy",
  "sesame",
] as const;

export const DIETARY_OPTIONS = [
  "vegetarian",
  "vegan",
  "jain",
  "halal",
  "gluten-free",
] as const;

export interface DonationDateInput {
  /** `datetime-local` values in the supplied IANA time zone. */
  foodExpiryAt: string;
  bestBeforeAt: string;
  pickupDeadlineAt: string;
  timeZone: string;
  storage: string;
  packaging: string;
  allergens: readonly string[];
  dietTags: readonly string[];
}

export interface DonationDateValues {
  foodExpiryAt: string;
  bestBeforeAt: string | null;
  pickupDeadlineAt: string;
  effectiveDeadlineAt: string;
  storage: StorageType;
  packaging: string;
  allergens: string[];
  dietTags: string[];
  timeZone: string;
}

export interface DonationDateResult {
  values?: DonationDateValues;
  errors: Record<string, string>;
  warnings: string[];
}

const LOCAL_DATE_TIME =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

function offsetMinutesAt(instantMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(new Date(instantMs));
  const name =
    parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  const match = /^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/.exec(name);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
}

/** Converts a timezone-naive datetime-local value to a UTC ISO string. */
export function zonedDateTimeToIso(local: string, timeZone: string): string {
  const match = LOCAL_DATE_TIME.exec(local.trim());
  if (!match) throw new Error("Enter a valid date and time.");

  const [, year, month, day, hour, minute, second] = match;
  const wallClock = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second ?? 0),
  );
  const probe = new Date(wallClock);
  if (
    probe.getUTCFullYear() !== Number(year) ||
    probe.getUTCMonth() !== Number(month) - 1 ||
    probe.getUTCDate() !== Number(day)
  ) {
    throw new Error("Enter a valid calendar date.");
  }

  const firstOffset = offsetMinutesAt(wallClock, timeZone);
  let utc = wallClock - firstOffset * 60_000;
  // Re-check after the first conversion so DST boundaries use the right offset.
  const secondOffset = offsetMinutesAt(utc, timeZone);
  if (secondOffset !== firstOffset) utc = wallClock - secondOffset * 60_000;
  return new Date(utc).toISOString();
}

function parseDate(
  value: string,
  timeZone: string,
  required: boolean,
): { iso?: string; error?: string } {
  if (!value.trim()) {
    return required ? { error: "This date is required." } : {};
  }
  try {
    return { iso: zonedDateTimeToIso(value, timeZone) };
  } catch {
    return { error: "Enter a valid date and time." };
  }
}

export function validateDonationDates(
  input: DonationDateInput,
  now: Date = new Date(),
): DonationDateResult {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  const food = parseDate(input.foodExpiryAt, input.timeZone, true);
  const best = parseDate(input.bestBeforeAt, input.timeZone, false);
  const pickup = parseDate(input.pickupDeadlineAt, input.timeZone, true);
  if (food.error) errors.foodExpiryAt = food.error;
  if (best.error) errors.bestBeforeAt = best.error;
  if (pickup.error) errors.pickupDeadlineAt = pickup.error;

  if (food.iso && new Date(food.iso).getTime() <= now.getTime()) {
    errors.foodExpiryAt = "Use-by time must be in the future.";
  }
  if (pickup.iso && new Date(pickup.iso).getTime() <= now.getTime()) {
    errors.pickupDeadlineAt = "Pickup deadline must be in the future.";
  }
  // Best-before is a quality hint: a past date is flagged, never blocked.
  if (best.iso && new Date(best.iso).getTime() <= now.getTime()) {
    warnings.push("Best-before date has passed; quality may be lower.");
  }

  if (!STORAGE_OPTIONS.includes(input.storage as StorageType)) {
    errors.storage = "Choose ambient, chilled or frozen storage.";
  }

  const allergens = [...new Set(input.allergens)];
  const dietTags = [...new Set(input.dietTags)];
  if (
    allergens.some(
      (item) => !(ALLERGEN_OPTIONS as readonly string[]).includes(item),
    )
  ) {
    errors.allergens = "Choose allergens from the list.";
  }
  if (
    dietTags.some(
      (item) => !(DIETARY_OPTIONS as readonly string[]).includes(item),
    )
  ) {
    errors.dietTags = "Choose dietary flags from the list.";
  }

  if (Object.keys(errors).length > 0 || !food.iso || !pickup.iso) {
    return { errors, warnings };
  }

  return {
    errors,
    warnings,
    values: {
      foodExpiryAt: food.iso,
      bestBeforeAt: best.iso ?? null,
      pickupDeadlineAt: pickup.iso,
      effectiveDeadlineAt:
        new Date(food.iso) <= new Date(pickup.iso) ? food.iso : pickup.iso,
      storage: input.storage as StorageType,
      packaging: input.packaging.trim(),
      allergens,
      dietTags,
      timeZone: input.timeZone,
    },
  };
}
