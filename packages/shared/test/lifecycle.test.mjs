import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CLAIM_TRANSITIONS,
  DONATION_TRANSITIONS,
  isExpired,
  transitionClaim,
  transitionDonation,
} from "../src/index.ts";

const NOW = "2026-11-22T10:00:00.000Z";
const PAST = "2026-11-20T10:00:00.000Z";
const FUTURE = "2026-11-25T10:00:00.000Z";
const DONOR = { id: "user_donor", type: "donor", organization_id: "org_donor" };
const RECIPIENT = {
  id: "user_recipient",
  type: "recipient",
  organization_id: "org_recipient",
};
const VOLUNTEER = { id: "user_volunteer", type: "volunteer" };
const ADMIN = { id: "user_admin", type: "admin" };
const SYSTEM = { id: "system", type: "system" };

function donation(overrides = {}) {
  return {
    id: "don_1",
    donor_organization_id: "org_donor",
    status: "draft",
    available_servings: 10,
    food_expiry_at: FUTURE,
    ...overrides,
  };
}

function claim(overrides = {}) {
  return {
    id: "clm_1",
    donation_id: "don_1",
    recipient_organization_id: "org_recipient",
    status: "pending",
    servings: 2,
    ...overrides,
  };
}

function donationContext(to, overrides = {}) {
  const actor =
    to === "expired"
      ? SYSTEM
      : to === "picked_up" || to === "delivered"
        ? VOLUNTEER
        : DONOR;
  return {
    actor,
    now: NOW,
    ...(to === "cancelled" ? { reason: "donor withdrew the donation" } : {}),
    ...overrides,
  };
}

function claimContext(to, overrides = {}) {
  const actor =
    to === "expired"
      ? SYSTEM
      : to === "cancelled"
        ? RECIPIENT
        : to === "picked_up" || to === "delivered"
          ? VOLUNTEER
          : DONOR;
  return {
    actor,
    now: NOW,
    ...(to === "cancelled" ? { reason: "recipient no longer needs it" } : {}),
    ...overrides,
  };
}

async function runDonation(state, to, context) {
  const events = [];
  const result = await transitionDonation(state, to, context, async (event) =>
    events.push(event),
  );
  return { result, events };
}

async function runClaim(state, currentDonation, to, context) {
  const events = [];
  const result = await transitionClaim(
    state,
    currentDonation,
    to,
    context,
    async (event) => events.push(event),
  );
  return { result, events };
}

describe("donation transitions", () => {
  for (const [from, rules] of Object.entries(DONATION_TRANSITIONS)) {
    for (const { to } of rules) {
      it(`allows ${from} -> ${to} and writes one event`, async () => {
        const state = donation({
          status: from,
          ...(to === "expired" ? { food_expiry_at: PAST } : {}),
        });
        const { result, events } = await runDonation(
          state,
          to,
          donationContext(to),
        );

        assert.equal(result.ok, true, result.ok ? undefined : result.message);
        assert.equal(result.donation.status, to);
        assert.equal(events.length, 1);
        assert.equal(events[0].donation_id, state.id);
        assert.equal(events[0].from_status, from);
        assert.equal(events[0].to_status, to);
        assert.equal(events[0].actor_type, donationContext(to).actor.type);
        assert.equal(events[0].actor_id, donationContext(to).actor.id);
        assert.equal(events[0].occurred_at, NOW);
        assert.equal(events[0].claim_id, undefined);
      });
    }
  }

  it("rejects an undeclared transition without writing an event", async () => {
    const { result, events } = await runDonation(
      donation({ status: "delivered" }),
      "cancelled",
      donationContext("cancelled"),
    );
    assert.deepEqual(result, {
      ok: false,
      code: "invalid_transition",
      message: "delivered -> cancelled is not allowed",
    });
    assert.equal(events.length, 0);
  });

  it("rejects an actor who does not own the donation", async () => {
    const { result } = await runDonation(
      donation(),
      "published",
      donationContext("published", {
        actor: { ...DONOR, organization_id: "other" },
      }),
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, "unauthorized_actor");
  });

  it("rejects a role that is not allowed for the transition", async () => {
    const { result } = await runDonation(
      donation(),
      "published",
      donationContext("published", { actor: RECIPIENT }),
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, "unauthorized_actor");
  });

  it("rejects a transition with an invalid timestamp", async () => {
    const { result } = await runDonation(
      donation(),
      "published",
      donationContext("published", { now: "not-a-date" }),
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, "invalid_date");
  });

  it("rejects negative available servings", async () => {
    const { result } = await runDonation(
      donation({ available_servings: -1 }),
      "published",
      donationContext("published"),
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, "invalid_quantity");
  });

  it("rejects a normal transition once the effective deadline has passed", async () => {
    const { result, events } = await runDonation(
      donation({
        status: "published",
        food_expiry_at: PAST,
        pickup_deadline_at: FUTURE,
      }),
      "claimed",
      donationContext("claimed"),
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, "donation_expired");
    assert.equal(events.length, 0);
    assert.equal(isExpired(donation({ food_expiry_at: PAST }), NOW), true);
    assert.equal(isExpired(donation({ food_expiry_at: FUTURE }), NOW), false);
  });
});

