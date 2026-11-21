import assert from "node:assert/strict";
import { test } from "node:test";

import {
  canCancelClaim,
  claimProgress,
  nextAction,
  statusVariant,
  toClaimRow,
} from "../src/lib/claims/view-model.ts";

const NOW = "2026-11-21T12:00:00Z";
const claim = (status, overrides = {}) => ({
  id: "c1", donationId: "d1", donationTitle: "Rice",
  donorOrganizationId: "org-donor", recipientOrgId: "org-recipient",
  servings: 6, weightKg: 6, status,
  createdAt: NOW, updatedAt: NOW,
  history: [
    { id: "e1", at: NOW, type: "created", actor: "u1" },
    { id: "e2", at: "2026-11-21T13:00:00Z", type: "confirmed", actor: "u2" },
  ],
  ...overrides,
});

const actor = { role: "recipient", organizationId: "org-recipient" };

test("badge variant reflects the claim status", () => {
  assert.equal(statusVariant("delivered"), "success");
  assert.equal(statusVariant("pending"), "warning");
  assert.equal(statusVariant("cancelled"), "destructive");
  assert.equal(statusVariant("expired"), "destructive");
  assert.equal(statusVariant("confirmed"), "secondary");
  assert.equal(statusVariant("pickup_scheduled"), "default");
});

test("next action is defined for every status in both views", () => {
  const statuses = [
    "pending", "confirmed", "pickup_scheduled", "picked_up",
    "delivered", "cancelled", "expired",
  ];
  for (const status of statuses) {
    for (const perspective of ["donor", "recipient"]) {
      const action = nextAction(claim(status), perspective);
      assert.ok(action.label.length > 0, `${status}/${perspective}`);
      assert.ok(["primary", "muted", "none"].includes(action.tone));
    }
  }
  assert.match(nextAction(claim("pending"), "donor").label, /Confirm/);
  assert.match(nextAction(claim("picked_up"), "recipient").label, /Confirm delivery/);
  assert.equal(nextAction(claim("delivered"), "recipient").tone, "none");
});

test("cancellation is guarded by state, role and organization", () => {
  assert.equal(canCancelClaim(claim("pending"), actor), true);
  assert.equal(canCancelClaim(claim("confirmed"), actor), true);
  assert.equal(canCancelClaim(claim("pickup_scheduled"), actor), true);
  assert.equal(canCancelClaim(claim("picked_up"), actor), false);
  assert.equal(canCancelClaim(claim("delivered"), actor), false);
  assert.equal(canCancelClaim(claim("cancelled"), actor), false);
  assert.equal(canCancelClaim(claim("expired"), actor), false);

  assert.equal(
    canCancelClaim(claim("pending"), { role: "recipient", organizationId: "org-other" }),
    false,
  );
  assert.equal(
    canCancelClaim(claim("pending"), { role: "donor", organizationId: "org-donor" }),
    true,
  );
  assert.equal(
    canCancelClaim(claim("pending"), { role: "donor", organizationId: "org-other" }),
    false,
  );
  assert.equal(
    canCancelClaim(claim("pending"), { role: "admin", organizationId: null }),
    true,
  );
  assert.equal(
    canCancelClaim(claim("pending"), { role: "volunteer", organizationId: "org-recipient" }),
    false,
  );
});

test("progress highlights the current step and marks closed claims", () => {
  const confirmed = claimProgress(claim("confirmed"));
  assert.deepEqual(
    confirmed.map((step) => step.state),
    ["done", "current", "upcoming", "upcoming", "upcoming"],
  );
  assert.equal(confirmed[1].status, "confirmed");
  assert.equal(confirmed.filter((step) => step.state === "current").length, 1);
  assert.deepEqual(
    claimProgress(claim("cancelled")).map((step) => step.state),
    ["closed"],
  );
});

test("view model exposes server status, next action and newest-first history", () => {
  const row = toClaimRow(claim("pending"), actor);
  assert.equal(row.status, "pending");
  assert.equal(row.statusLabel, "Pending");
  assert.equal(row.canCancel, true);
  assert.deepEqual(row.history.map((event) => event.id), ["e2", "e1"]);
  assert.equal(row.progress[0].state, "current");
});
