# Matching and urgency algorithms

This document explains why a donation matches a recipient. The implementation is
`packages/matching/src/urgency.ts` (deadline arithmetic) and
`packages/matching/src/matching.ts` (filters and ranking). Both are pure,
deterministic TypeScript with no LLM and no I/O: the caller supplies `now`.

## Urgency

The effective deadline is the earliest of the donation's food expiry (DLC,
use-by) and pickup deadline. Best-before (DDM) is a quality date and is never
used. If neither hard deadline exists the result is `unknown`.

```
remainingMinutes = effectiveDeadline - now - travelTime - handlingTime - buffer
```

Travel is derived from the haversine distance at `averageSpeedKmh` (default 25).
Handling defaults to 10 minutes and the safety buffer to 15 minutes.

| `remainingMinutes`            | Status       | Level    | Claimable |
| ----------------------------- | ------------ | -------- | --------- |
| deadline already at/before now | `expired`    | `null`   | no        |
| future deadline, margin ≤ 0   | `infeasible` | `null`   | no        |
| neither deadline supplied     | `unknown`    | `null`   | no        |
| > 720 min (> 12 h)            | `active`     | `low`    | yes       |
| 360–720 min (6–12 h)          | `active`     | `medium` | yes       |
| 180–360 min (3–6 h)           | `active`     | `high`   | yes       |
| > 0 and < 180 min             | `active`     | `critical` | yes     |

Boundaries are exact: 720 min is `medium`, 360 min is `medium`, 180 min is
`high`. `> 12 h` is strictly greater than 720 min. Time strings must carry an
explicit `Z` or offset; a bare `2026-11-21T10:00:00` is rejected as ambiguous.
All arithmetic uses epoch milliseconds.

## Distance

```
a = sin²(Δφ/2) + cos φ₁ · cos φ₂ · sin²(Δλ/2)
distanceKm = 2 · 6371.0088 · asin(min(1, √a))
```

Coordinates are validated (`latitude` −90…90, `longitude` −180…180). Distances
exceeding `maxDistanceKm` (default 25) are excluded.

## Hard filters

Every failing filter is collected into the exclusion reason list, so callers can
explain a rejection. Eligibility requires all of:

| Filter | Rule |
| --- | --- |
| Time | Urgency status is `active`. |
| Distance | Haversine distance ≤ `maxDistanceKm`. |
| Storage | Donation storage ≤ recipient storage (`ambient` < `chilled` < `frozen`). |
| Quantity | `availableServings > 0`; and ≥ `requiredServings` when `allowPartialClaims: false`. |
| Needs | With active needs, at least one donation category must match, case-sensitively. No active needs accepts anything. |
| Transport | Claimed weight ≤ `transportCapacityKg`. |

Active needs are those with status `active` and a deadline after `now`.
Fulfilled, closed and expired needs are ignored by both the filter and the
score. A need with a past deadline is filtered out even if its stored status
has not been refreshed yet.

## Score

Each eligible donation gets six 0–100 component scores. `score()` clamps to
0–100 and rounds to two decimals; weights are normalized to sum to 1 and rounded
to four decimals; each contribution is `round2(score × weight)`; the total is
`round2(sum of contributions)`.

| Component | Default weight | Score |
| --- | --- | --- |
| Urgency | 0.30 | `critical` 100, `high` 75, `medium` 50, `low` 25 |
| Distance | 0.25 | `100 × (1 − distanceKm / maxDistanceKm)` |
| Quantity | 0.15 | `100 × claimableServings / requiredServings` |
| Needs | 0.15 | `100 × matchedCategories / activeNeeds`, or 100 with no active needs |
| Availability | 0.10 | 100 if a volunteer window contains `now`, else 0 |
| Logistics | 0.05 | `100 × claimedWeightKg / transportCapacityKg` |

`claimableServings = min(availableServings, requiredServings)` and
`claimedWeightKg = totalWeightKg × claimableServings / totalServings`. A zero
transport capacity scores 0 for logistics. The denominator of the needs score
is the number of active needs, not the number of distinct categories, so two
active needs for the same category require two matched categories for 100.
Rounding happens per component before summation.

Matches are sorted by descending total score, then ascending distance, then
donation id, which makes the ordering deterministic.

## Worked example

`now = 2026-11-21T10:00:00Z`. Recipient at (12.9716, 77.5946), storage
`chilled`, transport capacity 50 kg, volunteer window 09:00–12:00Z, needs 80
servings of `produce` (one active need). Donation at (13.0216, 77.5946),
categories `["produce"]`, storage `ambient`, 100 total / 80 available servings,
40 kg, pickup deadline 18:00Z.

1. Distance = 5.559754 km; travel = 5.559754 / 25 × 60 = 13.3434 min.
2. Effective deadline = 18:00Z; margin = 480 − 13.3434 − 10 − 15 = 441.66 min
   → `medium` (6–12 h).
3. Claimable servings = min(80, 80) = 80; claimed weight = 40 × 80 / 100 =
   32 kg.
4. Needs: one active need, one matched category → 100.

| Component    | Score calculation                  | Score | Weight | Contribution |
| ------------ | ---------------------------------- | ----- | ------ | ------------ |
| Urgency      | `medium` → 50                      | 50    | 0.30   | 15.00        |
| Distance     | `100 × (1 − 5.56/25)`              | 77.76 | 0.25   | 19.44        |
| Quantity     | `100 × 80/80`                      | 100   | 0.15   | 15.00        |
| Needs        | `100 × 1/1`                        | 100   | 0.15   | 15.00        |
| Availability | window contains 10:00Z             | 100   | 0.10   | 10.00        |
| Logistics    | `100 × 32/50`                      | 64    | 0.05   | 3.20         |
| **Total**    | sum of contributions               |       |        | **77.64**    |

`packages/matching/src/matching.test.ts` contains this example as a test, so the
documented arithmetic is executable.

## Configuration

| Option | Default | Meaning |
| --- | --- | --- |
| `weights` | 0.30 / 0.25 / 0.15 / 0.15 / 0.10 / 0.05 | Any non-negative values; normalized. All zero is rejected. |
| `maxDistanceKm` | 25 | Hard distance limit; also the zero point of the distance score. |
| `averageSpeedKmh` | 25 | Converts distance to travel time. |
| `handlingTimeMinutes` | 10 | Urgency margin deduction. |
| `bufferMinutes` | 15 | Safety margin deduction. |
| `allowPartialClaims` | `true` | When false, a donation must cover all required servings. |

## Limitations

- Categories are opaque case-sensitive strings; the engine does not own the taxonomy.
- Availability only checks whether a volunteer window contains `now`; it does not schedule pickups or search later windows.
- Logistics rewards fitting the recipient's capacity, not minimizing cost or distance.
- The engine never persists claims, mutates servings, certifies food safety, or uses an LLM.
- Urgency thresholds and weights are policy choices; changing them changes scores without changing the input data.
