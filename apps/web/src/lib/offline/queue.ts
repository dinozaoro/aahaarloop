import type { OfflineRepository, OfflineStore } from "./store.ts";
import type { QueuedOperation, SyncOperationStatus } from "./types.ts";

export interface EnqueueInput {
  id?: string;
  entityType: string;
  entityId?: string | null;
  operation: string;
  payload?: unknown;
  createdAt?: string;
}

/** Persistent outbox. Operation ids double as idempotency keys on the wire. */
export class SyncQueue {
  private readonly operations: OfflineRepository<"operations">;
  readonly deviceId: string;

  constructor(store: OfflineStore, deviceId: string) {
    this.operations = store.operations;
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
    await this.operations.put(operation);
    return operation;
  }

  get(id: string): Promise<QueuedOperation | undefined> {
    return this.operations.get(id);
  }

  async list(status?: SyncOperationStatus): Promise<QueuedOperation[]> {
    const all = await this.operations.getAll();
    return (status ? all.filter((op) => op.status === status) : all).sort(
      (a, b) => a.createdAt.localeCompare(b.createdAt),
    );
  }

  /** Pending operations whose retry time has passed, in creation order. */
  async due(now = Date.now()): Promise<QueuedOperation[]> {
    const pending = await this.list("pending");
    return pending.filter((op) => Date.parse(op.nextAttemptAt) <= now);
  }

  async update(
    id: string,
    patch: Partial<QueuedOperation>,
  ): Promise<QueuedOperation | null> {
    const current = await this.operations.get(id);
    if (!current) {
      return null;
    }
    const updated: QueuedOperation = { ...current, ...patch, id };
    await this.operations.put(updated);
    return updated;
  }

  async counts(): Promise<Record<SyncOperationStatus | "total", number>> {
    const all = await this.operations.getAll();
    return {
      total: all.length,
      pending: all.filter((op) => op.status === "pending").length,
      in_progress: all.filter((op) => op.status === "in_progress").length,
      completed: all.filter((op) => op.status === "completed").length,
      failed: all.filter((op) => op.status === "failed").length,
    };
  }

  clear(): Promise<void> {
    return this.operations.clear();
  }
}
