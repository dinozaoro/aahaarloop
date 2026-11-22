import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

// The singleton imports the server-only Postgres DAL, which Node cannot load.
// Stub just that import with an in-memory repository so the real service is tested.
const dalStub = `data:text/javascript,${encodeURIComponent(`
export async function listFavorites(userId, organizationId) {
  return (globalThis.__aahaarFavoriteRows ?? []).filter(
    (row) => row.userId === userId && row.organizationId === organizationId,
  );
}
export async function addFavorite(userId, organizationId, donationId) {
  const row = { userId, organizationId, donationId, createdAt: "2026-11-21T12:00:00Z" };
  globalThis.__aahaarFavoriteRows = [...(globalThis.__aahaarFavoriteRows ?? []), row];
  return row;
}
export async function removeFavorite(userId, donationId) {
  const before = globalThis.__aahaarFavoriteRows ?? [];
  globalThis.__aahaarFavoriteRows = before.filter(
    (row) => !(row.userId === userId && row.donationId === donationId),
  );
  return globalThis.__aahaarFavoriteRows.length !== before.length;
}
`)}`;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@/lib/data/dal") return { url: dalStub, shortCircuit: true };
    return nextResolve(specifier, context);
  },
});

const { favoriteService } = await import("../src/lib/favorites/service.ts");

const donation = (id, status = "published", servingsAvailable = 1) => ({
  id, status, servingsAvailable,
});

function setup() {
  globalThis.__aahaarFavoriteRows = [];
}

test("favorites are user-scoped and keep the organization recorded at add time", async () => {
  setup();
  const user = "test-user";
  const favorite = await favoriteService.add(user, "org-one", "donation-one");

  assert.equal(favorite.organizationId, "org-one");
  assert.equal(
    (await favoriteService.list(user, "org-one", [donation("donation-one")])).length,
    1,
  );
  assert.equal(
    (await favoriteService.list(user, "org-two", [donation("donation-one")])).length,
    0,
  );
  assert.equal(
    (await favoriteService.list("other-user", "org-one", [donation("donation-one")])).length,
    0,
  );
  assert.equal(globalThis.__aahaarFavoriteRows.length, 1);
});

test("removed and unavailable favorites are not returned", async () => {
  setup();
  const user = "test-user-two";
  await favoriteService.add(user, "org-one", "donation-one");
  await favoriteService.add(user, "org-one", "expired");

  assert.equal(await favoriteService.remove(user, "donation-one"), true);
  assert.deepEqual(
    await favoriteService.list(user, "org-one", [
      donation("donation-one"),
      donation("expired", "expired"),
      donation("sold-out", "published", 0),
    ]),
    [],
  );
});
