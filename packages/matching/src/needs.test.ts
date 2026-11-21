import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_NEED_PRIORITY,
  closeNeed,
  createNeed,
  editNeed,
  fulfillNeed,
  getActiveNeeds,
  needsMatchCategory,
  refreshNeedStatuses,
  totalNeededQuantity,
  validateNeedInput,
} from "./needs.ts";
import {
  createNeed as publicCreateNeed,
  getActiveNeeds as publicGetActiveNeeds,
} from "./index.ts";
import type { Need } from "./needs.ts";

const HOUR_MS = 3_600_000;
const NOW = new Date("2026-11-21T10:00:00.000Z");

function at(offsetMs: number): Date {
  return new Date(NOW.getTime() + offsetMs);
}

function activeNeed(overrides: Partial<Need> = {}): Need {
  return {
    id: "need-1",
    category: "produce",
    quantity: 20,
    deadlineAt: at(24 * HOUR_MS),
    priority: "medium",
    notes: "",
    status: "active",
    createdAt: NOW,
    ...overrides,
  };
}

describe("validateNeedInput", () => {
  it("accepts a valid need", () => {
    assert.deepEqual(
      validateNeedInput(
        { category: "produce", quantity: 20, deadlineAt: at(HOUR_MS) },
        NOW
      ),
      []
    );
  });

  it("rejects zero and non-finite quantities", () => {
    for (const quantity of [0, -1, Number.POSITIVE_INFINITY, Number.NaN]) {
      const errors = validateNeedInput({ category: "produce", quantity }, NOW);
      assert.deepEqual(errors.map((error) => error.field), ["quantity"]);
    }
  });

  it("rejects a deadline at or before now", () => {
    for (const deadlineAt of [NOW, at(-HOUR_MS)]) {
      const errors = validateNeedInput(
        { category: "produce", quantity: 20, deadlineAt },
        NOW
      );
      assert.deepEqual(errors.map((error) => error.field), ["deadlineAt"]);
    }
  });

  it("rejects a blank category and an unknown priority", () => {
    const errors = validateNeedInput(
      { category: "   ", quantity: 20, priority: "urgent" as never },
      NOW
    );
    assert.deepEqual(errors.map((error) => error.field), [
      "priority",
      "category",
    ]);
  });

  it("throws on an unparseable deadline", () => {
    assert.throws(
      () =>
        validateNeedInput(
          { category: "produce", quantity: 20, deadlineAt: "not-a-date" },
          NOW
        ),
      /deadlineAt must be a valid date/
    );
  });
});

describe("createNeed", () => {
  it("creates an active need with defaults", () => {
    const { need, errors } = createNeed(
      { category: "  produce  ", quantity: 20 },
      NOW
    );

    assert.deepEqual(errors, []);
    assert.match(need.id, /^need-/);
    assert.equal(need.category, "produce");
    assert.equal(need.quantity, 20);
    assert.equal(need.deadlineAt, null);
    assert.equal(need.priority, DEFAULT_NEED_PRIORITY);
    assert.equal(need.notes, "");
    assert.equal(need.status, "active");
    assert.equal(need.createdAt, NOW);
  });

  it("keeps the supplied deadline, priority and notes", () => {
    const deadlineAt = at(24 * HOUR_MS);
    const { need } = createNeed(
      {
        category: "bakery",
        quantity: 10,
        deadlineAt,
        priority: "high",
        notes: "no nuts",
      },
      NOW
    );

    assert.equal(need.deadlineAt, deadlineAt);
    assert.equal(need.priority, "high");
    assert.equal(need.notes, "no nuts");
  });

  it("returns validation errors without a need for invalid input", () => {
    const { need, errors } = createNeed(
      {
        category: "",
        quantity: 0,
        deadlineAt: at(-HOUR_MS),
        priority: "urgent" as never,
      },
      NOW
    );

    assert.deepEqual(errors.map((error) => error.field), [
      "quantity",
      "deadlineAt",
      "priority",
      "category",
    ]);
    assert.equal(need, null);
  });
});

