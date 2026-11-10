# Aahaarloop product specification and domain glossary

Status: living document. Owner: Developer B, reviewed by Developer A.
Related issues: #13 (this document), #28 (urgency), #29 (matching), #32 (filters).

## Problem

Bengaluru produces a large surplus of edible food every day while shelters,
community kitchens and low-income households nearby go without. Surplus is
usually destroyed or thrown away because donors cannot tell, in time, who can
collect it before it is unsafe, and recipients cannot tell what is available
right now within their capacity. Aahaarloop closes that gap with a matching
workspace: donors publish surplus in under a minute, recipients state needs and
capacity, volunteers collect, and every match is explainable.

## Vision

Every surplus has a destination.

## Personas

| Persona | Description | Main need |
| --- | --- | --- |
| Donor | Restaurant, hotel, caterer, bakery, canteen or household with surplus | Publish quickly and know the food will be collected before the deadline |
| Recipient organization | Shelter, NGO, community kitchen, orphanage | See what is safe and claimable now, within capacity, storage and dietary constraints |
| Volunteer | Individual or partner courier | Clear pickup tasks with addresses, windows and quantities |
| Admin | Platform operator | Moderate listings and reports, audit privileged actions, tune city configuration |

## User journeys

### Donor

1. Sign in with Google and complete the organization profile.
2. Open the dashboard and start a donation in one click.
3. Step 1: food basics (name, category, quantity, optional photo).
4. Step 2: dates, storage and allergens.
5. Step 3: pickup location and publish.
6. Track claims and pickup progress; cancel with a reason if needed; review history.

### Recipient

1. Sign in and complete the organization profile (address, storage, capacity, constraints).
2. Record active needs (category, quantity, deadline, priority).
3. Open the ranked dashboard or browse and filter all donations.
4. Claim servings (full or partial) when the match is feasible.
5. Follow the claim status until pickup or delivery; cancel if it is still allowed.

### Volunteer

1. Receive or browse pickup tasks.
2. Accept a mission, see the pickup window and route.
3. Mark pickup and delivery, upload proof of delivery.

## Donation lifecycle

```
draft -> published -> claimed -> pickup_scheduled -> picked_up -> delivered
   |         |            |
   +---------+------------+--> cancelled
             |
             +--> expired
```

| Status | Meaning | Visible to recipients |
| --- | --- | --- |
| `draft` | Being prepared by the donor; autosaved, not published. | No |
| `published` | Available for matching and claims. | Yes |
| `claimed` | At least one claim holds the available servings. | Yes, without remaining servings |
| `pickup_scheduled` | A volunteer and window are assigned. | Yes |
| `picked_up` | Collected, in transit. | No (history only) |
| `delivered` | Handed over with proof. | History only |
| `cancelled` | Withdrawn by the donor or an admin, with a reason. | No |
| `expired` | Effective deadline passed before completion. | No |

State transitions are explicit; the publish action is the only way to leave
`draft`, and cancellation always records a reason and an event.

## Claim lifecycle

```
pending -> confirmed -> pickup_scheduled -> picked_up -> delivered
   |          |
   +----------+--> cancelled
   +--> expired
```

| Status | Meaning | Guarded cancel |
| --- | --- | --- |
| `pending` | Created, awaiting donor confirmation. | Yes |
| `confirmed` | Donor accepted the claim. | Yes |
| `pickup_scheduled` | Pickup window assigned. | Yes, until the volunteer departs |
| `picked_up` | Food collected. | No |
| `delivered` | Delivered to the recipient. | No |
| `cancelled` | Cancelled by either side with a reason. | No |
| `expired` | Expired before confirmation. | No |

## Key dates: DLC, DDM and pickup deadline

The three dates are deliberately separate and must never be collapsed into one
field.

| Field | Business meaning | Effect |
| --- | --- | --- |
| `food_expiry_at` (DLC, use-by) | Food-safety limit. The food must not be consumed after it. | Acts as a hard deadline for matching and expiry. |
| `best_before_at` (DDM, best-before) | Quality date. Food remains edible but may lose quality. | Displayed to donors and recipients; excluded from urgency and expiry. |
| `pickup_deadline_at` | Operational limit: the time by which the food must be collected. | Acts as a hard deadline for matching and expiry. |

`effective_deadline_at = min(food_expiry_at, pickup_deadline_at)` over all
donation items. Missing both means the donation is `unknown` and not claimable;
a missing date is never treated as low urgency.

## Urgency

```
remaining_minutes = effective_deadline_at - now - travel_minutes - handling_minutes - buffer_minutes
```

Defaults: travel from distance at 25 km/h, handling 10 minutes, safety buffer 15
minutes. Levels (`remaining_minutes`):

