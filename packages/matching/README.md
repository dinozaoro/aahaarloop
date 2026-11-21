# @aahaarloop/matching

Deterministic business rules shared by the web and mobile apps: recipient needs from issue #27, the urgency calculator from issue #28, and the matching engine from issue #29. For the full derivation, configuration and a worked example, see [`docs/matching-algorithms.md`](../../docs/matching-algorithms.md).

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

| Operational margin                | Level      |
| --------------------------------- | ---------- |
| more than 12 hours                | `low`      |
| 6 to 12 hours                     | `medium`   |
| 3 to 6 hours, excluding 6         | `high`     |
| more than 0 and less than 3 hours | `critical` |

Boundary rule: `low` is strictly more than 12 hours; `medium` is 6 to 12 hours inclusive; `high` is 3 hours inclusive to 6 hours exclusive; `critical` is strictly between 0 and 3 hours. Therefore exactly 12 hours is `medium`, exactly 6 hours is `medium`, and exactly 3 hours is `high`.

### Statuses

| Status       | Meaning                                                                                    | Claimable |
| ------------ | ------------------------------------------------------------------------------------------ | --------- |
| `active`     | Deadline is in the future and the operational margin is positive.                          | yes       |
| `expired`    | The effective deadline is at or before `now`.                                              | no        |
| `infeasible` | The deadline is in the future, but travel, handling and buffer consume the remaining time. | no        |
| `unknown`    | No food expiry or pickup deadline was provided.                                            | no        |

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

## Recipient needs

A `Need` records a food category, a quantity, an optional deadline, a priority, notes and a lifecycle status (`active`, `fulfilled` or `expired`). `createNeed(input, now)` and `editNeed(need, input, now)` validate the input and return `{ need, errors }`; `errors` is empty on success. `closeNeed(need)` (also exported as `fulfillNeed`) marks a need fulfilled.

Validation rules:

- `category` must not be blank.
- `quantity` must be a positive finite number.
- `deadlineAt`, when supplied, must be in the future. `null` means no deadline; passing `null` to `editNeed` clears it.
- `priority` must be `low`, `medium` or `high` and defaults to `medium`.

`getActiveNeeds(needs, now)` returns only needs whose status is `active` and whose deadline has not passed. `refreshNeedStatuses(needs, now)` recomputes expired statuses. The matching engine calls `getActiveNeeds` for both the needs hard filter and the needs score, so closed and expired needs never affect a match.

Needs are held in memory by the caller for now; this package does not persist them.

## Matching engine

`matchDonationsForRecipient(recipient, donations, { now, config })` filters and ranks donations for one recipient. It is pure and deterministic, and it does not use an LLM.

### Hard filters

A donation is excluded when any of these fail:

| Filter           | Rule                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| Time feasibility | The urgency calculation must return `active`.                                                                       |
| Distance         | Haversine distance must not exceed `maxDistanceKm` (default 25 km).                                                 |
| Storage          | The donation's required storage must not exceed what the recipient can provide (`ambient` < `chilled` < `frozen`).  |
| Quantity         | `availableServings` must be positive. With `allowPartialClaims: false`, it must also cover `requiredServings`.      |
| Needs            | If the recipient has active needs, at least one donation category must match. Fulfilled and expired needs are ignored; an empty active list accepts anything. |
| Transport        | The claimed weight must fit `transportCapacityKg`.                                                                  |

Excluded entries list every failed reason, so a caller can explain the rejection.

### Components and weights

Every eligible match is scored 0–100 per component, then combined with normalized weights.

| Component    | Default weight | 0–100 score                                                                        |
| ------------ | -------------- | ---------------------------------------------------------------------------------- |
| Urgency      | 0.30           | `critical` 100, `high` 75, `medium` 50, `low` 25                                   |
| Distance     | 0.25           | Linear from 100 at 0 km to 0 at `maxDistanceKm`                                    |
| Quantity     | 0.15           | `claimableServings / requiredServings`                                             |
| Needs        | 0.15           | Matched categories divided by active needs; 100 when no active needs are listed    |
| Availability | 0.10           | 100 when a volunteer window contains `now`, otherwise 0                            |
| Logistics    | 0.05           | Claimed weight divided by transport capacity (right-sized transport scores higher) |

