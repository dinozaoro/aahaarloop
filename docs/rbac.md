# Role-based access control

Authorization is enforced on the server. Session claims identify the actor, but
every privileged check re-reads organization membership from the database before
allowing a cross-tenant action.

## Roles

| Role        | Can do                                            | Cannot do                         |
| ----------- | ------------------------------------------------- | --------------------------------- |
| `donor`     | Post and edit donations in its own organization   | Edit another org's donations      |
| `recipient` | Claim donations for its own organization          | Claim for another org, admin work |
| `volunteer` | Be assigned pickups                               | Edit donations, admin work        |
| `admin`     | Override donation ownership, read the audit trail | Be self-assigned in onboarding    |

## Server helpers

`apps/web/src/lib/auth/authorization.ts` holds pure predicates. Unit tests cover
each role, cross-organization attempts and IDOR cases.

`apps/web/src/lib/auth/guards.ts` holds the server-side guards:

- `requireUser()` — redirects anonymous visitors to `/signin`.
- `requireRole(roles)` / `requireAdmin()` — redirects users with the wrong role.
- `requireOrgMember(organizationId)` — verifies the membership row in
  `organization_members`, not just the session's `activeOrganizationId`.
- `requireOwnership({ donationId?, organizationId? })` — resolves the donation's
  organization and rejects edits by non-members. Admins may override.
- `requireClaimFor(recipientOrganizationId)` — rejects claims for an org the
  recipient is not a verified member of.
- `forbidUnlessRole(roles)` — returns a `401`/`403` `Response` for route handlers
  or `null` when the request may proceed.

`GET /api/admin/audit` uses `forbidUnlessRole(["admin"])` and returns the latest
50 `audit_logs` entries. Every new privileged route handler must call a guard
before touching data; hiding a link is not authorization.

## Admin bootstrap

There is no admin self-service. To grant an existing signed-in user the admin
role, a maintainer with database access runs:

```sh
ALLOW_ADMIN_BOOTSTRAP=true ADMIN_BOOTSTRAP_EMAIL=user@example.com pnpm db:bootstrap-admin
```

Both the opt-in variable and the email are required. The script refuses to run
without them, leaves non-admin users untouched, is idempotent for existing
admins, and writes an `audit_logs` row with `action: "admin.bootstrap"`,
`actorType: "system"` and the user id. The audit trail can then be read through
the admin-only endpoint above.

shortcut: bootstrap is a maintainer CLI, not a self-service admin UI; add a
reviewed approval workflow before exposing it to non-maintainers.
