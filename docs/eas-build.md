# EAS build and install (Android)

The mobile app is built with Expo Application Services (EAS). Build profiles
live in `apps/mobile/eas.json`; app ids and versions live in
`apps/mobile/app.config.ts`.

## One-time setup

```bash
npx --yes eas-cli@16 login          # Expo account
cd apps/mobile
npx --yes eas-cli@16 whoami
```

No secret is committed: `eas.json` contains no credentials, `app.config.ts`
only reads `EXPO_PUBLIC_API_URL`, and `.env.local` is git-ignored. Signing
credentials are managed by EAS, never in this repository.

## Profiles

| Profile | Distribution | Android artifact | Use |
| --- | --- | --- | --- |
| `development` | internal | APK | debugging with a development client |
| `preview` | internal | APK | judges and internal testers |
| `production` | store | AAB | Play Store upload |

## Build a preview APK

```bash
pnpm --filter @aahaarloop/mobile build
# equivalent: npx --yes eas-cli@16 build --profile preview --platform android
```

EAS prints an artifact page with a QR code and a direct APK link. The build is
reproducible: the same commit, profile and `EXPO_PUBLIC_API_URL` produce the
same app version. Use `eas build:list` to find previous artifacts.

## Install on Android

1. Open the artifact link on the device (or scan the QR code).
2. Allow installation from unknown sources when Android prompts — internal
   distribution APKs are not installed from the Play Store.
3. Open **Aahaarloop**, then set the API URL at build time via
   `EXPO_PUBLIC_API_URL`; the bundled default is `http://localhost:3000`.

A physical device is required for final sign-off; the emulator is acceptable
for smoke testing.

## Versioning

- `APP_VERSION` in `app.config.ts` is the user-visible semantic version.
- `VERSION_CODE` (`android.versionCode`) must increase for **every** APK build,
  even when `APP_VERSION` is unchanged. Android refuses to install an APK whose
  version code is not higher than the installed one.
- The `production` profile uses `autoIncrement: true` for store builds; preview
  builds keep `appVersionSource: local` so the version comes from git.

Bump both constants in the same commit as a release and document the change in
the release notes.

## Verification

`pnpm --filter @aahaarloop/mobile test` validates the profile shape, package,
versioning, referenced assets and absence of committed secrets. A successful
manual sign-off records the artifact URL, SHA-256 checksum (added by the release
workflow) and the device model used.
