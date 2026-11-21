import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const web = new URL("../", import.meta.url).pathname;
const read = (relative) => readFileSync(join(web, relative), "utf8");

function pngSize(path) {
  const bytes = readFileSync(join(web, path));
  assert.equal(bytes.subarray(1, 4).toString(), "PNG");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

const manifest = JSON.parse(read("public/manifest.webmanifest"));

test("manifest declares an installable standalone app", () => {
  assert.equal(typeof manifest.name, "string");
  assert.ok(manifest.name.length > 0);
  assert.equal(manifest.short_name, "AahaarLoop");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.display, "standalone");
  assert.match(manifest.theme_color, /^#[0-9a-f]{6}$/i);
  assert.match(manifest.background_color, /^#[0-9a-f]{6}$/i);
  assert.ok(manifest.shortcuts.length > 0);
});

test("every declared icon exists and matches its declared size", () => {
  const purposes = new Set();
  for (const icon of manifest.icons) {
    const path = `public${icon.src}`;
    assert.ok(existsSync(join(web, path)), `${path} is missing`);
    const [width, height] = icon.sizes.split("x").map(Number);
    assert.deepEqual(pngSize(path), { width, height });
    icon.purpose.split(" ").forEach((purpose) => purposes.add(purpose));
  }
  assert.ok(purposes.has("any"));
  assert.ok(purposes.has("maskable"));
});

test("layout wires manifest, theme colour and iOS metadata", () => {
  const layout = read("src/app/layout.tsx");
  assert.match(layout, /manifest: "\/manifest\.webmanifest"/);
  assert.match(layout, /apple: "\/icons\/apple-touch-icon\.png"/);
  assert.match(layout, /appleWebApp:/);
  assert.match(layout, /themeColor: "#063a2a"/);
  assert.match(layout, /<InstallPrompt \/>/);
});

test("offline fallback is self-contained and reachable", () => {
  const html = read("public/offline.html");
  assert.match(html, /You are offline/);
  assert.match(html, /<style>/);
  assert.match(html, /icons\/icon-192\.png/);
  assert.ok(existsSync(join(web, "public/icons/apple-touch-icon.png")));
});
