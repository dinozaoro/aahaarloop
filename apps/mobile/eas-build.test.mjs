import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { test } from "node:test";

import appConfig from "./app.config.ts";

const eas = JSON.parse(await readFile(new URL("./eas.json", import.meta.url), "utf8"));

test("eas.json defines reproducible Android build profiles", () => {
  assert.ok(eas.build.development, "development profile");
  assert.equal(eas.build.preview.distribution, "internal");
  assert.equal(eas.build.preview.android.buildType, "apk");
  assert.equal(eas.build.development.android.buildType, "apk");
  assert.equal(eas.build.production.android.buildType, "app-bundle");
  assert.equal(eas.build.production.autoIncrement, true);
  assert.equal(eas.cli.appVersionSource, "local");
  assert.match(eas.cli.version, />= 16/);
});

test("Android package and versioning are configured", () => {
  const config = appConfig({ config: {} });
  assert.equal(config.android.package, "com.aahaarloop.mobile");
  assert.equal(config.version, "0.1.0");
  assert.equal(config.android.versionCode, 1);
  assert.equal(config.ios.bundleIdentifier, "com.aahaarloop.mobile");
});

test("referenced native assets exist so a preview build can resolve them", async () => {
  const config = appConfig({ config: {} });
  const assets = [
    config.icon,
    config.android.adaptiveIcon.foregroundImage,
    config.android.adaptiveIcon.backgroundImage,
    config.android.adaptiveIcon.monochromeImage,
  ];
  for (const asset of assets) {
    await access(new URL(asset, import.meta.url));
  }
});

test("no secret or private env value is committed in build config", async () => {
  for (const file of ["./eas.json", "./app.config.ts", "./.env.example"]) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /password|private[_-]?key|client[_-]?secret|api[_-]?key/i, file);
    for (const match of source.matchAll(/EXPO_PUBLIC_[A-Z0-9_]+/g)) {
      assert.ok(!/SECRET|TOKEN|PASSWORD|KEY/.test(match[0]), match[0]);
    }
  }
});
