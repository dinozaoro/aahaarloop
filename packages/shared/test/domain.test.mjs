import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ALLERGENS,
  CLAIM_STATUSES,
  ClaimInputSchema,
  DIETARY_FLAGS,
  DONATION_STATUSES,
  DonationDatesSchema,
  DonationInputSchema,
  effectiveDeadlineAt,
  IsoDateTimeSchema,
  NeedInputSchema,
  ProfileInputSchema,
  ROLES,
  STORAGE_TYPES,
  UNITS,
  URGENCY_LEVELS,
} from "../src/index.ts";

const ISO = "2026-11-21T10:00:00.000Z";
const LATER = "2026-11-21T12:00:00.000Z";

describe("vocabulary", () => {
  it("exports the expected single-source enums", () => {
    assert.deepEqual(ROLES, ["donor", "recipient", "volunteer", "admin"]);
    assert.deepEqual(DONATION_STATUSES, [
      "draft",
      "published",
      "claimed",
      "pickup_scheduled",
      "picked_up",
      "delivered",
      "cancelled",
      "expired",
    ]);
    assert.deepEqual(CLAIM_STATUSES, [
      "pending",
      "confirmed",
      "pickup_scheduled",
      "picked_up",
      "delivered",
      "cancelled",
      "expired",
    ]);
    assert.deepEqual(URGENCY_LEVELS, ["low", "medium", "high", "critical"]);
    assert.deepEqual(STORAGE_TYPES, ["ambient", "chilled", "frozen"]);
    assert.deepEqual(UNITS, ["serving", "kg", "g", "l", "ml", "piece"]);
    assert.deepEqual(DIETARY_FLAGS, [
      "vegetarian",
      "vegan",
      "halal",
      "gluten_free",
    ]);
    assert.deepEqual(ALLERGENS, [
      "gluten",
      "milk",
      "eggs",
      "peanuts",
      "tree_nuts",
      "soy",
      "fish",
      "shellfish",
      "sesame",
    ]);
  });
});

describe("dates", () => {
  it("accepts ISO 8601 with explicit offset", () => {
    for (const value of [
      ISO,
      "2026-11-21T10:00:00Z",
      "2026-11-21T15:30:00+05:30",
    ]) {
      assert.equal(IsoDateTimeSchema.parse(value), value);
    }
  });

  it("rejects dates without explicit timezone", () => {
    const result = IsoDateTimeSchema.safeParse("2026-11-21T10:00:00");
    assert.equal(result.success, false);
  });

  it("rejects invalid date strings", () => {
    assert.equal(IsoDateTimeSchema.safeParse("not-a-date").success, false);
    assert.equal(
      IsoDateTimeSchema.safeParse("2026-13-40T10:00:00Z").success,
      false,
    );
  });

  it("requires at least one hard deadline", () => {
    const result = DonationDatesSchema.safeParse({
      best_before_at: ISO,
    });
    assert.equal(result.success, false);
  });

  it("accepts food_expiry_at as hard deadline", () => {
    const result = DonationDatesSchema.safeParse({ food_expiry_at: ISO });
    assert.equal(result.success, true);
  });

  it("accepts pickup_deadline_at as hard deadline", () => {
    const result = DonationDatesSchema.safeParse({ pickup_deadline_at: ISO });
    assert.equal(result.success, true);
  });

  it("treats best_before_at as quality-only metadata", () => {
    const result = DonationDatesSchema.safeParse({
      food_expiry_at: LATER,
      best_before_at: ISO,
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.best_before_at, ISO);
    }
  });

  it("computes effective deadline as earliest hard deadline", () => {
    assert.equal(
      effectiveDeadlineAt({ food_expiry_at: LATER, pickup_deadline_at: ISO }),
      ISO,
    );
    assert.equal(
      effectiveDeadlineAt({ food_expiry_at: ISO, pickup_deadline_at: LATER }),
      ISO,
    );
    assert.equal(effectiveDeadlineAt({ food_expiry_at: ISO }), ISO);
    assert.equal(effectiveDeadlineAt({}), null);
  });
});

