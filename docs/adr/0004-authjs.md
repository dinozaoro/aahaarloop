# 0004 — Auth.js

Status: Accepted

## Context

Google is the identity provider, and the domain needs its own roles and
organization membership. Adding Auth.js adapter tables would duplicate our
`users` and `profiles` model and complicate onboarding.

## Decision

Use Auth.js v5 (`next-auth@beta`) with the Google provider and JWT sessions.
The first sign-in provisions local `users` and `profiles` rows; the JWT carries
the user id, role and active organization. Session refresh re-reads those
claims from the database instead of trusting client-supplied session data.
Admin is never self-assignable; bootstrap is a CLI with an audit entry.

## Consequences

- No adapter tables are needed, but every privileged route must still re-check
  membership because a JWT can be stale.
- `AUTH_SECRET`, `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are required at
  runtime; OAuth callback URLs must be registered per environment.
- Live Google sign-in is a human verification step; tests cover pure onboarding
  helpers and role logic only.
- Joining an organization by slug is a demo shortcut that needs invite tokens
  before production.
