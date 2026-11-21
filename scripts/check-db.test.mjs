import assert from "node:assert/strict";
import { test } from "node:test";

import { checkDatabaseConnection, redactSecrets } from "./check-db.mjs";

const url =
  "postgresql://user:super-secret@ep-pooled.neon.tech/app?sslmode=require";

function fakeClient(error) {
  return {
    connect: async () => {},
    query: async () => {
      if (error) throw error;
      return { rows: [{ ok: 1 }] };
    },
    end: async () => {},
  };
}

async function capture(fn) {
  const original = { log: console.log, error: console.error };
  const lines = [];
  console.log = console.error = (line) => lines.push(line);
  try {
    return { result: await fn(), lines };
  } finally {
    console.log = original.log;
    console.error = original.error;
  }
}

test("redactSecrets removes known secrets from a message", () => {
  assert.equal(
    redactSecrets("failed for user:super-secret@host", ["super-secret"]),
    "failed for user:***@host",
  );
});

test("checkDatabaseConnection reports success without printing credentials", async () => {
  const { result, lines } = await capture(() =>
    checkDatabaseConnection({ DATABASE_URL: url }, () => fakeClient()),
  );
  assert.equal(result, true);
  assert.equal(lines.length, 1);
  assert.doesNotMatch(lines[0], /super-secret/);
  assert.match(lines[0], /ep-pooled\.neon\.tech/);
});

test("checkDatabaseConnection redacts credentials from driver errors", async () => {
  const { result, lines } = await capture(() =>
    checkDatabaseConnection({ DATABASE_URL: url }, () =>
      fakeClient(new Error(`connect ECONNREFUSED ${url}`)),
    ),
  );
  assert.equal(result, false);
  assert.equal(lines.length, 1);
  assert.doesNotMatch(lines[0], /super-secret/);
  assert.match(lines[0], /ECONNREFUSED/);
});
