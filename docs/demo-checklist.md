# Final demo checklist and judging map

Companion to [the demo script](./demo-script.md). Run this twice with a timer
before the final presentation. A blank box means "not yet verified" — do not
assume it works because it worked once.

## Rehearsal record

| Run | Date | Duration | Scenario skipped? | Notes |
| --- | ---- | -------- | ----------------- | ----- |
| 1   | —    | —        | —                 | —     |
| 2   | —    | —        | —                 | —     |

Target: **12 minutes or less**. If a run exceeds 14 minutes, cut Scenario 4
first, then the install step ([demo script](./demo-script.md)).

## Path verification

- [ ] Reset + seed from a clean database; app loads within a minute.
- [ ] Donor dashboard shows the seeded active donations and deadlines.
- [ ] Donor posts a new surplus with a 2-hour deadline → critical urgency visible.
- [ ] Recipient claims part of it → remaining servings decrease, offer stays listed.
- [ ] Volunteer accepts the pickup on the mobile app → claim becomes `pickup_scheduled`.
- [ ] Delivery timeline reflects the status change on the web.
- [ ] Offline: a queued change replays on reconnect without duplication.
- [ ] Offline: `/offline.html` is self-contained and readable with no network.
- [ ] QR code scans to the latest GitHub Release and the APK installs on Android.
- [ ] `/api/health/db` returns `{"ok":true}` on the deployed app.
- [ ] `/api/ai/models` returns `available:false` gracefully (no credits; no paid call).
- [ ] Google sign-in reaches onboarding with the correct role.
- [ ] Cloudinary upload succeeds from the donation form.

## Judging criteria map

| Moment of the demo      | What the judge sees                       | Criterion served                   |
| ----------------------- | ----------------------------------------- | ---------------------------------- |
| 0:00 Problem framing    | Hard deadlines, surplus going to waste    | Problem significance, empathy      |
| 1:30 Critical expiry    | Urgency computed from DLC/pickup deadline | Domain correctness, food safety    |
| 3:30 Partial claim      | Same offer serves more than one kitchen   | Product depth, resource efficiency |
| 5:30 Volunteer delivery | Web + mobile stay in sync                 | System integration, role design    |
| 7:30 Offline replay     | No duplicate writes after reconnect       | Reliability, offline engineering   |
| 9:00 QR + APK           | Installable field tool, not a mockup      | Deliverability, mobile execution   |
| 10:30 Close             | Meals rescued, no silent data loss        | Impact, clarity of storytelling    |

## Fallback verification

- [ ] Network down → local seeded app + captured health-endpoint output.
- [ ] No Android device → web screens + APK artifact and QR as packaging proof.
- [ ] AI unavailable → explain it is intentionally off, no paid call attempted; the rest of the product is unaffected.
- [ ] Seed drift → repeat `ALLOW_DB_RESET=true pnpm db:reset && pnpm db:seed`.
- [ ] Presenter A absent → presenter B takes the donor screen; script is screen-based, not person-based.

## Roles and screens

| Presenter | Role      | Screens                          |
| --------- | --------- | -------------------------------- |
| A         | Donor     | `/dashboard`, `/donations/new`   |
| B         | Recipient | `/browse`, `/claims`             |
| C         | Volunteer | mobile app, `/volunteer/profile` |

## Sign-off

The issue requires both developers to sign off. This file intentionally leaves
the signatures blank so they are filled by a human after the rehearsal.

- [ ] Developer 1 (ItokianaRAKT): ____________________ date: __________
- [ ] Developer 2 (fatratra-png): ____________________ date: __________
