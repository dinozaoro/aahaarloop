import { databaseEnvSchema, parseEnv } from "@aahaarloop/shared";

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import { seedDatabase } from "../src/seed.ts";

const env = parseEnv(databaseEnvSchema, process.env);
const client = new pg.Client({
  connectionString: env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  ssl: env.DATABASE_URL.includes("sslmode=disable") ? false : true,
});

try {
  await client.connect();
  await seedDatabase(drizzle(client));
  console.log("Demo seed applied.");
} catch (error) {
  console.error(`Seed failed (${error.code ?? "unknown error"}).`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
