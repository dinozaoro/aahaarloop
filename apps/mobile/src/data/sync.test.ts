import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import type { SqliteDatabase, SqlParam } from "./database-types.ts";
import { currentVersion, migrate, SCHEMA_VERSION } from "./schema.ts";
import {
  detectConflict,
  MobileSyncEngine,
  MobileSyncQueue,
  resolveConflict,
} from "./sync.ts";

function testDatabase(): SqliteDatabase {
  const db = new DatabaseSync(":memory:");
  return {
    async execAsync(source) {
      db.exec(source);
    },
    async runAsync(source, params: SqlParam[] = []) {
      const result = db.prepare(source).run(...params);
      return {
        changes: Number(result.changes),
        lastInsertRowId: Number(result.lastInsertRowId),
      };
    },
    async getAllAsync<T>(
      source: string,
      params: SqlParam[] = [],
    ): Promise<T[]> {
      return db.prepare(source).all(...params) as T[];
    },
    async getFirstAsync<T>(
      source: string,
      params: SqlParam[] = [],
    ): Promise<T | null> {
      return (db.prepare(source).get(...params) as T | undefined) ?? null;
    },
  };
}

const START = Date.parse("2026-11-21T10:00:00.000Z");
const createdAt = new Date(START).toISOString();

async function setup() {
  const db = testDatabase();
  await migrate(db);
  return { db, queue: new MobileSyncQueue(db, "device-1") };
}

function engine(
  queue: MobileSyncQueue,
  transport: ConstructorParameters<typeof MobileSyncEngine>[0]["transport"],
  now = () => START,
  isOnline = () => true,
) {
  return new MobileSyncEngine({
    queue,
    transport,
    now,
    isOnline,
    baseDelayMs: 1_000,
    maxDelayMs: 10_000,
  });
}

test("v2 migration creates the outbox and conflict tables", async () => {
  const db = testDatabase();
  await migrate(db);
  assert.equal(await currentVersion(db), SCHEMA_VERSION);
  assert.equal(SCHEMA_VERSION, 2);

  const tables = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table'",
    [],
  );
  const names = tables.map((row) => row.name);
  assert.ok(names.includes("operations"));
  assert.ok(names.includes("conflicts"));
});

test("enqueue persists operations and due() respects creation order", async () => {
  const { queue } = await setup();
  const first = await queue.enqueue({
    entityType: "donation",
    entityId: "don-1",
    operation: "publish",
    createdAt,
  });
  const second = await queue.enqueue({
    entityType: "claim",
    operation: "confirm",
    createdAt: new Date(START + 1_000).toISOString(),
  });

  assert.notEqual(first.id, second.id);
  assert.equal((await queue.get(first.id))?.deviceId, "device-1");
  assert.deepEqual(
    (await queue.due(START + 2_000)).map((op) => op.id),
    [first.id, second.id],
  );
});

test("flush replays once, skips offline and retries with backoff", async () => {
  const { queue } = await setup();
  const op = await queue.enqueue({
    entityType: "donation",
    operation: "publish",
    payload: { title: "Curry" },
    createdAt,
  });
  const sent: string[] = [];
  const transport = {
    async send(operation: { id: string }) {
      sent.push(operation.id);
      return { ok: true as const };
    },
  };

  const offline = await engine(
    queue,
    transport,
    () => START,
    () => false,
  ).flush();
  assert.equal(offline.processed, 0);

  const first = await engine(queue, transport).flush();
  await engine(queue, transport).flush();
  assert.deepEqual(first, {
    processed: 1,
    succeeded: 1,
    retried: 0,
    failed: 0,
    conflicts: 0,
  });
  assert.deepEqual(sent, [op.id]);
  assert.equal((await queue.get(op.id))?.status, "completed");

  const retry = await queue.enqueue({
    entityType: "claim",
    operation: "confirm",
    createdAt,
  });
  let now = START;
  const failing = engine(
    queue,
    {
      async send() {
        return { ok: false as const, retryable: true, error: "offline" };
      },
    },
    () => now,
  );
  await failing.flush();
  assert.equal((await queue.get(retry.id))?.attempts, 1);
  assert.equal(
    Date.parse((await queue.get(retry.id))?.nextAttemptAt ?? ""),
    START + 1_000,
  );
  now += 1_000;
  await failing.flush();
  assert.equal((await queue.get(retry.id))?.attempts, 2);
  assert.equal(
    Date.parse((await queue.get(retry.id))?.nextAttemptAt ?? ""),
    START + 3_000,
  );
});

test("a conflict result is persisted and resolvable", async () => {
  const { queue } = await setup();
  const op = await queue.enqueue({
    entityType: "donation",
    operation: "update",
    createdAt,
  });
  const transport = {
    async send() {
      return {
        ok: false as const,
        retryable: false as const,
        conflict: true as const,
        remote: { version: 4, updatedAt: createdAt },
      };
    },
  };

  const report = await engine(queue, transport).flush();
  assert.equal(report.conflicts, 1);
  const conflicts = await queue.listConflicts();
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0]?.operationId, op.id);
  assert.equal(conflicts[0]?.resolution, "pending");

  const resolved = await queue.resolveConflict(conflicts[0]!.id, "merged");
  assert.equal(resolved?.resolution, "merged");
  assert.ok(resolved?.resolvedAt);
});

test("conflict detection and the three resolution paths never lose data silently", () => {
  const local = {
    version: 2,
    updatedAt: "2026-11-21T10:00:00.000Z",
    title: "local",
  };
  const remote = {
    version: 3,
    updatedAt: "2026-11-21T10:05:00.000Z",
    note: "remote",
  };

  assert.equal(detectConflict(local, remote), true);
  assert.equal(detectConflict(remote, remote), false);

  const overwrite = resolveConflict(local, remote, "overwrite");
  assert.equal(overwrite?.title, "local");
  assert.equal(overwrite?.version, 4);

  const merged = resolveConflict(local, remote, "merge");
  assert.equal(merged?.title, "local");
  assert.equal(merged?.note, "remote");
  assert.equal(merged?.version, 4);

  assert.equal(resolveConflict(local, remote, "cancel"), null);
});
