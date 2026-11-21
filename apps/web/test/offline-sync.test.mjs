import "fake-indexeddb/auto";

import assert from "node:assert/strict";
import test from "node:test";

import {
  OfflineStore,
  SyncEngine,
  SyncQueue,
} from "../src/lib/offline/index.ts";

const START = Date.parse("2026-11-21T10:00:00.000Z");
const createdAt = new Date(START).toISOString();

async function setup(name) {
  const store = await OfflineStore.open(name);
  await store.clearAll();
  const queue = new SyncQueue(store, "device-1");
  return { store, queue };
}

function engine(queue, transport, now = () => START) {
  return new SyncEngine({
    queue,
    transport,
    now,
    baseDelayMs: 1_000,
    maxDelayMs: 10_000,
  });
}

test("enqueue persists operations and due() respects creation order", async () => {
  const { store, queue } = await setup("queue-order");
  const first = await queue.enqueue({
    entityType: "donation",
    entityId: "don-1",
    operation: "create",
    createdAt,
  });
  const second = await queue.enqueue({
    entityType: "claim",
    entityId: "claim-1",
    operation: "confirm",
    createdAt: new Date(START + 1_000).toISOString(),
  });

  assert.notEqual(first.id, second.id);
  assert.equal(first.deviceId, "device-1");
  assert.equal((await queue.get(first.id))?.operation, "create");
  assert.deepEqual(
    (await queue.due(START + 2_000)).map((op) => op.id),
    [first.id, second.id],
  );
  store.close();
});

test("flush replays each operation once and marks it completed", async () => {
  const { store, queue } = await setup("flush-success");
  const op = await queue.enqueue({
    entityType: "donation",
    operation: "publish",
    createdAt,
  });
  const sent = [];
  const transport = {
    async send(operation) {
      sent.push(operation.id);
      return { ok: true };
    },
  };

  const first = await engine(queue, transport).flush();
  const second = await engine(queue, transport).flush();

  assert.deepEqual(first, {
    processed: 1,
    succeeded: 1,
    retried: 0,
    failed: 0,
  });
  assert.equal(second.processed, 0);
  assert.deepEqual(sent, [op.id]);
  assert.equal((await queue.get(op.id))?.status, "completed");
  assert.ok((await queue.get(op.id))?.completedAt);
  store.close();
});

test("retryable failures are rescheduled with exponential backoff", async () => {
  const { store, queue } = await setup("flush-retry");
  const op = await queue.enqueue({
    entityType: "claim",
    operation: "confirm",
    createdAt,
  });
  let now = START;
  const transport = {
    async send() {
      return { ok: false, retryable: true, error: "network down" };
    },
  };

  const first = await engine(queue, transport, () => now).flush();
  const retried = await queue.get(op.id);
  assert.equal(first.retried, 1);
  assert.equal(retried?.attempts, 1);
  assert.equal(retried?.status, "pending");
  assert.equal(Date.parse(retried?.nextAttemptAt), START + 1_000);

  now += 999;
  assert.equal((await queue.due(now)).length, 0);
  now += 1;
  assert.equal((await queue.due(now)).length, 1);

  transport.send = async () => ({
    ok: false,
    retryable: true,
    error: "still down",
  });
  await engine(queue, transport, () => now).flush();
  const twice = await queue.get(op.id);
  assert.equal(twice?.attempts, 2);
  assert.equal(Date.parse(twice?.nextAttemptAt), now + 2_000);
  store.close();
});

test("non-retryable failures and exhausted retries end in failed", async () => {
  const { store, queue } = await setup("flush-fail");
  const permanent = await queue.enqueue({
    entityType: "need",
    operation: "create",
    createdAt,
  });
  const exhausted = await queue.enqueue({
    entityType: "donation",
    operation: "update",
    createdAt,
  });

  const transport = {
    async send(operation) {
      if (operation.id === permanent.id) {
        return { ok: false, retryable: false, error: "validation" };
      }
      return { ok: false, retryable: true, error: "timeout" };
    },
  };
  let now = START;
  const instance = new SyncEngine({
    queue,
    transport,
    now: () => now,
    maxAttempts: 2,
  });

  for (let i = 0; i < 2; i += 1) {
    await instance.flush();
    now += 2_000;
  }
  assert.equal((await queue.get(permanent.id))?.status, "failed");
  assert.equal((await queue.get(exhausted.id))?.status, "failed");
  assert.equal((await queue.get(exhausted.id))?.attempts, 2);
  assert.equal((await queue.counts()).failed, 2);
  store.close();
});

test("start() flushes on the online event and reports queue status", async () => {
  const { store, queue } = await setup("flush-online");
  await queue.enqueue({
    entityType: "donation",
    operation: "publish",
    createdAt,
  });
  let sent = 0;
  const instance = engine(queue, {
    async send() {
      sent += 1;
      return { ok: true };
    },
  });

  const listeners = new Map();
  globalThis.window = {
    addEventListener: (type, fn) => listeners.set(type, fn),
    removeEventListener: (type) => listeners.delete(type),
  };
  instance.start();
  assert.equal(listeners.has("online"), true);
  listeners.get("online")();
  await new Promise((resolve) => setTimeout(resolve, 100));

  assert.equal(sent, 1);
  assert.equal((await instance.status()).completed, 1);
  instance.stop();
  assert.equal(listeners.has("online"), false);
  delete globalThis.window;
  store.close();
});
