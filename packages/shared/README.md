# @aahaarloop/shared

Single source of truth for shared domain vocabulary, date semantics, and Zod validation schemas used by web, mobile, server, and matching.

## Exports

- `vocabulary.ts`: roles, donation/claim statuses, urgency levels/statuses, storage types, units, dietary flags, allergens.
- `dates.ts`: ISO date-time schema and donation date semantics.
- `schemas.ts`: Zod input schemas for donation, claim, need, and profile payloads.

## Date semantics

| Field                | Meaning                                                 | Urgency/expiry |
| -------------------- | ------------------------------------------------------- | -------------- |
| `food_expiry_at`     | DLC/use-by. Food-safety limit; do not consume after it. | Hard deadline  |
| `best_before_at`     | DDM/best-before. Quality date only.                     | Excluded       |
| `pickup_deadline_at` | Operational latest collection time.                     | Hard deadline  |

`effective_deadline_at = min(food_expiry_at, pickup_deadline_at)`. Missing both hard deadlines means the donation is unknown/not claimable; a missing date is never treated as low urgency. All date-times are ISO 8601 strings with an explicit timezone offset and compared as UTC instants.

## Tests

```bash
npm test --workspace @aahaarloop/shared
```
