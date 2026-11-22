export interface IdempotencyRecord {
  status: number;
  bodyText: string;
  contentType: string | null;
}

export interface IdempotencyStore {
  get(key: string): Promise<IdempotencyRecord | undefined>;
  set(key: string, record: IdempotencyRecord): Promise<void>;
}

/** In-memory implementation for callers that inject their own store. */
export function createIdempotencyStore(): IdempotencyStore {
  const records = new Map<string, IdempotencyRecord>();
  return {
    get: async (key) => records.get(key),
    set: async (key, record) => {
      records.set(key, record);
    },
  };
}

/** Shared Postgres replay store; the DAL is loaded only when a route opts in. */
export const durableIdempotencyStore: IdempotencyStore = {
  async get(key) {
    const dal = await import("@/lib/data/dal");
    return dal.getIdempotency(key);
  },
  async set(key, record) {
    const dal = await import("@/lib/data/dal");
    await dal.setIdempotency(key, record);
  },
};