describe("DonationInputSchema", () => {
  const baseDonation = {
    title: "Rice trays",
    food_expiry_at: LATER,
    total_servings: 10,
    pickup_location: {
      address: "123 Main St, Bengaluru",
      point: { latitude: 12.9716, longitude: 77.5946 },
    },
    items: [
      {
        name: "Rice",
        category: "prepared",
        quantity: 10,
        unit: "serving",
        storage: "chilled",
      },
    ],
  };

  it("accepts a valid donation", () => {
    const result = DonationInputSchema.safeParse(baseDonation);
    assert.equal(result.success, true);
  });

  it("defaults dietary_flags and allergens", () => {
    const result = DonationInputSchema.parse(baseDonation);
    assert.deepEqual(result.items[0].dietary_flags, []);
    assert.deepEqual(result.items[0].allergens, []);
  });

  it("rejects available_servings exceeding total_servings", () => {
    const result = DonationInputSchema.safeParse({
      ...baseDonation,
      available_servings: 11,
    });
    assert.equal(result.success, false);
  });

  it("rejects missing hard deadline", () => {
    const { food_expiry_at: _, ...noDeadline } = baseDonation;
    const result = DonationInputSchema.safeParse({
      ...noDeadline,
      best_before_at: ISO,
    });
    assert.equal(result.success, false);
  });

  it("rejects invalid storage, unit, dietary flag, allergen", () => {
    assert.equal(
      DonationInputSchema.safeParse({
        ...baseDonation,
        items: [{ ...baseDonation.items[0], storage: "fridge" }],
      }).success,
      false,
    );
    assert.equal(
      DonationInputSchema.safeParse({
        ...baseDonation,
        items: [{ ...baseDonation.items[0], unit: "boxes" }],
      }).success,
      false,
    );
    assert.equal(
      DonationInputSchema.safeParse({
        ...baseDonation,
        items: [{ ...baseDonation.items[0], dietary_flags: ["keto"] }],
      }).success,
      false,
    );
    assert.equal(
      DonationInputSchema.safeParse({
        ...baseDonation,
        items: [{ ...baseDonation.items[0], allergens: ["mustard"] }],
      }).success,
      false,
    );
  });

  it("rejects invalid coordinates", () => {
    const result = DonationInputSchema.safeParse({
      ...baseDonation,
      pickup_location: {
        address: "Somewhere",
        point: { latitude: 91, longitude: 77.5 },
      },
    });
    assert.equal(result.success, false);
  });
});

describe("ClaimInputSchema", () => {
  it("accepts a valid claim", () => {
    const result = ClaimInputSchema.safeParse({
      donation_id: "don_1",
      recipient_id: "rec_1",
      servings: 2,
    });
    assert.equal(result.success, true);
  });

  it("rejects non-positive servings and missing ids", () => {
    assert.equal(
      ClaimInputSchema.safeParse({
        donation_id: "d",
        recipient_id: "r",
        servings: 0,
      }).success,
      false,
    );
    assert.equal(
      ClaimInputSchema.safeParse({
        donation_id: "",
        recipient_id: "r",
        servings: 1,
      }).success,
      false,
    );
  });
});

describe("NeedInputSchema", () => {
  const baseNeed = {
    recipient_id: "rec_1",
    category: "prepared",
    required_servings: 20,
    needed_by: LATER,
    storage: "ambient",
  };

  it("accepts a valid need", () => {
    assert.equal(NeedInputSchema.safeParse(baseNeed).success, true);
  });

  it("rejects invalid urgency/storage and missing needed_by", () => {
    assert.equal(
      NeedInputSchema.safeParse({ ...baseNeed, urgency: "urgent" }).success,
      false,
    );
    assert.equal(
      NeedInputSchema.safeParse({ ...baseNeed, storage: "cold" }).success,
      false,
    );
    const { needed_by: _, ...missing } = baseNeed;
    assert.equal(NeedInputSchema.safeParse(missing).success, false);
  });
});

describe("ProfileInputSchema", () => {
  it("accepts valid donor profile", () => {
    const result = ProfileInputSchema.safeParse({
      role: "donor",
      display_name: "Asha",
      organization_name: "Asha Kitchen",
    });
    assert.equal(result.success, true);
  });

  it("accepts valid recipient profile with capacity", () => {
    const result = ProfileInputSchema.safeParse({
      role: "recipient",
      display_name: "Shelter",
      organization_name: "Hope Shelter",
      storage: "chilled",
      transport_capacity_kg: 50,
      dietary_flags: ["vegetarian"],
      allergens_avoided: ["peanuts"],
    });
    assert.equal(result.success, true);
  });

  it("rejects recipient profile missing required fields", () => {
    const result = ProfileInputSchema.safeParse({
      role: "recipient",
      display_name: "Shelter",
      storage: "chilled",
      transport_capacity_kg: 50,
    });
    assert.equal(result.success, false);
  });

  it("accepts volunteer and admin profiles", () => {
    assert.equal(
      ProfileInputSchema.safeParse({ role: "volunteer", display_name: "V" })
        .success,
      true,
    );
    assert.equal(
      ProfileInputSchema.safeParse({ role: "admin", display_name: "A" })
        .success,
      true,
    );
  });

  it("rejects unknown role", () => {
    assert.equal(
      ProfileInputSchema.safeParse({ role: "manager", display_name: "X" })
        .success,
      false,
    );
  });
});
