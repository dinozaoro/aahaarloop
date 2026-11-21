import assert from "node:assert/strict";
import { test } from "node:test";

import { databaseEnvSchema, parseEnv } from "../src/index.ts";

const pooled = "postgresql://user:pw@ep-pooled.neon.tech/app?sslmode=require";
const direct = "postgresql://user:pw@ep-direct.neon.tech/app?sslmode=require";

test("databaseEnvSchema accepts a pooled URL", () => {
  const env = parseEnv(databaseEnvSchema, { DATABASE_URL: pooled });
  assert.equal(env.DATABASE_URL, pooled);
  assert.equal(env.DIRECT_URL, undefined);
});

test("databaseEnvSchema accepts an optional direct URL", () => {
  const env = parseEnv(databaseEnvSchema, {
    DATABASE_URL: pooled,
    DIRECT_URL: direct,
  });
  assert.equal(env.DIRECT_URL, direct);
});

test("databaseEnvSchema fails clearly when DATABASE_URL is missing", () => {
  assert.throws(
    () => parseEnv(databaseEnvSchema, {}),
    /Invalid environment variables: DATABASE_URL:/,
  );
});

test("databaseEnvSchema rejects a non-Postgres URL", () => {
  assert.throws(
    () => parseEnv(databaseEnvSchema, { DATABASE_URL: "https://example.com" }),
    /must be a PostgreSQL connection string/,
  );
});

test("validation errors never include the connection string", () => {
  const badUrl = "not-a-url-with-super-secret-password";
  try {
    parseEnv(databaseEnvSchema, { DATABASE_URL: badUrl });
    assert.fail("expected validation to fail");
  } catch (error) {
    assert.doesNotMatch(error.message, /super-secret-password/);
  }
});
