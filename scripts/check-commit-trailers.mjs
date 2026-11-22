import { execFileSync } from "node:child_process";
import process from "node:process";

export const REQUIRED_TRAILERS = [
  "Co-authored-by: ItokianaRAKT <itokianarakt@gmail.com>",
  "Co-authored-by: fatratra-png <nyfatratrar@gmail.com>",
];

/** Returns every reason a commit message fails the repository trailer policy. */
export function trailerErrors(message) {
  const errors = [];
  const lines = message
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const coAuthors = lines.filter((line) => line.startsWith("Co-authored-by:"));

  for (const trailer of REQUIRED_TRAILERS) {
    if (!coAuthors.includes(trailer)) errors.push(`missing ${trailer}`);
  }
  for (const extra of coAuthors.filter(
    (line) => !REQUIRED_TRAILERS.includes(line),
  )) {
    errors.push(`unexpected co-author: ${extra}`);
  }
  if (!lines.at(-1)?.startsWith("Co-authored-by:")) {
    errors.push("the last line must be a co-author trailer");
  }
  return errors;
}

function main() {
  const [base, head] = process.argv.slice(2);
  if (!base || !head) {
    console.error("Usage: check-commit-trailers.mjs <base-sha> <head-sha>");
    process.exitCode = 1;
    return;
  }

  const range = `${base}..${head}`;
  const messages = execFileSync("git", ["log", "--format=%B%x00", range], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  })
    .split("\0")
    .map((message) => message.trim())
    .filter(Boolean);

  if (messages.length === 0) {
    console.error(`No commits found in ${range}.`);
    process.exitCode = 1;
    return;
  }

  let failed = false;
  for (const message of messages) {
    const subject = message.split(/\r?\n/, 1)[0];
    const errors = trailerErrors(message);
    if (errors.length) {
      failed = true;
      console.error(`${subject}:`);
      for (const error of errors) console.error(`  - ${error}`);
    }
  }
  if (failed) process.exitCode = 1;
  else
    console.log(`All ${messages.length} commit(s) have the required trailers.`);
}

if (process.argv[1]?.endsWith("check-commit-trailers.mjs")) main();
