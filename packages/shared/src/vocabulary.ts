// Single source of truth for the shared vocabulary. Every enum used by web,
// mobile, server and matching is declared here and nowhere else.

export const ROLES = ["donor", "recipient", "volunteer", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const DONATION_STATUSES = [
  "draft",
  "published",
  "claimed",
  "pickup_scheduled",
  "picked_up",
  "delivered",
  "cancelled",
  "expired",
] as const;
export type DonationStatus = (typeof DONATION_STATUSES)[number];

export const CLAIM_STATUSES = [
  "pending",
  "confirmed",
  "pickup_scheduled",
  "picked_up",
  "delivered",
  "cancelled",
  "expired",
] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

// Urgency levels are the claimable outcomes, ordered from least to most urgent
// by the operational margin (docs/product-spec.md "Urgency").
export const URGENCY_LEVELS = ["low", "medium", "high", "critical"] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

// Non-claimable outcomes of the urgency calculation. They are not levels.
export const URGENCY_STATUSES = ["expired", "infeasible", "unknown"] as const;
export type UrgencyStatus = (typeof URGENCY_STATUSES)[number];

// Ordered by capacity: ambient < chilled < frozen (used by matching).
export const STORAGE_TYPES = ["ambient", "chilled", "frozen"] as const;
export type StorageType = (typeof STORAGE_TYPES)[number];

// Metric units. Countable items use "serving" or "piece".
export const UNITS = ["serving", "kg", "g", "l", "ml", "piece"] as const;
export type Unit = (typeof UNITS)[number];

// PROVISIONAL starting list, to be confirmed by the product owners. Diet
// filters are preferences, not guarantees (docs/product-spec.md disclaimers).
export const DIETARY_FLAGS = [
  "vegetarian",
  "vegan",
  "halal",
  "gluten_free",
] as const;
export type DietaryFlag = (typeof DIETARY_FLAGS)[number];

// PROVISIONAL starting list, to be confirmed by the product owners. Allergen
// filters are preferences, not guarantees (docs/product-spec.md disclaimers).
export const ALLERGENS = [
  "gluten",
  "milk",
  "eggs",
  "peanuts",
  "tree_nuts",
  "soy",
  "fish",
  "shellfish",
  "sesame",
] as const;
export type Allergen = (typeof ALLERGENS)[number];

// Food categories are intentionally NOT an enum: they stay opaque strings
// (packages/matching/README.md, "Assumptions and limits").
