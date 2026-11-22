import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

// store.ts pulls the server-only Postgres DAL, which Node cannot load.
// The empty-id guard must return before any DAL call, so the stub throws
// loudly if the lookup ever reaches it.
const dalStub = `data:text/javascript,${encodeURIComponent(`
export async function findOrganization() {
  throw new Error("getOrganization must return before reaching the DAL");
}
`)}`;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.endsWith("dal.ts") || specifier === "@/lib/data/dal") {
      return { url: dalStub, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { getOrganization } = await import("../src/lib/data/store.ts");

test("organization lookup rejects an empty identifier", async () => {
  assert.equal(await getOrganization(""), undefined);
  assert.equal(await getOrganization("   "), undefined);
});
