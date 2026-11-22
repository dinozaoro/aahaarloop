import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createNotificationService,
  defaultPreferences,
  NOTIFICATION_TYPES,
} from "../src/lib/notifications/service.ts";
import { notificationTriggers } from "../src/lib/notifications/triggers.ts";

const NOW = "2026-11-21T12:00:00Z";

function setup(options = {}) {
  const rows = [];
  const prefs = new Map();
  const repo = {
    all: () => rows,
    save: (item) => {
      const i = rows.findIndex((row) => row.id === item.id);
      if (i === -1) rows.push(item); else rows[i] = item;
    },
    preferences: (userId) => prefs.get(userId) ?? defaultPreferences(),
    savePreferences: (userId, value) => prefs.set(userId, value),
  };
  const sent = [];
  const adapter = {
    channel: "email",
    send: async (notification) => { sent.push(notification); },
  };
  const service = createNotificationService(repo, {
    now: () => NOW,
    adapters: { email: adapter },
    ...options,
  });
  return { rows, prefs, repo, sent, service };
}

const claim = {
  id: "c1", donationId: "d1", donationTitle: "Rice",
  donorOrganizationId: "org-donor", recipientOrgId: "org-recipient",
  servings: 6, weightKg: 6, status: "confirmed",
  createdAt: NOW, updatedAt: NOW, history: [],
};
const task = {
  id: "t1", donationId: "d1", claimId: "c1", status: "assigned",
  windowStart: NOW, windowEnd: "2026-11-22T12:00:00Z",
  address: "2 MG Road", location: { latitude: 12.97, longitude: 77.59 },
  weightKg: 6, createdAt: NOW,
};

const input = (overrides = {}) => ({
  type: "claim_created",
  title: "Claim submitted",
  body: "Your claim is pending confirmation.",
  entityType: "claim",
  entityId: "c1",
  recipients: ["u1", "u2"],
  ...overrides,
});

test("notify creates one notification per recipient and marks unread", async () => {
  const { service } = setup();
  const created = await service.notify(input());
  assert.equal(created.length, 2);
  assert.deepEqual(created.map((item) => item.userId), ["u1", "u2"]);
  assert.ok(created.every((item) => item.readAt === null));
  assert.equal((await service.list("u1")).unread, 1);
  assert.equal((await service.list("u2")).total, 1);
});

test("disabled event types are not delivered", async () => {
  const { service, repo } = setup();
  repo.savePreferences("u1", {
    ...defaultPreferences(),
    enabled: { ...defaultPreferences().enabled, claim_created: false },
  });
  const created = await service.notify(input());
  assert.deepEqual(created.map((item) => item.userId), ["u2"]);
});

test("duplicate notifications for one user and entity are suppressed", async () => {
  const { service } = setup();
  const first = await service.notify(input({ recipients: ["u1"] }));
  const second = await service.notify(
    input({ recipients: ["u1"], title: "Different copy" }),
  );
  assert.equal(first.length, 1);
  assert.equal(second.length, 0);
  assert.equal((await service.list("u1")).total, 1);
});

test("duplicates are allowed again after the dedupe window", async () => {
  let time = Date.parse(NOW);
  const { service } = setup({
    now: () => new Date(time).toISOString(),
    dedupeWindowMs: 1000,
  });
  await service.notify(input({ recipients: ["u1"] }));
  time += 2000;
  assert.equal((await service.notify(input({ recipients: ["u1"] }))).length, 1);
  assert.equal((await service.list("u1")).total, 2);
});

test("read state persists, is per-user and cannot be forged across users", async () => {
  const { service } = setup();
  const [notification] = await service.notify(input({ recipients: ["u1"] }));
  const read = await service.markRead(notification.id, "u1");
  assert.notEqual(read.readAt, null);
  assert.equal((await service.list("u1", { unreadOnly: true })).total, 0);
  await assert.rejects(() => service.markRead(notification.id, "u2"), /another user/);
  assert.equal(await service.markAllRead("u1"), 0);
});

test("preferences choose the delivery adapter", async () => {
  const { service, repo, sent } = setup();
  repo.savePreferences("u1", { ...defaultPreferences(), channel: "email" });
  await service.notify(input({ recipients: ["u1"] }));
  assert.equal(sent.length, 1);
  assert.equal(sent[0].userId, "u1");
  const next = await service.updatePreferences("u1", {
    enabled: { pickup_assigned: false },
  });
  assert.equal(next.channel, "email");
  assert.equal(next.enabled.pickup_assigned, false);
  assert.equal(next.enabled.claim_created, true);
});

test("every domain trigger produces the expected typed input", async () => {
  const cases = [
    [notificationTriggers.claimCreated(claim, "u1"), "claim_created", "claim", "c1"],
    [notificationTriggers.claimCancelled(claim, "u1", "spoiled"), "claim_cancelled", "claim", "c1"],
    [notificationTriggers.claimExpired(claim, "u1"), "claim_expired", "claim", "c1"],
    [notificationTriggers.pickupAssigned(task, "u1"), "pickup_assigned", "pickup_task", "t1"],
    [notificationTriggers.pickupCompleted(task, "u1"), "pickup_completed", "pickup_task", "t1"],
    [notificationTriggers.delivered(claim, "u1"), "delivered", "claim", "c1"],
    [notificationTriggers.deadlineApproaching(claim, "u1", 4), "deadline_approaching", "claim", "c1"],
  ];
  for (const [triggered, type, entityType, entityId] of cases) {
    assert.ok(NOTIFICATION_TYPES.includes(triggered.type));
    assert.equal(triggered.type, type);
    assert.equal(triggered.entityType, entityType);
    assert.equal(triggered.entityId, entityId);
    assert.deepEqual(triggered.recipients, ["u1"]);
  }
});
