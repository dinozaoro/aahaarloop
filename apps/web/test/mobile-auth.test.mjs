import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { safeCallbackUrl } from "../src/lib/auth/callbacks.ts";

test("callback URLs stay on this origin", () => {
  assert.equal(safeCallbackUrl("/api/mobile/handoff?returnTo=x", "/dashboard"), "/api/mobile/handoff?returnTo=x");
  for (const bad of [undefined, null, "", "//evil.test", "https://evil.test", "javascript:alert(1)", 7]) {
    assert.equal(safeCallbackUrl(bad, "/dashboard"), "/dashboard");
  }
});

test("mobile handoff only accepts the app deep link", async () => {
  const source = await readFile(new URL("../src/app/api/mobile/handoff/route.ts", import.meta.url), "utf8");
  assert.match(source, /const APP_CALLBACK = "aahaarloop:\/\/auth"/);
  assert.match(source, /if \(returnTo !== APP_CALLBACK\)/);
  assert.match(source, /session\.user\.activeOrganizationId/);
});
