import assert from "node:assert/strict";
import { test } from "node:test";

import { createClaimService } from "../src/lib/claims/transaction.ts";

function setup(available = 10) {
  const state = {
    donation: {
      id: "d1", title: "Rice", organizationId: "org-donor", description: "",
      category: "prepared", storage: "chilled", servingsTotal: 10,
      servingsAvailable: available, weightKg: 10, allergens: [], dietTags: [],
      packaging: "", pickupAddress: "12 MG Road", pickupArea: "Bengaluru",
      location: { latitude: 12.97, longitude: 77.59 }, foodExpiryAt: "2026-11-23T00:00:00Z",
      bestBeforeAt: "", pickupDeadlineAt: "2026-11-22T00:00:00Z", status: "published",
      createdAt: "2026-11-21T00:00:00Z", updatedAt: "2026-11-21T00:00:00Z", events: [],
    },
    claims: [],
  };
  const repo = {
    findDonation: () => state.donation,
    findByIdempotencyKey: (key) => state.claims.find((claim) => claim.idempotencyKey === key),
    saveDonation: (donation) => { state.donation = donation; },
    saveClaim: (claim) => { state.claims.push(claim); },
    appendEvent: () => {},
  };
  return { state, service: createClaimService(repo, () => "2026-11-21T12:00:00Z") };
}

const claim = (key, servings, items) => ({
  donationId: "d1", recipientOrgId: "org-recipient", servings,
  actorId: "user-1", idempotencyKey: key, ...(items ? { items } : {}),
});

test("two partial claims consume the exact remaining quantity", async () => {
  const { state, service } = setup();
  const first = await service.create(claim("a", 3, [
    { name: "Rice", quantity: 2 }, { name: "Dal", quantity: 1 },
  ]));
  const second = await service.create(claim("b", 4));
  assert.deepEqual(first.items.map((item) => item.quantity), [2, 1]);
  assert.equal(state.donation.servingsAvailable, 3);
  assert.equal(state.donation.status, "published");
  assert.equal(second.items[0].quantity, 4);
  assert.equal(state.claims.length, 2);
});

test("a partial claim followed by a full claim closes the donation", async () => {
  const { state, service } = setup();
  await service.create(claim("a", 6));
  assert.equal(state.donation.status, "published");
  await service.create(claim("b", 4));
  assert.equal(state.donation.servingsAvailable, 0);
  assert.equal(state.donation.status, "claimed");
});

test("concurrent partial claims cannot allocate more than the total", async () => {
  const { state, service } = setup(8);
  const results = await Promise.allSettled([
    service.create(claim("a", 3)),
    service.create(claim("b", 3)),
    service.create(claim("c", 3)),
  ]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 2);
  assert.equal(state.donation.servingsAvailable, 2);
  assert.equal(state.donation.status, "published");
});

test("item breakdown must match the requested servings", async () => {
  const { service } = setup();
  await assert.rejects(
    () => service.create(claim("bad", 4, [{ name: "Rice", quantity: 3 }])),
    /must sum to the claim/,
  );
});
