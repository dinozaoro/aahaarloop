import assert from "node:assert/strict";
import { test } from "node:test";

import { createClaimLifecycle } from "../src/lib/claims/cancellation.ts";

const NOW = "2026-11-21T12:00:00Z";

function setup(status = "pending", expiresAt = "2026-11-22T12:00:00Z") {
  const state = {
    donation: {
      id: "d1", title: "Rice", organizationId: "org-donor", description: "",
      category: "prepared", storage: "chilled", servingsTotal: 10,
      servingsAvailable: 4, weightKg: 10, allergens: [], dietTags: [], packaging: "",
      pickupAddress: "12 MG Road", pickupArea: "Bengaluru",
      location: { latitude: 12.97, longitude: 77.59 }, foodExpiryAt: "2026-11-23T00:00:00Z",
      bestBeforeAt: "", pickupDeadlineAt: "2026-11-22T00:00:00Z", status: "claimed",
      createdAt: NOW, updatedAt: NOW, events: [],
    },
    claim: {
      id: "c1", donationId: "d1", donationTitle: "Rice", donorOrganizationId: "org-donor",
      recipientOrgId: "org-recipient", servings: 6, weightKg: 6, status,
      expiresAt, createdAt: NOW, updatedAt: NOW,
      history: [{ id: "e1", at: NOW, type: "created", actor: "user-1" }],
    },
    events: [],
  };
  const repo = {
    allClaims: () => [state.claim],
    findClaim: () => state.claim,
    findDonation: () => state.donation,
    saveClaim: (claim) => { state.claim = claim; },
    saveDonation: (donation) => { state.donation = donation; },
    appendEvent: (_id, type, actor) => { state.events.push({ type, actor }); },
  };
  return { state, lifecycle: createClaimLifecycle(repo, () => NOW) };
}

const recipient = { id: "user-1", role: "recipient", organizationId: "org-recipient" };
const donor = { id: "user-2", role: "donor", organizationId: "org-donor" };
const admin = { id: "admin-1", role: "admin", organizationId: null };

test("cancelling releases the exact quantity once", async () => {
  const { state, lifecycle } = setup();
  const closed = await lifecycle.cancel("c1", recipient, "No longer needed");
  assert.equal(closed.status, "cancelled");
  assert.equal(state.donation.servingsAvailable, 10);
  assert.equal(state.donation.status, "published");
  assert.equal(state.events.length, 1);
  await assert.rejects(() => lifecycle.cancel("c1", recipient, "again"), /Only open claims/);
  assert.equal(state.donation.servingsAvailable, 10);
  assert.equal(state.events.length, 1);
});

test("a donor cannot cancel after pickup, an admin still can", async () => {
  const before = setup("pickup_scheduled");
  assert.equal((await before.lifecycle.cancel("c1", donor, "late")).status, "cancelled");
  const after = setup("picked_up");
  await assert.rejects(() => after.lifecycle.cancel("c1", donor, "too late"), /cannot be cancelled/);
  await assert.rejects(() => after.lifecycle.cancel("c1", recipient, "too late"), /cannot be cancelled/);
  await assert.rejects(() => after.lifecycle.cancel("c1", admin, "override"), /Only open claims/);
});

test("expired open claims release their quantity exactly once", async () => {
  const { state, lifecycle } = setup("confirmed", "2026-11-21T11:00:00Z");
  const expired = await lifecycle.expire();
  assert.equal(expired.length, 1);
  assert.equal(state.donation.servingsAvailable, 10);
  assert.equal((await lifecycle.expire()).length, 0);
  assert.equal(state.donation.servingsAvailable, 10);
  assert.equal(state.events.length, 1);
});

test("cancellation requires a reason", async () => {
  const { lifecycle } = setup();
  await assert.rejects(() => lifecycle.cancel("c1", recipient, "  "), /reason is required/);
});
