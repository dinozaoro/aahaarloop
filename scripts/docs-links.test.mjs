import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function* markdownFiles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (
      ["node_modules", ".git", ".next", "dist", "turbo"].includes(entry.name)
    ) {
      continue;
    }
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* markdownFiles(file);
    else if (entry.name.endsWith(".md")) yield file;
  }
}

function localTargets(markdown) {
  return [...markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)]
    .map((match) => match[1].split("#")[0].trim())
    .filter((target) => target && !/^(https?:|mailto:)/.test(target));
}

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

test("every local documentation link resolves to a real file", async () => {
  const files = [
    path.join(root, "README.md"),
    ...(await Array.fromAsync(markdownFiles(path.join(root, "docs")))),
  ];
  const broken = [];

  for (const file of files) {
    const markdown = await readFile(file, "utf8");
    for (const target of localTargets(markdown)) {
      const resolved = path.resolve(path.dirname(file), target);
      if (!(await exists(resolved))) {
        broken.push(`${path.relative(root, file)} -> ${target}`);
      }
    }
  }

  assert.deepEqual(broken, []);
});
