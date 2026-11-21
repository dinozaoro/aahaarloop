import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const packages = ["@aahaarloop/shared", "@aahaarloop/matching"];

async function* sourceFiles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (["node_modules", ".next", "dist"].includes(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* sourceFiles(file);
    else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) yield file;
  }
}

for (const app of ["web", "mobile"]) {
  const appRoot = path.join(root, "apps", app);
  const manifest = pathToFileURL(path.join(appRoot, "package.json"));
  const require = createRequire(manifest);

  test(`${app} can import both shared packages`, async () => {
    const { dependencies = {} } = JSON.parse(await readFile(manifest, "utf8"));
    for (const name of packages) {
      assert.ok(dependencies[name], `${app} must declare ${name}`);
      const resolved = require.resolve(name);
      const imported = await import(pathToFileURL(resolved).href);
      assert.ok(Object.keys(imported).length > 0, `${name} exports nothing`);
    }
  });
}

test("apps do not import another platform's UI", async () => {
  const forbidden = {
    web: [/\bfrom\s+["']react-native/, /\bfrom\s+["']expo\b/],
    mobile: [/\bfrom\s+["']next(\/|\b)/, /\bfrom\s+["']@\/components\/ui/],
  };
  for (const [app, patterns] of Object.entries(forbidden)) {
    for await (const file of sourceFiles(path.join(root, "apps", app, "src"))) {
      const source = await readFile(file, "utf8");
      for (const pattern of patterns) {
        assert.doesNotMatch(
          source,
          pattern,
          `${file} imports cross-platform UI`,
        );
      }
    }
  }
});
