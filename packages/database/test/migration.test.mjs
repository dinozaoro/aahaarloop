import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { test } from "node:test";

const migrationDir = new URL("../migrations/", import.meta.url);

async function allMigrationSql() {
  const files = (await readdir(migrationDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  assert.ok(files.length >= 1, "expected at least one migration");
  const chunks = await Promise.all(
    files.map((file) => readFile(new URL(file, migrationDir), "utf8")),
  );
  return chunks.join("\n");
}

test("the migrations create all 32 domain tables", async () => {
  const sql = await allMigrationSql();
  const matches = sql.match(/CREATE TABLE "/g) ?? [];
  assert.equal(matches.length, 32);
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
  const sql = await allMigrationSql();
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
  const sql = await allMigrationSql();
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

test("the drizzle journal covers every migration in order", async () => {
  const journal = JSON.parse(
    await readFile(new URL("meta/_journal.json", migrationDir), "utf8"),
  );
  const files = (await readdir(migrationDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  assert.equal(journal.entries.length, files.length);
  journal.entries.forEach((entry, index) => {
    assert.equal(entry.idx, index);
    assert.ok(entry.tag.includes(files[index].replace(".sql", "")));
  });
});
