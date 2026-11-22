export interface IdempotencyRecord {
  status: number;
  bodyText: string;
  contentType: string | null;
}

export interface IdempotencyStore {
  get(key: string): IdempotencyRecord | undefined;
  set(key: string, record: IdempotencyRecord): void;
}

export function createIdempotencyStore(): IdempotencyStore {
  const records = new Map<string, IdempotencyRecord>();
  return {
    get: (key) => records.get(key),
    set: (key, record) => {
      records.set(key, record);
    },
  };
}
