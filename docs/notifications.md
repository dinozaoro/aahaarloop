# In-app notifications

Notifications are stored per user and surfaced by a bell in the site header.
The demo store is in memory; the `notifications` table in
`packages/database/src/claims.ts` is the production persistence target.

## Triggers

`apps/web/src/lib/notifications/triggers.ts` defines one builder per domain
event: `claim_created`, `claim_cancelled`, `claim_expired`, `pickup_assigned`,
`pickup_completed`, `delivered` and `deadline_approaching`. Each builder returns
a single `NotifyInput` with a stable `entityId`, which is the basis for
suppression.

## Read state and preferences

- A notification is unread until `POST /api/notifications/[id]/read` (or
  `POST /api/notifications/read-all`) is called by its owner. Cross-user reads
  are rejected.
- `GET/PATCH /api/notifications/preferences` controls the delivery channel
  (`in_app`, `email`, `push`) and per-type enablement. In-app storage always
  happens; the channel selects an optional out-of-band adapter.
- `NotificationAdapter` (`send(notification): Promise<void>`) is the interface
  an email or push provider implements. No provider is bundled.

## Duplicate suppression

`createNotificationService` skips a notification when the same
`(type, entityId, userId)` key was created within `dedupeWindowMs` (10 minutes
by default). The window is injectable for tests.

## Retention

Notifications follow the same retention as their parent claim/donation. The
append-only audit log (`docs/lifecycle.md`) remains the security record;
notifications are convenience state and may be pruned with the parent entity.
