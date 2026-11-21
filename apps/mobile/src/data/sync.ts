import type { SqliteDatabase } from "./database-types.ts";
import type {
  ConflictResolution,
  LocalConflict,
  QueuedOperation,
  SyncOperationStatus,
  VersionedRecord,
} from "./types.ts";

const OPERATION_COLUMNS = [
  "id",
  "device_id",
  "entity_type",
  "entity_id",
  "operation",
  "payload",
  "status",
  "attempts",
  "last_error",
  "created_at",
  "next_attempt_at",
  "completed_at",
] as const;

const OPERATION_SELECT = `SELECT id, device_id AS deviceId, entity_type AS entityType,
  entity_id AS entityId, operation, payload, status, attempts,
  last_error AS lastError, created_at AS createdAt,
  next_attempt_at AS nextAttemptAt, completed_at AS completedAt
  FROM operations`;

const CONFLICT_COLUMNS = [
  "id",
  "operation_id",
  "entity_type",
  "entity_id",
  "local_version",
  "remote_version",
  "resolution",
  "resolved_at",
] as const;

const CONFLICT_SELECT = `SELECT id, operation_id AS operationId,
  entity_type AS entityType, entity_id AS entityId,
  local_version AS localVersion, remote_version AS remoteVersion,
  resolution, resolved_at AS resolvedAt
  FROM conflicts`;

async function replaceRow(
  db: SqliteDatabase,
  table: string,
  columns: readonly string[],
  values: unknown[],
): Promise<void> {
  const placeholders = columns.map(() => "?").join(", ");
  const updates = columns
    .filter((column) => column !== "id")
    .map((column) => `${column} = excluded.${column}`)
    .join(", ");
  await db.runAsync(
    `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders}) ` +
      `ON CONFLICT(id) DO UPDATE SET ${updates}`,
    values as Parameters<SqliteDatabase["runAsync"]>[1],
  );
}

export interface EnqueueInput {
  id?: string;
  entityType: string;
  entityId?: string | null;
  operation: string;
  payload?: unknown;
  createdAt?: string;
}

/** Persistent outbox; operation ids are idempotency keys on the wire. */
export class MobileSyncQueue {
  private readonly db: SqliteDatabase;
  readonly deviceId: string;

  constructor(db: SqliteDatabase, deviceId: string) {
    this.db = db;
    this.deviceId = deviceId;
  }

  async enqueue(input: EnqueueInput): Promise<QueuedOperation> {
    const createdAt = input.createdAt ?? new Date().toISOString();
    const operation: QueuedOperation = {
      id: input.id ?? crypto.randomUUID(),
      deviceId: this.deviceId,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      operation: input.operation,
      payload: input.payload ?? null,
      status: "pending",
      attempts: 0,
      lastError: null,
      createdAt,
      nextAttemptAt: createdAt,
      completedAt: null,
    };
    await this.save(operation);
    return operation;
  }

  private async save(operation: QueuedOperation): Promise<void> {
    await replaceRow(this.db, "operations", OPERATION_COLUMNS, [
      operation.id,
      operation.deviceId,
      operation.entityType,
      operation.entityId,
      operation.operation,
      operation.payload == null ? null : JSON.stringify(operation.payload),
      operation.status,
      operation.attempts,
      operation.lastError,
      operation.createdAt,
      operation.nextAttemptAt,
      operation.completedAt,
    ]);
  }

  async get(id: string): Promise<QueuedOperation | null> {
    const row = await this.db.getFirstAsync<QueuedOperation>(
      `${OPERATION_SELECT} WHERE id = ?`,
      [id],
    );
    if (row?.payload) {
      row.payload = JSON.parse(row.payload as string) as unknown;
    }
    return row;
  }

  async due(now = Date.now()): Promise<QueuedOperation[]> {
    const rows = await this.db.getAllAsync<QueuedOperation>(
      `${OPERATION_SELECT} WHERE status = 'pending' AND next_attempt_at <= ?
       ORDER BY created_at ASC`,
      [new Date(now).toISOString()],
    );
    return rows.map((row) => ({
      ...row,
      payload: row.payload
        ? (JSON.parse(row.payload as string) as unknown)
        : null,
    }));
  }

  async update(
    id: string,
    patch: Partial<QueuedOperation>,
  ): Promise<QueuedOperation | null> {
    const current = await this.get(id);
    if (!current) {
      return null;
    }
    const updated: QueuedOperation = { ...current, ...patch, id };
    await this.save(updated);
    return updated;
  }

  async counts(): Promise<Record<SyncOperationStatus | "total", number>> {
    const rows = await this.db.getAllAsync<{ status: SyncOperationStatus }>(
      "SELECT status FROM operations",
      [],
    );
    return {
      total: rows.length,
      pending: rows.filter((row) => row.status === "pending").length,
      in_progress: rows.filter((row) => row.status === "in_progress").length,
      completed: rows.filter((row) => row.status === "completed").length,
      failed: rows.filter((row) => row.status === "failed").length,
    };
  }

  async addConflict(
    conflict: Omit<LocalConflict, "resolution" | "resolvedAt">,
  ): Promise<LocalConflict> {
    const stored: LocalConflict = {
      ...conflict,
      resolution: "pending",
      resolvedAt: null,
    };
    await replaceRow(this.db, "conflicts", CONFLICT_COLUMNS, [
      stored.id,
      stored.operationId,
      stored.entityType,
      stored.entityId,
      stored.localVersion,
      stored.remoteVersion,
      stored.resolution,
      stored.resolvedAt,
    ]);
    return stored;
  }

