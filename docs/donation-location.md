# Donation pickup location and publish

Step 3 of the donation flow lives at `/donations/new/location`. It collects an
exact pickup point, contact details and reviewable instructions, then publishes
the donation only when the whole draft is complete.

## Fields and validation

| Field               | Rule                                                     |
| ------------------- | -------------------------------------------------------- |
| Street address      | Required, 3–160 characters                               |
| Locality            | Must be chosen from the Bengaluru address search results |
| Map pin             | Must be placed before saving or publishing               |
| Contact name        | Required, at least 2 characters                          |
| Contact phone       | Required, digits with optional `+`, spaces or hyphens    |
| Pickup instructions | Optional, at most 300 characters                         |
| Fractional toggle   | Explains that a recipient may claim part of the donation |

A pin cannot be placed until a locality is selected, so the saved latitude and
longitude always come from a curated Bengaluru locality rather than arbitrary
input. `apps/web/test/donation-location.test.mjs` covers a complete publish, a
missing pin, a missing address, unknown localities and invalid contact details.

## Review and publish

The review card shows every field from [step 2](donation-dates.md) and step 3:
all three dates, the effective deadline, storage, packaging, allergens, dietary
flags, address, pin coordinates, contact, instructions and the fractional
setting. Publishing is blocked when step 2 or step 3 is incomplete; a successful
publish flips the draft to `published` with a timestamp and shows an
"Available to recipients" status.

The pure helpers in `apps/web/src/lib/donations` keep validation testable:

- `draft.ts` — the `sessionStorage` draft contract and safe read/write helpers.
- `location.ts` — Bengaluru address search, pickup validation and publishing.

shortcut: address search uses a fixed list of Bengaluru localities and the map
pin is a coordinate from that list, not a live geocoding or map SDK; integrate a
map provider before asking donors for precise, real-world pins.
