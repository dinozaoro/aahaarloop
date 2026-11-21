import assert from "node:assert/strict";
import test from "node:test";

const { logStructured, redact } = await import("../src/lib/monitoring/log.ts");

test("redact removes emails, phone numbers and credentials", () => {
  const input =
    "Contact donor@demo.aahaarloop.test or +91 98765 43210 with nt_live_abcdefghijkl";
  const output = redact(input);
  assert.equal(output, "Contact [email] or [phone] with [token]");
});

test("structured logs never contain raw identifiers", () => {
  const lines = [];
  const original = console.info;
  console.info = (line) => lines.push(line);
  try {
    logStructured("api_error", {
      message: "failed for recipient@demo.aahaarloop.test",
      status: 500,
    });
  } finally {
    console.info = original;
  }
  const entry = JSON.parse(lines[0]);
  assert.equal(entry.event, "api_error");
  assert.equal(entry.message, "failed for [email]");
  assert.equal(entry.status, 500);
  assert.ok(entry.at);
});
