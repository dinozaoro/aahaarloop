import { openDatabaseAsync } from "expo-sqlite";

import type { SqliteDatabase } from "./database-types.ts";
import { migrate } from "./schema.ts";

export const LOCAL_DATABASE_NAME = "aahaarloop.db";

/** Opens the local database and applies any pending migration on first launch. */
export async function openAppDatabase(
  name = LOCAL_DATABASE_NAME,
): Promise<SqliteDatabase> {
  const db = await openDatabaseAsync(name);
  await migrate(db);
  return db;
}
