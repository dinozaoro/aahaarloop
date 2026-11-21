import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { test } from "node:test";

const migrationDir = new URL("../migrations/", import.meta.url);

async function initialSql() {
  const files = (await readdir(migrationDir)).filter((file) =>
    file.endsWith(".sql"),
  );
  assert.equal(files.length, 1, "expected exactly one initial migration");
  return readFile(new URL(files[0], migrationDir), "utf8");
}

test("the initial migration creates all 28 domain tables", async () => {
  const sql = await initialSql();
  const matches = sql.match(/CREATE TABLE "/g) ?? [];
  assert.equal(matches.length, 28);
  for (const table of [
    "users",
    "organizations",
    "donations",
    "claims",
    "impact_records",
  ]) {
    assert.ok(sql.includes(`CREATE TABLE "${table}"`), `missing ${table}`);
  }
});

test("the migration creates lifecycle enums", async () => {
  const sql = await initialSql();
  for (const type of [
    "user_role",
    "donation_status",
    "claim_status",
    "storage_type",
    "pickup_task_status",
  ]) {
    assert.ok(
      sql.includes(`CREATE TYPE "public"."${type}"`),
      `missing enum ${type}`,
    );
  }
});

test("the migration enforces non-negative quantities and unique memberships", async () => {
  const sql = await initialSql();
  for (const constraint of [
    "donations_quantity_non_negative",
    "donations_remaining_non_negative",
    "claims_quantity_non_negative",
    "organization_members_org_user_unique",
    "donation_allergens_unique",
  ]) {
    assert.ok(sql.includes(constraint), `missing ${constraint}`);
  }
});

test("the drizzle journal references the initial migration", async () => {
  const journal = JSON.parse(
    await readFile(new URL("meta/_journal.json", migrationDir), "utf8"),
  );
  assert.equal(journal.entries.length, 1);
  assert.equal(journal.entries[0].idx, 0);
  const sqlFile = (await readdir(migrationDir)).find((file) =>
    file.endsWith(".sql"),
  );
  assert.ok(journal.entries[0].tag.includes(sqlFile.replace(".sql", "")));
});
