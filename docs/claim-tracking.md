# Claim tracking views

`app/claims/page.tsx` renders one card per claim in the signed-in user's
workspace: donors see claims against their donations, recipients see their own,
and admins see all. The status badge is derived directly from the server's
`Claim.status`; the view never invents a transition.

The next action and the progress highlight come from
`apps/web/src/lib/claims/view-model.ts`, which mirrors the lifecycle in
`apps/web/src/lib/claims/cancellation.ts`. Both views are responsive grids and
use semantic lists, `aria-current="step"` for the active step and a labelled
history `<details>` element.

## Cancellation guard

The cancel button is rendered only when `canCancelClaim` returns true: the
claim must be in `pending`, `confirmed` or `pickup_scheduled`, and the actor
must be the owning recipient, the owning donor or an admin. The button opens a
dialog requiring a non-empty reason and posts to
`POST /api/claims/[id]/cancel`. The server re-checks the role, organization and
state before releasing the reserved quantity, then `router.refresh()` reflects
the authoritative status.
