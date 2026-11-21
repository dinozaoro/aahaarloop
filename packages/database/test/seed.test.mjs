import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { buildSeedData, DEMO_EMAILS, DEMO_IDS } from "../src/seed-data.ts";
import { buildSeedPlan, seedDatabase } from "../src/seed.ts";

const NOW = new Date("2026-11-21T12:00:00Z");
const hoursUntil = (date) => (date.getTime() - NOW.getTime()) / 3_600_000;

test("seed data is deterministic for a given instant", () => {
  assert.deepEqual(buildSeedData(NOW), buildSeedData(NOW));
});

test("demo emails use the reserved .test domain and no real names", () => {
  const data = buildSeedData(NOW);
  for (const user of data.users) {
    assert.match(user.email, /@demo\.aahaarloop\.test$/);
  }
  assert.deepEqual(
    data.users.map((user) => user.email).sort(),
    Object.values(DEMO_EMAILS).sort(),
  );
  assert.deepEqual(data.users.map((user) => user.role).sort(), [
    "admin",
    "donor",
    "recipient",
    "volunteer",
  ]);
});

test("all seeded locations are in Bengaluru", () => {
  const data = buildSeedData(NOW);
  const locations = [
    ...data.organizations.map((org) => [org.latitude, org.longitude]),
    ...data.donations
      .filter((donation) => donation.latitude)
      .map((donation) => [donation.latitude, donation.longitude]),
  ];
  assert.ok(locations.length >= 7);
  for (const [latitude, longitude] of locations) {
    const lat = Number(latitude);
    const lon = Number(longitude);
    assert.ok(lat > 12.8 && lat < 13.1, `latitude ${lat} outside Bengaluru`);
    assert.ok(lon > 77.4 && lon < 77.9, `longitude ${lon} outside Bengaluru`);
  }
});

test("published donations cover critical, high, medium and low urgency", () => {
  const data = buildSeedData(NOW);
  const offsets = data.donations
    .filter((donation) => donation.status === "published")
    .map((donation) => hoursUntil(donation.pickupDeadlineAt))
    .sort((a, b) => a - b);
  assert.deepEqual(offsets, [2, 5, 9, 20]);
  assert.ok(
    data.donations.some(
      (donation) =>
        donation.status === "draft" && donation.pickupDeadlineAt === undefined,
    ),
  );
});

test("all fixed identifiers are unique", () => {
  const ids = [
    DEMO_IDS.donorOrg,
    DEMO_IDS.recipientOrg,
    DEMO_IDS.volunteerOrg,
    DEMO_IDS.donorUser,
    DEMO_IDS.recipientUser,
    DEMO_IDS.volunteerUser,
    DEMO_IDS.adminUser,
    ...DEMO_IDS.categories,
    ...DEMO_IDS.allergens,
    ...DEMO_IDS.donations,
    ...DEMO_IDS.claims,
    ...DEMO_IDS.needs,
  ];
  assert.equal(new Set(ids).size, ids.length);
});

test("seed plan inserts parents before children", () => {
  const order = buildSeedPlan(NOW).map((step) => step.name);
  assert.deepEqual(order, [
    "organizations",
    "users",
    "organizationMembers",
    "foodCategories",
    "foodAllergens",
    "donations",
    "donationItems",
    "donationAllergens",
    "recipientNeeds",
    "claims",
    "claimItems",
    "favorites",
  ]);
});

function recordingDb() {
  const calls = [];
  return {
    calls,
    insert(table) {
      return {
        values(values) {
          calls.push({ table, values });
          return {
            async onConflictDoNothing() {
              calls[calls.length - 1].conflictSafe = true;
            },
          };
        },
      };
    },
  };
}

test("seedDatabase uses conflict-safe inserts and is repeatable", async () => {
  const first = recordingDb();
  await seedDatabase(first, NOW);
  const second = recordingDb();
  await seedDatabase(second, NOW);

  assert.ok(first.calls.length > 0);
  assert.equal(first.calls.length, second.calls.length);
  assert.deepEqual(
    second.calls.map((call) => call.values),
    first.calls.map((call) => call.values),
  );
  assert.ok(first.calls.every((call) => call.conflictSafe));
  assert.ok(second.calls.every((call) => call.conflictSafe));
});

test("claim items reference a seeded donation item", () => {
  const data = buildSeedData(NOW);
  const itemIds = new Set(data.donationItems.map((item) => item.id));
  for (const item of data.claimItems) {
    assert.ok(itemIds.has(item.donationItemId));
  }
});
