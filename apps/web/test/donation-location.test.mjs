import assert from "node:assert/strict";
import { test } from "node:test";

import {
  BENGALURU_LOCALITIES,
  publishDraft,
  searchBengaluruAddresses,
  validatePickupLocation,
} from "../src/lib/donations/location.ts";

const now = new Date("2026-11-22T06:00:00.000Z");
const indiranagar = BENGALURU_LOCALITIES.find(
  (item) => item.id === "indiranagar",
);
const dates = {
  foodExpiryAt: "2026-11-23T17:30:00.000Z",
  bestBeforeAt: null,
  pickupDeadlineAt: "2026-11-23T12:30:00.000Z",
  effectiveDeadlineAt: "2026-11-23T12:30:00.000Z",
  storage: "chilled",
  packaging: "sealed trays",
  allergens: ["milk"],
  dietTags: ["vegetarian"],
  timeZone: "Asia/Kolkata",
};
const completeInput = {
  address: "12, 100 Feet Road",
  localityId: indiranagar.id,
  pinPlaced: true,
  contactName: "Anita Rao",
  contactPhone: "+91 98765 43210",
  pickupInstructions: "Ring the side gate",
  splittable: true,
};

test("Bengaluru address search is case-insensitive and locality-based", () => {
  const results = searchBengaluruAddresses("  indira ");
  assert.equal(results.length, 1);
  assert.equal(results[0].id, "indiranagar");
  assert.ok(
    searchBengaluruAddresses("560095").some(
      (item) => item.id === "koramangala",
    ),
  );
  assert.deepEqual(searchBengaluruAddresses("i"), []);
  assert.deepEqual(searchBengaluruAddresses("Chennai"), []);
});

test("complete pickup details produce coordinates from the selected locality", () => {
  const result = validatePickupLocation(completeInput);
  assert.deepEqual(result.errors, {});
  assert.equal(result.values.address, "12, 100 Feet Road");
  assert.equal(result.values.locality, "Indiranagar");
  assert.equal(result.values.latitude, indiranagar.latitude);
  assert.equal(result.values.longitude, indiranagar.longitude);
  assert.equal(result.values.splittable, true);
});

test("publishing requires a placed pin and an address", () => {
  const missingPin = validatePickupLocation({
    ...completeInput,
    pinPlaced: false,
  });
  assert.match(missingPin.errors.pin, /pin/);
  assert.equal(missingPin.values, undefined);

  const missingAddress = validatePickupLocation({
    ...completeInput,
    address: "  ",
  });
  assert.match(missingAddress.errors.address, /address/);

  const unknownLocality = validatePickupLocation({
    ...completeInput,
    localityId: "mars",
  });
  assert.match(unknownLocality.errors.locality, /locality/);
});

test("contact details are validated without blocking optional instructions", () => {
  assert.match(
    validatePickupLocation({ ...completeInput, contactName: "A" }).errors
      .contactName,
    /contact/,
  );
  assert.match(
    validatePickupLocation({ ...completeInput, contactPhone: "hello" }).errors
      .contactPhone,
    /phone/,
  );
  assert.deepEqual(
    validatePickupLocation({ ...completeInput, pickupInstructions: "" }).errors,
    {},
  );
});

test("publishing a complete draft moves it to published with a timestamp", () => {
  const location = validatePickupLocation(completeInput).values;
  const result = publishDraft(
    { dates, location, status: "draft", publishedAt: null },
    now,
  );
  assert.deepEqual(result.errors, {});
  assert.equal(result.donation.status, "published");
  assert.equal(result.donation.publishedAt, "2026-11-22T06:00:00.000Z");
  assert.deepEqual(result.donation.dates, dates);
  assert.deepEqual(result.donation.location, location);
});

test("publishing an incomplete draft is blocked", () => {
  assert.match(
    publishDraft(
      { dates: null, location: null, status: "draft", publishedAt: null },
      now,
    ).errors.dates,
    /dates/,
  );
  const location = validatePickupLocation(completeInput).values;
  assert.match(
    publishDraft(
      { dates, location: null, status: "draft", publishedAt: null },
      now,
    ).errors.location,
    /pickup/,
  );
  assert.ok(location);
});
