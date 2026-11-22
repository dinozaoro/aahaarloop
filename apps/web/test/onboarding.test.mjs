import assert from "node:assert/strict";
import { test } from "node:test";

import {
  isSelfAssignableRole,
  isUserRole,
  organizationNameOrDefault,
  organizationTypeForRole,
  parseOnboardingRole,
  parseOrganizationMode,
  SELF_ASSIGNABLE_ROLES,
  sessionUserFromClaims,
  slugifyOrganizationName,
  uniqueOrganizationSlug,
  USER_ROLES,
  validateJoinSlug,
  validateOrganizationName,
} from "../src/lib/auth/onboarding.ts";

test("admin is a valid stored role but cannot be self-selected", () => {
  assert.ok(isUserRole("admin"));
  assert.ok(USER_ROLES.includes("admin"));
  assert.equal(isSelfAssignableRole("admin"), false);
  assert.ok(!SELF_ASSIGNABLE_ROLES.includes("admin"));
  assert.throws(() => parseOnboardingRole("admin"), /Choose donor/);
});

test("onboarding accepts only donor, recipient and volunteer", () => {
  assert.deepEqual(
    [...SELF_ASSIGNABLE_ROLES],
    ["donor", "recipient", "volunteer"],
  );
  for (const role of SELF_ASSIGNABLE_ROLES) {
    assert.equal(parseOnboardingRole(role), role);
    assert.equal(organizationTypeForRole(role), role);
  }
  for (const bad of [null, "", "ADMIN", 1, {}]) {
    assert.throws(() => parseOnboardingRole(bad));
  }
});

test("organization mode defaults to create and rejects unknown values", () => {
  assert.equal(parseOrganizationMode(undefined), "create");
  assert.equal(parseOrganizationMode("create"), "create");
  assert.equal(parseOrganizationMode("join"), "join");
  assert.throws(() => parseOrganizationMode("admin"));
});

test("organization names are trimmed and length-checked", () => {
  assert.equal(validateOrganizationName("  Hope Shelter  "), "Hope Shelter");
  for (const bad of [null, "", "a", "x".repeat(121)]) {
    assert.throws(() => validateOrganizationName(bad));
  }
});

test("organization name can be skipped during onboarding", () => {
  assert.equal(organizationNameOrDefault(""), "My organization");
  assert.equal(organizationNameOrDefault("  "), "My organization");
  assert.equal(organizationNameOrDefault(null), "My organization");
  assert.equal(organizationNameOrDefault(" Hope Shelter "), "Hope Shelter");
  assert.throws(() => organizationNameOrDefault("a"));
});

test("join slugs accept only lowercase hyphenated identifiers", () => {
  assert.equal(validateJoinSlug("  Hope-Shelter "), "hope-shelter");
  for (const bad of [null, "", "Has Spaces", "under_score", "../etc"]) {
    assert.throws(() => validateJoinSlug(bad));
  }
});

test("slugify produces stable slugs and handles empty input", () => {
  assert.equal(
    slugifyOrganizationName("Annapurna Community Kitchen!"),
    "annapurna-community-kitchen",
  );
  assert.equal(slugifyOrganizationName("  --- "), "organization");
});

test("uniqueOrganizationSlug avoids taken slugs", () => {
  assert.equal(uniqueOrganizationSlug("Hope Shelter", []), "hope-shelter");
  assert.equal(
    uniqueOrganizationSlug("Hope Shelter", ["hope-shelter"]),
    "hope-shelter-2",
  );
  assert.equal(
    uniqueOrganizationSlug("Hope Shelter", ["hope-shelter", "hope-shelter-2"]),
    "hope-shelter-3",
  );
});

test("session claims expose id, role and active organization safely", () => {
  assert.deepEqual(
    sessionUserFromClaims({
      id: "user-1",
      role: "recipient",
      activeOrganizationId: "org-1",
    }),
    { id: "user-1", role: "recipient", activeOrganizationId: "org-1" },
  );
});

test("invalid or legacy claims fall back to a non-admin identity", () => {
  assert.deepEqual(sessionUserFromClaims({}), {
    id: "",
    role: "donor",
    activeOrganizationId: null,
  });
  assert.deepEqual(
    sessionUserFromClaims({ role: "root", activeOrganizationId: 42 }),
    { id: "", role: "donor", activeOrganizationId: null },
  );
});
