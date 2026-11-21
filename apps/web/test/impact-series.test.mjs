import assert from "node:assert/strict";
import test from "node:test";

import { monthlyRescued, statusCounts } from "../src/lib/impact/series.ts";

const now = new Date("2026-11-21T12:00:00Z");

test("monthly series includes empty months and totals rounded kilograms", () => {
  const series = monthlyRescued(
    [
      { updatedAt: "2026-11-02T10:00:00Z", weightKg: 4.24 },
      { updatedAt: "2026-11-15T10:00:00Z", weightKg: 2.1 },
      { updatedAt: "2026-09-01T10:00:00Z", weightKg: 1 },
    ],
    now,
    3,
  );
  assert.deepEqual(series.map((point) => point.label), ["Sept", "Oct", "Nov"]);
  assert.deepEqual(series.map((point) => point.value), [1, 0, 6.3]);
});

test("status counts are sorted by frequency", () => {
  assert.deepEqual(
    statusCounts([{ status: "pending" }, { status: "delivered" }, { status: "pending" }]),
    [
      { label: "pending", value: 2 },
      { label: "delivered", value: 1 },
    ],
  );
});
