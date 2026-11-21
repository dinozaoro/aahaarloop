# Web integration

## Architecture and ownership

The Web client lives in `apps/web` and uses Next.js App Router, React, TypeScript, Tailwind CSS, Auth.js and server-side Drizzle. It does not connect to PostgreSQL from the browser. Web owns `apps/web`; Android and shared backend packages remain separately owned.

## Shared API

Auth.js Google sign-in is available at `/api/auth/[...nextauth]`. The shared Web API currently provides:

| Capability | Routes | Authentication |
| --- | --- | --- |
| Donations | `GET/POST /api/donations`, `GET/PATCH /api/donations/:id`, `POST /api/donations/:id/publish` | Signed-in user; writes require the donor role. |
| Claims | `GET/POST /api/claims`, `POST /api/claims/:id/cancel` | Signed-in recipient for claims; donors can read their own claims. Creates require an `idempotency-key`. |
| Matches | `GET /api/matches` | Signed-in recipient with an active organization. |
| Notifications | `GET /api/notifications`, `POST /api/notifications/:id/read`, `POST /api/notifications/read-all`, `GET/PATCH /api/notifications/preferences` | Signed-in user. |
| Pickups | `GET/POST /api/pickups/tasks`, `POST /api/pickups/tasks/:id/assign`, `POST /api/pickups/tasks/:id/complete` | Volunteer, recipient or admin according to the operation. |
| Food images | `POST /api/uploads/sign` | Signed-in donor; returns a signed upload configuration. |

Request schemas and response behavior are implemented beside each route and in `packages/shared`. Reuse those contracts; do not call the database from client components.

## Current UI status

The landing page, discovery, donation details, donor and recipient workspaces, donation forms, impact, profile and settings use the current warm editorial design. Most screens still read the seeded preview store in `apps/web/src/lib/data/store.ts`; those values reset with the server process and are not shared production records. Although the API routes above exist, the redesigned discovery claim action, donation image upload, notification preferences and live pickup workflow are not yet connected to them. They are presented as unavailable where the interface cannot complete the action.

Impact uses completed seeded handovers. Meal counts are estimated at 0.3 kg per meal, rounded, and labeled as estimates. The landing page’s large sample metrics are illustrative and labeled; they are not live impact data. The map is a labeled schematic using seeded coordinates, not a live map provider.

## Integration constraints

- Google OAuth manages authentication; AahaarLoop does not store a separate password.
- Role-sensitive API calls require an active organization and server-side authorization.
- Claim creation must send `donation_id`, `recipient_id`, `servings`, and an `idempotency-key` header. Duplicate claims and unavailable donations are handled by the API.
- Donation mutations use the shared `DonationInputSchema`; image signing is a separate authenticated request.
- Notification and pickup APIs must be connected before showing saved preferences, assignments or live tracking as complete.

## Web-owned files

All page, component, styling, navigation, font and Web integration files under `apps/web` are Web-owned. `WEB_INTEGRATION.md` records the shared API boundary and current UI integration status.
