# Web integration

## Architecture and ownership

The Web client lives in `apps/web` and uses Next.js App Router, React, TypeScript, Tailwind CSS, Auth.js and server-side Drizzle. It does not connect to PostgreSQL from the browser. Domain state is read and written in Postgres through the server-only DAL at `apps/web/src/lib/data/dal.ts`, which maps Drizzle rows to the existing domain types. Repository adapters are async, server pages await DAL reads, and client UI calls HTTP routes (then refreshes the route). Web owns `apps/web`; Android and shared backend packages remain separately owned.

## Shared API

Auth.js Google sign-in is available at `/api/auth/[...nextauth]`. The shared Web API currently provides:

| Capability | Routes | Authentication |
| --- | --- | --- |
| Donations | `GET/POST /api/donations`, `GET/PATCH /api/donations/:id`, `POST /api/donations/:id/publish` | Signed-in user; writes require the donor role. |
| Claims | `GET/POST /api/claims`, `POST /api/claims/:id/cancel` | Signed-in recipient for claims; donors can read their own claims. Creates require the recipient role, a matching active organization and an `idempotency-key`. |
| Matches | `GET /api/matches` | Signed-in recipient with an active organization. |
| Needs | `GET/POST/PATCH/DELETE /api/needs` | Signed-in recipient with an active organization. |
| Notifications | `GET /api/notifications`, `POST /api/notifications/:id/read`, `POST /api/notifications/read-all`, `GET/PATCH /api/notifications/preferences` | Signed-in user. |
| Pickups | `GET/POST /api/pickups/tasks`, `POST /api/pickups/tasks/:id/assign`, `POST /api/pickups/tasks/:id/complete` | Volunteer, recipient or admin according to the operation. |
| Profile | `GET/PATCH /api/profile` | Signed-in user; the submitted role must match the session role. |
| Session | `GET /api/me` | Signed-in user; returns role and active organization. |
| Food images | `POST /api/uploads/sign` | Signed-in donor; returns a signed upload configuration. |

Request schemas and response behavior are implemented beside each route and in `packages/shared`. Response envelopes are unchanged: `{ donations }` for donation lists, `{ data, total, unread }` for notifications and `{ tasks }` for pickup tasks. Reuse those contracts; do not call the database from client components.

## Current UI status

The landing page, discovery, donation details, donor and recipient workspaces, donation forms, impact, profile and settings use the current warm editorial design. Server pages now read Postgres through the DAL (`apps/web/src/lib/data/store.ts` is a thin async façade), so the seeded rows — five donations, two needs, two claims and one pickup task — appear in the UI and in mobile responses without a separate hydration step. The donation wizard, claim action, recipient needs editor, profile editor, notification bell and favorites now call the API; pickup tasks are read from Postgres in server pages. The mobile claims screen syncs from `GET /api/claims` when opened. Image upload signing remains a separate authenticated request.

A newly onboarded organization has no seeded donations: the seed donations belong to the seeded donor organization and the seed claims to the seeded recipient organization. Claim tests should use the seeded recipient organization; the browse list is visible to any signed-in user.

Impact uses completed seeded handovers. Meal counts are estimated at 0.3 kg per meal, rounded, and labeled as estimates. The landing page’s large sample metrics are illustrative and labeled; they are not live impact data. The map is a labeled schematic using seeded coordinates, not a live map provider.

## Integration constraints

- Google OAuth manages authentication; AahaarLoop does not store a separate password.
- Role-sensitive API calls require an active organization and server-side authorization.
- Claim creation requires the `recipient` role, a `recipient_id` equal to `session.user.activeOrganizationId`, and an `idempotency-key` header with `donation_id` and `servings`. The web and mobile clients both send the header; `claims.idempotency_key` is unique in Postgres, so duplicates are rejected across workers even though the claim lock is still in-process.
- Donation mutations use the shared `DonationInputSchema`; the wizard creates with `POST /api/donations` and then calls `POST /api/donations/{id}/publish`. Image signing is a separate authenticated request.
- Favorites are user-scoped: the schema has no organization column, so the active organization is ignored by the adapter.
- Migration `packages/database/migrations/0001_lucky_speed.sql` (claims idempotency key plus notification preferences) is generated but **not applied**. An operator must run the migrations before using the app.
- Moderation reports, admin config, telemetry and the in-process idempotency replay cache remain in memory; only domain state lives in Postgres.

## Web-owned files

All page, component, styling, navigation, font and Web integration files under `apps/web` are Web-owned. `WEB_INTEGRATION.md` records the shared API boundary and current UI integration status.
