# Donation and claim lifecycle

The single source of truth for lifecycle transitions is
[`packages/shared/src/lifecycle.ts`](../packages/shared/src/lifecycle.ts). It
exports the transition tables (`DONATION_TRANSITIONS`, `CLAIM_TRANSITIONS`), the
guard checks, and the two entry points `transitionDonation` and
`transitionClaim`. No other module may decide whether a transition is legal.
The state names come from [`vocabulary.ts`](../packages/shared/src/vocabulary.ts),
and the deadlines from [`dates.ts`](../packages/shared/src/dates.ts).

## Donation states and transitions

| From               | To                 | Allowed actors               | Condition                         |
| ------------------ | ------------------ | ---------------------------- | --------------------------------- |
| `draft`            | `published`        | donor (owner), admin         | —                                 |
| `draft`            | `cancelled`        | donor (owner), admin         | reason required                   |
| `published`        | `claimed`          | donor (owner), admin, system | deadline not passed               |
| `published`        | `cancelled`        | donor (owner), admin         | reason required                   |
| `published`        | `expired`          | system                       | effective deadline passed         |
| `claimed`          | `pickup_scheduled` | donor, volunteer, admin      | deadline not passed               |
| `claimed`          | `cancelled`        | donor (owner), admin         | reason required                   |
| `claimed`          | `expired`          | system                       | effective deadline passed         |
| `pickup_scheduled` | `picked_up`        | volunteer, admin             | deadline not passed               |
| `pickup_scheduled` | `cancelled`        | donor (owner), admin         | reason required; before departure |
| `pickup_scheduled` | `expired`          | system                       | effective deadline passed         |
| `picked_up`        | `delivered`        | volunteer, admin             | —                                 |

`delivered`, `cancelled` and `expired` are terminal. There is no transition back
to `draft`: publishing is the only way out of `draft`.

## Claim states and transitions

| From               | To                 | Allowed actors                  | Condition                             |
| ------------------ | ------------------ | ------------------------------- | ------------------------------------- |
| `pending`          | `confirmed`        | donor (donation owner), admin   | deadline valid, servings <= available |
| `pending`          | `cancelled`        | recipient (owner), donor, admin | reason required                       |
| `pending`          | `expired`          | system                          | donation expired before confirmation  |
| `confirmed`        | `pickup_scheduled` | donor, volunteer, admin         | deadline not passed                   |
| `confirmed`        | `cancelled`        | recipient (owner), donor, admin | reason required                       |
| `pickup_scheduled` | `picked_up`        | volunteer, admin                | deadline not passed                   |
| `pickup_scheduled` | `cancelled`        | recipient (owner), donor, admin | reason required; before departure     |
| `picked_up`        | `delivered`        | volunteer, admin                | —                                     |

A claim starts in `pending`; creation is not a transition. `delivered`,
`cancelled` and `expired` are terminal.

## Guards checked before every transition

1. **Transition** — the pair must exist in the relevant table.
2. **Actor** — the role must be listed, and a donor/recipient must belong to the
   owning organization. `system` is reserved for expiry.
3. **Reason** — every cancellation needs a non-empty, trimmed reason.
4. **Deadline** — `effective_deadline_at = min(food_expiry_at, pickup_deadline_at)`.
   Once it has passed (inclusive), only `expired` and `cancelled` are allowed.
   `best_before_at` is quality metadata and never blocks a transition.
5. **Quantity** — `available_servings` must be a non-negative integer and claim
   `servings` a positive integer; confirming a claim may not take more than is
   available. Confirmation subtracts the claimed servings from
   `available_servings`, so the caller must not subtract them again.

Any failed guard returns `{ ok: false, code, message }` and **no event** is
written. Codes are `invalid_transition`, `unauthorized_actor`,
`reason_required`, `donation_expired`, `invalid_quantity` and `invalid_date`.

## Events

Both entry points require an `appendEvent` callback wired to the append-only
`donation_events` table (see [`database/schema.md`](database/schema.md#claims-pickup-and-events)).
The callback is invoked exactly once, after all guards pass. Each event carries
the actor type and id, the ISO `occurred_at` timestamp, `from_status` /
`to_status`, the reason, and a metadata object. The donation id is always
present; the claim id is present for claim transitions.

An expired donation cannot be claimed normally: a `pending` claim on it cannot
be confirmed, and no regular transition out of its state is permitted. Expiry
is a distinct `system` transition on both the donation and its pending claims,
with the default reason `effective deadline passed`. Cancellation is an
explicit actor action with a caller-supplied reason; it is the only way to stop
an active donation before pickup without using expiry.
