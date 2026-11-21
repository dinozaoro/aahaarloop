# Environment configuration

## Status

The repository contains the code and the variable contract only. **No Neon
project, branch, or credentials have been provisioned by this change.** Creating
the Neon project and its development branch is a human action performed in the
Neon console; the resulting connection strings must be distributed through the
team secret manager, never through Git.

## Variables

| Variable              | Required | Owner                            | Consumed by                 | Purpose                                                         |
| --------------------- | -------- | -------------------------------- | --------------------------- | --------------------------------------------------------------- |
| `DATABASE_URL`        | yes      | Developer A (Neon project admin) | web server, `pnpm db:check` | Pooled connection string for runtime queries.                   |
| `DIRECT_URL`          | no\*     | Developer A (Neon project admin) | migration tooling           | Direct connection string for DDL/migrations.                    |
| `NEXT_PUBLIC_APP_URL` | yes      | Developer A                      | web app                     | Canonical URL and OAuth callback base.                          |
| `EXPO_PUBLIC_API_URL` | yes      | Developer A                      | mobile app                  | Base URL for API requests.                                      |
| `AUTH_SECRET`         | yes      | Developer A                      | Auth.js                     | Encrypts session JWTs. Generate with `openssl rand -base64 32`. |
| `AUTH_GOOGLE_ID`      | yes      | Developer A (Google Cloud owner) | Auth.js Google provider     | OAuth client id.                                                |
| `AUTH_GOOGLE_SECRET`  | yes      | Developer A (Google Cloud owner) | Auth.js Google provider     | OAuth client secret.                                            |
| `CLOUDINARY_CLOUD_NAME` | yes    | Developer A                      | web upload signing          | Cloudinary cloud name.                                          |
| `CLOUDINARY_API_KEY`  | yes      | Developer A                      | web upload signing          | Cloudinary API key (server-only).                               |
| `CLOUDINARY_API_SECRET` | yes    | Developer A                      | web upload signing          | Cloudinary API secret (server-only).                            |
| `SIGHTENGINE_API_USER` | no      | Developer A                      | image authenticity          | Optional; absence degrades to `unavailable`.                    |
| `SIGHTENGINE_API_SECRET` | no    | Developer A                      | image authenticity          | Optional; never sent to the client.                             |

\* Required in preview and production where migrations are applied.

Auth.js reads the three `AUTH_*` variables lazily at request time, so builds do
not need them. See [authentication](../authentication.md) for setup and the
OAuth callback URLs.

## Local setup

1. Copy `.env.example` to `.env.local` at the repository root (or export the
   variables in your shell).
2. Ask the Neon project admin for the development branch's pooled and direct
   connection strings and put them in `DATABASE_URL` and `DIRECT_URL`.
3. Verify the connection with a read-only query:

   ```bash
   pnpm db:check
   ```

The script prints only the protocol, host and path of the database — never the
user, password or full connection string. Validation uses `parseEnv` from
`@aahaarloop/shared`, so a missing or malformed variable fails immediately with
a message naming the variable.

`.env`, `.env.*` are ignored by Git; `.env.example` is the sole committed
template and contains placeholders only.

## Preview

Create one Neon branch per preview deployment. Set `DATABASE_URL` to that
branch's pooled string and `DIRECT_URL` to its direct string in the hosting
provider's preview environment settings. Set `NEXT_PUBLIC_APP_URL` and
`EXPO_PUBLIC_API_URL` to the preview URLs. Preview branches must never point at
production data. Give each preview deployment its own `AUTH_SECRET` and Google
OAuth client, and register `https://<preview-host>/api/auth/callback/google` as
an authorized redirect URI.

## Production

Use the Neon production branch with its own pooled and direct strings, stored
in the hosting provider's secret store. Rotate credentials through Neon, not in
the repository. Production and preview credentials must be distinct.

## Adding a variable

Add it to `.env.example` with a placeholder, add it to the relevant Zod schema
in `packages/shared`, document its owner above, and update `parseEnv` tests if
it is required.
