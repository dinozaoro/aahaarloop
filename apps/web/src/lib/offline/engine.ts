import type { SyncQueue } from "./queue.ts";
import type { QueuedOperation } from "./types.ts";

export const BACKGROUND_SYNC_TAG = "aahaarloop-sync";

export type SyncResult =
  { ok: true } | { ok: false; retryable: boolean; error: string };

/** The caller owns the server call; it must honour operation.id as the key. */
export interface SyncTransport {
  send(operation: QueuedOperation): Promise<SyncResult>;
}

export interface FlushReport {
  processed: number;
  succeeded: number;
  retried: number;
  failed: number;
}

export interface SyncEngineOptions {
  queue: SyncQueue;
  transport: SyncTransport;
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  now?: () => number;
}

const EMPTY_REPORT: FlushReport = {
  processed: 0,
  succeeded: 0,
  retried: 0,
  failed: 0,
};

export class SyncEngine {
  private readonly queue: SyncQueue;
  private readonly transport: SyncTransport;
  private readonly maxAttempts: number;
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;
  private readonly now: () => number;
  private flushing = false;
  private started = false;
  private onOnline: (() => void) | null = null;

  constructor(options: SyncEngineOptions) {
    this.queue = options.queue;
    this.transport = options.transport;
    this.maxAttempts = options.maxAttempts ?? 5;
    this.baseDelayMs = options.baseDelayMs ?? 1_000;
    this.maxDelayMs = options.maxDelayMs ?? 60_000;
    this.now = options.now ?? Date.now;
  }

  private backoffDelay(attempts: number): number {
    return Math.min(this.baseDelayMs * 2 ** (attempts - 1), this.maxDelayMs);
  }

  async flush(): Promise<FlushReport> {
    if (this.flushing) {
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

        const attempts = operation.attempts + 1;
        if (result.retryable && attempts < this.maxAttempts) {
          const delay = this.backoffDelay(attempts);
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

  start(): void {
    if (this.started || typeof window === "undefined") {
      return;
    }
    this.started = true;
    this.onOnline = () => void this.flush();
    window.addEventListener("online", this.onOnline);
    void this.registerBackgroundSync();
  }

  stop(): void {
    if (!this.started) {
      return;
    }
    this.started = false;
    if (this.onOnline && typeof window !== "undefined") {
      window.removeEventListener("online", this.onOnline);
    }
    this.onOnline = null;
  }

  private async registerBackgroundSync(): Promise<void> {
    if (typeof navigator === "undefined" || !navigator.serviceWorker) {
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      const sync = (
        registration as ServiceWorkerRegistration & {
          sync?: { register(tag: string): Promise<void> };
        }
      ).sync;
      await sync?.register(BACKGROUND_SYNC_TAG);
    } catch {
      // Background sync is an enhancement; the online listener still covers it.
    }
  }
}
