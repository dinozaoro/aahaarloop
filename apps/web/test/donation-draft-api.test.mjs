import assert from "node:assert/strict";
import { test } from "node:test";

import { draftToDonationInput } from "../src/lib/donations/draft-to-api.ts";

const draft = {
  basics: {
    foodName: "Vegetable biryani",
    category: "prepared",
    servings: 12,
    unit: "portions",
    description: "Freshly cooked",
  },
  dates: {
    foodExpiryAt: "2026-11-23T18:00:00Z",
    bestBeforeAt: null,
    pickupDeadlineAt: "2026-11-23T15:00:00Z",
    effectiveDeadlineAt: "2026-11-23T15:00:00Z",
    storage: "chilled",
    packaging: "sealed trays",
    allergens: ["peanut", "egg"],
    dietTags: ["gluten-free", "jain"],
    timeZone: "Asia/Kolkata",
  },
  location: {
    address: "12 MG Road",
    locality: "Indiranagar",
    latitude: 12.97,
    longitude: 77.59,
    contactName: "Asha",
    contactPhone: "+91 98765 43210",
    pickupInstructions: "Gate 2",
    splittable: true,
  },
  status: "draft",
  publishedAt: null,
};

test("draft maps wizard vocabulary to the API contract", () => {
  const input = draftToDonationInput(draft);
  assert.ok(input);
  assert.equal(input.items[0].allergens.join(","), "peanuts,eggs");
  assert.equal(input.items[0].dietary_flags.join(","), "gluten_free,vegetarian");
  assert.equal(input.items[0].unit, "serving");
  assert.equal(input.total_servings, 12);
  assert.equal(input.pickup_location.label, "Indiranagar");
});

test("incomplete draft maps to null", () => {
  assert.equal(draftToDonationInput({ ...draft, location: null }), null);
});