| Range | Level |
| --- | --- |
| > 12 h | `low` |
| 6 h to 12 h inclusive | `medium` |
| 3 h inclusive to < 6 h | `high` |
| > 0 and < 3 h | `critical` |
| deadline <= now | `expired` |
| deadline in future but margin <= 0 | `infeasible` |
| no hard deadline | `unknown` |

`expired`, `infeasible` and `unknown` are not normally claimable. The full
contract lives in `packages/matching/README.md`.

## Matching formula

Hard filters (any failure excludes the donation): time feasibility (`active`),
haversine distance within `max_distance_km`, storage compatibility
(`ambient` < `chilled` < `frozen`), positive remaining servings and enough
servings unless partial claims are allowed, need-category overlap when needs
exist, and claimed weight within transport capacity.

Eligible donations are scored 0-100 per component and combined with normalized
weights (defaults):

| Component | Weight | Score |
| --- | --- | --- |
| Urgency | 0.30 | critical 100, high 75, medium 50, low 25 |
| Distance | 0.25 | linear, 100 at 0 km to 0 at max distance |
| Quantity | 0.15 | claimable servings / required servings |
| Needs | 0.15 | matched needs / listed needs, 100 when none listed |
| Availability | 0.10 | 100 when a volunteer window contains now, else 0 |
| Logistics | 0.05 | claimed weight / transport capacity |

Weights are configurable per city and normalized to sum to 1. Every match
returns a per-component explanation so recipients can see why it ranked where
it did. The engine is deterministic and does not use an LLM.

## Filters

Category, diet (preference), allergen (preference), quantity, distance,
deadline, expiry, storage, packaging, status, urgency, verification, pickup,
delivery, date, time, needs match and fractional servings. Filters combine
with AND. Filter state is stored in the URL so a view is shareable. Diet and
allergen filters are preferences and must be labeled as such.

## Non-goals

- Certifying that food is safe to eat, or replacing local food-safety law.
- Financial transactions between donors and recipients.
- Route optimization beyond a pickup window and an ETA estimate.
- Native payment, advertising or marketplace ranking for money.
- Automatic legal or medical advice on allergens.

## Initial scope: Bengaluru

- City center 12.9716 N, 77.5946 E; default match radius 25 km.
- Timezone Asia/Kolkata; all timestamps stored and compared as UTC instants.
- English UI first; currency and distance in metric units.
- One city configuration (radius, weights, thresholds) at launch, keyed by city.

## Configurable expansion

City, match radius, urgency thresholds, matching weights, allowed categories,
storage levels and verification requirements are configuration, not code.
Adding a city means adding a configuration row and geocoding its addresses; the
scoring formula stays the same. Feature flags gate optional capabilities such
as AI photo suggestions (#23) and Sightengine detection (#24).

## Food-safety and product disclaimers

Aahaarloop helps route surplus; it does not certify safety. Donors remain
responsible for correct storage, labeling and dates. Recipients must apply their
own food-safety judgement. AI suggestions are proposals that a donor must
confirm. Diet and allergen filters are preferences, not guarantees, and the UI
must say so.

## Assumptions and limitations

- Impact statistics shown before launch are demo data and labeled as such.
- Volunteer availability is a declared window, not live GPS tracking.
- Geocoding depends on an external provider; the prototype falls back to a
  curated locality table and must be replaced with a real provider in production.
- Authentication, database persistence and the API are separate issues; until
  then the web prototype uses demo data.
- The matching engine does not persist claims or mutate available servings.
- Proof of delivery is stored as an upload reference, not verified forensically.

## Glossary

| Term | Definition |
| --- | --- |
| Surplus / donation | A set of edible items offered by a donor with dates, storage and a pickup location. |
| Serving | One portion used for quantity matching; donors state total and available servings. |
| Claim | A recipient organization's request for some or all of a donation's servings. |
| Partial claim | A claim for fewer servings than available; the rest stays claimable. |
| DLC | Date limite de consommation (use-by); a food-safety date. |
| DDM | Date de durabilité minimale (best-before); a quality date. |
| Pickup deadline | Latest time the food can be collected. |
| Effective deadline | Earliest of the food expiry and the pickup deadline. |
| Operational margin | Remaining minutes after travel, handling and safety buffer. |
| Urgency | Level derived from the operational margin: low, medium, high, critical. |
| Match | A donation ranked for a recipient by the matching engine, with reasons. |
| Need | A recipient's active requirement: category, quantity, deadline, priority. |
| Capacity | Recipient storage and transport limits used as hard filters. |
| Verification | Admin confirmation that an organization is legitimate; shown in the UI. |
| Handover | The physical transfer from donor to volunteer to recipient. |
| Proof of delivery | Photo or signature reference recorded when the recipient receives food. |
| Expired | The effective deadline passed; the donation is not claimable. |
| Infeasible | Deadline is in the future but travel, handling and buffer consume the margin. |

## Review

Both developers review this document before implementation issues are merged.
Changes to the formula, dates or lifecycle require updating this file in the
same pull request.
