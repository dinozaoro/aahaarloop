# API reference

Base URL: `https://aahaarloop.vercel.app/api` (local: `http://localhost:3000/api`).
All bodies and responses are JSON. Route handlers run on the Node.js runtime.

## Conventions

- **Auth**: Auth.js session cookie. Unauthenticated calls to protected routes return `401`; wrong role returns `403`.
- **Errors**: `{ "error": { "code": "...", "message": "...", "request_id": "...", "details": ... } }`.
  Codes: `validation_error` (400), `unauthorized` (401), `forbidden` (403), `not_found` (404), `conflict` (409), `rate_limited` (429), `internal_error` (500). See [API foundation](./api-foundation.md).
- **Idempotency**: mutations that accept an idempotency key read the `idempotency-key` header; replaying the same key returns the stored response.
- **CSRF**: unsafe methods from a cross-origin request are rejected.
- **Pagination**: list endpoints accept `page` and `pageSize` query parameters where documented.

## Routes

| Method   | Path                             | Auth              | Purpose                                                                  |
| -------- | -------------------------------- | ----------------- | ------------------------------------------------------------------------ |
| GET      | `/donations`                     | session           | List published donations with filters and pagination.                    |
| POST     | `/donations`                     | donor             | Create a donation draft.                                                 |
| GET      | `/donations/[id]`                | session           | Read one donation.                                                       |
| PATCH    | `/donations/[id]`                | donor (owner)     | Update a donation.                                                       |
| POST     | `/donations/[id]/publish`        | donor (owner)     | Publish a draft.                                                         |
| POST     | `/claims`                        | recipient         | Create a claim; enforces quantity and one active claim per donation/org. |
| POST     | `/claims/[id]/cancel`            | recipient (owner) | Cancel a claim and release quantity.                                     |
| POST     | `/claims/expire`                 | admin             | Expire stale claims.                                                     |
| GET      | `/matches`                       | recipient         | Rank donations for the caller's organization.                            |
| GET      | `/favorites`                     | recipient         | List saved donations.                                                    |
| POST     | `/favorites`                     | recipient         | Save or unsave a published donation.                                     |
| GET      | `/notifications`                 | session           | List notifications for the caller.                                       |
| POST     | `/notifications/[id]/read`       | session           | Mark one notification read.                                              |
| POST     | `/notifications/read-all`        | session           | Mark all notifications read.                                             |
| GET      | `/notifications/preferences`     | session           | Read notification preferences.                                           |
| PATCH    | `/notifications/preferences`     | session           | Update notification preferences.                                         |
| GET      | `/pickups/tasks`                 | volunteer/admin   | List pickup tasks.                                                       |
| POST     | `/pickups/tasks`                 | admin             | Create a pickup task.                                                    |
| POST     | `/pickups/tasks/[id]/assign`     | admin             | Assign a volunteer to a task.                                            |
| POST     | `/pickups/tasks/[id]/complete`   | volunteer/admin   | Complete a task and record proof.                                        |
| POST     | `/reports`                       | session           | Submit a moderation report.                                              |
| GET      | `/reports`                       | admin             | List reports.                                                            |
| POST     | `/admin/reports/[id]/[decision]` | admin             | Resolve a report.                                                        |
| GET      | `/admin/reports`                 | admin             | Admin view of reports.                                                   |
| GET      | `/admin/config`                  | admin             | Read city/threshold/weight configuration.                                |
| PATCH    | `/admin/config`                  | admin             | Update configuration.                                                    |
| GET      | `/admin/[resource]`              | admin             | Generic admin resource list.                                             |
| GET      | `/admin/[resource]/[id]`         | admin             | Generic admin resource read.                                             |
| POST     | `/admin/actions`                 | admin             | Run an administrative action.                                            |
| GET      | `/admin/audit`                   | admin             | Query the privileged-action audit log.                                   |
| POST     | `/uploads/sign`                  | donor             | Sign a Cloudinary direct upload (server secret never leaves the server). |
| GET/POST | `/auth/[...nextauth]`            | public            | Auth.js session, sign-in and callback endpoints.                         |
| GET      | `/health/db`                     | public            | Read-only Neon connectivity probe: `select 1`.                           |
| GET      | `/ai/models`                     | public            | Free AI Gateway status; never makes a paid inference call.               |

## Examples

### Create and publish a donation

```sh
curl -X POST http://localhost:3000/api/donations \
  -H 'content-type: application/json' \
  -H 'idempotency-key: 11111111-1111-4111-8111-111111111111' \
  -d '{
    "title": "Vegetable biryani",
    "description": "Cooked this morning",
    "items": [{ "name": "Biryani", "category": "meals", "quantity": 20, "unit": "serving", "storage": "chilled" }],
    "total_servings": 20,
    "food_expiry_at": "2026-11-23T10:00:00Z",
    "pickup_deadline_at": "2026-11-22T18:00:00Z",
    "pickup_location": { "address": "12 Main Street, Indiranagar", "point": { "latitude": 12.97, "longitude": 77.64 } }
  }'

curl -X POST http://localhost:3000/api/donations/<id>/publish
```

### Claim part of a donation

```sh
curl -X POST http://localhost:3000/api/claims \
  -H 'content-type: application/json' \
  -H 'idempotency-key: 22222222-2222-4222-8222-222222222222' \
  -d '{"donation_id":"<id>","recipient_id":"<org-id>","servings":5}'
```

### Check the paired services

```sh
curl https://aahaarloop.vercel.app/api/health/db     # {"ok":true}
curl https://aahaarloop.vercel.app/api/ai/models     # available:false when the account has no AI credits
```

## Setup from a clean clone

1. Node from `.nvmrc`, pnpm 9 (`packageManager` in `package.json`).
2. `pnpm install --frozen-lockfile`.
3. Copy `.env.example` to `.env.local` and fill the variables listed in [environment configuration](./development/environment.md).
4. `pnpm db:check`, `pnpm db:migrate`, `pnpm db:seed` (see [demo data](./database/demo-data.md)).
5. `pnpm lint && pnpm typecheck && pnpm test && pnpm --filter @aahaarloop/web dev`.

Keep preview environments on their own Neon branch and their own `AUTH_SECRET`; never point a preview at production data.
