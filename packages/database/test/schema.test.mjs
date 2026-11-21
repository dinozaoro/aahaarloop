import assert from "node:assert/strict";
import { test } from "node:test";

import { getTableConfig } from "drizzle-orm/pg-core";

import * as schema from "../src/index.ts";

const tables = [
  "users",
  "profiles",
  "organizations",
  "organizationMembers",
  "donorProfiles",
  "recipientProfiles",
  "volunteerProfiles",
  "deviceSessions",
  "foodCategories",
  "foodAllergens",
  "donations",
  "donationItems",
  "donationImages",
  "donationAllergens",
  "favorites",
  "recipientNeeds",
  "claims",
  "claimItems",
  "pickupTasks",
  "pickupAssignments",
  "donationEvents",
  "notifications",
  "syncOperations",
  "syncConflicts",
  "aiAnalysis",
  "reports",
  "auditLogs",
  "impactRecords",
];

test("the schema exports all 28 domain tables", () => {
  assert.equal(tables.length, 28);
  for (const name of tables) {
    assert.ok(schema[name], `missing table export: ${name}`);
  }
});

test("every table has a UUID primary key and a timestamptz creation date", () => {
  for (const name of tables) {
    const { columns } = getTableConfig(schema[name]);
    const id = columns.find((column) => column.name === "id");
    const createdAt = columns.find((column) => column.name === "created_at");
    assert.ok(id?.primary, `${name}.id must be a primary key`);
    assert.equal(id.columnType, "PgUUID", `${name}.id must be a UUID`);
    assert.ok(createdAt, `${name} must have created_at`);
    assert.equal(
      createdAt.columnType,
      "PgTimestamp",
      `${name}.created_at must be timestamptz`,
    );
    assert.equal(createdAt.withTimezone, true);
  }
});

test("quantity columns are protected by non-negative checks", () => {
  const checkNames = (name) =>
    getTableConfig(schema[name]).checks.map((item) => item.name);
  for (const [table, constraint] of [
    ["donations", "donations_quantity_non_negative"],
    ["donations", "donations_remaining_non_negative"],
    ["donationItems", "donation_items_quantity_non_negative"],
    ["claims", "claims_quantity_non_negative"],
    ["claimItems", "claim_items_quantity_non_negative"],
    ["recipientNeeds", "recipient_needs_quantity_non_negative"],
    ["impactRecords", "impact_records_value_non_negative"],
  ]) {
    assert.ok(checkNames(table).includes(constraint), `missing ${constraint}`);
  }
});

test("duplicate memberships and duplicate favorite/allergen links are blocked", () => {
  const indexNames = (name) =>
    getTableConfig(schema[name]).indexes.map((item) => item.config.name);
  assert.ok(
    indexNames("organizationMembers").includes(
      "organization_members_org_user_unique",
    ),
  );
  assert.ok(indexNames("favorites").includes("favorites_user_donation_unique"));
  assert.ok(
    indexNames("donationAllergens").includes("donation_allergens_unique"),
  );
});

test("donation indexes cover status, deadlines, organization and location", () => {
  const indexes = getTableConfig(schema.donations).indexes.map(
    (item) => item.config.name,
  );
  for (const name of [
    "donations_status_expiry_idx",
    "donations_status_deadline_idx",
    "donations_organization_idx",
    "donations_location_idx",
  ]) {
    assert.ok(indexes.includes(name), `missing ${name}`);
  }
});

test("lifecycle enums expose the documented statuses", () => {
  assert.deepEqual(schema.donationStatus.enumValues, [
    "draft",
    "published",
    "claimed",
    "pickup_scheduled",
    "picked_up",
    "delivered",
    "cancelled",
    "expired",
  ]);
  assert.ok(schema.claimStatus.enumValues.includes("cancelled"));
  assert.ok(schema.claimStatus.enumValues.includes("expired"));
  assert.deepEqual(schema.storageType.enumValues, [
    "ambient",
    "refrigerated",
    "frozen",
  ]);
});

test("relations are defined for the main domain entities", () => {
  for (const name of [
    "usersRelations",
    "organizationsRelations",
    "donationsRelations",
    "claimsRelations",
    "pickupTasksRelations",
    "donationEventsRelations",
    "syncOperationsRelations",
  ]) {
    assert.ok(schema[name], `missing relations: ${name}`);
  }
});
