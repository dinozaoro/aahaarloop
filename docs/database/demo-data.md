# Demo data and database commands

The initial migration lives in `packages/database/migrations` and is generated
from the reviewed Drizzle schema with `pnpm --filter @aahaarloop/database
generate`. It is applied with `pnpm db:migrate`.

## Commands

| Command                                       | What it does                                                                  |
| --------------------------------------------- | ----------------------------------------------------------------------------- |
| `pnpm db:check`                               | Read-only connection smoke test (see environment configuration).              |
| `pnpm db:migrate`                             | Applies pending migrations using `DIRECT_URL` (falls back to `DATABASE_URL`). |
| `pnpm db:seed`                                | Inserts deterministic demo data with conflict-safe upserts.                   |
| `pnpm db:reset`                               | Truncates all application tables and reapplies the seed.                      |
| `pnpm --filter @aahaarloop/database generate` | Regenerates a migration after a schema change.                                |

`db:reset` is destructive and refuses to run unless `ALLOW_DB_RESET=true` is
set. It never drops tables or the migration ledger, and it only targets the
database referenced by `DATABASE_URL`. Do not run it against production.

## Demo accounts

All accounts use the reserved `.test` domain and fictional names. No real
personal data is included. Sign-in is handled by Auth.js with Google OAuth;
no passwords are stored in the seed. See [the demo script](../demo-script.md)
for the presenter walkthrough.

| Role      | Email                            | Organization                |
| --------- | -------------------------------- | --------------------------- |
| Donor     | `donor@demo.aahaarloop.test`     | Annapurna Community Kitchen |
| Recipient | `recipient@demo.aahaarloop.test` | Hope Shelter                |
| Volunteer | `volunteer@demo.aahaarloop.test` | Green Riders Collective     |
| Admin     | `admin@demo.aahaarloop.test`     | Annapurna Community Kitchen |

## Seeded content

- Six food categories and six allergens.
- Three verified Bengaluru organizations with coordinates in Indiranagar,
  Koramangala and Jayanagar.
- Four demo users, each a member or owner of an organization.
- Five donations: four published with pickup deadlines 2, 5, 9 and 20 hours
  from seed time (critical/high/medium/low urgency) and one draft.
- Donation items, allergen links, two recipient needs, two claims and a saved
  favorite.

Deadlines are computed relative to the seed time, so re-seeding a demo database
keeps the urgency examples meaningful. Insert identifiers are fixed and all
inserts use `ON CONFLICT DO NOTHING`, making `db:seed` safe to replay.
