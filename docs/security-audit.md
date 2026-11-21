# Security audit — final pass

Date: 2026-11-22. Scope: production web app (`https://aahaarloop.vercel.app`),
the monorepo dependencies and the deployed configuration. This complements the
Lighthouse/bundle audit in [performance-audit.md](./performance-audit.md).

## Dependency vulnerabilities

`pnpm audit --prod` found two advisories:

| Package                                           | Severity | Finding                                                                                                                | Action                                                                                                                                    |
| ------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `drizzle-orm` < 0.45.2                            | **high** | SQL injection via improperly escaped values ([GHSA-gpj5-g38j-94v9](https://github.com/advisories/GHSA-gpj5-g38j-94v9)) | Upgraded to `0.45.4` in web and database; build/tests re-run.                                                                             |
| `minimatch` 10.x via `expo` → `@expo/fingerprint` | moderate | ReDoS ([GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249))                                       | Build-time only, not shipped to browsers. No patched Expo major in this SDK line. Accepted with tracking; upgrading Expo is the real fix. |

Result after the fix: **1 moderate (build-time) advisory**, no high/critical.

## Response headers (verified at runtime)

```
strict-transport-security: max-age=31536000; includeSubDomains
x-content-type-options: nosniff
x-frame-options: DENY
referrer-policy: strict-origin-when-cross-origin
permissions-policy: camera=(), microphone=(), geolocation=(self), payment=()
```

A `Content-Security-Policy-Report-Only` is now sent in production with
`frame-ancestors 'none'`, `base-uri 'self'` and `form-action 'self'`. It is
**report-only on purpose**: Next.js uses inline scripts/styles, so enforcement
needs a nonce strategy and a report endpoint. Do not flip it to enforcing
without that work.

## Secrets and source

- No live credentials in tracked files. The strings matching key patterns are
  fixtures in tests (`nt_live_test`, `AKIAIOSFODNN7EXAMPLE`).
- Only `NEXT_PUBLIC_APP_URL` is public by design. `DATABASE_URL`,
  `NEON_AI_GATEWAY_TOKEN`, `AUTH_*`, `CLOUDINARY_*` and `SIGHTENGINE_*` are
  server-only.
- Sightengine request URLs embed the secret and are built server-side only;
  the authenticity logger redacts emails, phone numbers and token-shaped
  strings before emitting structured logs.
- Source maps are not exposed: the served chunks contain no
  `sourceMappingURL`, and requesting a `.map` returns HTTP 403.

## Application controls

- Auth.js session cookies; protected pages redirect to `/signin`, protected
  APIs return 401/403. Verified: `/api/donations` and `/api/matches` → 401.
- CSRF check on unsafe cross-origin methods, idempotency keys on mutations,
  per-route rate limits where configured. Covered by `apps/web/test/api.test.mjs`.
- Admin actions require the `admin` role and are written to the audit log.
- Offline writes are idempotency-keyed; conflicts are surfaced for human
  resolution rather than silently overwriting data.

## Remaining human work

- Add an CSP report endpoint and move to an enforced nonce-based CSP.
- Configure Vercel alerting/uptime on `/api/health` (see [monitoring.md](./monitoring.md)).
- Authorize Google redirect URIs for each preview host (production URI is set).
- Upgrade Expo SDK when a patched `minimatch` is available upstream.
