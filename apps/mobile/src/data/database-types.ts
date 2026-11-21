// Minimal async SQLite surface shared by the Expo adapter and the Node tests.
// expo-sqlite's SQLiteDatabase satisfies this structurally.
export type SqlParam = string | number | boolean | Uint8Array | null;

export interface SqliteDatabase {
  execAsync(source: string): Promise<void>;
  runAsync(
    source: string,
    params: SqlParam[],
  ): Promise<{ changes: number; lastInsertRowId: number | bigint }>;
  getAllAsync<T>(source: string, params: SqlParam[]): Promise<T[]>;
  getFirstAsync<T>(source: string, params: SqlParam[]): Promise<T | null>;
}
