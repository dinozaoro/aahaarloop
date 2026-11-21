# Test strategy

The suite is deliberately split by what it proves. Every layer runs in CI on
every pull request via `.github/workflows/ci.yml`.

## Layers

| Layer                      | Where                                                                                                         | What it proves                                                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Pure domain                | `packages/matching/src/*.test.ts`, `packages/shared/test/*.test.mjs`, `packages/database/test/*.test.mjs`     | Urgency, matching, needs, lifecycle, schemas and vocabulary. No I/O.                                                                             |
| Web units/integration      | `apps/web/test/*.test.mjs`                                                                                    | API envelope, idempotency, validation, authorization, claim transactions, partial claims, pickup assignment, notifications, admin and telemetry. |
| Cross-service              | `apps/web/test/offline-*.test.mjs`, `service-worker.test.mjs`, `neon-gateway.test.mjs`, `monitoring.test.mjs` | IndexedDB outbox, sync replay, cache strategies, Gateway client and log redaction with injected fakes.                                           |
| End-to-end (service level) | `apps/web/test/donation-to-delivery.test.mjs`                                                                 | Draft → publish → partial claim → pickup task → assign → complete, with quantity checks and an audit trail.                                      |

Run everything locally:

```sh
pnpm test                       # turbo + root script checks
pnpm --filter @aahaarloop/web test
```

## Isolation

Web tests use the deterministic in-memory demo store and injected adapters
(fake IndexedDB, fake `fetch`, fake `SqliteDatabase`). They never connect to
`DATABASE_URL`, so a test run cannot mutate a Neon branch. Database tests that
need SQL use `node:sqlite` in memory. CI runs the same commands with no secrets.

## Current coverage of critical paths

- Urgency and matching: covered by the matching package tests.
- Lifecycle transitions and cancellation: `claim-lifecycle.test.mjs`.
- Claim concurrency: `claims-transaction.test.mjs` runs parallel claims and proves the total never exceeds availability; idempotent replay is covered.
- Donation → delivery: the new end-to-end test covers the flow through a **completed pickup task**.

## Known gap

The app does not yet flip the claim and donation statuses to `delivered` when a
pickup is completed — that workflow is issue #44. The end-to-end test therefore
stops at `task.status === "completed"`. Extend it with explicit `delivered`
assertions when #44 lands.

There is also no browser-driven E2E (Playwright) suite and no test against a
real Postgres database. Both are deliberate: the demo store and injected fakes
keep the suite fast and secret-free. Add a dedicated test database and a
Playwright job before treating the web UI as regression-proof.

## Rule for a failing test

A red test blocks the PR: CI must pass on all checks, and the two required
co-author trailers are enforced by a separate job. Do not merge with a skipped
critical-path test.
