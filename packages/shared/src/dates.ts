import { z } from "zod";

/**
 * Date semantics (docs/product-spec.md "Key dates: DLC, DDM and pickup deadline"):
 *
 * - food_expiry_at (DLC, use-by): food-safety limit. Hard deadline for
 *   matching and expiry; food must not be consumed after it.
 * - best_before_at (DDM, best-before): quality date. Displayed, but deliberately
 *   excluded from urgency and expiry calculations.
 * - pickup_deadline_at: operational limit by which food must be collected. Hard
 *   deadline for matching and expiry.
 *
 * effective_deadline_at = min(food_expiry_at, pickup_deadline_at) over all
 * donation items. Missing both hard deadlines means the donation is `unknown`
 * and not claimable; a missing date is never treated as low urgency.
 *
 * All date-times are ISO 8601 strings with an explicit timezone offset and are
 * compared as UTC instants.
 */

export const ISO_OFFSET_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:?\d{2})$/;

export const IsoDateTimeSchema = z
  .string()
  .regex(ISO_OFFSET_RE, "Must be ISO 8601 with an explicit timezone offset")
  .refine(
    (value) => !Number.isNaN(Date.parse(value)),
    "Must be a valid date-time",
  );

export type IsoDateTime = z.infer<typeof IsoDateTimeSchema>;

export const FoodExpiryAtSchema = IsoDateTimeSchema.describe(
  "DLC/use-by: food-safety hard deadline. Included in urgency and expiry.",
);

export const BestBeforeAtSchema = IsoDateTimeSchema.describe(
  "DDM/best-before: quality date only. Excluded from urgency and expiry.",
);

export const PickupDeadlineAtSchema = IsoDateTimeSchema.describe(
  "Operational pickup hard deadline. Included in urgency and expiry.",
);

export const DonationDatesSchema = z
  .object({
    food_expiry_at: FoodExpiryAtSchema.nullable().optional(),
    best_before_at: BestBeforeAtSchema.nullable().optional(),
    pickup_deadline_at: PickupDeadlineAtSchema.nullable().optional(),
  })
  .superRefine((value, ctx) => {
    const hasHardDeadline =
      value.food_expiry_at != null || value.pickup_deadline_at != null;
    if (!hasHardDeadline) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "At least one hard deadline is required (food_expiry_at or pickup_deadline_at); a missing deadline is never treated as low urgency",
        path: ["food_expiry_at"],
      });
    }
  });

export type DonationDatesInput = z.infer<typeof DonationDatesSchema>;

/** Earliest of the hard deadlines, or null when none is present. */
export function effectiveDeadlineAt(
  dates: Pick<DonationDatesInput, "food_expiry_at" | "pickup_deadline_at">,
): string | null {
  const candidates = [dates.food_expiry_at, dates.pickup_deadline_at].filter(
    (value): value is string => value != null,
  );
  if (candidates.length === 0) return null;
  return candidates.reduce((a, b) => (Date.parse(a) <= Date.parse(b) ? a : b));
}
