import { fileURLToPath } from "node:url";

import pg from "pg";

import { databaseEnvSchema, parseEnv } from "../packages/shared/src/index.ts";

const { Client } = pg;

export function redactSecrets(message, secrets) {
  let result = String(message);
  for (const secret of secrets) {
    if (secret) result = result.split(secret).join("***");
  }
  return result;
}

function safeTarget(connectionString) {
  const url = new URL(connectionString);
  return `${url.protocol}//${url.hostname}${url.pathname}`;
}

function defaultClient(config) {
  return new Client({
    connectionString: config.DATABASE_URL,
    connectionTimeoutMillis: 5000,
    ssl: config.DATABASE_URL.includes("sslmode=disable")
      ? false
      : { rejectUnauthorized: true },
  });
}

export async function checkDatabaseConnection(
  env,
  createClient = defaultClient,
) {
  const config = parseEnv(databaseEnvSchema, env);
  const secrets = [
    config.DATABASE_URL,
    config.DIRECT_URL,
    new URL(config.DATABASE_URL).password,
  ];
  const target = safeTarget(config.DATABASE_URL);
  const client = createClient(config);

  try {
    await client.connect();
    const { rows } = await client.query("SELECT 1 AS ok");
    if (rows[0]?.ok !== 1) throw new Error("unexpected response from SELECT 1");
    console.log(`Database connection OK: ${target}`);
    return true;
  } catch (error) {
    console.error(
      `Database connection FAILED (${target}): ${redactSecrets(error.message, secrets)}`,
    );
    return false;
  } finally {
    await client.end().catch(() => {});
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    if (!(await checkDatabaseConnection(process.env))) process.exitCode = 1;
  } catch (error) {
    console.error(
      redactSecrets(error.message, [
        process.env.DATABASE_URL,
        process.env.DIRECT_URL,
      ]),
    );
    process.exitCode = 1;
  }
}
