# Reports and moderation

Users can report unsafe or fraudulent donations and users. Reports require one
of the reasons in `REPORT_REASONS` (`unsafe_food`, `fraudulent`, `spam`,
`inappropriate`, `other`) and an optional detail note.

## Flow

- `POST /api/reports` creates a report for the signed-in reporter.
- `GET /api/reports` lists the reporter's own reports.
- `GET /api/admin/reports` lists all reports for admins, including AI signals.
- `POST /api/admin/reports/[id]/resolve` and `.../dismiss` decide an open report.
  Only admins may call these; the service also re-checks the actor role, and
  decided reports cannot be changed again.

Each decision is written through `ModerationAudit` with the admin actor id,
action (`report.resolved` / `report.dismissed`), entity id and resulting status.
The audit writer passes values through the shared redaction logic, so no
credentials can leak into the trail.

## AI authenticity signals

When a report targets a donation, the server attaches an `AiAnalysis` snapshot
from an injectable `SignalSource` (the Sightengine integration in
`packages/food-recognition`). Submitters cannot supply their own signals.
`toReportView` strips `imageAuthenticity` (and its score) from every copy that
is not for `viewer === "admin"`. Reporters and the public never receive the
authenticity field. The structural `AiAnalysis` type mirrors the Sightengine
analysis stored by `packages/food-recognition` without adding a cross-package
dependency to the web app.

The demo `SignalSource` in `store-repository.ts` returns a deterministic
`suspicious` snapshot so the admin queue can be exercised; production replaces
it with a lookup of the stored analysis for the reported image.
