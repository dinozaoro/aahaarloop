# Architecture

This is the reference for system boundaries and data flow. It describes the
code that exists in this repository and marks work that is only designed. See
the [ADR index](adr/README.md) for the decisions behind each choice.

## Status

- **Implemented:** pnpm/Turborepo workspace, Next.js web shell, Auth.js sign-in
  and onboarding, server-side RBAC, Drizzle schema and migrations, a
  server-only Postgres DAL wired into web pages and HTTP routes, shared
  matching rules, food-recognition interfaces and GitHub Actions CI.
- **Operator step pending:** `packages/database/migrations/0001_lucky_speed.sql`
  is generated but not applied. An operator must run the migrations before
  using the app; see [data access](#data-access).
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
  Server --> DAL[Server-only data DAL]
  DAL --> DB[(Neon PostgreSQL)]
  Server --> Match["@aahaarloop/matching"]
  Server --> Food["@aahaarloop/food-recognition"]
  Food --> AI[AI vision provider and Sightengine]
  Web -. planned .-> Map[Leaflet map tiles]
```

Only the web app talks to the database, through the server-only DAL. The Expo
app calls the same HTTP routes via `EXPO_PUBLIC_API_URL` and receives unchanged
response envelopes; it never connects to Postgres directly.

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
  Web->>DB: Insert donation and donation_images rows via DAL
  Web->>Rules: Compute urgency and eligibility
  Rules-->>Web: Score plus hard-filter decision
  Recipient->>Web: Request matching donations
  Web->>DB: Read published donations and recipient needs via DAL
  Web->>Rules: Rank with needs and logistics
  Rules-->>Web: Explainable ranked list
  Recipient->>Web: Claim servings with idempotency-key header
  Web->>Web: Check recipient role and active organization
  Web->>DB: Persist claim and update available servings via DAL
```

The matching package never mutates state: it receives donor, recipient and
logistics inputs and returns a decision with reasons. Web pages await DAL
reads; client actions call HTTP routes. The persistent tables and claim
lifecycle are defined in `packages/database`, and the seeded rows are visible
in the UI without a separate hydration step.

## Data access

Domain state (donations, claims, needs, organizations, notifications, pickups,
favorites, moderation, admin config, telemetry and POST replay responses) lives
in Postgres, not in process-local stores.
`apps/web/src/lib/data/dal.ts` is `server-only`: it uses `getDb()` and maps
Drizzle rows to domain types. `apps/web/src/lib/data/store.ts` and the
`*-store-repository.ts` adapters are thin async adapters; services await them,
server pages await DAL reads, and client components call HTTP routes and then
refresh. No client imports the DAL. HTTP envelopes are unchanged:
`{ donations }`, `{ data, total, unread }` and `{ tasks }`.

Claim creation requires the `recipient` role, a `recipient_id` matching
`session.user.activeOrganizationId`, and an `idempotency-key` header (sent by
both the web UI and the mobile client). `claims.idempotency_key` is unique in
Postgres; `commitClaim` locks the donation row with `SELECT … FOR UPDATE` and
writes the claim, stock decrement and event in one transaction, so the in-process
claim lock is gone. Favorites are scoped to both the user and the active
organization.

Migrations `packages/database/migrations/0001_lucky_speed.sql` and
`0002_cultured_energizer.sql` are generated but **not applied**: an operator must
run `pnpm --filter @aahaarloop/database migrate` before using the app. The seed
supplies five donations, two needs, two claims and one pickup task. A newly
onboarded organization has no seeded donations, so claim tests use the seeded
recipient organization. Moderation audit entries reuse `audit_logs`; admin
config, telemetry and POST replay responses have their own tables. The config
snapshot and match cache stay process-local and are refreshed from Postgres at
startup and on config change.

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
