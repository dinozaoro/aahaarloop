import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const root = new URL("../../../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("DAL stays server-only and reads through getDb", async () => {
  const dal = await source("apps/web/src/lib/data/dal.ts");
  assert.match(dal, /import "server-only"/);
  assert.match(dal, /getDb\(\)/);
  assert.doesNotMatch(dal, /const donations: Donation\[\] = \[\]/);
});

test("claim idempotency key is durable and the mobile client sends it", async () => {
  const schema = await source("packages/database/src/claims.ts");
  const mobile = await source("apps/mobile/src/lib/api.ts");
  assert.match(schema, /idempotencyKey: text\("idempotency_key"\)/);
  assert.match(mobile, /headers\.set\("idempotency-key", options\.idempotencyKey\)/);
});

test("notification preferences are persisted", async () => {
  const schema = await source("packages/database/src/identity.ts");
  assert.match(schema, /export const notificationPreferences = pgTable\("notification_preferences"/);
});

test("claims commit atomically with a locked donation row", async () => {
  const dal = await source("apps/web/src/lib/data/dal.ts");
  assert.match(dal, /export async function commitClaim/);
  assert.match(dal, /db\.transaction\(/);
  assert.match(dal, /\.for\("update"\)/);
  const service = await source("apps/web/src/lib/claims/transaction.ts");
  assert.doesNotMatch(service, /let tail: Promise/);
  assert.match(service, /repo\.commit\(claim/);
});

test("the remaining in-memory stores now have durable backends", async () => {
  const schema = await source("packages/database/src/operations.ts");
  for (const table of ["apiIdempotency", "telemetryEvents", "adminConfig"]) {
    assert.match(schema, new RegExp(`export const ${table} = pgTable`));
  }
  const donations = await source("packages/database/src/donations.ts");
  assert.match(donations, /favorites[^\n]*pgTable/);
  assert.match(donations, /organizationId: uuid\("organization_id"\)/);
  const handler = await source("apps/web/src/lib/api/handler.ts");
  assert.match(handler, /options\.idempotency === true \? durableIdempotencyStore/);
  const reports = await source("apps/web/src/lib/moderation/store-repository.ts");
  assert.match(reports, /recordAudit/);
});
