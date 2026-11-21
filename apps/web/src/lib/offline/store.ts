import type { OfflineRecordMap, StoreName } from "./types.ts";

export const OFFLINE_DB_NAME = "aahaarloop-offline";
export const OFFLINE_SCHEMA_VERSION = 3;
export const OFFLINE_STORES = [
  "donations",
  "claims",
  "needs",
  "drafts",
  "sessions",
  "operations",
  "conflicts",
] as const;

export class OfflineQuotaError extends Error {
  constructor() {
    super("Offline storage quota exceeded");
    this.name = "OfflineQuotaError";
  }
}

export function toOfflineError(error: unknown): Error {
  const name = error instanceof Error ? error.name : "";
  if (name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED") {
    return new OfflineQuotaError();
  }
  return error instanceof Error ? error : new Error(String(error));
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("Offline transaction aborted"));
  });
}

/** Applied inside onupgradeneeded, keyed by the previous schema version. */
function migrate(db: IDBDatabase, fromVersion: number): void {
  if (fromVersion < 1) {
    const donations = db.createObjectStore("donations", { keyPath: "id" });
    donations.createIndex("status", "status");
    donations.createIndex("updatedAt", "updatedAt");

    const claims = db.createObjectStore("claims", { keyPath: "id" });
    claims.createIndex("donationId", "donationId");
    claims.createIndex("status", "status");

    const needs = db.createObjectStore("needs", { keyPath: "id" });
    needs.createIndex("category", "category");

    const drafts = db.createObjectStore("drafts", { keyPath: "id" });
    drafts.createIndex("kind", "kind");

    db.createObjectStore("sessions", { keyPath: "id" });
  }

  if (fromVersion < 3) {
    const conflicts = db.createObjectStore("conflicts", { keyPath: "id" });
    conflicts.createIndex("resolution", "resolution");
  }

  if (fromVersion < 2) {
    const operations = db.createObjectStore("operations", { keyPath: "id" });
    operations.createIndex("status", "status");
    operations.createIndex("createdAt", "createdAt");
    operations.createIndex("entity", ["entityType", "entityId"]);
  }
}

export class OfflineRepository<K extends StoreName> {
  private readonly database: IDBDatabase;
  readonly name: K;

  constructor(database: IDBDatabase, name: K) {
    this.database = database;
    this.name = name;
  }

  async put(value: OfflineRecordMap[K]): Promise<void> {
    try {
      const transaction = this.database.transaction(this.name, "readwrite");
      transaction.objectStore(this.name).put(value);
      await transactionDone(transaction);
    } catch (error) {
      throw toOfflineError(error);
    }
  }

  async get(id: string): Promise<OfflineRecordMap[K] | undefined> {
    try {
      const transaction = this.database.transaction(this.name, "readonly");
      const request = transaction.objectStore(this.name).get(id);
      const [value] = await Promise.all([
        requestResult(request),
        transactionDone(transaction),
      ]);
      return value as OfflineRecordMap[K] | undefined;
    } catch (error) {
      throw toOfflineError(error);
    }
  }

  async getAll(): Promise<OfflineRecordMap[K][]> {
    try {
      const transaction = this.database.transaction(this.name, "readonly");
      const request = transaction.objectStore(this.name).getAll();
      const [values] = await Promise.all([
        requestResult(request),
        transactionDone(transaction),
      ]);
      return values as OfflineRecordMap[K][];
    } catch (error) {
      throw toOfflineError(error);
    }
  }

  async getAllByIndex(
    index: string,
    value: IDBValidKey,
  ): Promise<OfflineRecordMap[K][]> {
    try {
      const transaction = this.database.transaction(this.name, "readonly");
      const request = transaction
        .objectStore(this.name)
        .index(index)
        .getAll(value);
      const [values] = await Promise.all([
        requestResult(request),
        transactionDone(transaction),
      ]);
      return values as OfflineRecordMap[K][];
    } catch (error) {
      throw toOfflineError(error);
    }
  }

  async update(
    id: string,
    patch: Partial<OfflineRecordMap[K]>,
  ): Promise<OfflineRecordMap[K] | null> {
    const current = await this.get(id);
    if (!current) {
      return null;
    }
    const updated = { ...current, ...patch, id } as OfflineRecordMap[K];
    await this.put(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    try {
      const transaction = this.database.transaction(this.name, "readwrite");
      transaction.objectStore(this.name).delete(id);
      await transactionDone(transaction);
    } catch (error) {
      throw toOfflineError(error);
    }
  }

  async clear(): Promise<void> {
    try {
      const transaction = this.database.transaction(this.name, "readwrite");
      transaction.objectStore(this.name).clear();
      await transactionDone(transaction);
    } catch (error) {
      throw toOfflineError(error);
    }
  }
}

export class OfflineStore {
  readonly donations: OfflineRepository<"donations">;
  readonly claims: OfflineRepository<"claims">;
  readonly needs: OfflineRepository<"needs">;
  readonly drafts: OfflineRepository<"drafts">;
  readonly sessions: OfflineRepository<"sessions">;
  readonly operations: OfflineRepository<"operations">;
  readonly conflicts: OfflineRepository<"conflicts">;

  private readonly db: IDBDatabase;

  private constructor(db: IDBDatabase) {
    this.db = db;
    this.donations = new OfflineRepository(db, "donations");
    this.claims = new OfflineRepository(db, "claims");
    this.needs = new OfflineRepository(db, "needs");
    this.drafts = new OfflineRepository(db, "drafts");
    this.sessions = new OfflineRepository(db, "sessions");
    this.operations = new OfflineRepository(db, "operations");
    this.conflicts = new OfflineRepository(db, "conflicts");
  }

  static async open(name = OFFLINE_DB_NAME): Promise<OfflineStore> {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(name, OFFLINE_SCHEMA_VERSION);
      request.onupgradeneeded = (event) =>
        migrate(request.result, event.oldVersion);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(toOfflineError(request.error));
    });
    return new OfflineStore(db);
  }

  get version(): number {
    return this.db.version;
  }

  async clearAll(): Promise<void> {
    const transaction = this.db.transaction([...OFFLINE_STORES], "readwrite");
    for (const name of OFFLINE_STORES) {
      transaction.objectStore(name).clear();
    }
    await transactionDone(transaction);
  }

  close(): void {
    this.db.close();
  }
}
