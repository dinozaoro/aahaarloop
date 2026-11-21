import assert from "node:assert/strict";
import test from "node:test";

import { deliveryEta } from "../src/lib/claims/eta.ts";

const now = new Date("2026-11-21T12:00:00Z");

test("ETA counts down to the pickup deadline", () => {
  const result = deliveryEta("2026-11-21T15:30:00Z", now);
  assert.equal(result.overdue, false);
  assert.equal(result.minutesLeft, 210);
  assert.equal(result.label, "Arriving in 3 h 30 min");
});

test("ETA reports overdue deadlines and missing values safely", () => {
  const overdue = deliveryEta("2026-11-21T10:00:00Z", now);
  assert.equal(overdue.overdue, true);
  assert.equal(overdue.label, "Overdue by 2 h 0 min");
  assert.equal(deliveryEta("not a date", now).label, "Time to be confirmed");
});