describe("cancellation and expiration", () => {
  it("requires a reason to cancel and records it on the event", async () => {
    const missing = await runDonation(
      donation({ status: "published" }),
      "cancelled",
      donationContext("cancelled", { reason: "  " }),
    );
    assert.equal(missing.result.ok, false);
    assert.equal(missing.result.code, "reason_required");
    assert.equal(missing.events.length, 0);

    const cancelled = await runDonation(
      donation({ status: "published" }),
      "cancelled",
      donationContext("cancelled", {
        reason: "spoilage risk",
        metadata: { inspector: "user_admin" },
      }),
    );
    assert.equal(cancelled.result.ok, true);
    assert.equal(cancelled.events[0].reason, "spoilage risk");
    assert.deepEqual(cancelled.events[0].metadata, { inspector: "user_admin" });
    assert.equal(cancelled.result.donation.status, "cancelled");

    const terminal = await runDonation(
      cancelled.result.donation,
      "published",
      donationContext("published"),
    );
    assert.equal(terminal.result.ok, false);
    assert.equal(terminal.result.code, "invalid_transition");
  });

  it("expires only the system actor and supplies a default reason", async () => {
    const wrongActor = await runDonation(
      donation({ status: "published", pickup_deadline_at: PAST }),
      "expired",
      donationContext("expired", { actor: DONOR }),
    );
    assert.equal(wrongActor.result.ok, false);
    assert.equal(wrongActor.result.code, "unauthorized_actor");

    const expired = await runDonation(
      donation({ status: "published", pickup_deadline_at: PAST }),
      "expired",
      donationContext("expired"),
    );
    assert.equal(expired.result.ok, true);
    assert.equal(expired.events[0].actor_type, "system");
    assert.equal(expired.events[0].reason, "effective deadline passed");
    assert.equal(expired.result.donation.status, "expired");
  });
});

describe("claim transitions", () => {
  for (const [from, rules] of Object.entries(CLAIM_TRANSITIONS)) {
    for (const { to } of rules) {
      it(`allows ${from} -> ${to} and writes one event`, async () => {
        const currentDonation = donation({
          status: "published",
          ...(to === "expired" ? { food_expiry_at: PAST } : {}),
        });
        const state = claim({ status: from });
        const { result, events } = await runClaim(
          state,
          currentDonation,
          to,
          claimContext(to),
        );

        assert.equal(result.ok, true, result.ok ? undefined : result.message);
        assert.equal(result.claim.status, to);
        assert.equal(events.length, 1);
        assert.equal(events[0].claim_id, state.id);
        assert.equal(events[0].donation_id, currentDonation.id);
        assert.equal(events[0].from_status, from);
        assert.equal(events[0].to_status, to);
        assert.equal(events[0].actor_type, claimContext(to).actor.type);
        assert.equal(events[0].occurred_at, NOW);
      });
    }
  }

  it("decrements available servings when a claim is confirmed", async () => {
    const { result, events } = await runClaim(
      claim({ servings: 4 }),
      donation({ available_servings: 10 }),
      "confirmed",
      claimContext("confirmed"),
    );
    assert.equal(result.ok, true);
    assert.equal(result.donation.available_servings, 6);
    assert.deepEqual(events[0].metadata, { available_servings_after: 6 });
  });

  it("rejects a servings amount above the available quantity", async () => {
    const { result, events } = await runClaim(
      claim({ servings: 11 }),
      donation({ available_servings: 10 }),
      "confirmed",
      claimContext("confirmed"),
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, "invalid_quantity");
    assert.equal(events.length, 0);
  });

  it("rejects zero servings", async () => {
    const { result } = await runClaim(
      claim({ status: "confirmed", servings: 0 }),
      donation(),
      "pickup_scheduled",
      claimContext("pickup_scheduled"),
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, "invalid_quantity");
  });

  it("rejects a non-owner recipient cancelling a claim", async () => {
    const { result } = await runClaim(
      claim(),
      donation(),
      "cancelled",
      claimContext("cancelled", {
        actor: { ...RECIPIENT, organization_id: "someone_else" },
      }),
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, "unauthorized_actor");
  });

  it("does not let an expired donation be claimed normally", async () => {
    const { result, events } = await runClaim(
      claim(),
      donation({ status: "published", food_expiry_at: PAST }),
      "confirmed",
      claimContext("confirmed", { actor: ADMIN }),
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, "donation_expired");
    assert.equal(events.length, 0);
  });

  it("rejects an undeclared claim transition", async () => {
    const { result } = await runClaim(
      claim({ status: "delivered" }),
      donation(),
      "cancelled",
      claimContext("cancelled"),
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, "invalid_transition");
  });
});
