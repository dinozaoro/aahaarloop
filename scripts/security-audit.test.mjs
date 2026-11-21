import assert from "node:assert/strict";
import { test } from "node:test";

import {
  insecureRegistryUrls,
  scanForSecrets,
  unsafeDependencySpecs,
} from "./security-audit.mjs";

test("secret scan finds known secret shapes without leaking their values", () => {
  const findings = scanForSecrets(
    [
      "const token = 'ghp_abcdefghijklmnopqrstuvwxyz0123456789';", // 36+ chars
      "aws: AKIAIOSFODNN7EXAMPLE",
      "key: sk_live_abcdefghijklmnopqrst",
      "-----BEGIN RSA PRIVATE KEY-----",
    ].join("\n"),
    "src/config.ts",
  );

  const patterns = findings.map((finding) => finding.pattern);
  assert.ok(patterns.includes("github-token"), patterns.join(", "));
  assert.ok(patterns.includes("aws-access-key"), patterns.join(", "));
  assert.ok(patterns.includes("stripe-live-key"), patterns.join(", "));
  assert.ok(patterns.includes("private-key-block"), patterns.join(", "));
  for (const finding of findings) {
    assert.equal(finding.file, "src/config.ts");
    assert.ok(finding.line >= 1);
    assert.equal(Object.hasOwn(finding, "value"), false);
  }
});

test("secret scan ignores benign configuration text", () => {
  const findings = scanForSecrets(
    "AUTH_SECRET=replace-with-a-random-32-byte-secret\n" +
      "NEXT_PUBLIC_APP_URL=http://localhost:3000\n" +
      "token: ${{ secrets.EXPO_TOKEN }}\n",
    ".env.example",
  );
  assert.deepEqual(findings, []);
});

test("dependency scan flags git, http and local specs but allows semver", () => {
  const manifest = JSON.stringify({
    dependencies: {
      safe: "^1.2.3",
      pinned: "2.0.0",
      risky: "git+https://github.com/evil/pkg.git",
      remote: "http://registry.example/pkg.tgz",
    },
    devDependencies: {
      local: "file:../sibling",
      linked: "link:../other",
    },
  });

  const findings = unsafeDependencySpecs(manifest, "package.json");
  const names = findings.map((finding) => finding.dependency).sort();
  assert.deepEqual(names, ["linked", "local", "remote", "risky"]);
  assert.ok(
    findings.every((finding) => finding.file === "package.json"),
  );
  assert.equal(
    findings.find((finding) => finding.dependency === "risky").section,
    "dependencies",
  );
});

test("dependency scan tolerates malformed or empty manifests", () => {
  assert.deepEqual(unsafeDependencySpecs("not json"), []);
  assert.deepEqual(unsafeDependencySpecs("{}"), []);
});

test("registry scan detects insecure http tarball URLs", () => {
  const urls = insecureRegistryUrls(
    "resolved: \"https://registry.npmjs.org/a.tgz\"\n" +
      "resolved: \"http://insecure.example/b.tgz\"\n",
  );
  assert.deepEqual(urls, ["http://insecure.example/b.tgz"]);
});
