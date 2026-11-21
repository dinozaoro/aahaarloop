import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import type { SqliteDatabase, SqlParam } from "./database-types.ts";
import {
  ClaimRepository,
  DonationRepository,
  MissionRepository,
} from "./repositories.ts";
import {
  currentVersion,
  migrate,
  resetDatabase,
  SCHEMA_VERSION,
} from "./schema.ts";
import type { LocalClaim, LocalDonation, LocalMission } from "./types.ts";

/** Adapts Node's built-in SQLite to the same async surface expo-sqlite exposes. */
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

const NOW = "2026-11-21T10:00:00.000Z";

function donation(id = "don-1"): LocalDonation {
  return {
    id,
    title: "Vegetable curry",
    description: null,
    status: "published",
    quantity: 20,
    remainingQuantity: 12,
    unit: "serving",
    storage: "chilled",
    address: "12 Main Street",
    latitude: 18.8792,
    longitude: 47.5079,
    foodExpiryAt: "2026-11-22T10:00:00.000Z",
    bestBeforeAt: null,
    pickupDeadlineAt: "2026-11-21T16:00:00.000Z",
    updatedAt: NOW,
  };
}

function claim(id = "claim-1"): LocalClaim {
  return {
    id,
    donationId: "don-1",
    recipientId: "org-1",
    status: "pending",
    quantity: 5,
    unit: "serving",
    note: null,
    expiresAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function mission(id = "mission-1"): LocalMission {
  return {
    id,
    donationId: "don-1",
    claimId: "claim-1",
    status: "assigned",
    windowStart: "2026-11-21T14:00:00.000Z",
    windowEnd: "2026-11-21T15:00:00.000Z",
    address: "12 Main Street",
    latitude: 18.8792,
    longitude: 47.5079,
    capacityKg: 10,
    notes: null,
    updatedAt: NOW,
  };
}

test("migrate creates the schema on an empty database and is idempotent", async () => {
  const db = testDatabase();
  assert.equal(await currentVersion(db), 0);

  assert.equal(await migrate(db), SCHEMA_VERSION);
  assert.equal(await currentVersion(db), SCHEMA_VERSION);

  const donations = new DonationRepository(db);
  await donations.upsert(donation());

  assert.equal(await migrate(db), SCHEMA_VERSION);
  assert.equal((await donations.getById("don-1"))?.title, "Vegetable curry");
});

test("donation repository supports upsert, read, list and delete", async () => {
  const db = testDatabase();
  await migrate(db);
  const donations = new DonationRepository(db);

  await donations.upsert(donation());
  await donations.upsert(donation("don-2"));
  assert.equal((await donations.list()).length, 2);

  const updated = { ...donation(), remainingQuantity: 3 };
  await donations.upsert(updated);
  const stored = await donations.getById("don-1");
  assert.equal(stored?.remainingQuantity, 3);
  assert.equal(stored?.status, "published");

  await donations.remove("don-1");
  assert.equal(await donations.getById("don-1"), null);
  assert.equal((await donations.list()).length, 1);
});

test("claim repository lists by donation and cascades on donation delete", async () => {
  const db = testDatabase();
  await migrate(db);
  const donations = new DonationRepository(db);
  const claims = new ClaimRepository(db);

  await donations.upsert(donation());
  await claims.upsert(claim());
  await claims.upsert(claim("claim-2"));

  assert.equal((await claims.listByDonation("don-1")).length, 2);
  assert.equal((await claims.getById("claim-1"))?.recipientId, "org-1");

  await donations.remove("don-1");
  assert.equal((await claims.listByDonation("don-1")).length, 0);
});

test("mission repository supports upsert and filtering by status", async () => {
  const db = testDatabase();
  await migrate(db);
  const missions = new MissionRepository(db);
  await new DonationRepository(db).upsert(donation());
  await new ClaimRepository(db).upsert(claim());

  await missions.upsert(mission());
  await missions.upsert({ ...mission("mission-2"), status: "completed" });

  assert.equal((await missions.getById("mission-1"))?.donationId, "don-1");
  assert.equal((await missions.listByStatus("assigned")).length, 1);
  assert.equal((await missions.listByStatus("completed")).length, 1);

  await missions.remove("mission-1");
  assert.equal(await missions.getById("mission-1"), null);
});

test("repositories reject invalid records before writing", async () => {
  const db = testDatabase();
  await migrate(db);
  const donations = new DonationRepository(db);

  await assert.rejects(
    () => donations.upsert({ ...donation(), id: " " }),
    /id is required/,
  );
  await assert.rejects(
    () => donations.upsert({ ...donation(), quantity: -1 }),
    /non-negative/,
  );
  await assert.rejects(
    () => donations.upsert({ ...donation(), status: "nope" as never }),
    /unsupported value/,
  );
  assert.equal((await donations.list()).length, 0);
});

test("resetDatabase clears data and rebuilds an empty schema", async () => {
  const db = testDatabase();
  await migrate(db);
  const donations = new DonationRepository(db);
  await donations.upsert(donation());

  await resetDatabase(db);

  assert.equal(await currentVersion(db), SCHEMA_VERSION);
  assert.equal((await donations.list()).length, 0);
  await donations.upsert(donation());
  assert.equal((await donations.getById("don-1"))?.title, "Vegetable curry");
});
