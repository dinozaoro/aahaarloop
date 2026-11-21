# 0001 — Next.js App Router

Status: Accepted

## Context

The web app needs public browsing pages, authenticated onboarding and a small
number of privileged mutations. It must render useful content without shipping
a separate client-only API, and privileged code must stay off the browser.

## Decision

Use Next.js 16 with the App Router (`apps/web/src/app`). Server components read
data, server actions handle mutations, and route handlers under
`app/api/admin` and `app/api/auth` expose HTTP endpoints. Each privileged
handler calls a server guard from `apps/web/src/lib/auth/guards.ts`.

## Consequences

- Authorization lives next to the mutation; hidden UI is never the only layer.
- Route handlers and server actions can reuse the same Drizzle client and RBAC
  helpers without a second service.
- A Node-compatible deployment is required; static export is not a target.
- Some pages are still prototype demos using an in-memory store, so they must
  be migrated to database queries before production data is used.
