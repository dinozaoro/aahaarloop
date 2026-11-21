import assert from "node:assert/strict";
import { test } from "node:test";

import { favoriteService } from "../src/lib/favorites/service.ts";

const donation = (id, status = "published") => ({ id, status, servingsAvailable: 1 });

test("favorites remain scoped to the recipient organization", () => {
  const user = `test-user-${Date.now()}`;
  favoriteService.add(user, "org-one", "donation-one");

  assert.equal(favoriteService.list(user, "org-one", [donation("donation-one")]).length, 1);
  assert.equal(favoriteService.list(user, "org-two", [donation("donation-one")]).length, 0);
  assert.equal(favoriteService.list("other-user", "org-one", [donation("donation-one")]).length, 0);
});

test("removed and unavailable favorites are not returned", () => {
  const user = `test-user-${Date.now()}-two`;
  favoriteService.add(user, "org-one", "donation-one");
  favoriteService.add(user, "org-one", "expired");
  favoriteService.remove(user, "donation-one");

  assert.deepEqual(
    favoriteService.list(user, "org-one", [donation("donation-one"), donation("expired", "expired")]),
    [],
  );
});