  listConflicts(): Promise<LocalConflict[]> {
    return this.db.getAllAsync<LocalConflict>(
      `${CONFLICT_SELECT} ORDER BY resolved_at DESC`,
      [],
    );
  }

  async resolveConflict(
    id: string,
    resolution: Exclude<ConflictResolution, "pending">,
  ): Promise<LocalConflict | null> {
    const current = await this.db.getFirstAsync<LocalConflict>(
      `${CONFLICT_SELECT} WHERE id = ?`,
      [id],
    );
    if (!current) {
      return null;
    }
    const resolved: LocalConflict = {
      ...current,
      resolution,
      resolvedAt: new Date().toISOString(),
    };
    await replaceRow(this.db, "conflicts", CONFLICT_COLUMNS, [
      resolved.id,
      resolved.operationId,
      resolved.entityType,
      resolved.entityId,
      resolved.localVersion,
      resolved.remoteVersion,
      resolved.resolution,
      resolved.resolvedAt,
    ]);
    return resolved;
  }
}

export type SyncResult =
  | { ok: true }
  | { ok: false; retryable: boolean; error: string }
  | { ok: false; retryable: false; conflict: true; remote: VersionedRecord };

export interface SyncTransport {
  send(operation: QueuedOperation): Promise<SyncResult>;
}

export interface FlushReport {
  processed: number;
  succeeded: number;
  retried: number;
  failed: number;
  conflicts: number;
}

export interface MobileSyncEngineOptions {
  queue: MobileSyncQueue;
  transport: SyncTransport;
  isOnline?: () => boolean;
  now?: () => number;
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

const EMPTY_REPORT: FlushReport = {
  processed: 0,
  succeeded: 0,
  retried: 0,
  failed: 0,
  conflicts: 0,
};

export class MobileSyncEngine {
  private readonly queue: MobileSyncQueue;
  private readonly transport: SyncTransport;
  private readonly isOnline: () => boolean;
  private readonly now: () => number;
  private readonly maxAttempts: number;
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;
  private flushing = false;

  constructor(options: MobileSyncEngineOptions) {
    this.queue = options.queue;
    this.transport = options.transport;
    this.isOnline = options.isOnline ?? (() => true);
    this.now = options.now ?? Date.now;
    this.maxAttempts = options.maxAttempts ?? 5;
    this.baseDelayMs = options.baseDelayMs ?? 1_000;
    this.maxDelayMs = options.maxDelayMs ?? 60_000;
  }

  private backoff(attempts: number): number {
    return Math.min(this.baseDelayMs * 2 ** (attempts - 1), this.maxDelayMs);
  }

  async flush(): Promise<FlushReport> {
    if (this.flushing || !this.isOnline()) {
      return EMPTY_REPORT;
    }
    this.flushing = true;

    try {
      const due = await this.queue.due(this.now());
      const report: FlushReport = { ...EMPTY_REPORT };

      for (const queued of due) {
        const operation = await this.queue.get(queued.id);
        if (!operation || operation.status !== "pending") {
          continue;
        }
        await this.queue.update(operation.id, { status: "in_progress" });

        let result: SyncResult;
        try {
          result = await this.transport.send(operation);
        } catch (error) {
          result = {
            ok: false,
            retryable: true,
            error: error instanceof Error ? error.message : String(error),
          };
        }
        report.processed += 1;

        if (result.ok) {
          await this.queue.update(operation.id, {
            status: "completed",
            completedAt: new Date(this.now()).toISOString(),
            lastError: null,
          });
          report.succeeded += 1;
          continue;
        }

        if (!result.retryable && "conflict" in result) {
          await this.queue.addConflict({
            id: crypto.randomUUID(),
            operationId: operation.id,
            entityType: operation.entityType,
            entityId: operation.entityId,
            localVersion: JSON.stringify(operation.payload),
            remoteVersion: JSON.stringify(result.remote),
          });
          await this.queue.update(operation.id, {
            status: "failed",
            lastError: "conflict detected",
          });
          report.conflicts += 1;
          continue;
        }

        const attempts = operation.attempts + 1;
        if (result.retryable && attempts < this.maxAttempts) {
          const delay = this.backoff(attempts);
          await this.queue.update(operation.id, {
            status: "pending",
            attempts,
            lastError: result.error,
            nextAttemptAt: new Date(this.now() + delay).toISOString(),
          });
          report.retried += 1;
        } else {
          await this.queue.update(operation.id, {
            status: "failed",
            attempts,
            lastError: result.error,
          });
          report.failed += 1;
        }
      }
      return report;
    } finally {
      this.flushing = false;
    }
  }

  status(): Promise<Record<string, number>> {
    return this.queue.counts();
  }
}

/** A conflict exists when local and remote versions diverged. */
export function detectConflict(
  local: VersionedRecord,
  remote: VersionedRecord,
): boolean {
  return (
    local.version !== remote.version || local.updatedAt !== remote.updatedAt
  );
}

export type ConflictStrategy = "merge" | "overwrite" | "cancel";

/**
 * Resolves a conflict from the local device's point of view:
 * overwrite keeps local fields, merge keeps local values but reuses the
 * highest version, cancel drops the local record. Never returns silently
 * unchanged data: every non-null result advances the version.
 */
export function resolveConflict<T extends VersionedRecord>(
  local: T,
  remote: T,
  strategy: ConflictStrategy,
): T | null {
  if (strategy === "cancel") {
    return null;
  }
  const version = Math.max(local.version, remote.version) + 1;
  if (strategy === "overwrite") {
    return { ...local, version };
  }
  return { ...remote, ...local, version };
}
