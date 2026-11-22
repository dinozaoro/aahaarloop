# Donation dates, storage and allergens

Step 2 of the donation flow lives at `/donations/new/dates`. It uses
`datetime-local` inputs and an explicit IANA time zone (`Asia/Kolkata`, the
Bengaluru demo zone) before storing UTC ISO timestamps.

## The three dates

| Input             | Meaning                          | Validation                         |
| ----------------- | -------------------------------- | ---------------------------------- |
| Use-by (DLC)      | Food-safety deadline             | Required and must be in the future |
| Best-before (DDM) | Quality hint, not a safety limit | Optional; a past date is a warning |
| Pickup deadline   | Operational collection cutoff    | Required and must be in the future |

The effective deadline is `min(use-by, pickup deadline)`; best-before never
feeds urgency or expiry. Past use-by and pickup times are blocked, while a past
best-before date is shown as a warning and can still be saved.

The pure helpers in `apps/web/src/lib/donations/dates.ts` handle timezone
conversion, DST boundaries, multi-select validation and the effective deadline.
`apps/web/test/donation-dates.test.mjs` covers midnight boundaries, DST
transitions, past/current/future dates and duplicate selections.

Storage is limited to ambient, chilled or frozen. Allergens and dietary flags
are multi-select checkboxes; unknown values are rejected by the validator.

shortcut: the draft stays in client state until the persistence issue lands, so
navigating away discards step 2; wire it to the donation store when step 3 is
implemented.
