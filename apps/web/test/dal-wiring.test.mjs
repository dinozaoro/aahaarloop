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
