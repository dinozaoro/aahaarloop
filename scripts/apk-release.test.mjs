import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import {
  buildInstallNotes,
  buildReleaseNotes,
  releaseInputs,
} from "./release-notes.mjs";

const workflow = await readFile(
  new URL("../.github/workflows/apk-release.yml", import.meta.url),
  "utf8",
);

const inputs = {
  tag: "v0.1.0",
  sha: "abcdef1234567890",
  repository: "dinozaoro/aahaarloop",
  apkName: "aahaarloop-v0.1.0.apk",
  checksum: "a".repeat(64),
  buildUrl: "https://expo.dev/artifacts/eas/example.apk",
  runUrl: "https://github.com/dinozaoro/aahaarloop/actions/runs/1",
  apiUrl: "https://api.aahaarloop.example",
};

test("workflow triggers on version tags and manual dispatch", () => {
  assert.match(workflow, /push:\s*\n\s*tags:\s*\['v\*'\]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /description: 'Release tag, e\.g\. v0\.1\.0'/);
});

test("workflow waits for the EAS build and downloads the preview APK", () => {
  assert.match(
    workflow,
    /eas build --platform android --profile preview --non-interactive --json/,
  );
  assert.doesNotMatch(workflow, /--no-wait/);
  assert.match(workflow, /artifacts\??\.buildUrl/);
  assert.match(workflow, /curl -fL --retry 3 "\$APK_URL" -o "\$APK_PATH"/);
  assert.match(workflow, /test -s "\$APK_PATH"/);
});

test("workflow computes and verifies a SHA-256 checksum", () => {
  assert.match(workflow, /sha256sum "\$APK_PATH"/);
  assert.match(workflow, /echo "\$CHECKSUM  \$APK_NAME" > "\$APK_PATH\.sha256"/);
  assert.match(workflow, /sha256sum -c -/);
});

test("workflow publishes the APK, checksum and install notes as a Release", () => {
  assert.match(workflow, /softprops\/action-gh-release@v2/);
  assert.match(workflow, /body_path: RELEASE_NOTES\.md/);
  assert.match(workflow, /\$\{\{ steps\.build\.outputs\.apk_path \}\}/);
  assert.match(workflow, /\.sha256/);
  assert.match(workflow, /INSTALL\.md/);
  assert.match(workflow, /node scripts\/release-notes\.mjs/);
});

test("secrets are referenced, never embedded, with least-privilege permissions", () => {
  assert.match(workflow, /token: \$\{\{ secrets\.EXPO_TOKEN \}\}/);
  assert.match(workflow, /GITHUB_TOKEN: \$\{\{ github\.token \}\}/);
  assert.match(workflow, /permissions:\s*\n\s*contents: write/);
  assert.doesNotMatch(workflow, /token:\s*["']?[A-Za-z0-9_-]{20,}/);
  assert.match(workflow, /node-version-file: \.nvmrc/);
  assert.match(workflow, /pnpm install --frozen-lockfile/);
});

test("release notes link the artifact, checksum, commit and manual sign-off", () => {
  const notes = buildReleaseNotes(inputs);
  assert.match(notes, /Aahaarloop Android APK v0\.1\.0/);
  assert.match(notes, /aahaarloop-v0\.1\.0\.apk\.sha256/);
  assert.match(notes, new RegExp(inputs.checksum));
  assert.match(notes, /https:\/\/github\.com\/dinozaoro\/aahaarloop\/commit\/abcdef1234567890/);
  assert.match(notes, new RegExp(inputs.buildUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(notes, /https:\/\/api\.aahaarloop\.example/);
  assert.match(notes, /sha256sum -c/);
  assert.match(notes, /Manual device sign-off/);
});

test("install notes explain unknown sources, verification and the manual test", () => {
  const notes = buildInstallNotes(inputs);
  assert.match(notes, /aahaarloop-v0\.1\.0\.apk/);
  assert.match(notes, /unknown sources/i);
  assert.match(notes, /sha256sum -c/);
  assert.match(notes, /https:\/\/api\.aahaarloop\.example/);
  assert.match(notes, /CI cannot test on a physical device/);
});

test("missing release inputs are reported before notes are written", () => {
  const env = {
    RELEASE_TAG: inputs.tag,
    RELEASE_SHA: inputs.sha,
    RELEASE_REPOSITORY: inputs.repository,
    RELEASE_APK: inputs.apkName,
    RELEASE_CHECKSUM: inputs.checksum,
    RELEASE_BUILD_URL: inputs.buildUrl,
    RELEASE_RUN_URL: inputs.runUrl,
    RELEASE_API_URL: inputs.apiUrl,
  };
  const incomplete = { ...env };
  delete incomplete.RELEASE_CHECKSUM;
  assert.throws(() => releaseInputs(incomplete), /RELEASE_CHECKSUM/);
  assert.equal(releaseInputs(env).tag, "v0.1.0");
});
