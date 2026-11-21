# @aahaarloop/matching

Deterministic business rules shared by the web and mobile apps. The package starts with the urgency calculator required by issue #28.

## Urgency calculation

`calculateUrgency(input)` returns a level and a claimability decision. It is pure: the same inputs always produce the same output, and the caller must pass `now`.

### Effective deadline

The effective deadline is the earliest of:

- `foodExpiryAt` — the earliest applicable use-by date across the donation items.
- `pickupDeadlineAt` — the operational pickup deadline.

`best_before_at` is a quality date, not a safety deadline. It is deliberately excluded.

If neither deadline is present, the result is `unknown` and not claimable.

### Operational margin

```
remainingMinutes = effectiveDeadline - now - travelTime - handlingTime - buffer
```

All values are converted to epoch milliseconds. Travel and handling default to 0 minutes. The safety buffer defaults to 15 minutes.

### Levels

| Operational margin | Level |
| --- | --- |
| more than 12 hours | `low` |
| 6 to 12 hours | `medium` |
| 3 to 6 hours, excluding 6 | `high` |
| more than 0 and less than 3 hours | `critical` |

Boundary rule: `low` is strictly more than 12 hours; `medium` is 6 to 12 hours inclusive; `high` is 3 hours inclusive to 6 hours exclusive; `critical` is strictly between 0 and 3 hours. Therefore exactly 12 hours is `medium`, exactly 6 hours is `medium`, and exactly 3 hours is `high`.

### Statuses

| Status | Meaning | Claimable |
| --- | --- | --- |
| `active` | Deadline is in the future and the operational margin is positive. | yes |
| `expired` | The effective deadline is at or before `now`. | no |
| `infeasible` | The deadline is in the future, but travel, handling and buffer consume the remaining time. | no |
| `unknown` | No food expiry or pickup deadline was provided. | no |

Expired and infeasible donations must not be presented as normally claimable. Admin review, if any, is outside this function.

### Timezones

All calculations use epoch milliseconds and are timezone-independent. `Date` objects represent instants. Strings must be ISO 8601 with an explicit `Z` or offset; strings without an offset are rejected to avoid local-time ambiguity. `effectiveDeadlineAt` is returned as an ISO 8601 UTC string.

### Example

```ts
import { calculateUrgency } from "@aahaarloop/matching";

const result = calculateUrgency({
  now: "2026-11-21T10:00:00Z",
  foodExpiryAt: "2026-11-21T20:00:00+05:30",
  pickupDeadlineAt: "2026-11-21T18:00:00+05:30",
  travelTimeMinutes: 30,
  handlingTimeMinutes: 15,
  bufferMinutes: 15,
});

// effective deadline: 2026-11-21T12:30:00.000Z
// remaining: 1h30m -> critical, active, claimable
```

### Assumptions and limits

- The caller passes the earliest applicable food expiry across donation items.
- Travel and handling are estimates supplied by the caller.
- The buffer is a safety and logistics margin, not a food-safety certification.
- The function does not certify that food is safe to eat.
- A missing deadline is not treated as low urgency; it is `unknown`.
- The function does not schedule reminders or expire donations in the database.

## Tests

```bash
npm test --prefix packages/matching
```

The package has no runtime dependencies and uses Node's built-in test runner with TypeScript type stripping (Node 22.18+).
