import { databaseEnvSchema, parseEnv } from "@aahaarloop/shared";

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import { seedDatabase } from "../src/seed.ts";

// Reset is destructive: require an explicit opt-in even on demo databases.
if (process.env.ALLOW_DB_RESET !== "true") {
  console.error("Refusing to reset: set ALLOW_DB_RESET=true to confirm.");
  process.exit(1);
}

const env = parseEnv(databaseEnvSchema, process.env);
const client = new pg.Client({
  connectionString: env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  ssl: env.DATABASE_URL.includes("sslmode=disable") ? false : true,
});

try {
  await client.connect();
  const { rows } = await client.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '__drizzle_migrations'",
  );
  if (rows.length > 0) {
    const names = rows.map((row) => `"${row.tablename}"`).join(", ");
    await client.query(`TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE`);
  }
  await seedDatabase(drizzle(client));
  console.log(`Reset ${rows.length} tables and reapplied the demo seed.`);
} catch (error) {
  console.error(`Reset failed (${error.code ?? "unknown error"}).`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
