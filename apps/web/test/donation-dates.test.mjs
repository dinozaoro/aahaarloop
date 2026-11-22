import assert from "node:assert/strict";
import { test } from "node:test";

import {
  validateDonationDates,
  zonedDateTimeToIso,
} from "../src/lib/donations/dates.ts";

const now = new Date("2026-11-21T12:00:00.000Z");
const base = {
  foodExpiryAt: "2026-11-22T23:00",
  bestBeforeAt: "",
  pickupDeadlineAt: "2026-11-22T18:00",
  timeZone: "Asia/Kolkata",
  storage: "chilled",
  packaging: "  sealed trays  ",
  allergens: ["milk", "gluten"],
  dietTags: ["vegetarian"],
};

test("datetime-local values use the supplied IANA time zone", () => {
  assert.equal(
    zonedDateTimeToIso("2026-11-22T00:30", "Asia/Kolkata"),
    "2026-11-21T19:00:00.000Z",
  );
  assert.equal(
    zonedDateTimeToIso("2026-11-22T00:30", "UTC"),
    "2026-11-22T00:30:00.000Z",
  );
});

test("midnight boundaries stay on the correct calendar day", () => {
  const late = zonedDateTimeToIso("2026-11-21T23:59", "Asia/Kolkata");
  const early = zonedDateTimeToIso("2026-11-22T00:01", "Asia/Kolkata");
  assert.equal(late, "2026-11-21T18:29:00.000Z");
  assert.equal(early, "2026-11-21T18:31:00.000Z");
  assert.ok(new Date(early) > new Date(late));
});

test("DST transitions do not use the pre-transition offset", () => {
  const spring = zonedDateTimeToIso("2026-03-08T03:30", "America/New_York");
  assert.equal(spring, "2026-03-08T07:30:00.000Z");
  const fall = zonedDateTimeToIso("2026-11-01T01:30", "America/New_York");
  assert.equal(fall, "2026-11-01T05:30:00.000Z");
});

test("malformed and impossible calendar dates are rejected", () => {
  assert.throws(() => zonedDateTimeToIso("22/11/2026 23:00", "UTC"), /valid/);
  assert.throws(
    () => zonedDateTimeToIso("2026-02-30T10:00", "UTC"),
    /calendar/,
  );
});

test("valid step-2 input produces UTC ISO values and the effective deadline", () => {
  const result = validateDonationDates(base, now);
  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.warnings, []);
  assert.equal(result.values.foodExpiryAt, "2026-11-22T17:30:00.000Z");
  assert.equal(result.values.pickupDeadlineAt, "2026-11-22T12:30:00.000Z");
  assert.equal(result.values.effectiveDeadlineAt, "2026-11-22T12:30:00.000Z");
  assert.equal(result.values.bestBeforeAt, null);
  assert.equal(result.values.storage, "chilled");
  assert.equal(result.values.packaging, "sealed trays");
  assert.deepEqual(result.values.allergens, ["milk", "gluten"]);
  assert.deepEqual(result.values.dietTags, ["vegetarian"]);
});

test("past use-by and pickup deadlines are blocked", () => {
  const result = validateDonationDates(
    {
      ...base,
      foodExpiryAt: "2026-11-20T23:00",
      pickupDeadlineAt: "2026-11-20T18:00",
    },
    now,
  );
  assert.match(result.errors.foodExpiryAt, /future/);
  assert.match(result.errors.pickupDeadlineAt, /future/);
  assert.equal(result.values, undefined);
});

test("a past best-before date is a warning, not a hard failure", () => {
  const result = validateDonationDates(
    { ...base, bestBeforeAt: "2026-11-20T23:00" },
    now,
  );
  assert.deepEqual(result.errors, {});
  assert.match(result.warnings[0], /quality/);
  assert.ok(result.values.bestBeforeAt);
});

test("missing hard deadlines, bad storage and unknown allergens fail", () => {
  const result = validateDonationDates(
    {
      ...base,
      foodExpiryAt: "",
      pickupDeadlineAt: "",
      storage: "hot",
      allergens: ["milk", "unknown"],
      dietTags: ["vegetarian", "magic"],
    },
    now,
  );
  assert.match(result.errors.foodExpiryAt, /required/);
  assert.match(result.errors.pickupDeadlineAt, /required/);
  assert.match(result.errors.storage, /storage/);
  assert.match(result.errors.allergens, /list/);
  assert.match(result.errors.dietTags, /list/);
});

test("duplicate multi-select values are stored once", () => {
  const result = validateDonationDates(
    {
      ...base,
      allergens: ["milk", "milk", "gluten"],
      dietTags: ["vegan", "vegan"],
    },
    now,
  );
  assert.deepEqual(result.values.allergens, ["milk", "gluten"]);
  assert.deepEqual(result.values.dietTags, ["vegan"]);
});
