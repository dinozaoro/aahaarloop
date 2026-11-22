# Postgres DAL wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace process-local domain stores with one server-only Postgres DAL and wire the disconnected web actions to the existing HTTP API.

**Architecture:** `apps/web/src/lib/data/dal.ts` maps Drizzle rows to the existing domain types. The current repository adapters become async facades over it; services await their repositories. Server components read the DAL; client components call routes and refresh. Mobile response shapes stay unchanged.

**Tech Stack:** Next.js 16.4.6 App Router, React 19, TypeScript 6, Drizzle ORM 0.44 on `pg`, Neon Postgres, Zod 4, node:test.

**Spec:** `docs/superpowers/specs/2026-11-22-postgres-dal-wiring-design.md`

## Global Constraints

- Work on branch `feat/postgres-dal-wiring`; commit messages end with the two mandatory co-author trailers from root `AGENTS.md`.
- Read Next.js 16 guides in `node_modules/next/dist/docs` before writing route-handler or client-component code.
- All DB access goes through `getDb()` in `apps/web/src/lib/db.ts`; `import "server-only"` in the DAL.
- No client component imports `getDb()`, the DAL, or `@aahaarloop/database`.
- Preserve existing API response envelopes (`{ donations }`, `{ data, total, unread }`, `{ tasks }`, bare donation/claim).
- Keep `shortcut:` comments for the in-memory moderation/admin-config/telemetry/idempotency stores.

## Review Focus

- A stale worker must not serve another worker's writes: every domain read goes to Postgres, not a module array — pinned by a DAL test that inserts through one helper and reads through another.
- Claim idempotency must survive a retry on another worker: `claims.idempotency_key` unique column plus mobile header emission — pinned by a test that the client sends the header.
- Donation/need mappings must not turn missing optional DB columns into crashes: row→domain mapper defaults — pinned by a test with a minimal seed row.
- Cross-organization reads must stay scoped: claims/needs routes re-check session org — pinned by existing guard tests plus new route assertions.
- The web wizard must not claim success without persisting: publish POSTs then publishes — pinned by a source-level assertion on `donation-location-form.tsx`.

---

### Task 1: DAL and async repository seams

**Files:**
- Create `apps/web/src/lib/data/dal.ts`
- Modify `apps/web/src/lib/donations/service.ts`, `lib/claims/transaction.ts`, `lib/claims/cancellation.ts`, `lib/notifications/service.ts`, `lib/pickups/tasks.ts`, `lib/favorites/service.ts`
- Test `apps/web/test/dal-mapping.test.mjs`

**Interfaces:**
- Produces: `dal.*` async read/write functions; repository interfaces return `Promise`.

Steps: write mapping test, run to fail, implement DAL + async seams, run `pnpm --filter @aahaarloop/web test`, commit.

### Task 2: Adapters and API routes

**Files:** `lib/data/store.ts`, the four `*-store-repository.ts`, `lib/favorites/service.ts`, `app/api/donations/**`, `app/api/claims/**`, `app/api/notifications/**`, `app/api/pickups/**`, `app/api/favorites/route.ts`, `app/api/matches/route.ts`, `apps/mobile/src/lib/api.ts`.

**Interfaces:** Consumes Task 1 `dal.*`; produces unchanged HTTP envelopes.

Steps: convert adapters, add `GET /api/claims`, emit `idempotency-key` in `apiFetch`, run lint/typecheck/test, commit.

### Task 3: Server pages read the DAL

**Files:** the ~15 pages importing `lib/data/store`.

Steps: hoist awaited DAL reads, run typecheck, commit.

### Task 4: Wire web actions

**Files:** donation wizard, `browse/[id]` claim button, recipient needs editor, profile forms, notification bell mount, new `/api/needs` and `/api/profile` routes.

Steps: add routes with Zod + guards, add client calls, run tests/typecheck, commit.

### Task 5: Migration, docs, verification

**Files:** schema + generated migration, `WEB_INTEGRATION.md`, `docs/architecture.md`, `docs/donation-location.md`.

Steps: generate migration (do not apply), update docs, run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `npm run build`, commit.
