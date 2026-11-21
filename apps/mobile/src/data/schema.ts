import type { SqliteDatabase } from "./database-types.ts";

export interface Migration {
  version: number;
  statements: readonly string[];
}

export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS donations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity >= 0),
        remaining_quantity INTEGER NOT NULL CHECK (remaining_quantity >= 0),
        unit TEXT NOT NULL,
        storage TEXT NOT NULL,
        address TEXT,
        latitude REAL,
        longitude REAL,
        food_expiry_at TEXT,
        best_before_at TEXT,
        pickup_deadline_at TEXT,
        updated_at TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS donations_status_expiry_idx
        ON donations (status, food_expiry_at)`,
      `CREATE TABLE IF NOT EXISTS claims (
        id TEXT PRIMARY KEY,
        donation_id TEXT NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
        recipient_id TEXT NOT NULL,
        status TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity >= 0),
        unit TEXT NOT NULL,
        note TEXT,
        expires_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS claims_donation_idx ON claims (donation_id)`,
      `CREATE INDEX IF NOT EXISTS claims_recipient_idx ON claims (recipient_id)`,
      `CREATE TABLE IF NOT EXISTS missions (
        id TEXT PRIMARY KEY,
        donation_id TEXT REFERENCES donations(id) ON DELETE SET NULL,
        claim_id TEXT REFERENCES claims(id) ON DELETE SET NULL,
        status TEXT NOT NULL,
        window_start TEXT,
        window_end TEXT,
        address TEXT,
        latitude REAL,
        longitude REAL,
        capacity_kg INTEGER,
        notes TEXT,
        updated_at TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS missions_status_window_idx
        ON missions (status, window_start)`,
    ],
  },
];

export const SCHEMA_VERSION = Math.max(...MIGRATIONS.map((m) => m.version));

export const DATA_TABLES = ["missions", "claims", "donations"] as const;

async function ensureMigrationsTable(db: SqliteDatabase): Promise<void> {
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    )`,
  );
}

export async function currentVersion(db: SqliteDatabase): Promise<number> {
  await ensureMigrationsTable(db);
  const row = await db.getFirstAsync<{ version: number | null }>(
    "SELECT MAX(version) AS version FROM schema_migrations",
    [],
  );
  return row?.version ?? 0;
}

export async function migrate(db: SqliteDatabase): Promise<number> {
  await db.execAsync("PRAGMA foreign_keys = ON");
  let version = await currentVersion(db);

  for (const migration of MIGRATIONS) {
    if (migration.version <= version) {
      continue;
    }
    await db.execAsync("BEGIN");
    try {
      for (const statement of migration.statements) {
        await db.execAsync(statement);
      }
      await db.runAsync(
        "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
        [migration.version, new Date().toISOString()],
      );
      await db.execAsync("COMMIT");
      version = migration.version;
    } catch (error) {
      await db.execAsync("ROLLBACK");
      throw error;
    }
  }

  return version;
}

/** Development-only: drop local data and rebuild an empty schema. */
export async function resetDatabase(db: SqliteDatabase): Promise<void> {
  for (const table of DATA_TABLES) {
    await db.execAsync(`DROP TABLE IF EXISTS ${table}`);
  }
  await db.execAsync("DROP TABLE IF EXISTS schema_migrations");
  await migrate(db);
}
