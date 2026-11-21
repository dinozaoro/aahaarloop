import { z } from "zod";

import { DonationDatesSchema, IsoDateTimeSchema } from "./dates.ts";
import {
  ALLERGENS,
  CLAIM_STATUSES,
  DIETARY_FLAGS,
  DONATION_STATUSES,
  ROLES,
  STORAGE_TYPES,
  UNITS,
  URGENCY_LEVELS,
} from "./vocabulary.ts";

export const RoleSchema = z.enum(ROLES);
export const DonationStatusSchema = z.enum(DONATION_STATUSES);
export const ClaimStatusSchema = z.enum(CLAIM_STATUSES);
export const UrgencyLevelSchema = z.enum(URGENCY_LEVELS);
export const StorageTypeSchema = z.enum(STORAGE_TYPES);
export const UnitSchema = z.enum(UNITS);
export const DietaryFlagSchema = z.enum(DIETARY_FLAGS);
export const AllergenSchema = z.enum(ALLERGENS);

const NonEmptyString = z.string().trim().min(1);
const PositiveInt = z.number().int().positive();
const NonNegativeInt = z.number().int().nonnegative();
const Latitude = z.number().finite().min(-90).max(90);
const Longitude = z.number().finite().min(-180).max(180);

export const GeoPointSchema = z.object({
  latitude: Latitude,
  longitude: Longitude,
});
export type GeoPoint = z.infer<typeof GeoPointSchema>;

export const LocationSchema = z.object({
  label: NonEmptyString.max(200).optional(),
  address: NonEmptyString.max(500),
  point: GeoPointSchema,
});
export type LocationInput = z.infer<typeof LocationSchema>;

export const DonationItemInputSchema = z.object({
  name: NonEmptyString.max(120),
  category: NonEmptyString.max(80),
  quantity: z.number().finite().positive(),
  unit: UnitSchema,
  storage: StorageTypeSchema,
  dietary_flags: z.array(DietaryFlagSchema).default([]),
  allergens: z.array(AllergenSchema).default([]),
});
export type DonationItemInput = z.infer<typeof DonationItemInputSchema>;

export const DonationInputSchema = DonationDatesSchema.extend({
  title: NonEmptyString.max(160),
  description: z.string().trim().max(2000).optional(),
  items: z.array(DonationItemInputSchema).min(1),
  total_servings: PositiveInt,
  available_servings: NonNegativeInt.optional(),
  pickup_location: LocationSchema,
  image_url: z.string().url().optional(),
}).superRefine((value, ctx) => {
  if (
    value.available_servings != null &&
    value.available_servings > value.total_servings
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "available_servings cannot exceed total_servings",
      path: ["available_servings"],
    });
  }
});
export type DonationInput = z.infer<typeof DonationInputSchema>;

export const ClaimInputSchema = z.object({
  donation_id: NonEmptyString,
  recipient_id: NonEmptyString,
  servings: PositiveInt,
  note: z.string().trim().max(500).optional(),
});
export type ClaimInput = z.infer<typeof ClaimInputSchema>;

export const NeedInputSchema = z.object({
  recipient_id: NonEmptyString,
  category: NonEmptyString.max(80),
  required_servings: PositiveInt,
  needed_by: IsoDateTimeSchema,
  urgency: UrgencyLevelSchema.optional(),
  storage: StorageTypeSchema,
  dietary_flags: z.array(DietaryFlagSchema).default([]),
  allergens_avoided: z.array(AllergenSchema).default([]),
  notes: z.string().trim().max(500).optional(),
});
export type NeedInput = z.infer<typeof NeedInputSchema>;

const BaseProfileSchema = z.object({
  role: RoleSchema,
  display_name: NonEmptyString.max(160),
  phone: z.string().trim().max(32).optional(),
  address: LocationSchema.optional(),
});

export const DonorProfileInputSchema = BaseProfileSchema.extend({
  role: z.literal("donor"),
  organization_name: NonEmptyString.max(160).optional(),
});
export type DonorProfileInput = z.infer<typeof DonorProfileInputSchema>;

export const RecipientProfileInputSchema = BaseProfileSchema.extend({
  role: z.literal("recipient"),
  organization_name: NonEmptyString.max(160),
  storage: StorageTypeSchema,
  transport_capacity_kg: z.number().finite().nonnegative(),
  dietary_flags: z.array(DietaryFlagSchema).default([]),
  allergens_avoided: z.array(AllergenSchema).default([]),
});
export type RecipientProfileInput = z.infer<typeof RecipientProfileInputSchema>;

export const VolunteerProfileInputSchema = BaseProfileSchema.extend({
  role: z.literal("volunteer"),
  transport_capacity_kg: z.number().finite().nonnegative().optional(),
});
export type VolunteerProfileInput = z.infer<typeof VolunteerProfileInputSchema>;

export const AdminProfileInputSchema = BaseProfileSchema.extend({
  role: z.literal("admin"),
});
export type AdminProfileInput = z.infer<typeof AdminProfileInputSchema>;

export const ProfileInputSchema = z.discriminatedUnion("role", [
  DonorProfileInputSchema,
  RecipientProfileInputSchema,
  VolunteerProfileInputSchema,
  AdminProfileInputSchema,
]);
export type ProfileInput = z.infer<typeof ProfileInputSchema>;
