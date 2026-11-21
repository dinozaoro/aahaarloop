import assert from "node:assert/strict";
import { test } from "node:test";

import { DonationInputSchema } from "@aahaarloop/shared";
import { createDonationService } from "../src/lib/donations/service.ts";

const payload = {
  title: "Surplus rice",
  description: "Cooked rice from lunch service",
  total_servings: 40,
  available_servings: 40,
  food_expiry_at: "2026-11-23T18:00:00+03:00",
  pickup_deadline_at: "2026-11-22T20:00:00+03:00",
  pickup_location: {
    address: "12 MG Road, Bengaluru",
    point: { latitude: 12.97, longitude: 77.59 },
  },
  items: [
    {
      name: "Rice",
      category: "prepared",
      quantity: 40,
      unit: "serving",
      storage: "chilled",
      dietary_flags: ["vegetarian"],
      allergens: [],
    },
  ],
};

function setup() {
  const rows = [];
  const repo = {
    all: () => rows,
    find: (id) => rows.find((row) => row.id === id),
    save: (donation) => {
      const index = rows.findIndex((row) => row.id === donation.id);
      if (index === -1) rows.push(donation);
      else rows[index] = donation;
    },
  };
  return { rows, service: createDonationService(repo, () => "2026-11-21T12:00:00Z") };
}

test("a donor creates a scoped draft with an audit-ready history", () => {
  const { service } = setup();
  const input = DonationInputSchema.parse(payload);
  const donation = service.create(input, "org-1", "user-1");
  assert.equal(donation.organizationId, "org-1");
  assert.equal(donation.status, "draft");
  assert.equal(donation.servingsAvailable, 40);
  assert.deepEqual(donation.dietTags, ["vegetarian"]);
  assert.deepEqual(donation.events.map((event) => event.type), ["created"]);
});

test("lists expose only own drafts and only published donations to others", () => {
  const { service } = setup();
  const input = DonationInputSchema.parse(payload);
  service.create(input, "org-1", "user-1");
  const other = service.create(input, "org-2", "user-2");
  service.publish(other.id, "org-2", "user-2");

  assert.equal(service.list("org-1").length, 1);
  assert.equal(service.list("org-1")[0].organizationId, "org-1");
  assert.equal(service.list().length, 1);
  assert.equal(service.list()[0].id, other.id);
});

test("publishing requires a located pin and records the transition", () => {
  const { service } = setup();
  const input = DonationInputSchema.parse(payload);
  const unlocated = service.create(
    DonationInputSchema.parse({
      ...payload,
      pickup_location: {
        ...payload.pickup_location,
        point: { latitude: 0, longitude: 0 },
      },
    }),
    "org-1",
    "user-1",
  );
  assert.throws(
    () => service.publish(unlocated.id, "org-1", "user-1"),
    /located pin/,
  );
  const donation = service.create(input, "org-1", "user-1");
  const published = service.publish(donation.id, "org-1", "user-1");
  assert.equal(published.status, "published");
  assert.deepEqual(published.events.map((event) => event.type), [
    "created",
    "published",
  ]);
});

test("cross-organization edits and double publishing are rejected", () => {
  const { service } = setup();
  const input = DonationInputSchema.parse(payload);
  const donation = service.create(input, "org-1", "user-1");
  assert.throws(
    () => service.update(donation.id, "org-2", "user-2", { title: "Stolen" }),
    /another organization/,
  );
  service.publish(donation.id, "org-1", "user-1");
  assert.throws(
    () => service.publish(donation.id, "org-1", "user-1"),
    /Only draft/,
  );
});
