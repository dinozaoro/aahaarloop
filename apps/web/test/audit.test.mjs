import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import {
  buildAuditEntry,
  createAuditWriter,
  redact,
} from "../src/lib/audit/log.ts";

test("audit redaction removes secrets at every depth", () => {
  assert.deepEqual(
    redact({
      title: "Rice",
      password: "hunter2",
      nested: [{ apiKey: "sk-live", qty: 4 }],
    }),
    { title: "Rice", nested: [{ qty: 4 }] },
  );
});

test("a privileged action writes one redacted, attributable entry", async () => {
  const inserted = [];
  const write = createAuditWriter(async (entry) => inserted.push(entry));
  await write({
    actorType: "admin",
    actorId: "user-1",
    action: "admin.config.update",
    entityType: "config",
    entityId: "config-1",
    before: { urgencyHours: 48, clientSecret: "old" },
    after: { urgencyHours: 24, clientSecret: "new" },
    ipAddress: "127.0.0.1",
  });

  assert.equal(inserted.length, 1);
  assert.deepEqual(inserted[0].before, { urgencyHours: 48 });
  assert.deepEqual(inserted[0].after, { urgencyHours: 24 });
  assert.equal(inserted[0].actorType, "admin");
  assert.equal(inserted[0].entityType, "config");
  assert.ok(inserted[0].occurredAt instanceof Date);
});

test("audit entries carry nulls instead of missing fields", () => {
  const entry = buildAuditEntry({
    actorType: "system",
    action: "claim.expire",
    entityType: "claim",
  });
  assert.equal(entry.actorId, null);
  assert.equal(entry.entityId, null);
  assert.equal(entry.before, null);
  assert.equal(entry.after, null);
});

test("the admin audit API is read-only and admin-guarded", async () => {
  const source = await readFile(
    new URL("../src/app/api/admin/audit/route.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /forbidUnlessRole\(\["admin"\]\)/);
  assert.doesNotMatch(source, /export const (POST|PATCH|PUT|DELETE)/);
});
