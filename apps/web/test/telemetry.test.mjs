import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import {
  createTelemetry,
  PAYLOAD_KEYS,
  sanitizePayload,
  TELEMETRY_EVENTS,
} from "../src/lib/telemetry/events.ts";

const NOW = "2026-11-21T12:00:00Z";

function setup(options = {}) {
  const events = [];
  const telemetry = createTelemetry((event) => events.push(event), {
    now: () => NOW,
    ...options,
  });
  return { events, telemetry };
}

test("every documented event type has an allowlisted schema", () => {
  assert.deepEqual([...TELEMETRY_EVENTS], [
    "donation_created",
    "donation_claimed",
    "donation_matched",
    "donation_delivered",
  ]);
  for (const name of TELEMETRY_EVENTS) {
    assert.ok(PAYLOAD_KEYS[name].length > 0, name);
  }
});

test("each event is emitted once per event id", async () => {
  const { events, telemetry } = setup();
  const first = await telemetry.track(
    "donation_created",
    { servings: 5 },
    { eventId: "fixed-1" },
  );
  const second = await telemetry.track(
    "donation_created",
    { servings: 5 },
    { eventId: "fixed-1" },
  );
  assert.equal(first, true);
  assert.equal(second, false);
  assert.equal(events.length, 1);
});

test("recorded events carry only the schema fields", async () => {
  const { events, telemetry } = setup();
  await telemetry.track(
    "donation_matched",
    { matchCount: 3, excludedCount: 1, topScore: 88.5 },
    { eventId: "match-1" },
  );
  assert.deepEqual(events[0], {
    eventId: "match-1",
    name: "donation_matched",
    occurredAt: NOW,
    payload: { matchCount: 3, excludedCount: 1, topScore: 88.5 },
  });
});

test("personal data, identifiers and nested values never reach the sink", async () => {
  const { events, telemetry } = setup();
  await telemetry.track(
    "donation_created",
    {
      category: "prepared",
      servings: 10,
      email: "donor@example.com",
      phone: "+91 98765 43210",
      donorName: "Asha Rao",
      userId: "user-123",
      latitude: 12.97,
      address: "12 MG Road",
      ipAddress: "203.0.113.5",
      location: { latitude: 12.97, longitude: 77.59 },
    },
    { eventId: "pii-1" },
  );
  assert.deepEqual(events[0].payload, { category: "prepared", servings: 10 });
  const serialized = JSON.stringify(events);
  for (const pii of ["example.com", "98765", "Asha", "user-123", "MG Road", "203.0.113", "latitude"]) {
    assert.equal(serialized.includes(pii), false, pii);
  }
});

test("sanitize drops string values that look like emails or phone numbers", () => {
  const result = sanitizePayload("donation_claimed", {
    servings: 4,
    isPartial: true,
    note: "call +91 98765 43210",
  });
  assert.deepEqual(result, { servings: 4, isPartial: true });
});

test("sampling is deterministic and bounded", async () => {
  const none = setup({ sampleRate: 0 });
  await none.telemetry.track("donation_created", {}, { eventId: "a" });
  assert.equal(none.events.length, 0);

  const all = setup({ sampleRate: 1 });
  await all.telemetry.track("donation_created", {}, { eventId: "a" });
  assert.equal(all.events.length, 1);

  const sampled = setup({ sampleRate: 0.5 });
  const first = await sampled.telemetry.track("donation_created", {}, { eventId: "sample-1" });
  const fresh = setup({ sampleRate: 0.5 });
  const again = await fresh.telemetry.track("donation_created", {}, { eventId: "sample-1" });
  assert.equal(first, again);

  assert.throws(() => createTelemetry(() => undefined, { sampleRate: 1.5 }), /sampleRate/);
});

test("emission is wired into server routes only", async () => {
  for (const file of [
    "../src/app/api/donations/route.ts",
    "../src/app/api/claims/route.ts",
    "../src/app/api/matches/route.ts",
    "../src/app/api/pickups/tasks/[id]/complete/route.ts",
  ]) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.match(source, /telemetry\.track\(/, file);
  }
});
