import assert from "node:assert/strict";
import { test } from "node:test";

import { buildDonorDashboard } from "../src/lib/donor-dashboard.ts";

const donation = (id, status, total, available, deadline) => ({
  id,
  status,
  servingsTotal: total,
  servingsAvailable: available,
  pickupDeadlineAt: deadline,
});

test("donor dashboard sorts active donations and summarizes rescued food", () => {
  const result = buildDonorDashboard(
    [
      donation("late", "published", 10, 10, "2026-11-21T12:00:00Z"),
      donation("urgent", "claimed", 20, 5, "2026-11-21T10:00:00Z"),
      donation("done", "delivered", 30, 0, "2026-11-21T09:00:00Z"),
    ],
    [{ id: "claim", status: "pickup_scheduled" }],
  );

  assert.deepEqual(result.active.map(({ id }) => id), ["urgent", "late"]);
  assert.equal(result.urgent.id, "urgent");
  assert.equal(result.rescuedServings, 45);
  assert.equal(result.awaitingPickup.length, 1);
});

test("empty donor data produces an empty dashboard summary", () => {
  const result = buildDonorDashboard([], []);
  assert.deepEqual(result.active, []);
  assert.equal(result.urgent, undefined);
  assert.equal(result.rescuedServings, 0);
  assert.deepEqual(result.awaitingPickup, []);
});
