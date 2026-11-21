import { auditLogs } from "@aahaarloop/database";

import type { Db } from "@/lib/db";

const SENSITIVE_KEY =
  /password|secret|token|authorization|cookie|api[_-]?key|credential|private[_-]?key|card/i;

/** Removes secrets at every depth; field names are safe, values are not. */
export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !SENSITIVE_KEY.test(key))
        .map(([key, nested]) => [key, redact(nested)]),
    );
  }
  return value;
}

export type AuditActor = "donor" | "recipient" | "volunteer" | "admin" | "system";

export interface AuditInput {
  actorId?: string | null;
  actorType: AuditActor;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export function buildAuditEntry(input: AuditInput) {
  return {
    actorType: input.actorType,
    actorId: input.actorId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    before: input.before === undefined ? null : redact(input.before),
    after: input.after === undefined ? null : redact(input.after),
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    occurredAt: new Date(),
  };
}

export type AuditEntry = ReturnType<typeof buildAuditEntry>;

/** Injectable writer keeps the audit logic testable without a database. */
export function createAuditWriter(
  insert: (entry: AuditEntry) => Promise<void>,
) {
  return async (input: AuditInput): Promise<void> => {
    await insert(buildAuditEntry(input));
  };
}

export async function recordAudit(db: Db, input: AuditInput): Promise<void> {
  await db.insert(auditLogs).values(buildAuditEntry(input));
}
