# AahaarLoop

> **Good food should find a table.**
>
> AahaarLoop helps restaurants, food businesses, community kitchens, NGOs,
> volunteers, and recipients move surplus food to people who can use it before
> the pickup window closes.

<p>
  <a href="https://github.com/dinozaoro/aahaarloop/actions"><img src="https://img.shields.io/github/actions/workflow/status/dinozaoro/aahaarloop/ci.yml?label=CI&logo=github" alt="CI status" /></a>
  <img src="https://img.shields.io/badge/Node.js-%E2%89%A522.18-339933?logo=node.js&logoColor=white" alt="Node.js 22.18 or newer" />
  <img src="https://img.shields.io/badge/pnpm-9.15-F69220?logo=pnpm&logoColor=white" alt="pnpm 9.15" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="Strict TypeScript" />
  <img src="https://img.shields.io/badge/Expo-58-000020?logo=expo&logoColor=white" alt="Expo 58" />
</p>

## Contents

- [What we are building](#what-we-are-building)
- [Product surfaces](#product-surfaces)
- [Architecture](#architecture)
- [Technology stack](#technology-stack)
- [Repository map](#repository-map)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Environment](#environment)
- [Run the applications](#run-the-applications)
- [Commands](#commands)
- [Database workflow](#database-workflow)
- [Mobile development](#mobile-development)
- [Testing and quality gates](#testing-and-quality-gates)
- [Contribution workflow](#contribution-workflow)
- [Engineering conventions](#engineering-conventions)
- [Ownership boundaries](#ownership-boundaries)
- [Documentation](#documentation)
- [Security notes](#security-notes)

## What we are building

AahaarLoop is a shared surplus-food coordination platform for India. The core
loop is intentionally simple:

```text
Food business posts surplus
          ↓
Nearby recipient discovers a suitable offer
          ↓
Recipient claims the offer
          ↓
Pickup is coordinated and tracked
          ↓
Food reaches a community table
```

The product keeps the operational details visible: quantity, pickup location,
pickup deadline, use-by information, storage, allergens, claim status, and
delivery progress.

> **Food-safety boundary:** AahaarLoop supports discovery and coordination. It
> does not inspect, certify, or guarantee that food is safe to eat. Donors and
> recipients remain responsible for handling and allergen checks.

## Product surfaces

| Surface                | Audience                               | Main capabilities                                                                                                        |
| ---------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Web app                | Donors, recipients, volunteers, admins | Sign-in, onboarding, donation management, matching, claims, pickups, impact, notifications, moderation                   |
| Android app            | Donors, recipients, volunteers         | Mobile discovery, donation creation, image upload, claims, pickup views, local cache, offline drafts, native permissions |
| Shared domain packages | Every client and server                | Validation, role-neutral types, matching rules, database contracts                                                       |

## Architecture

```text
┌─────────────────────┐       ┌─────────────────────┐
│  Next.js web app    │       │  Expo Android app   │
│  App Router         │       │  Expo Router        │
└──────────┬──────────┘       └──────────┬──────────┘
           │                              │
           └──────────────┬───────────────┘
                          │ HTTP API
                 ┌────────▼────────┐
                 │  Web API routes  │
                 │ Auth + validation│
                 └────────┬────────┘
                          │
                 ┌────────▼────────┐
                 │ Drizzle / Neon  │
                 │ PostgreSQL      │
                 └─────────────────┘

     packages/shared + packages/matching
       are consumed by both client surfaces
```

The web app owns the backend API routes because the current API is implemented
inside Next.js. The mobile app calls those routes through
EXPO_PUBLIC_API_URL and never connects directly to PostgreSQL.

## Technology stack

### Applications

| Area                 | Technologies                                                                  |
| -------------------- | ----------------------------------------------------------------------------- |
| Web                  | Next.js 16, React 19, TypeScript, App Router                                  |
| Web UI               | Tailwind CSS 4, Radix UI, class-variance-authority, lucide-react, Sonner      |
| Authentication       | Auth.js / NextAuth Google provider                                            |
| Android              | Expo 58, React Native 0.88, Expo Router, TypeScript                           |
| Android capabilities | Expo SQLite, SecureStore, Image Picker, Location, Notifications, Vector Icons |

### Platform and domain

| Area               | Technologies                                                  |
| ------------------ | ------------------------------------------------------------- |
| Database           | PostgreSQL on Neon                                            |
| ORM and migrations | Drizzle ORM and Drizzle Kit                                   |
| Validation         | Zod                                                           |
| Matching           | Deterministic urgency and matching rules in packages/matching |
| Shared contracts   | TypeScript source in packages/shared                          |
| Uploads            | Cloudinary signed uploads                                     |
| Maps               | Leaflet-based web map flows                                   |
| Workspace          | pnpm 9.15, Turborepo, Corepack                                |
| Quality            | ESLint, Prettier, TypeScript, Node test runner                |

## Repository map

```text
.
├── apps/
│   ├── web/                 # Next.js web app and API routes
│   └── mobile/              # Expo / React Native Android app
├── packages/
│   ├── shared/              # Shared schemas, types, and constants
│   ├── matching/            # Matching and urgency algorithms
│   ├── database/            # Drizzle schema, migrations, seed scripts
│   └── config/              # Shared TypeScript and ESLint presets
├── docs/                    # Product, architecture, API, security, and runbooks
├── scripts/                 # Repository checks and CI helpers
├── .github/workflows/       # CI and Android release workflows
├── AGENTS.md                # Contribution rules for every agent and developer
├── package.json             # Workspace commands
├── pnpm-workspace.yaml      # Workspace package discovery
└── turbo.json               # Task graph and caching rules
```

Each application owns its UI. Web components must not be imported into mobile,
and React Native components must not be imported into web. Platform-neutral
logic belongs in packages/shared or packages/matching.

## Prerequisites

- Node.js **22.18 or newer**. The version is pinned by .nvmrc and engines.
- Corepack-enabled pnpm **9.15.0**.
- Git.
- PostgreSQL/Neon access for API and database work.
- Android Studio and an emulator, or a USB-debuggable Android device, for
  native mobile work.
- Expo CLI is provided through the project dependency; do not install a global
  CLI unless your local setup requires it.

Check your versions:

```bash
node --version
corepack pnpm --version
```

## Quick start

```bash
git clone https://github.com/dinozaoro/aahaarloop.git
cd aahaarloop

corepack enable
pnpm install

cp .env.example .env.local
# Fill the values described in docs/development/environment.md

pnpm dev
```

The web app runs at [http://localhost:3000](http://localhost:3000). The Expo
development server starts alongside it. For Android, use the mobile workflow
below.

## Environment

The committed .env.example contains placeholders only. Never commit real
credentials or paste them into an issue or pull request.

| Variable              | Used by          | Purpose                                    |
| --------------------- | ---------------- | ------------------------------------------ |
| DATABASE_URL          | Web / database   | Pooled Neon connection for runtime queries |
| DIRECT_URL            | Database tooling | Direct Neon connection for migrations      |
| NEXT_PUBLIC_APP_URL   | Web              | Canonical URL and OAuth callback base      |
| EXPO_PUBLIC_API_URL   | Mobile           | Base URL used by the Android client        |
| AUTH_SECRET           | Web              | Auth.js session encryption secret          |
| AUTH_GOOGLE_ID        | Web              | Google OAuth client id                     |
| AUTH_GOOGLE_SECRET    | Web              | Google OAuth client secret                 |
| CLOUDINARY_CLOUD_NAME | Web API          | Cloudinary upload target                   |
| CLOUDINARY_API_KEY    | Web API          | Cloudinary signing key                     |
| CLOUDINARY_API_SECRET | Web API          | Server-only Cloudinary signing secret      |

Generate a local auth secret with:

```bash
openssl rand -base64 32
```

Read [docs/development/environment.md](docs/development/environment.md) for
owners, preview branches, production setup, and the rules for adding a new
variable.

## Run the applications

### Web

```bash
pnpm web
```

To run the optimized web server after a build:

```bash
pnpm --filter @aahaarloop/web build
pnpm --filter @aahaarloop/web start
```

### Android

Create the mobile environment file first:

```bash
cp apps/mobile/.env.example apps/mobile/.env.local
```

For the Android emulator, the default API host is
http://10.0.2.2:3000. For a physical device, set EXPO_PUBLIC_API_URL to a
reachable LAN address, for example http://192.168.1.20:3000.

```bash
pnpm mobile
# Press a in the Expo terminal to open Android
```

Or run the Android command directly:

```bash
pnpm android
```

Native debug builds and release APK workflows are documented in
[apps/mobile/README.md](apps/mobile/README.md),
[docs/eas-build.md](docs/eas-build.md), and
[docs/apk-release.md](docs/apk-release.md).

## Commands

Run these from the repository root:

| Command                                     | Purpose                                                 |
| ------------------------------------------- | ------------------------------------------------------- |
| pnpm dev                                    | Start the workspace development tasks through Turborepo |
| pnpm web                                    | Start only the web app                                  |
| pnpm mobile                                 | Start only Expo                                         |
| pnpm android                                | Start Expo with Android targeting                       |
| pnpm build                                  | Build workspace packages and the web application        |
| pnpm lint                                   | Run ESLint across workspace packages                    |
| pnpm typecheck                              | Run strict TypeScript checks                            |
| pnpm test                                   | Run package tests and repository-level tests            |
| pnpm format                                 | Format the repository with Prettier                     |
| pnpm format:check                           | Check formatting without changing files                 |
| pnpm db:check                               | Run a read-only database connection smoke test          |
| pnpm db:migrate                             | Apply database migrations                               |
| pnpm db:seed                                | Load development/demo data                              |
| pnpm db:reset                               | Reset the development database; use carefully           |
| pnpm db:bootstrap-admin                     | Bootstrap the configured admin account                  |
| pnpm --filter @aahaarloop/database generate | Generate a Drizzle migration                            |

Useful app-level checks:

```bash
pnpm --filter @aahaarloop/web typecheck
pnpm --filter @aahaarloop/web test
pnpm --filter @aahaarloop/mobile typecheck
pnpm --filter @aahaarloop/mobile test
```

## Database workflow

1. Create or select the correct Neon development branch.
2. Put pooled and direct connection strings in your ignored environment file.
3. Update the Drizzle schema in packages/database/src.
4. Generate a migration:

   ```bash
   pnpm --filter @aahaarloop/database generate
   ```

5. Review the SQL migration before applying it.
6. Run the migration against the intended branch:

   ```bash
   pnpm db:migrate
   ```

7. Update schema documentation and tests when the contract changes.

Never point local reset or seed commands at production data. Read
[docs/database/schema.md](docs/database/schema.md) and
[docs/database/demo-data.md](docs/database/demo-data.md) before changing data
or migrations.

## Mobile development

The Android application is a native mobile experience, not a web page wrapped
inside a device frame. Mobile code owns navigation, mobile UI, permissions,
offline storage, image selection/upload, location, and native notifications.

Important mobile paths:

```text
apps/mobile/
├── app.config.ts                 # Expo configuration and app metadata
├── metro.config.js               # Monorepo-aware Metro configuration
├── src/app/                      # Expo Router screens and layouts
├── src/components.tsx            # Shared mobile UI primitives
├── src/context/                  # App state, cache, and sync context
├── src/data/                     # SQLite repositories and migrations
├── src/lib/api.ts                # API client and response contracts
├── src/lib/offline.ts            # Durable offline request queue
├── src/lib/media.ts              # Image picker and signed upload flow
└── src/theme.ts                  # Mobile colors, type, spacing, and radii
```

The current native backend contract still has known limits around native
authentication/session transfer, push-token registration, and an authenticated
claims list. These are documented in
[MOBILE_INTEGRATION.md](MOBILE_INTEGRATION.md). Do not silently invent an API
endpoint or claim that a pending offline action completed on the server.

## Testing and quality gates

Before opening a pull request, run:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm format:check
pnpm test
pnpm build
```

The CI workflow runs the same core checks on pull requests and pushes to main.
It also validates the required commit trailers. See [docs/ci.md](docs/ci.md).

For mobile changes, also verify the Android bundle or native build when the
change touches native configuration, permissions, or assets. A successful
TypeScript check is not a substitute for testing on an emulator or physical
Android device.

## Contribution workflow

### 1. Start from an up-to-date branch

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/42-food-listing
```

Use one branch and one pull request per issue. If there is no issue, use a
descriptive branch without a number, such as docs/project-readme.

Allowed branch prefixes:

```text
feat/   fix/   docs/   refactor/   perf/   test/   build/   ci/   chore/   style/
```

### 2. Keep the change scoped

- Read AGENTS.md before editing.
- Preserve unrelated work in a shared checkout.
- Keep web and mobile ownership boundaries intact.
- Prefer an existing helper, component, or dependency before adding a new one.
- Update tests and documentation when behavior or contracts change.

### 3. Commit with the project format

Use an English Conventional Commit with one logical change:

```text
feat(donations): add pickup deadline validation
fix(api): reject claims for unavailable donations
docs(readme): document local development
```

Every commit must end with exactly these trailers:

```text
Co-authored-by: ItokianaRAKT <itokianarakt@gmail.com>
Co-authored-by: fatratra-png <nyfatratrar@gmail.com>
```

Do not add an AI, tool, or bot as an author or co-author. Validate a commit
range locally with:

```bash
node scripts/check-commit-trailers.mjs <base-sha> <head-sha>
```

### 4. Open a focused pull request

Pull request titles use Conventional Commits. The body should explain:

- What changed and why.
- Which user journey or contract is affected.
- How it was tested.
- Any known limitation or follow-up.
- Closes #<issue-number> when an issue exists.

Keep screenshots or a short screen recording for meaningful UI changes. Call
out whether the change was checked on a real Android device, emulator, or only
through static/build validation.

## Engineering conventions

### TypeScript and code structure

- Keep strict TypeScript enabled; avoid any and unsafe casts.
- Validate untrusted input at API boundaries with Zod or the existing schema.
- Keep shared business rules platform-neutral.
- Keep route handlers thin; put reusable behavior in the appropriate lib or
  package module.
- Prefer small, readable functions over speculative abstractions.

### Web UI

- Use the existing design tokens and UI primitives before introducing a new
  visual language.
- Keep copy plain, specific, and useful to the person taking the next action.
- Make keyboard focus, reduced motion, responsive layouts, and readable line
  lengths part of the implementation.
- Use transform and opacity for motion when possible; ship a reduced-motion
  fallback.

### Android UI

- Keep touch targets at least 48dp where practical.
- Handle safe areas, Android back behavior, keyboard behavior, and permissions.
- Request only the permissions the current action needs and explain why.
- Do not silently drop offline actions or present queued work as completed.
- Use native vector icons or local assets instead of emoji placeholders.

### API and security

- The mobile app must call the HTTP API, never the database directly.
- Enforce authorization on the server, not only in UI conditionals.
- Preserve CSRF, rate-limit, audit, and IDOR protections.
- Keep secrets server-side; only explicitly public EXPO_PUBLIC_* values reach
  the Android bundle.
- Treat donor-provided food handling and allergen text as untrusted input.

## Ownership boundaries

| Area                                                       | Owner                        |
| ---------------------------------------------------------- | ---------------------------- |
| Web landing page, web workspace, responsive web UI         | Web implementation           |
| Android navigation, mobile UI, native behavior, offline UX | Mobile implementation        |
| API routes, authentication, database, shared contracts     | Shared/server implementation |
| Matching and urgency rules                                 | packages/matching            |
| Type and validation contracts                              | packages/shared              |

When a feature crosses boundaries, document the API contract first and keep
the platform-specific implementation in its own app.

## Documentation

| Document                                           | Contents                                          |
| -------------------------------------------------- | ------------------------------------------------- |
| [Product spec](docs/product-spec.md)               | Product language, roles, and matching contract    |
| [Architecture](docs/architecture.md)               | System context, containers, data flow, deployment |
| [Design tokens](docs/design-tokens.md)             | Shared visual foundation                          |
| [API foundation](docs/api-foundation.md)           | API conventions and response behavior             |
| [Authentication](docs/authentication.md)           | Google sign-in and onboarding                     |
| [RBAC](docs/rbac.md)                               | Server-side role checks and IDOR protection       |
| [Security](docs/security.md)                       | Security requirements and hardening               |
| [Matching algorithms](docs/matching-algorithms.md) | Urgency formula and matching rules                |
| [Notifications](docs/notifications.md)             | Notification types and delivery behavior          |
| [Mobile integration](MOBILE_INTEGRATION.md)        | Mobile architecture and backend gaps              |
| [CI](docs/ci.md)                                   | Required checks and commit trailers               |
| [EAS build](docs/eas-build.md)                     | Android build and release workflow                |

If you change behavior, update the closest authoritative document instead of
letting the README become a second source of truth.

## Security notes

- Never commit .env.local, database credentials, OAuth secrets, Cloudinary
  secrets, or EAS tokens.
- Never log passwords, access tokens, full connection strings, or personal data.
- Report security issues privately to the maintainers rather than opening a
  public issue with exploitable details.
- Review [docs/security.md](docs/security.md) before changing auth, API
  authorization, uploads, rate limiting, or audit behavior.

---

<p align="center">
  Built for the Codebenders ACE Builders Hackathon · Problem Statement 2: Rescue the Surplus
</p>
