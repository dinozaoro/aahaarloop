import "fake-indexeddb/auto";

import assert from "node:assert/strict";
import test from "node:test";

import {
  OFFLINE_SCHEMA_VERSION,
  OFFLINE_STORES,
  OfflineQuotaError,
  OfflineStore,
  toOfflineError,
} from "../src/lib/offline/index.ts";

const now = "2026-11-21T10:00:00.000Z";

function donation(id = "don-1") {
  return {
    id,
    title: "Vegetable curry",
    status: "published",
    remainingQuantity: 12,
    updatedAt: now,
    cachedAt: now,
  };
}

async function freshStore(name) {
  const store = await OfflineStore.open(name);
  await store.clearAll();
  return store;
}

test("open creates the versioned schema with all five stores", async () => {
  const store = await freshStore("schema-test");
  assert.equal(store.version, OFFLINE_SCHEMA_VERSION);

  const databases = await indexedDB.databases();
  assert.ok(databases.some((db) => db.name === "schema-test"));

  const names = await new Promise((resolve, reject) => {
    const request = indexedDB.open("schema-test", OFFLINE_SCHEMA_VERSION);
    request.onsuccess = () => resolve([...request.result.objectStoreNames]);
    request.onerror = () => reject(request.error);
  });
  assert.deepEqual(new Set(names), new Set(OFFLINE_STORES));
  store.close();
});

test("repositories support CRUD and indexed lookups", async () => {
  const store = await freshStore("crud-test");
  const { donations, claims, drafts, sessions } = store;

  await donations.put(donation());
  await donations.put(donation("don-2"));
  assert.equal((await donations.get("don-1"))?.title, "Vegetable curry");
  assert.equal((await donations.getAll()).length, 2);
  assert.equal(
    (await donations.getAllByIndex("status", "published")).length,
    2,
  );

  await claims.put({
    id: "claim-1",
    donationId: "don-1",
    status: "pending",
    quantity: 5,
    updatedAt: now,
    cachedAt: now,
  });
  assert.equal((await claims.getAllByIndex("donationId", "don-1")).length, 1);

  await drafts.put({
    id: "draft-1",
    kind: "donation",
    payload: { title: "Unfinished" },
    updatedAt: now,
  });
  assert.equal((await drafts.getAllByIndex("kind", "donation")).length, 1);

  await sessions.put({
    id: "session",
    value: { role: "volunteer" },
    updatedAt: now,
  });
  assert.deepEqual((await sessions.get("session"))?.value, {
    role: "volunteer",
  });

  await donations.delete("don-1");
  assert.equal(await donations.get("don-1"), undefined);
  store.close();
});

test("cached records survive closing and reopening the database", async () => {
  const first = await freshStore("reload-test");
  await first.donations.put(donation());
  await first.sessions.put({ id: "session", value: "token", updatedAt: now });
  first.close();

  const second = await OfflineStore.open("reload-test");
  assert.equal((await second.donations.get("don-1"))?.remainingQuantity, 12);
  assert.equal((await second.sessions.get("session"))?.value, "token");
  await second.clearAll();
  assert.equal((await second.donations.getAll()).length, 0);
  second.close();
});

test("quota errors are surfaced as a typed offline error", () => {
  assert.ok(
    toOfflineError(new DOMException("full", "QuotaExceededError")) instanceof
      OfflineQuotaError,
  );
  assert.ok(toOfflineError(new Error("nope")) instanceof Error);
  assert.equal(toOfflineError("nope").message, "nope");
});
