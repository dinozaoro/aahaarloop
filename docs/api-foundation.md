# API foundation

All route handlers go through `withApiHandler` in
[`apps/web/src/lib/api/handler.ts`](../apps/web/src/lib/api/handler.ts). It owns
validation, error responses, the request id, structured logging and the POST
replay path; handlers only implement business logic. The admin audit route is
the reference example.

## Error envelope

Every non-2xx response has the same shape:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Validation failed",
    "request_id": "<uuid>",
    "details": [
      {
        "path": "servings",
        "message": "Expected a positive number",
        "code": "too_small"
      }
    ]
  }
}
```

Stable codes and statuses are defined in
[`errors.ts`](../apps/web/src/lib/api/errors.ts): `validation_error` (400),
`unauthorized` (401), `forbidden` (403), `not_found` (404), `conflict` (409),
`rate_limited` (429) and `internal_error` (500). A Zod error is converted to
400 with one detail per issue, containing the field path and message only —
never the submitted value. Unknown exceptions become 500 with the fixed message
`Internal server error` and no details, so credentials or internals in an
exception cannot reach the client.

## Request id and logs

The wrapper generates a UUID per request, returns it in the `x-request-id`
header and includes it as `request_id` in one structured JSON log line. The log
contains method, path, status, error code and duration. Request bodies, query
values, headers and raw exception messages are never logged, so secrets cannot
leak into logs.

## Idempotency and rate limiting

Passing `idempotency: true` (or a store) to the wrapper enables replay for POST
requests carrying an `Idempotency-Key` header. A replay returns the original
status and body with a fresh request id; only successful responses are stored.
The default store is in-memory: it deduplicates within one process only and
must be replaced with a shared durable store before running multiple instances.

Passing `rateLimit: createRateLimiter(...)` applies a fixed-window limit keyed
by client address and path. Over-limit calls receive 429. This is an
in-process hook; no external rate-limit service is configured.

## Pagination

[`pagination.ts`](../apps/web/src/lib/api/pagination.ts) parses `page` and
`limit` from the query string, defaults to page 1 / limit 20, clamps the limit
to 100 and ignores non-positive or non-integer values. `paginate(items, params)`
returns `{ page, limit, offset, total, data }`.

## Verification

`node --test test/api.test.mjs` (included in `pnpm --filter @aahaarloop/web test`)
covers the envelope, Zod-to-400 conversion, idempotent replay, secret redaction,
rate limiting and pagination.
