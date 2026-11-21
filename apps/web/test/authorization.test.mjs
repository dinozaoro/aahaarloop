import assert from "node:assert/strict";
import { test } from "node:test";

import {
  canAccessAdmin,
  canBeAssignedPickup,
  canClaimFor,
  canEditDonation,
  isMemberOf,
} from "../src/lib/auth/authorization.ts";

const actor = (role, activeOrganizationId = "org-a") => ({
  id: `user-${role}`,
  role,
  activeOrganizationId,
});

test("only the admin role reaches admin surfaces", () => {
  assert.equal(canAccessAdmin(actor("admin")), true);
  for (const role of ["donor", "recipient", "volunteer"]) {
    assert.equal(canAccessAdmin(actor(role)), false, `${role} reached admin`);
  }
});

test("volunteers can take pickups but never admin routes", () => {
  assert.equal(canBeAssignedPickup(actor("volunteer")), true);
  assert.equal(canBeAssignedPickup(actor("donor")), false);
  assert.equal(canAccessAdmin(actor("volunteer")), false);
});

test("a donor can only edit donations in their own organization", () => {
  const donor = actor("donor");
  assert.equal(canEditDonation(donor, { organizationId: "org-a" }), true);
  assert.equal(canEditDonation(donor, { organizationId: "org-b" }), false);
});

test("IDOR: a donor with no active organization cannot edit any donation", () => {
  const donor = actor("donor", null);
  assert.equal(canEditDonation(donor, { organizationId: "org-a" }), false);
  assert.equal(canEditDonation(donor, { organizationId: "org-b" }), false);
});

test("recipients and volunteers cannot edit donations; admins can", () => {
  for (const role of ["recipient", "volunteer"]) {
    assert.equal(
      canEditDonation(actor(role), { organizationId: "org-a" }),
      false,
    );
  }
  assert.equal(
    canEditDonation(actor("admin"), { organizationId: "org-b" }),
    true,
  );
});

test("a recipient can only claim for their own organization", () => {
  const recipient = actor("recipient");
  assert.equal(canClaimFor(recipient, "org-a"), true);
  assert.equal(canClaimFor(recipient, "org-b"), false);
});

test("cross-tenant claim attempts by other roles or missing orgs fail", () => {
  assert.equal(canClaimFor(actor("donor"), "org-a"), false);
  assert.equal(canClaimFor(actor("volunteer"), "org-a"), false);
  assert.equal(canClaimFor(actor("recipient", null), "org-a"), false);
  assert.equal(canClaimFor(actor("recipient"), null), false);
});

test("membership requires an exact organization match", () => {
  assert.equal(isMemberOf(actor("donor"), "org-a"), true);
  assert.equal(isMemberOf(actor("donor"), "ORG-A"), false);
  assert.equal(isMemberOf(actor("donor"), undefined), false);
});
