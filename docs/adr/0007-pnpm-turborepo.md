# 0007 — pnpm and Turborepo

Status: Accepted

## Context

Two apps and several packages share TypeScript, lint and formatting settings.
Installs and checks must be reproducible locally and in CI without duplicated
configuration.

## Decision

Use pnpm workspaces with a frozen lockfile and Turborepo for `build`, `lint`,
`typecheck` and `test`. Shared presets live in `packages/config`; root scripts
are the single CI entry point, and GitHub Actions caches the pnpm store.

## Consequences

- One install and one set of root commands drive every package and CI job.
- Lockfile changes are reviewable and CI fails on drift with
  `--frozen-lockfile`.
- Tasks depend on upstream builds, so a broken package blocks downstream work.
- Mobile builds are intentionally a stub in this workspace; EAS remains
  outside the root `build` task.
