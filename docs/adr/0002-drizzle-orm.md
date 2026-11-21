# 0002 — Drizzle ORM

Status: Accepted

## Context

The domain has 28 tables with relations, JSON fields, enums and indexes. We
want TypeScript types generated from one schema and SQL migrations that can be
reviewed, without a heavyweight runtime DSL.

## Decision

Define the schema in `packages/database/src`, generate SQL migrations with
`drizzle-kit`, and query through `drizzle-orm/node-postgres`. Apps consume the
schema as a workspace package; only the database package owns migration and
seed scripts.

## Consequences

- Schema changes produce reviewable SQL and a single source of truth for types.
- Raw SQL remains available for expressions such as `version + 1`.
- The app opens the pooled client lazily so builds do not need a database.
- Tests use schema-level assertions rather than a live database; a real Neon
  connection must still be verified by a human before deployment.
