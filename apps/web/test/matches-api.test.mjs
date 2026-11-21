import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import {
  createMatchCache,
  rankMatches,
} from "../src/lib/matching/ranked-matches.ts";

const NOW = "2026-11-21T12:00:00Z";
const location = { latitude: 12.9716, longitude: 77.5946 };

const organization = {
  id: "org-recipient",
  name: "Rainbow Kitchen",
  kind: "recipient",
  area: "Bengaluru",
  address: "1 Church Street, Bengaluru",
  location,
  verified: true,
  storage: "chilled",
  transportCapacityKg: 100,
  capacityServings: 50,
  dietaryConstraints: [],
  contactName: "Anita",
  contactPhone: "+910000000000",
};

const donation = (id, overrides = {}) => ({
  id,
  organizationId: "org-donor",
  title: "Rice",
  description: "Cooked rice",
  category: "prepared",
  storage: "chilled",
  servingsTotal: 40,
  servingsAvailable: 40,
  weightKg: 20,
  allergens: [],
  dietTags: [],
  packaging: "box",
  pickupAddress: "2 MG Road, Bengaluru",
  pickupArea: "Bengaluru",
  location,
  foodExpiryAt: "2026-11-23T12:00:00Z",
  bestBeforeAt: "2026-11-22T12:00:00Z",
  pickupDeadlineAt: "2026-11-22T12:00:00Z",
  status: "published",
  createdAt: NOW,
  updatedAt: NOW,
  events: [],
  ...overrides,
});

const need = {
  id: "need-1",
  organizationId: "org-recipient",
  category: "prepared",
  servings: 40,
  deadlineAt: "2026-11-23T12:00:00Z",
  priority: "urgent",
  notes: "",
  status: "active",
  createdAt: NOW,
  updatedAt: NOW,
};

const filters = { page: 1, pageSize: 20 };

test("ranking returns only eligible, other-org donations with score breakdown", () => {
  const result = rankMatches(
    organization,
    [need],
    [donation("d1"), donation("own", { organizationId: "org-recipient" })],
    filters,
    NOW,
  );
  assert.deepEqual(result.data.map((match) => match.donationId), ["d1"]);
  assert.equal(result.excluded.some((item) => item.donationId === "own"), false);
  const explanation = result.data[0].explanation;
  assert.ok(result.data[0].totalScore >= 0);
  assert.ok(explanation.urgency.contribution >= 0);
  assert.ok(explanation.distance.weight > 0);
  assert.equal(explanation.needs.matchedCategories.includes("prepared"), true);
});

test("expired and unpublished donations are excluded", () => {
  const result = rankMatches(
    organization,
    [need],
    [
      donation("expired", { foodExpiryAt: "2026-11-20T12:00:00Z" }),
      donation("draft", { status: "draft" }),
    ],
    filters,
    NOW,
  );
  assert.equal(result.data.length, 0);
  assert.equal(result.excluded.length, 1);
  assert.ok(result.excluded[0].reasons.includes("expired"));
});

test("filters and pagination apply after ranking", () => {
  const donations = [donation("d1"), donation("d2"), donation("d3")];
  const first = rankMatches(organization, [], donations, { ...filters, pageSize: 2 }, NOW);
  const second = rankMatches(organization, [], donations, { ...filters, page: 2, pageSize: 2 }, NOW);
  assert.equal(first.total, 3);
  assert.equal(first.data.length, 2);
  assert.equal(second.data.length, 1);
  assert.equal(rankMatches(organization, [], donations, { ...filters, category: "bakery" }, NOW).total, 0);
});

test("cache is scoped per organization and expires", () => {
  let time = 0;
  const cache = createMatchCache(100, () => time);
  cache.set("org-recipient:page", { value: 1 });
  assert.deepEqual(cache.get("org-recipient:page"), { value: 1 });
  assert.equal(cache.get("org-other:page"), undefined);
  time = 100;
  assert.equal(cache.get("org-recipient:page"), undefined);
});

test("the matches endpoint is recipient-only", async () => {
  const source = await readFile(
    new URL("../src/app/api/matches/route.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /forbidUnlessRole\(\["recipient"\]\)/);
});
