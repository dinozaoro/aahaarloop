# @aahaarloop/mobile

Expo (React Native) app with Expo Router and TypeScript. It shares business logic with the other
clients through the workspace packages and imports no web UI.

## Prerequisites

- Node.js 22.18 or newer and npm (the repository uses npm workspaces).
- Android Studio with an emulator, or a physical device with Expo Go / USB debugging.

## Install

From the repository root:

```bash
npm install
```

## Environment

Copy the example file and adjust the API URL:

```bash
cp apps/mobile/.env.example apps/mobile/.env.local
```

| Variable              | Purpose                                                    |
| --------------------- | ---------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL` | Public API base URL inlined into the bundle at build time. |

`app.config.ts` reads the variable and exposes it as `extra.apiUrl`; `src/config/env.ts` is the only
place the app reads configuration. Only `EXPO_PUBLIC_*` values reach the client, so secrets must stay
on the server. `.env.local` is git-ignored.

## Run

```bash
npm run android          # Expo dev server + Android emulator or device
npm run mobile           # Expo dev server, then press "a" for Android
```

To build and install a native debug app instead of using Expo Go:

```bash
npm --workspace @aahaarloop/mobile exec expo run:android
```

## Release builds and demo install

Preview APKs are built with EAS and published as GitHub Releases; see
[docs/eas-build.md](../../docs/eas-build.md) and
[docs/apk-release.md](../../docs/apk-release.md). The demo-booth QR code is
[`assets/install-qr.png`](./assets/install-qr.png) — it points to the latest
release and is regenerated as documented in the release workflow page.

## Checks

```bash
npm run lint
npm run typecheck
npm test                 # shared packages
```

## Structure

```
app.config.ts          Expo config (app ids, icons, env-driven extra)
metro.config.js        Monorepo-aware Metro config
src/app/_layout.tsx    Root stack
src/app/(tabs)/        Tab routes: Home and Matches
src/config/env.ts      Typed runtime configuration
```

## Shared packages

`@aahaarloop/matching` is imported from `packages/matching` through the npm workspace and resolved by
Metro, including its TypeScript sources. Changes to shared packages reload with the app; no build step
is required. Keep platform-specific UI here: screens must not import web components.
