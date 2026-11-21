import assert from "node:assert/strict";
import { test } from "node:test";

import { z } from "zod";

import { parseEnv } from "../src/index.ts";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(3000),
});

test("parseEnv returns validated values", () => {
  const env = parseEnv(schema, { DATABASE_URL: "postgresql://localhost/db" });
  assert.equal(env.DATABASE_URL, "postgresql://localhost/db");
  assert.equal(env.PORT, 3000);
});

test("parseEnv names missing variables in the error", () => {
  assert.throws(
    () => parseEnv(schema, {}),
    /Invalid environment variables: DATABASE_URL:/,
  );
});

test("parseEnv names invalid variables in the error", () => {
  assert.throws(
    () => parseEnv(schema, { DATABASE_URL: "not-a-url" }),
    /Invalid environment variables: DATABASE_URL:/,
  );
});
