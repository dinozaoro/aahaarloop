import { databaseEnvSchema, parseEnv } from "@aahaarloop/shared";

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

let connection: Promise<pg.Client> | undefined;

async function getClient() {
  if (!connection) {
    const { DATABASE_URL } = parseEnv(databaseEnvSchema, process.env);
    const client = new pg.Client({
      connectionString: DATABASE_URL,
      connectionTimeoutMillis: 5000,
      ssl: DATABASE_URL.includes("sslmode=disable")
        ? false
        : { rejectUnauthorized: true },
    });
    connection = client
      .connect()
      .then(() => client)
      .catch((error: unknown) => {
        connection = undefined;
        throw error;
      });
  }
  return connection;
}

/** Opens the pooled connection on first use, never at module load. */
export async function getDb() {
  return drizzle(await getClient());
}

export type Db = Awaited<ReturnType<typeof getDb>>;
