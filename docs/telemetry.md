# Product telemetry

Server-side, privacy-conscious events give the team product evidence without
collecting personal data. Emission lives in `apps/web/src/lib/telemetry`; the
in-memory sink is `store-repository.ts`, and `recordAudit` remains the security
record for who did what.

## Event schema

Every event is exactly:

```json
{
  "eventId": "donation_created:<uuid>",
  "name": "donation_created",
  "occurredAt": "2026-11-21T12:00:00.000Z",
  "payload": { "category": "prepared", "servings": 10 }
}
```

| Event | Allowed payload fields | Emitted from |
| --- | --- | --- |
| `donation_created` | `category`, `servings`, `storage`, `hasPhoto` | `POST /api/donations` |
| `donation_claimed` | `servings`, `isPartial` | `POST /api/claims` |
| `donation_matched` | `matchCount`, `excludedCount`, `topScore` | `GET /api/matches` (fresh computation) |
| `donation_delivered` | `weightKg` | `POST /api/pickups/tasks/[id]/complete` |

## No personal data

`sanitizePayload` uses a per-event allowlist. Any key outside it is dropped;
within an allowlisted key, strings that look like an email or phone number are
dropped, strings are capped at 60 characters, and only finite numbers and
booleans are kept. Objects and arrays are never recorded. Names, user ids,
emails, addresses, coordinates and IPs therefore cannot enter the sink. No
client endpoint accepts arbitrary telemetry payloads.

## Sampling and deduplication

`createTelemetry` accepts a `sampleRate` between 0 and 1 (default 1). Sampling
uses a stable hash of `eventId`, so a given event is always kept or always
skipped. `track` also deduplicates by `eventId`: repeating the same event id is
a no-op. Callers derive event ids from the source entity
(`donation_created:<id>`, `donation_matched:<cache key>`), so each real event is
emitted at most once.

## Retention

The demo sink keeps the most recent 5,000 events and drops the oldest first.
Production should replace the sink with a store that applies the same 30-day
retention window; the `TelemetrySink` interface is the seam. Telemetry is not a
security or billing record and must not be used as one.
