# AahaarLoop mobile integration

Status: native Expo Router foundation and core API journeys implemented for an authenticated backend session. The app uses the current warm Figma Android language, existing SQLite repositories/outbox, and `StyleSheet`/native `Animated`; it does not alter Web files.

## Architecture

- `apps/mobile/src/app`: Expo Router screens and bottom navigation.
- `apps/mobile/src/components.tsx`, `src/theme.ts`: mobile-only visual system and reusable states.
- `apps/mobile/src/lib/api.ts`: JSON API client with structured errors and idempotency keys.
- `apps/mobile/src/lib/offline.ts`: existing SQLite outbox wired for pending donation requests and retry.
- `apps/mobile/src/context/app-context.tsx`: local donation cache and durable confirmed-claim cache for offline visibility.
- `apps/mobile/src/context/app-context.tsx`: local role/session presentation state and current-session claims.
- Configure `EXPO_PUBLIC_API_URL`; Android emulators should use a reachable host address rather than `localhost`.
- Expo SDK modules now include image picker, foreground location, notifications, and SecureStore. Permissions are requested only from the relevant action; authentication tokens are not stored because the backend has no native token contract.

## API contracts used

- `GET /api/donations` — authenticated; returns `{ donations }`. Donors are scoped to their organization; other roles receive published donations.
- `POST /api/donations` — donor/admin; accepts shared `DonationInputSchema`, returns a draft donation.
- `POST /api/donations/:id/publish` — donor/admin; publishes a valid draft.
- `POST /api/uploads/sign` — donor/admin; signs an 8 MB JPEG/PNG/WebP Cloudinary upload. The mobile app uploads the selected image directly, then sends its `secure_url` as `image_url` when creating the donation.
- `GET /api/donations/:id` — authenticated; returns a published donation or an owned draft.
- `POST /api/claims` — recipient; requires `idempotency-key` and `{ donation_id, recipient_id, servings, note? }`.
- `GET /api/notifications` — authenticated; returns paginated notification data.
- `GET /api/pickups/tasks` — volunteer/admin; pickup tasks.
- `POST /api/pickups/tasks` — recipient/admin; `{ claimId }` creates a pickup task.
- `GET /api/matches` exists for authenticated recipients and uses server-side needs/matching; the current discover screen uses `/api/donations` until a native session and needs contract are available.

The pickup screen reads `GET /api/pickups/tasks` and renders only the server task status; it does not advance a task locally or fabricate delivery state. Notifications are read through `POST /api/notifications/:id/read` after the server confirms the action.

Shared request vocabulary comes from `@aahaarloop/shared`: roles, donation/claim states, units, storage types, allergens and date/location schemas. The local cache uses `apps/mobile/src/data` types and migrations.

## Required backend follow-up

- Native authentication: expose OAuth/PKCE or short-lived access/refresh tokens plus a mobile-safe session endpoint. The current Auth.js browser cookie is not a native login contract, so the profile screen states this limitation instead of pretending to authenticate.
- `GET /api/claims` (scoped to the active organization) and claim detail/status transitions are needed for durable claims and pickup tracking across launches.
- Device registration/push notification endpoint and AI food recognition endpoint are not currently present. The existing Cloudinary signing endpoint is now wired for JPEG/PNG/WebP camera or library images.
- A documented sync mutation/conflict endpoint is needed before queued offline writes can reconcile server versions; current outbox retries the request and marks failures.

## Mobile-owned files

`apps/mobile/**` and this document. Web routes, Web components, shared database code and landing-page files remain outside mobile ownership.
