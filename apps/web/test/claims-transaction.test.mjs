import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { ApiError } from "../src/lib/api/errors.ts";
import { createClaimService } from "../src/lib/claims/transaction.ts";

const donation = (available = 10) => ({
  id: "d1",
  organizationId: "org-donor",
  title: "Rice",
  description: "",
  category: "prepared",
  storage: "chilled",
  servingsTotal: 10,
  servingsAvailable: available,
  weightKg: 10,
  allergens: [],
  dietTags: [],
  packaging: "",
  pickupAddress: "12 MG Road",
  pickupArea: "Bengaluru",
  location: { latitude: 12.97, longitude: 77.59 },
  foodExpiryAt: "2026-11-23T00:00:00Z",
  bestBeforeAt: "",
  pickupDeadlineAt: "2026-11-22T00:00:00Z",
  status: "published",
  createdAt: "2026-11-21T00:00:00Z",
  updatedAt: "2026-11-21T00:00:00Z",
  events: [],
});

function setup(available = 10) {
  const state = { donation: donation(available), claims: [], events: [] };
  const repo = {
    findDonation: () => state.donation,
    findByIdempotencyKey: (key) => state.claims.find((claim) => claim.idempotencyKey === key),
    // The real commit locks the donation row and re-checks stock inside one transaction.
    commit: (claim, actor) => {
      const existing = state.claims.find((item) => item.idempotencyKey === claim.idempotencyKey);
      if (existing) return existing;
      if (state.donation.status !== "published" || state.donation.servingsAvailable < claim.servings) {
        throw new ApiError("conflict", "Requested quantity is not available");
      }
      const remaining = state.donation.servingsAvailable - claim.servings;
      state.donation = {
        ...state.donation,
        servingsAvailable: remaining,
        status: remaining === 0 ? "claimed" : "published",
      };
      state.claims.push(claim);
      state.events.push({ type: "claimed", actor });
      return claim;
    },
  };
  return { state, service: createClaimService(repo, () => "2026-11-21T12:00:00Z") };
}

const command = (key, servings = 4) => ({
  donationId: "d1",
  recipientOrgId: "org-recipient",
  servings,
  actorId: "user-1",
  idempotencyKey: key,
});

test("parallel claims never allocate more than the available quantity", async () => {
  const { state, service } = setup(10);
  const results = await Promise.allSettled([
    service.create(command("a")),
    service.create(command("b")),
    service.create(command("c")),
  ]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 2);
  assert.equal(results.filter((result) => result.status === "rejected").length, 1);
  assert.equal(state.donation.servingsAvailable, 2);
  assert.equal(state.donation.status, "published");
  assert.equal(state.events.length, 2);
});

test("a full claim closes the donation and quantity never goes negative", async () => {
  const { state, service } = setup(4);
  await service.create(command("full", 4));
  assert.equal(state.donation.servingsAvailable, 0);
  assert.equal(state.donation.status, "claimed");
  await assert.rejects(() => service.create(command("extra", 1)), ApiError);
  assert.equal(state.donation.servingsAvailable, 0);
});

test("an idempotent replay returns the original claim", async () => {
  const { state, service } = setup();
  const first = await service.create(command("same"));
  const replay = await service.create(command("same", 9));
  assert.equal(replay.id, first.id);
  assert.equal(replay.servings, first.servings);
  assert.equal(state.claims.length, 1);
  assert.equal(state.donation.servingsAvailable, 6);
});

test("the claim API requires idempotency keys and recipient role", async () => {
  const source = await readFile(
    new URL("../src/app/api/claims/route.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /idempotency-key/);
  assert.match(source, /forbidUnlessRole\(\["recipient"\]\)/);
  assert.match(source, /claim\.create/);
});
