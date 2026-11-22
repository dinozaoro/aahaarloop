import { fileURLToPath } from "node:url";
import { databaseEnvSchema, parseEnv } from "@aahaarloop/shared";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

import { seedDatabase } from "../src/seed.ts";

const env = parseEnv(databaseEnvSchema, process.env);
const connectionString = env.DIRECT_URL ?? env.DATABASE_URL;
const client = new pg.Client({
  connectionString,
  connectionTimeoutMillis: 5000,
  ssl: connectionString.includes("sslmode=disable") ? false : true,
});

try {
  await client.connect();
  const migrationsFolder = fileURLToPath(
    new URL("../migrations", import.meta.url),
  );
  const db = drizzle(client);
  await migrate(db, { migrationsFolder });
  await seedDatabase(db);
  console.log("Migrations applied and demo seed ensured.");
} catch (error) {
  console.error(`Migration failed (${error.code ?? "unknown error"}).`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
