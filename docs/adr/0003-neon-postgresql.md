# 0003 — Neon PostgreSQL

Status: Accepted (target)

## Context

The platform needs a managed Postgres with separate development and production
branches, pooled runtime connections and a direct connection for migrations.
No database project has been provisioned by this repository.

## Decision

Use Neon PostgreSQL. `DATABASE_URL` is the pooled runtime string;
`DIRECT_URL` is optional locally and used by migrations in hosted
environments. Connection strings are validated by `databaseEnvSchema` and kept
out of Git; owners and setup steps are in
[environment configuration](../development/environment.md).

## Consequences

- Preview environments can point at a development branch without touching
  production data.
- A human must create the Neon project, distribute credentials and run
  `pnpm db:migrate` before the app has persistent data.
- The repository only proves the code and contract: `pnpm db:check` redacts
  credentials and does not claim a live connection.
- Applications must tolerate connection failures at request time because the
  client is created lazily.