Weights are normalized to sum to 1, so callers can pass any non-negative values. Missing keys fall back to the defaults; all-zero weights are rejected. The explanation payload includes each raw score, normalized weight, contribution, and the inputs behind it (`distanceKm`, `claimableServings`, `matchedCategories`, `remainingMinutes`, `claimedWeightKg`).

### Time feasibility and travel

Travel time is derived from the haversine distance and `averageSpeedKmh` (default 25). The matching engine then calls the urgency calculator with `handlingTimeMinutes` (default 10) and `bufferMinutes` (default 15).

### Partial claims

`claimableServings = min(availableServings, requiredServings)`. The claimed weight is proportional: `totalWeightKg × claimableServings / totalServings`. Partial claims are enabled by default and can be disabled with `allowPartialClaims: false`.

### Example

```ts
import { matchDonationsForRecipient } from "@aahaarloop/matching";

const result = matchDonationsForRecipient(
  {
    id: "recipient-1",
    location: { latitude: -18.8792, longitude: 47.5079 },
    needs: [
      {
        id: "need-1",
        category: "produce",
        quantity: 80,
        deadlineAt: "2026-11-22T10:00:00Z",
        priority: "medium",
        notes: "",
        status: "active",
        createdAt: "2026-11-20T10:00:00Z",
      },
    ],
    requiredServings: 80,
    storage: "chilled",
    transportCapacityKg: 50,
    volunteerAvailability: [
      { start: "2026-11-21T09:00:00Z", end: "2026-11-21T12:00:00Z" },
    ],
  },
  [
    {
      id: "donation-1",
      location: { latitude: -18.9, longitude: 47.52 },
      categories: ["produce"],
      storage: "ambient",
      totalServings: 100,
      availableServings: 100,
      totalWeightKg: 40,
      pickupDeadlineAt: "2026-11-21T18:00:00Z",
    },
  ],
  { now: "2026-11-21T10:00:00Z" },
);

// result.matches[0].claimableServings -> 80
// result.matches[0].totalScore -> weighted score
// result.matches[0].explanation -> per-component scores
```

### Assumptions and limits

- Domain types are local to this package until the Drizzle schema (#4) defines their database shapes.
- Food categories are opaque strings; the matching engine does not own the taxonomy.
- Availability checks whether a volunteer is available at `now`. It does not schedule a pickup or search future windows.
- The logistics score rewards using a larger share of the available capacity; it is not a cost calculation.
- The engine does not persist claims or update `availableServings`.

## Volunteer profiles

`createVolunteerProfile(input, now)` and `editVolunteerProfile(profile, input, now)` validate and return a profile with transport mode, capacity, a service area, availability windows and platform-controlled `verified` status. `validateVolunteerProfile(input)` returns field-level errors for the UI. `isVolunteerAvailable(profile, at)` checks a single instant (inclusive at both ends).

`getMatchingVolunteerFields(profile)` returns `transportCapacityKg` and `volunteerAvailability` for a `RecipientRequest`, so the matching engine's weight filter and availability score use the saved profile. `canAcceptMission(profile, mission)` is the mission-assignment gate: the volunteer must be verified, carry the whole weight, have one window covering the whole pickup window, and have the pickup inside the service radius.

```ts
import {
  canAcceptMission,
  getMatchingVolunteerFields,
} from "@aahaarloop/matching";

const recipientRequest = {
  id: "recipient-1",
  location: { latitude: 12.9716, longitude: 77.5946 },
  needs: [],
  requiredServings: 80,
  storage: "ambient",
  ...getMatchingVolunteerFields(savedProfile),
};
```

## Tests

```bash
npm test --prefix packages/matching
```

The package has no runtime dependencies and uses Node's built-in test runner with TypeScript type stripping (Node 22.18+).
