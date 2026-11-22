# Admin configuration

Admins can change operational configuration at `/admin/config` without a
deploy. `GET/PATCH /api/admin/config` is admin-guarded; PATCH accepts a partial
body and returns the validated full config plus a monotonically increasing
`version`.

## Defaults

| Setting | Default | Meaning |
| --- | --- | --- |
| `city` | `Bengaluru` | Operating city shown to donors and recipients |
| `donorSegment` | `all` | Donor segment the current campaign targets |
| `safetyBufferMinutes` | `15` | Logistics buffer subtracted from urgency |
| `urgencyThresholds.criticalHours` | `3` | Below this remains → critical |
| `urgencyThresholds.highHours` | `6` | Below this remains → high |
| `urgencyThresholds.mediumHours` | `12` | Below this remains → medium, above → low |
| `matchingWeights.*` | engine defaults | urgency 0.30, distance 0.25, quantity 0.15, needs 0.15, availability 0.10, logistics 0.05 |

## Validation

`validateAdminConfig` rejects empty `city`/`donorSegment`, a negative safety
buffer, non-finite or negative weights, a zero-sum weight set, and thresholds
that are not `0 < criticalHours < highHours < mediumHours`. Shape validation
happens in the route with zod; cross-field rules are enforced in the shared
validator so direct callers are also safe. Invalid updates leave the current
config and version unchanged.

## How consumers read it

- Matching: `toMatchingConfig()` maps the admin config into the matching
  engine's `MatchingConfig` (weights, buffer and urgency thresholds);
  `rankMatches` passes it to `matchDonationsForRecipient`.
- Urgency: `donationUrgency()` reads the configured buffer and thresholds.
- Cache invalidation: `onConfigChange` clears the matches cache and the config
  version is part of every cache key, so a changed weight or threshold is
  reflected on the next request.

The store is in-memory and resets on restart; the module is the seam where a
persisted configuration repository replaces it without changing consumers.
