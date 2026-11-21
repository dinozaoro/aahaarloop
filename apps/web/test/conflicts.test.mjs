import assert from "node:assert/strict";
import test from "node:test";

import {
  detectConflict,
  resolveConflict,
} from "../src/lib/offline/conflicts.ts";

const local = { version: 2, updatedAt: "2026-11-21T10:00:00Z", title: "local" };
const remote = { version: 3, updatedAt: "2026-11-21T10:05:00Z", note: "remote" };

test("conflict detection compares version and update time", () => {
  assert.equal(detectConflict(local, remote), true);
  assert.equal(detectConflict(local, local), false);
});

test("merge keeps both sides and advances the version", () => {
  const merged = resolveConflict(local, remote, "merge");
  assert.equal(merged.title, "local");
  assert.equal(merged.note, "remote");
  assert.equal(merged.version, 4);
});

test("overwrite keeps local, cancel drops it", () => {
  assert.equal(resolveConflict(local, remote, "overwrite").title, "local");
  assert.equal(resolveConflict(local, remote, "cancel"), null);
});
