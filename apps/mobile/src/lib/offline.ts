import { openAppDatabase, MobileSyncEngine, MobileSyncQueue } from "@/data";
import type { QueuedOperation, SyncResult } from "@/data";
import { apiFetch, ApiError } from "./api";

export interface QueuedRequest {
  path: string;
  method: string;
  body?: string;
  headers?: Record<string, string>;
}

let queuePromise: Promise<MobileSyncQueue> | null = null;

async function getQueue(): Promise<MobileSyncQueue> {
  queuePromise ??= openAppDatabase().then((db) => new MobileSyncQueue(db, "android-device"));
  return queuePromise;
}

export async function queueRequest(request: QueuedRequest): Promise<QueuedOperation> {
  const queue = await getQueue();
  return queue.enqueue({
    entityType: "request",
    operation: `${request.method} ${request.path}`,
    payload: request,
  });
}

export async function listSyncConflicts() {
  return (await getQueue()).listConflicts();
}

export async function resolveSyncConflict(
  id: string,
  resolution: "merged" | "overwritten" | "cancelled",
) {
  return (await getQueue()).resolveConflict(id, resolution);
}

export async function getQueueCounts() {
  return (await getQueue()).counts();
}

export async function flushOfflineRequests(): Promise<void> {
  const queue = await getQueue();
  const engine = new MobileSyncEngine({
    queue,
    isOnline: () => true,
    transport: {
      async send(operation: QueuedOperation): Promise<SyncResult> {
        const request = operation.payload as QueuedRequest;
        try {
          await apiFetch(request.path, {
            method: request.method,
            body: request.body,
            headers: request.headers,
            idempotencyKey: operation.id,
          });
          return { ok: true };
        } catch (error) {
          const status = error instanceof ApiError ? error.status : 0;
          return {
            ok: false,
            retryable: status === 0 || status >= 500,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    },
  });
  await engine.flush();
}
