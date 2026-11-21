import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** High-confidence secret shapes. Placeholders in .env.example are excluded by path. */
export const SECRET_PATTERNS = [
  { name: "aws-access-key", re: /AKIA[0-9A-Z]{16}/g },
  { name: "github-token", re: /gh[pousr]_[A-Za-z0-9_]{36,}/g },
  { name: "slack-token", re: /xox[baprs]-[A-Za-z0-9-]{10,}/g },
  { name: "stripe-live-key", re: /sk_live_[A-Za-z0-9]{20,}/g },
  {
    name: "private-key-block",
    re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
  },
];

/** Returns findings; never prints the matched secret value. */
export function scanForSecrets(content, file = "<input>") {
  const findings = [];
  for (const { name, re } of SECRET_PATTERNS) {
    for (const match of content.matchAll(re)) {
      const line = content.slice(0, match.index).split("\n").length;
      findings.push({ file, line, pattern: name });
    }
  }
  return findings;
}

/** Source specs that pull code outside the pinned registry are a supply-chain risk. */
export function unsafeDependencySpecs(manifestText, file = "<input>") {
  let manifest;
  try {
    manifest = JSON.parse(manifestText);
  } catch {
    return [];
  }
  const sections = ["dependencies", "devDependencies", "optionalDependencies"];
  const findings = [];
  for (const section of sections) {
    for (const [name, spec] of Object.entries(manifest[section] ?? {})) {
      if (typeof spec === "string" && /^(?:git\+|http:\/\/|file:|link:)/.test(spec)) {
        findings.push({ file, dependency: name, spec, section });
      }
    }
  }
  return findings;
}

export function insecureRegistryUrls(lockfileText) {
  return [...lockfileText.matchAll(/http:\/\/[^\s"']+/g)].map((match) => match[0]);
}

function trackedFiles() {
  return execFileSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean);
}

const SKIP = /\/(?:pnpm-lock\.yaml|package-lock\.json|yarn\.lock)$|\.env\.example$|\.test\.mjs$/;

function main() {
  const files = trackedFiles();
  const findings = [];

  for (const file of files) {
    if (SKIP.test(file)) continue;
    if (/(?:^|\/)\.env(?:\.local|\.[^.]+)?$/.test(file)) {
      findings.push({ file, line: 0, pattern: "tracked-env-file" });
      continue;
    }
    let content;
    try {
      content = readFileSync(path.join(ROOT, file), "utf8");
    } catch {
      continue; // binary or deleted
    }
    findings.push(...scanForSecrets(content, file));
  }

  for (const file of files.filter((name) => name.endsWith("package.json"))) {
    findings.push(
      ...unsafeDependencySpecs(readFileSync(path.join(ROOT, file), "utf8"), file),
    );
  }

  findings.push(
    ...insecureRegistryUrls(readFileSync(path.join(ROOT, "pnpm-lock.yaml"), "utf8"))
      .slice(0, 20)
      .map((url) => ({ file: "pnpm-lock.yaml", line: 0, pattern: `insecure-registry:${url}` })),
  );

  if (findings.length > 0) {
    console.error(`Security audit found ${findings.length} issue(s):`);
    for (const finding of findings) console.error(JSON.stringify(finding));
    process.exit(1);
  }
  console.log(`Security audit OK: ${files.length} tracked files scanned.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
