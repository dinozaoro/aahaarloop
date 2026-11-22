# 0009 — AI providers

Status: Proposed

## Context

Donors type less when a photo can suggest a name and category, but a wrong
suggestion could mislead recipients. A separate authenticity signal helps
admins spot AI-generated images. Provider APIs and models change often.

## Decision

Keep AI work in `packages/food-recognition` behind the
`FoodRecognitionProvider` and `SightengineClient` interfaces. Suggestions are
stored as proposals that a donor must confirm; authenticity is a signal that
never blocks publishing. Secrets stay server-side and are never sent to
callers. No live provider is configured in this repository.

## Consequences

- Tests inject fake clients, so the package is verified without live APIs.
- Timeouts, rate limits and a failed analysis degrade to `failed` or
  `unavailable` and publishing continues.
- Adding a provider means implementing the interface, not rewriting UI flows.
- Provider credentials, model versions and cost limits need human setup and
  review before production use.