describe("editNeed", () => {
  it("updates only the supplied fields", () => {
    const original = activeNeed({ notes: "keep me" });
    const { need, errors } = editNeed(original, { quantity: 35 }, NOW);

    assert.deepEqual(errors, []);
    assert.equal(need.quantity, 35);
    assert.equal(need.category, original.category);
    assert.equal(need.deadlineAt, original.deadlineAt);
    assert.equal(need.notes, "keep me");
    assert.equal(original.quantity, 20);
  });

  it("clears the deadline when explicitly set to null", () => {
    const { need } = editNeed(activeNeed(), { deadlineAt: null }, NOW);
    assert.equal(need.deadlineAt, null);
  });

  it("reactivates an expired need given a future deadline", () => {
    const expired = activeNeed({
      status: "expired",
      deadlineAt: at(-HOUR_MS),
    });
    const { need } = editNeed(expired, { deadlineAt: at(HOUR_MS) }, NOW);
    assert.equal(need.status, "active");
  });

  it("keeps an expired status when the old deadline is still past", () => {
    const expired = activeNeed({
      status: "expired",
      deadlineAt: at(-HOUR_MS),
    });
    const { need, errors } = editNeed(expired, { quantity: 30 }, NOW);
    assert.deepEqual(errors, []);
    assert.equal(need.status, "expired");
  });

  it("never reactivates a fulfilled need", () => {
    const fulfilled = activeNeed({ status: "fulfilled" });
    const { need } = editNeed(fulfilled, { deadlineAt: at(HOUR_MS) }, NOW);
    assert.equal(need.status, "fulfilled");
  });

  it("returns validation errors without a need for invalid input", () => {
    const { need, errors } = editNeed(activeNeed(), { quantity: -5 }, NOW);
    assert.deepEqual(errors.map((error) => error.field), ["quantity"]);
    assert.equal(need, null);
  });
});

describe("closing needs", () => {
  it("marks a need fulfilled", () => {
    const need = activeNeed();
    assert.equal(closeNeed(need).status, "fulfilled");
    assert.equal(fulfillNeed(need).status, "fulfilled");
    assert.equal(need.status, "active");
  });
});

describe("getActiveNeeds", () => {
  it("keeps only needs that are not fulfilled or expired", () => {
    const needs = [
      activeNeed({ id: "active" }),
      activeNeed({ id: "fulfilled", status: "fulfilled" }),
      activeNeed({ id: "expired-status", status: "expired" }),
      activeNeed({ id: "overdue", deadlineAt: at(-HOUR_MS) }),
      activeNeed({ id: "no-deadline", deadlineAt: null }),
    ];

    assert.deepEqual(
      getActiveNeeds(needs, NOW).map((need) => need.id),
      ["active", "no-deadline"]
    );
  });

  it("treats a deadline equal to now as expired", () => {
    assert.deepEqual(getActiveNeeds([activeNeed({ deadlineAt: NOW })], NOW), []);
  });
});

describe("refreshNeedStatuses", () => {
  it("marks overdue needs expired without touching fulfilled or future needs", () => {
    const needs = [
      activeNeed({ id: "overdue", deadlineAt: at(-HOUR_MS) }),
      activeNeed({ id: "fulfilled", status: "fulfilled", deadlineAt: at(-HOUR_MS) }),
      activeNeed({ id: "future" }),
      activeNeed({ id: "no-deadline", deadlineAt: null }),
    ];

    assert.deepEqual(
      refreshNeedStatuses(needs, NOW).map((need) => need.status),
      ["expired", "fulfilled", "active", "active"]
    );
    assert.equal(needs[0]?.status, "active");
  });
});

describe("need helpers", () => {
  it("matches categories case-insensitively", () => {
    const needs = [activeNeed({ category: "Produce" })];
    assert.equal(needsMatchCategory(needs, ["produce"]), true);
    assert.equal(needsMatchCategory(needs, ["dairy"]), false);
  });

  it("treats no active needs as matching anything", () => {
    assert.equal(
      needsMatchCategory([activeNeed({ status: "fulfilled" })], ["dairy"]),
      true
    );
  });

  it("sums quantities of active needs only", () => {
    assert.equal(
      totalNeededQuantity([
        activeNeed({ quantity: 20 }),
        activeNeed({ quantity: 5, status: "fulfilled" }),
        activeNeed({ quantity: 7 }),
      ]),
      27
    );
  });
});

describe("package exports", () => {
  it("exposes need helpers from the entry point", () => {
    assert.equal(publicCreateNeed, createNeed);
    assert.equal(publicGetActiveNeeds, getActiveNeeds);
  });
});
