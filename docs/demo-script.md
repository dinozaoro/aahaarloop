# Demo script (12 minutes)

A repeatable, fully fictional walkthrough for judges. All data lives in the
reserved `.test` domain and the seed uses fixed Bengaluru locations — no real
personal data.

## Before the run (2 min)

```sh
# On the demo database only — never on production.
ALLOW_DB_RESET=true pnpm db:reset
pnpm db:seed
pnpm db:check
```

Then confirm the deployed app is healthy:

```sh
curl https://aahaarloop.vercel.app/api/health/db    # {"ok":true}
curl https://aahaarloop.vercel.app/api/ai/models    # available:false is expected (no credits)
```

Reset and seed are deterministic: fixed IDs, deadlines relative to seed time,
`ON CONFLICT DO NOTHING`. Re-running gives the same story with fresh urgency
windows.

## Roles and screens

| Presenter | Role                                | Screen                           |
| --------- | ----------------------------------- | -------------------------------- |
| A         | Donor (Annapurna Community Kitchen) | `/dashboard`, `/donations/new`   |
| B         | Recipient (Hope Shelter)            | `/browse`, `/claims`             |
| C         | Volunteer (Green Riders Collective) | mobile app, `/volunteer/profile` |

Demo accounts are listed in [demo-data.md](./database/demo-data.md).

## Minute-by-minute

**0:00–1:30 — The problem.** Show the donor dashboard: active donations,
servings rescued, pickups waiting. Message: surplus food has a hard deadline and
today's leftovers need a destination before the end of the day.

**1:30–3:30 — Scenario 1: critical expiry.** Donor posts a new surplus with a
pickup deadline ~2 hours away. Show it appearing at the top of the recipient's
`/browse` with the critical urgency treatment. Say the deadline is the DLC
(food-safety) date, not a marketing hint.

**3:30–5:30 — Scenario 2: partial claim.** Recipient opens that donation and
claims only the servings they can collect. Show the remaining quantity
decreasing rather than the offer disappearing — the rest stays available to
another kitchen.

**5:30–7:30 — Scenario 3: volunteer delivery.** Switch to the mobile app: the
volunteer sees the pickup task, accepts it, and moves it to `in_progress`. On
the web, show the recipient's claim progressing to `pickup_scheduled` and the
delivery timeline on `/claims`.

**7:30–9:00 — Scenario 4: offline resilience.** Turn off the phone's network,
queue a status change, reconnect, and show the sync replaying without creating
a duplicate. If the device is unavailable, narrate the flow and show the
offline fallback page (`/offline.html`).

**9:00–10:30 — Install & reach.** Scan the QR from `apps/mobile/assets/install-qr.png`
to the latest release; show the APK installing and the app opening.

**10:30–12:00 — Close.** Recap: one surplus offer, one partial claim, one
volunteer delivery, no food wasted, no duplicate writes when offline.

## Fallback plan

- **No network:** use the locally seeded app (`pnpm dev`) and a pre-recorded
  screenshot of the deployed health endpoints. The offline fallback page is
  self-contained and needs no network.
- **No Android device:** demo the mobile flow from the web screens and show the
  APK artifact + QR code as proof of packaging.
- **AI features unavailable:** expected — this account has no AI Gateway
  credits. Show `/api/ai/models` returning `available:false` and explain the
  rest of the product does not depend on it. No paid call is attempted.
- **Seed drift:** repeat the reset block above; it takes under a minute.

## Timing target

The full run fits in 12 minutes. Rehearse twice with a timer; if a scenario
runs long, cut Scenario 4 narration first, then the install step.
