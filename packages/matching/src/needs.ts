import type { Instant } from "./urgency.ts";

export type NeedStatus = "active" | "fulfilled" | "expired";
export type NeedPriority = "low" | "medium" | "high";

export interface Need {
  id: string;
  /** Food category the recipient needs (e.g. "produce", "bakery"). */
  category: string;
  /** Number of servings required. */
  quantity: number;
  /** Deadline by which the need should be covered. */
  deadlineAt: Instant | null;
  /** Priority of the need. */
  priority: NeedPriority;
  /** Free-form notes (allergens, packaging, handling…). */
  notes: string;
  /** Current lifecycle status. */
  status: NeedStatus;
  /** When the need was created. */
  createdAt: Instant;
}

export interface CreateNeedInput {
  category: string;
  quantity: number;
  deadlineAt?: Instant | null;
  priority?: NeedPriority;
  notes?: string;
}

export interface EditNeedInput {
  category?: string;
  quantity?: number;
  deadlineAt?: Instant | null;
  priority?: NeedPriority;
  notes?: string;
}

export const DEFAULT_NEED_PRIORITY: NeedPriority = "medium";

/** Validation error messages are surfaced to the UI. */
export interface NeedValidationError {
  field: string;
  message: string;
}

function toEpochMs(value: Instant, field: string): number {
  if (value instanceof Date) {
    const ms = value.getTime();
    if (Number.isNaN(ms)) {
      throw new TypeError(`${field} must be a valid Date`);
    }
    return ms;
  }

  if (typeof value !== "string") {
    throw new TypeError(`${field} must be a Date or an ISO 8601 string`);
  }

  const ms = Date.parse(value);
  if (Number.isNaN(ms)) {
    throw new TypeError(`${field} must be a valid date`);
  }
  return ms;
}

export function validateNeedInput(
  input: CreateNeedInput | EditNeedInput,
  now: Instant
): NeedValidationError[] {
  const errors: NeedValidationError[] = [];
  const nowMs = toEpochMs(now, "now");

  if (input.quantity !== undefined) {
    if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
      errors.push({
        field: "quantity",
        message: "Quantity must be a positive number",
      });
    }
  }

  if (input.deadlineAt !== null && input.deadlineAt !== undefined) {
    const deadlineMs = toEpochMs(input.deadlineAt, "deadlineAt");
    if (deadlineMs <= nowMs) {
      errors.push({
        field: "deadlineAt",
        message: "Deadline must be in the future",
      });
    }
  }

  if (input.priority !== undefined) {
    if (!["low", "medium", "high"].includes(input.priority)) {
      errors.push({
        field: "priority",
        message: "Priority must be low, medium or high",
      });
    }
  }

  if (input.category !== undefined) {
    if (!input.category || !input.category.trim()) {
      errors.push({
        field: "category",
        message: "Category is required",
      });
    }
  }

  return errors;
}

export function createNeed(
  input: CreateNeedInput,
  now: Instant
): { need: Need; errors: NeedValidationError[] } {
  const errors = validateNeedInput(input, now);
  if (errors.length > 0) {
    return { need: null as unknown as Need, errors };
  }

  const nowMs = toEpochMs(now, "now");
  const deadlineMs =
    input.deadlineAt == null ? null : toEpochMs(input.deadlineAt, "deadlineAt");
  const status: NeedStatus =
    deadlineMs !== null && deadlineMs <= nowMs ? "expired" : "active";

  const need: Need = {
    id: `need-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    category: input.category.trim(),
    quantity: input.quantity,
    deadlineAt: input.deadlineAt ?? null,
    priority: input.priority ?? DEFAULT_NEED_PRIORITY,
    notes: input.notes ?? "",
    status,
    createdAt: now,
  };
  return { need, errors: [] };
}

export function editNeed(
  need: Need,
  input: EditNeedInput,
  now: Instant
): { need: Need; errors: NeedValidationError[] } {
  const errors = validateNeedInput(input, now);
  if (errors.length > 0) {
    return { need: null as unknown as Need, errors };
  }

  const nowMs = toEpochMs(now, "now");
  const nextDeadline =
    input.deadlineAt !== undefined ? input.deadlineAt : need.deadlineAt;
  const deadlineMs =
    nextDeadline == null ? null : toEpochMs(nextDeadline, "deadlineAt");

  const status: NeedStatus =
    need.status === "fulfilled"
      ? "fulfilled"
      : deadlineMs !== null && deadlineMs <= nowMs
        ? "expired"
        : "active";

  return {
    need: {
      ...need,
      category: input.category?.trim() ?? need.category,
      quantity: input.quantity ?? need.quantity,
      deadlineAt: nextDeadline,
      priority: input.priority ?? need.priority,
      notes: input.notes ?? need.notes,
      status,
    },
    errors: [],
  };
}

export function closeNeed(need: Need): Need {
  return { ...need, status: "fulfilled" };
}

export function fulfillNeed(need: Need): Need {
  return { ...need, status: "fulfilled" };
}

/** Returns only needs that are still active (not expired, not fulfilled). */
export function getActiveNeeds(needs: readonly Need[], now: Instant): Need[] {
  const nowMs = toEpochMs(now, "now");
  return needs.filter((need) => {
    if (need.status !== "active") {
      return false;
    }
    if (need.deadlineAt != null) {
      const deadlineMs = toEpochMs(need.deadlineAt, "deadlineAt");
      if (deadlineMs <= nowMs) {
        return false;
      }
    }
    return true;
  });
}

/** Recomputes the status of every need based on its deadline. */
export function refreshNeedStatuses(needs: readonly Need[], now: Instant): Need[] {
  const nowMs = toEpochMs(now, "now");
  return needs.map((need) => {
    if (need.status === "fulfilled") {
      return need;
    }
    if (need.deadlineAt != null) {
      const deadlineMs = toEpochMs(need.deadlineAt, "deadlineAt");
      if (deadlineMs <= nowMs) {
        return { ...need, status: "expired" as const };
      }
    }
    return need;
  });
}

export function needsMatchCategory(
  needs: readonly Need[],
  categories: readonly string[]
): boolean {
  const activeNeeds = needs.filter((n) => n.status === "active");
  if (activeNeeds.length === 0) {
    return true;
  }
  const needsSet = new Set(activeNeeds.map((n) => n.category.toLowerCase()));
  return categories.some((c) => needsSet.has(c.toLowerCase()));
}

export function totalNeededQuantity(needs: readonly Need[]): number {
  return needs
    .filter((n) => n.status === "active")
    .reduce((sum, n) => sum + n.quantity, 0);
}
