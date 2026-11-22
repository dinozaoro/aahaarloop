import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { resolveAndroidDownloadUrl } from "../src/lib/links.ts";

test("accepts a configured HTTPS APK URL", () => {
  assert.equal(
    resolveAndroidDownloadUrl("https://downloads.example.org/aahaarloop.apk"),
    "https://downloads.example.org/aahaarloop.apk",
  );
});

test("accepts a local absolute path for a self-hosted APK", () => {
  assert.equal(
    resolveAndroidDownloadUrl("/downloads/aahaarloop.apk"),
    "/downloads/aahaarloop.apk",
  );
});

test("does not expose a download action for missing or unsafe URLs", () => {
  assert.equal(resolveAndroidDownloadUrl(undefined), null);
  assert.equal(resolveAndroidDownloadUrl("javascript:alert(1)"), null);
  assert.equal(resolveAndroidDownloadUrl("//example.org/aahaarloop.apk"), null);
});

test("the web app ships a valid Android install QR image", async () => {
  const image = await readFile(
    new URL("../public/images/android-install-qr.png", import.meta.url),
  );
  assert.deepEqual(
    image.subarray(0, 8),
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  );
});
