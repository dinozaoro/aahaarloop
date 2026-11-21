import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import {
  cloudinaryConfigFromEnv,
  createCloudinarySigner,
  MAX_IMAGE_BYTES,
  UploadRequestSchema,
} from "../src/lib/uploads/cloudinary.ts";

const config = {
  cloudName: "demo-cloud",
  apiKey: "123456",
  apiSecret: "super-secret",
};
const request = {
  fileName: "rice.jpg",
  mimeType: "image/jpeg",
  sizeBytes: 1024,
};

test("upload validation rejects unsupported and oversized files", () => {
  assert.equal(UploadRequestSchema.safeParse(request).success, true);
  assert.equal(
    UploadRequestSchema.safeParse({ ...request, mimeType: "application/pdf" })
      .success,
    false,
  );
  assert.equal(
    UploadRequestSchema.safeParse({ ...request, sizeBytes: MAX_IMAGE_BYTES + 1 })
      .success,
    false,
  );
});

test("signed upload never leaks the API secret", () => {
  const signed = createCloudinarySigner(config, () => 1_700_000_000)(request);
  const expected = createHash("sha1")
    .update(
      `folder=${signed.folder}&public_id=${signed.publicId}&timestamp=${signed.timestamp}${config.apiSecret}`,
    )
    .digest("hex");
  assert.equal(signed.signature, expected);
  assert.match(signed.url, /api\.cloudinary\.com\/v1_1\/demo-cloud/);
  assert.doesNotMatch(JSON.stringify(signed), /super-secret/);
  assert.match(signed.publicId, /aahaarloop\/donations\/.*\.jpg$/);
});

test("missing Cloudinary credentials fail closed", () => {
  assert.throws(() => cloudinaryConfigFromEnv({}), /not configured/);
  assert.equal(cloudinaryConfigFromEnv({
    CLOUDINARY_CLOUD_NAME: "c",
    CLOUDINARY_API_KEY: "k",
    CLOUDINARY_API_SECRET: "s",
  }).cloudName, "c");
});

test("the signing route stays authenticated and server-only", async () => {
  const source = await readFile(
    new URL("../src/app/api/uploads/sign/route.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /auth\(\)/);
  assert.match(source, /cloudinaryConfigFromEnv/);
  assert.doesNotMatch(source, /apiSecret:\s*process\.env/);
});
