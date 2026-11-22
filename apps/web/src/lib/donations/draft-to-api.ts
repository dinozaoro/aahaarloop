import type { DonationDraft } from "./draft.ts";

const UNITS: Record<string, "serving" | "kg" | "piece"> = {
  portions: "serving",
  kg: "kg",
  containers: "piece",
};

const ALLERGENS: Record<string, string> = {
  egg: "eggs",
  peanut: "peanuts",
  "tree-nut": "tree_nuts",
};

const DIET_FLAGS: Record<string, string> = {
  "gluten-free": "gluten_free",
  jain: "vegetarian",
};

/** Converts the browser draft into the API contract; returns null if incomplete. */
export function draftToDonationInput(draft: DonationDraft | null) {
  if (!draft?.basics || !draft.dates || !draft.location) return null;
  const unit = UNITS[draft.basics.unit ?? "portions"] ?? "serving";
  return {
    title: draft.basics.foodName,
    description: draft.basics.description,
    food_expiry_at: draft.dates.foodExpiryAt,
    best_before_at: draft.dates.bestBeforeAt,
    pickup_deadline_at: draft.dates.pickupDeadlineAt,
    items: [
      {
        name: draft.basics.foodName,
        category: draft.basics.category,
        quantity: unit === "kg" ? 1 : draft.basics.servings,
        unit,
        storage: draft.dates.storage,
        dietary_flags: draft.dates.dietTags.map((flag) => DIET_FLAGS[flag] ?? flag),
        allergens: draft.dates.allergens.map((item) => ALLERGENS[item] ?? item),
      },
    ],
    total_servings: draft.basics.servings,
    pickup_location: {
      label: draft.location.locality,
      address: draft.location.address,
      point: {
        latitude: draft.location.latitude,
        longitude: draft.location.longitude,
      },
    },
  };
}
