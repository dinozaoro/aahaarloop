# @aahaarloop/mobile

Expo (React Native) app with Expo Router and TypeScript. It shares business logic with the other
clients through the workspace packages and imports no web UI.

## Prerequisites

- Node.js 22.18 or newer and pnpm 9 (the repository is a pnpm workspace).
- Android Studio with an emulator, or a physical device with Expo Go / USB debugging.

## Install

From the repository root:

```sh
pnpm install
```

## Environment

Copy the example file and adjust the API URL:

```sh
cp apps/mobile/.env.example apps/mobile/.env.local
```

| Variable              | Purpose                                                    |
| --------------------- | ---------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL` | Public API base URL inlined into the bundle at build time. |

`app.config.ts` reads the variable and exposes it as `extra.apiUrl`; `src/config/env.ts` is the only
place the app reads configuration. Only `EXPO_PUBLIC_*` values reach the client, so secrets must stay
on the server. `.env.local` is git-ignored.

## Run

```sh
pnpm --filter @aahaarloop/mobile android   # Expo dev server + Android emulator or device
pnpm mobile                               # Expo dev server, then press "a" for Android
```

To build and install a native debug app instead of using Expo Go:

```sh
pnpm --filter @aahaarloop/mobile exec expo run:android
```

## Release builds

Preview, development and production APK/AAB builds are produced with EAS. See
[docs/eas-build.md](../../docs/eas-build.md) for setup, build profiles,
installation and versioning.

```sh
pnpm --filter @aahaarloop/mobile build:preview
```

## Checks

```sh
pnpm --filter @aahaarloop/mobile lint
pnpm --filter @aahaarloop/mobile typecheck
pnpm --filter @aahaarloop/mobile test
```

## Structure

```
app.config.ts          Expo config (app ids, versioning, icons, env-driven extra)
eas.json               EAS build profiles (internal APK / store AAB)
metro.config.js        Monorepo-aware Metro config
src/app/_layout.tsx    Root stack
src/app/(tabs)/        Tab routes: Home and Matches
src/config/env.ts      Typed runtime configuration
```

## Shared packages

`@aahaarloop/matching` is imported from `packages/matching` through the pnpm workspace and resolved by
Metro, including its TypeScript sources. Changes to shared packages reload with the app; no build step
is required. Keep platform-specific UI here: screens must not import web components.
