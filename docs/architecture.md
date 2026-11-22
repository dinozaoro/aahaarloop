# Architecture

This is the reference for system boundaries and data flow. It describes the
code that exists in this repository and marks work that is only designed. See
the [ADR index](adr/README.md) for the decisions behind each choice.

## Status

- **Implemented:** pnpm/Turborepo workspace, Next.js web shell, Auth.js sign-in
  and onboarding, server-side RBAC, Drizzle schema and migrations, shared
  matching rules, food-recognition interfaces and GitHub Actions CI.
- **Designed, not integrated:** map tiles (Leaflet), image uploads
  (Cloudinary), live AI credentials, mobile offline sync and deployment
  pipelines. Schema columns and interfaces exist for these, but no live service
  is configured here.

## System context

```mermaid
flowchart LR
  Donor[Donor] --> Web
  Recipient[Recipient organisation] --> Web
  Volunteer[Volunteer] --> Mobile
  Admin[Admin] --> Web
  Web[Next.js web app] --> Server[Route handlers and server actions]
  Mobile[Expo mobile app] --> Server
  Server --> Auth[Auth.js and Google]
  Server --> DB[(Neon PostgreSQL)]
  Server --> Match["@aahaarloop/matching"]
  Server --> Food["@aahaarloop/food-recognition"]
  Food --> AI[AI vision provider and Sightengine]
  Web -. planned .-> Map[Leaflet map tiles]
```

Only the web app currently talks to the database. The Expo app declares
`EXPO_PUBLIC_API_URL` for future API calls; it has no data screens yet.

## Workspaces

| Workspace                   | Role                                                                   |
| --------------------------- | ---------------------------------------------------------------------- |
| `apps/web`                  | Next.js App Router UI, route handlers, server actions and auth guards  |
| `apps/mobile`               | Expo Router app, configured with shared TypeScript and env parsing     |
| `packages/shared`           | Platform-neutral constants, types and env schemas                      |
| `packages/matching`         | Deterministic urgency and matching rules (pure functions)              |
| `packages/database`         | Drizzle schema, relations, migrations, seed and admin bootstrap        |
| `packages/food-recognition` | Provider-neutral analysis, confirmation, authenticity and publish flow |
| `packages/config`           | Shared TypeScript and ESLint configuration                             |

Apps never import another platform's UI. Platform-neutral logic lives in the
packages so web and mobile can reuse it; see `scripts/workspace.test.mjs`.

## Donation to claim flow

```mermaid
sequenceDiagram
  participant Donor
  participant Web as Next.js server
  participant Rules as Matching rules
  participant DB as Neon PostgreSQL
  participant Recipient

  Donor->>Web: Create donation and photo
  Web->>DB: Insert donation and donation_images rows
  Web->>Rules: Compute urgency and eligibility
  Rules-->>Web: Score plus hard-filter decision
  Recipient->>Web: Request matching donations
  Web->>DB: Read published donations and recipient needs
  Web->>Rules: Rank with needs and logistics
  Rules-->>Web: Explainable ranked list
  Recipient->>Web: Claim servings
  Web->>Web: requireClaimFor(recipient organization)
  Web->>DB: Persist claim and update available servings
```

The matching package never mutates state: it receives donor, recipient and
logistics inputs and returns a decision with reasons. The prototype web UI
still reads a seeded in-memory store in `apps/web/src/lib/data/store.ts`; the
persistent tables and claim lifecycle are defined in `packages/database`.

## Authentication and authorization

```mermaid
sequenceDiagram
  participant User
  participant Web as Next.js server
  participant Google
  participant DB as Neon PostgreSQL

  User->>Web: Continue with Google
  Web->>Google: OAuth redirect
  Google-->>Web: Profile with verified email
  Web->>DB: Find or provision users and profiles
  Web-->>User: JWT session with id, role and organization
  User->>Web: Choose role and organization
  Web->>DB: Insert organization membership, update user role
  Web-->>User: Refreshed JWT re-read from the database
```

Session claims identify the actor, but privileged handlers re-check membership
and ownership on the server. Details and helper names are in
[authentication](authentication.md) and [RBAC](rbac.md).

## Matching

Urgency, hard filters, weights and the worked example live in
[matching algorithms](matching-algorithms.md); domain terms are in the
[product specification](product-spec.md). The same pure package is intended to
drive both web lists and mobile notifications so explanations stay consistent.

## Offline sync (designed)

```mermaid
sequenceDiagram
  participant Mobile as Expo client
  participant Outbox as Local outbox
  participant API as Future sync endpoint
  participant DB as sync tables

  Mobile->>Outbox: Queue mutation while offline
  Outbox->>API: Replay with device_id and operation id
  API->>DB: Insert sync_operations record
  alt Remote state changed
    DB-->>API: Conflict found
    API-->>Mobile: sync_conflicts entry for review
  else No conflict
    API-->>Mobile: Acknowledgement
  end
```

`device_sessions`, `sync_operations` and `sync_conflicts` already exist in the
schema, but no sync endpoint, local outbox or conflict resolver is implemented.
Idempotency keys and server-side RBAC must be part of the endpoint before it is
exposed.

## Deployment

```mermaid
flowchart TB
  GitHub[GitHub PR] --> CI[GitHub Actions CI]
  CI --> Preview[Preview deployment]
  GitHub --> Main[main]
  Main --> CI
  Main --> Prod[Production web deployment]
  Preview --> Neon[(Neon dev branch)]
  Prod --> NeonProd[(Neon production database)]
  EAS[EAS build] --> MobileApp[Expo app]
  MobileApp --> Prod
```

CI details are in [CI](ci.md) and variables in
[environment configuration](development/environment.md). Each environment owns
its `AUTH_SECRET`, Google OAuth client and database strings; preview databases
must never be production data. The workflow uses no secrets itself. The EAS
pipeline is not configured yet.

## Decisions

- [0001 Next.js App Router](adr/0001-nextjs-app-router.md)
- [0002 Drizzle ORM](adr/0002-drizzle-orm.md)
- [0003 Neon PostgreSQL](adr/0003-neon-postgresql.md)
- [0004 Auth.js](adr/0004-authjs.md)
- [0005 Leaflet](adr/0005-leaflet.md)
- [0006 Expo](adr/0006-expo.md)
- [0007 pnpm and Turborepo](adr/0007-pnpm-turborepo.md)
- [0008 Cloudinary](adr/0008-cloudinary.md)
- [0009 AI providers](adr/0009-ai-providers.md)
