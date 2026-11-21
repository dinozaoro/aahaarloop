import assert from "node:assert/strict";
import { test } from "node:test";

import { trailerErrors } from "./check-commit-trailers.mjs";

const A = "Co-authored-by: ItokianaRAKT <itokianarakt@gmail.com>";
const B = "Co-authored-by: fatratra-png <nyfatratrar@gmail.com>";

test("accepts both required trailers, including blank lines between them", () => {
  assert.deepEqual(trailerErrors(`feat: add thing\n\n${A}\n\n${B}\n`), []);
  assert.deepEqual(trailerErrors(`fix: repair thing\n\n${A}\n${B}\n`), []);
});

test("fails when a required co-author is missing", () => {
  const errors = trailerErrors(`feat: add thing\n\n${B}\n`);
  assert.equal(
    errors.some((error) => error.includes(A)),
    true,
  );
});

test("fails when an AI co-author is added", () => {
  const errors = trailerErrors(
    `feat: add thing\n\n${A}\n${B}\nCo-authored-by: Claude <claude@anthropic.com>\n`,
  );
  assert.equal(
    errors.some((error) => error.includes("unexpected co-author")),
    true,
  );
});

test("fails when the message does not end with a trailer", () => {
  const errors = trailerErrors(`${A}\n${B}\n\nSigned-off-by: someone\n`);
  assert.equal(
    errors.some((error) => error.includes("last line")),
    true,
  );
});
