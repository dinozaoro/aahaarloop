# Postgres DAL wiring — design

Date: 2026-11-22
Branch: `feat/postgres-dal-wiring` (new, from `main`)

## Intent

The prototype has two speeds. Auth, onboarding, guards, audit and health really
use Neon/Postgres. Every other domain writes to module-level arrays in
`apps/web/src/lib/data/store.ts` and the `*-store-repository.ts` adapters, so
data vanishes on restart and is not shared between workers. The web wizard,
recipient needs, profiles, claim action and notification bell do not call the
API at all, and the seeded rows are invisible to the UI.

Goal: one durable source of truth. Keep the existing HTTP contracts (mobile
already depends on them) and make the web screens read and write that source.

## Goals

- Donations, claims, needs, organizations/profiles, notifications and pickups
  are read from and written to Postgres through one server-only DAL.
- Seeded demo rows appear in the web UI and in mobile responses without a
  separate hydration step.
- The five disconnected web actions call the existing/new API routes: donation
  publish, claim, need create/edit/close, profile edit, notification bell.
- Mobile keeps the same response envelopes; fix the missing `idempotency-key`
  header so `POST /api/claims` stops returning 400.

## Non-goals

- No visual redesign, no new product features, no change to Auth.js flows.
- No dev/Credentials login: real Google sign-in provisions a user, then
  onboarding creates an organization; published seed donations are visible to
  any signed-in user. Demo-account impersonation is a separate decision.
- Moderation reports, admin config, telemetry and the in-process idempotency
  replay cache stay in memory. They are not in the audit's path. Each keeps a
  `shortcut:` comment stating the limit.
- No live migration or seed run against a shared Neon branch.

## Constraints

- `apps/web/AGENTS.md`: Next.js 16.4.6 docs under `node_modules/next/dist/docs`
  were read before writing code (route handlers, mutating data, data security).
- Root `AGENTS.md`: branch `feat/postgres-dal-wiring`; every commit ends with the
  two mandatory co-author trailers; one logical change per commit.
- `packages/database` exports tables only, no CRUD. `getDb()` in
  `apps/web/src/lib/db.ts` is the only runtime DB entry point; it is lazily
  connected and `Db` is its inferred type.
- Drizzle is constructed without a schema object: use `db.select/insert/update`
  and explicit joins; no `db.query`.
- Existing services and tests use synchronous repository interfaces. Making
  them async is the cost of using a real database; the pure business rules stay
  untouched.

## Approaches

1. **Single DAL behind the existing repositories** (chosen). One `server-only`
   module maps DB rows to the existing domain types. The repository adapters
   become async implementations of the current interfaces; services await them.
   Server pages await DAL reads. UI actions call the HTTP API. One source of
   truth, mobile contract preserved, business rules reused.
2. **SQL writes inside routes, reads through internal fetch** (rejected):
   two read paths to keep consistent, extra HTTP hop, no benefit over 1.
3. **Demo-only scope** (rejected): leaves mobile pickups and favorites
   volatile, which is exactly the reported problem.

## Decisions (builder calls)

- New file `apps/web/src/lib/data/dal.ts` with `import "server-only"`, `getDb()`
  and table imports from `@aahaarloop/database`. All mapping lives there.
- Repository interfaces in `donations/service.ts`, `claims/transaction.ts`,
  `claims/cancellation.ts`, `notifications/service.ts`, `pickups/tasks.ts`,
  `favorites/service.ts` become `Promise`-returning; their implementations and
  all callers `await`. Tests with in-memory fakes wrap returns in `Promise.resolve`.
- `apps/web/src/lib/data/store.ts` and the `*-store-repository.ts` files become
  thin async adapters to the DAL; no arrays.
- New routes: `GET/POST/PATCH /api/needs`, `PATCH /api/profile`. Both use
  `withApiHandler`, `auth()` plus server-side role/org checks, and the shared
  Zod schemas.
- Small generated migration (not applied here): `claims.idempotency_key` text
  with a unique index, and `notification_preferences` (`user_id`, `channel`,
  `enabled` jsonb). Per `docs/database/schema.md`, both developers must review
  before this reaches a shared Neon branch.
- Mapping shortcuts, each with a `shortcut:` comment:
  - `FoodCategory` from the seeded category slug (`cooked-meals` → `prepared`,
    `fruits` → `produce`, `snacks` → `pantry`, else `other`).
  - `weightKg` stays 0: no volumetric data exists in the input or the seed.
  - `pickupArea` comes from the owning organization's address.
  - Need `status` from `fulfilled_at`; `priority` from `needed_by` (< 24 h →
    `urgent`, else `normal`) because the table has no priority column.
  - Notification `entityType`, `entityId`, `dedupeKey` are reserved keys inside
    the existing `data` jsonb, avoiding a second migration.
- Client mutations call the API then `router.refresh()`; no client imports the
  DAL or `getDb()`.

## Sequence for the implementer

1. DAL + async interfaces + adapters, with a small assert-based check for the
   row → domain mapping.
2. Donations, claims, needs, organizations, notifications and pickups reads in
   server pages switched to the DAL.
3. API routes switched to the async adapters; mobile response shapes unchanged;
   `apiFetch` sends `idempotency-key`.
4. UI actions wired (wizard, claim button, needs editor, profile forms, bell).
5. Generated migration, docs (`WEB_INTEGRATION.md`, `docs/architecture.md`,
   `docs/donation-location.md`), then `pnpm lint`, `typecheck`, `test`, `build`.

## Builder-check answers (decided by the implementer)

- `PATCH /api/profile` edits the signed-in user's `users.name`, `profiles.phone`
  and, when present, the active organization's contact fields. It accepts the
  shared `ProfileInputSchema` so role-specific fields validate, but the donor /
  volunteer browser-local profile editors stay out of scope: the audit is about
  shared server state, and onboarding already persists role/organization.
- The wizard creates via `POST /api/donations` and then calls
  `POST /api/donations/{id}/publish`; local draft vocabulary is normalized
  (`kg → kilograms`, `containers → pieces`, `gluten-free → gluten_free`,
  `egg → eggs`, `peanut → peanuts`, `jain → vegetarian`).
- Claim/pickup writes keep the in-process lock, and the DB unique indexes on
  claims and idempotency keys stop cross-worker duplicates. No new transaction
  layer is introduced for this prototype.
- Server pages and API mutations use `session.user.activeOrganizationId`; the
  `NEXT_PUBLIC_*_ORG_ID` constants remain only as read-only demo fallbacks for
  seeded data.
- Claim history comes from `donation_events` with `claimId`; notifications may
  start empty. Seed rows already exist for donations, needs, claims and pickups.
- Favorites are in scope: `favoriteService` becomes a DAL adapter and keeps its
  user-scoped API. The schema has no organization column, so the active org is
  ignored in the adapter.
- Needs use `notes` as the display name, `needed_by` for the derived priority
  and soft-delete for "closed"; the UI continues to show a priority badge.

## Risks

- Seeded donations belong to the seeded organization; a freshly onboarded
  Google user sees them in browse but cannot claim them as that organization.
  This is expected and documented, not a bug in the DAL.
- `db.ts` caches one `pg.Client`; serverless workers each get their own client,
  which is fine for reads/writes but not for the remaining in-memory helpers.
- No live database was contacted during design; the mapping is based on the
  checked-in schema, migration and seed data.
