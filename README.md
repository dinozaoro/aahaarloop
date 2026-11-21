# aahaarloop

Monorepo for the Aahaarloop surplus-food platform.

## Workspace layout

- `apps/web` — Next.js (App Router) web app with the design system and app shell.
- `apps/mobile` — Expo (React Native) app with Expo Router.
- `packages/shared` — shared TypeScript constants and types.
- `packages/matching` — deterministic urgency and matching rules shared by the clients.
- `packages/config` — shared tsconfig presets.
- `packages/database` — Drizzle schema, relations and migration config.
- `docs/product-spec.md` — product specification, glossary and matching contract.
- `docs/matching-algorithms.md` — urgency formula, hard filters, weights and a worked example.
- `docs/design-tokens.md` — design tokens and UI foundation.
- `docs/accessibility.md` — accessibility baseline, audit status and known gaps.
- `docs/development/environment.md` — environment variables, owners and Neon setup.
- `docs/database/schema.md` — purpose of every table and column.
- `docs/database/demo-data.md` — demo accounts, seed content and DB commands.
- `docs/authentication.md` — Google sign-in, onboarding and protected routes.

Each app owns its UI: web never imports React Native UI, mobile never imports web UI. Both apps consume only platform-neutral TypeScript from `packages/shared` and `packages/matching`.

## Getting started

Use Node 22.18+ (see `.nvmrc`) and pnpm 9 via Corepack:

```bash
corepack enable
pnpm install
pnpm dev
```

`pnpm dev` starts the web app on http://localhost:3000 and Expo. See `apps/mobile/README.md` for the mobile workflow and environment variables.

## Commands

| Command                                       | What it does                                                   |
| --------------------------------------------- | -------------------------------------------------------------- |
| `pnpm web`                                    | Starts only the web app.                                       |
| `pnpm mobile`                                 | Starts only Expo.                                              |
| `pnpm dev`                                    | Starts the web and mobile dev servers.                         |
| `pnpm build`                                  | Builds the web app (mobile builds use EAS).                    |
| `pnpm lint`                                   | Lints every workspace package.                                 |
| `pnpm typecheck`                              | Type-checks every workspace package.                           |
| `pnpm test`                                   | Runs package tests plus the workspace boundary checks.         |
| `pnpm format`                                 | Formats the repository with Prettier (and sorts imports).      |
| `pnpm format:check`                           | Fails when a file is not formatted.                            |
| `pnpm db:check`                               | Runs a read-only connection smoke test against `DATABASE_URL`. |
| `pnpm --filter @aahaarloop/database generate` | Generates a SQL migration from the Drizzle schema.             |

TypeScript is strict in every app and package. ESLint uses flat configs; `packages/config` holds the shared ignores and tsconfig presets. Prettier owns formatting and import order, so `pnpm format:check` is the CI gate.

Environment variables are validated with `parseEnv(schema, env)` from `@aahaarloop/shared`. It throws a single error naming every missing or invalid variable instead of failing later at runtime. Copy `.env.example` to `.env.local` and see `docs/development/environment.md`; no Neon credentials are committed and the smoke test never logs them.

These root commands are the CI entry points: a workflow can run `pnpm install --frozen-lockfile` followed by `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check` and `pnpm test` without per-app steps.
