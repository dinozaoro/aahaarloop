# EAS builds and APK installation

The Android app is built with [EAS Build](../apps/mobile/eas.json). Builds are
reproducible from the repository: the Expo config, the package id and the
version numbers are committed, and no credential or signing key is stored in
git.

## One-time setup

```sh
pnpm install
npx --yes eas-cli@27.11.0 login
npx --yes eas-cli@27.11.0 build:configure
```

`eas build:configure` links the local project to an EAS project and writes the
project id into `app.config.ts`. That id is public metadata and is committed.

Set the public API URL as an EAS environment variable for the build profile
you use (never commit a secret to `.env` or `eas.json`):

```sh
npx --yes eas-cli@27.11.0 env:create \
  --name EXPO_PUBLIC_API_URL --value https://api.example.org \
  --environment preview --visibility public
```

Only `EXPO_PUBLIC_*` values reach the client bundle. Server credentials stay on
the server.

## Build profiles

| Profile       | Distribution | Android output | Use                         |
| ------------- | ------------ | -------------- | --------------------------- |
| `development` | internal     | APK            | Debugging on a test device  |
| `preview`     | internal     | APK            | Judges and internal testing |
| `production`  | store        | AAB            | Play Store submission       |

The preview profile produces an APK that can be installed directly, without a
Play Store account.

## Build and install

From the repository root:

```sh
pnpm --filter @aahaarloop/mobile build:preview
```

EAS prints an artifact URL when the build finishes. Install it on a device with
USB debugging enabled:

```sh
adb install -r path/to/downloaded.apk
```

Or open the artifact URL on the device and allow installation from unknown
sources for the demo build.

## Versioning

`apps/mobile/app.config.ts` owns the version (`version`, Android `versionCode`,
iOS `buildNumber`) and `eas.json` sets `cli.appVersionSource: "local"`.

For each release:

1. Bump `version` (user-facing, e.g. `0.2.0`).
2. Increment Android `versionCode` and iOS `buildNumber`.
3. Commit the change before building — an EAS build uses the committed config.

Android refuses to install an APK whose `versionCode` is not strictly greater
than the installed one, so use `adb install -r` only for the same build.

## Checks before a release build

```sh
pnpm --filter @aahaarloop/mobile typecheck
pnpm --filter @aahaarloop/mobile lint
pnpm --filter @aahaarloop/mobile test
```

A successful build is not enough: install the APK on a real Android device and
confirm the app opens and reaches the configured API before handing it to a
judge.
