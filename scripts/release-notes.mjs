import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Release body: links the artifact, checksum and exact source commit. */
export function buildReleaseNotes({
  tag,
  sha,
  repository,
  apkName,
  checksum,
  buildUrl,
  runUrl,
  apiUrl,
}) {
  const shortSha = sha.slice(0, 7);
  const commitUrl = `https://github.com/${repository}/commit/${sha}`;
  return `# Aahaarloop Android APK ${tag}

Reproducible preview build for judges and internal testers.

## Artifacts

| File | Description |
| --- | --- |
| \`${apkName}\` | Installable Android APK (EAS \`preview\` profile) |
| \`${apkName}.sha256\` | SHA-256 checksum |
| \`INSTALL.md\` | Install, verify and test instructions |

- **Version:** \`${tag}\`
- **Source commit:** [${shortSha}](${commitUrl})
- **Built by:** [CI run](${runUrl}) on the \`preview\` EAS profile
- **API endpoint bundled in the app:** \`${apiUrl}\`

## Verify the download

\`\`\`sh
sha256sum -c ${apkName}.sha256
\`\`\`

Expected SHA-256: \`${checksum}\`

## Install

See the attached \`INSTALL.md\`. Direct install link: ${buildUrl}

## Manual device sign-off (required before release is marked verified)

- [ ] Download the APK and confirm the checksum matches
- [ ] Install on a physical Android device (install from unknown sources)
- [ ] Open Aahaarloop and confirm it reaches \`${apiUrl}\`
- [ ] Record the device model, tester and result in the release checklist

Generated automatically by the APK release workflow.
`;
}

/** Standalone install guide attached to the release. */
export function buildInstallNotes({ tag, apkName, apiUrl }) {
  return `# Install Aahaarloop ${tag}

This is an internal-distribution APK, not a Play Store app.

## Steps

1. On your Android device, open the APK link on the release page (or scan the
   EAS QR code) and download \`${apkName}\`.
2. When prompted, allow installation from unknown sources. Internal-distribution
   APKs are not installed through the Play Store.
3. Open the downloaded file and tap **Install**.
4. Launch **Aahaarloop**. The app talks to \`${apiUrl}\`.

## Verify integrity first

Download \`${apkName}.sha256\` from the release and run:

\`\`\`sh
sha256sum -c ${apkName}.sha256
\`\`\`

Only install when it reports \`OK\`.

## Troubleshooting

- **Install blocked:** enable "Install unknown apps" for your browser or file
  manager in Android settings.
- **App not installed:** uninstall an existing Aahaarloop first. Android also
  refuses downgrades, so check that this build's version code is higher.
- **No data / connection errors:** the API URL is baked in at build time
  (\`${apiUrl}\`); confirm the device can reach it.

## Required manual test

CI cannot test on a physical device. Before the release is signed off, install
on a real Android phone, exercise the donor and recipient flows, and record the
device model, tester and result in the release checklist.
`;
}

const REQUIRED = [
  "RELEASE_TAG",
  "RELEASE_SHA",
  "RELEASE_REPOSITORY",
  "RELEASE_APK",
  "RELEASE_CHECKSUM",
  "RELEASE_BUILD_URL",
  "RELEASE_RUN_URL",
  "RELEASE_API_URL",
];

export function releaseInputs(env) {
  const missing = REQUIRED.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing release inputs: ${missing.join(", ")}`);
  }
  return {
    tag: env.RELEASE_TAG,
    sha: env.RELEASE_SHA,
    repository: env.RELEASE_REPOSITORY,
    apkName: env.RELEASE_APK,
    checksum: env.RELEASE_CHECKSUM,
    buildUrl: env.RELEASE_BUILD_URL,
    runUrl: env.RELEASE_RUN_URL,
    apiUrl: env.RELEASE_API_URL,
  };
}

async function main() {
  const inputs = releaseInputs(process.env);
  await Promise.all([
    writeFile("RELEASE_NOTES.md", buildReleaseNotes(inputs)),
    writeFile("INSTALL.md", buildInstallNotes(inputs)),
  ]);
}

// Run only when invoked directly by the workflow, not when imported by tests.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
