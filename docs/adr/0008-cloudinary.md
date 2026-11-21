# 0008 — Cloudinary

Status: Proposed

## Context

Donations need photos for matching and AI suggestions. Storing images in the
database would bloat backups, and serving them from app servers would leak
implementation details.

## Decision

Use Cloudinary as the image host when uploads are integrated. The
`donation_images` table already stores a public `url` and a
`provider_public_id`; upload signing and deletion must remain server-side.

## Consequences

- No upload SDK or credential is present yet, so no live uploads are claimed.
- Signed uploads avoid exposing the API secret, but need an expiry and a
  donation id in the signature payload.
- Provider public ids let us delete images when a donation is removed.
- Accessibility still requires donor-supplied alt text or generated labels
  reviewed by the donor.
