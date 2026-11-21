# Admin dashboard

`/admin` is rendered only for users with the `admin` role (`requireAdmin()`).
It provides searchable, paginated tables over five resources: users,
organizations, donations, claims and missions. Each API route independently
re-checks the role with `forbidUnlessRole(["admin"])`, so the guard is enforced
on the server, not just in the page.

## Layout

- `apps/web/src/lib/admin/data.ts` — pure search + pagination helpers and the
  allowed resource list.
- `apps/web/src/lib/admin/data-source.ts` — aggregates the demo stores into flat,
  display-ready rows.
- `GET /api/admin/[resource]` — paginated, searchable list.
- `GET /api/admin/[resource]/[id]` — single record detail.
- `POST /api/admin/actions` — audited moderation actions.

## Moderation actions

Two actions are available: `unpublish_donation` (returns a published donation
to `draft`) and `verify_organization`. Both are validated against the target
entity type, applied through `applyAdminAction`, and recorded via `recordAudit`
with the admin actor id. An unavailable audit backend is logged and does not
roll back a committed action; the action itself is always auditable in the
request path.

## Demo persistence

The tables read the in-memory demo store, which resets on server restart. The
admin APIs are the seam where a database-backed repository replaces the demo
store; the search/pagination and guard contracts stay unchanged.
