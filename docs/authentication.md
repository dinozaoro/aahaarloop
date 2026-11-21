# Authentication and onboarding

The web app uses Auth.js v5 (`next-auth@beta`) with the Google provider and JWT
sessions. There are no Auth.js adapter tables: the local `users` and `profiles`
rows are written by our own code on first sign-in.

## Status

This change adds the code, tests and variable contract only. **Google OAuth was
not exercised against a live Google project or Neon database here.** A human
must create the OAuth client, set the variables in
[`.env.example`](../.env.example) / [environment configuration](development/environment.md),
and run the manual checks below.

## Configuration

1. In Google Cloud, create an OAuth client of type "Web application".
2. Authorize `http://localhost:3000/api/auth/callback/google` for local use and
   `https://<preview-host>/api/auth/callback/google` for each preview.
3. Set `AUTH_SECRET`, `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` (see environment
   docs). Auth.js infers the provider credentials from the `AUTH_*` names.
4. Apply the schema with `pnpm db:migrate` so first sign-in can write a user.

`trustHost: true` lets Auth.js accept preview proxy hosts. Keep the app behind a
trusted proxy and set `NEXT_PUBLIC_APP_URL` to the canonical URL.

## Flow

1. `/signin` posts to the `signIn("google", { redirectTo: "/onboarding" })`
   server action. The route handler lives at `/api/auth/[...nextauth]`.
2. On first sign-in, the `jwt` callback provisions a `users` row and a
   `profiles` row from Google's email, name and avatar, then stores our user id,
   role and active organization in the JWT. Inserts are conflict-safe.
3. The `session` callback exposes `session.user.id`, `role`,
   `activeOrganizationId` and `needsOnboarding` (true until an organization is
   set).
4. `/onboarding` requires a session, lets the user pick donor, recipient or
   volunteer and create or join an organization, then refreshes the JWT with
   `unstable_update`. The refresh re-reads the role and organization from the
   database, so client-supplied session data is never trusted.
5. `signOut()` clears the JWT.

The admin role exists in the schema and in stored sessions but is **never**
offered in onboarding: `parseOnboardingRole` rejects it. Admin assignment is an
existing-admin action, not a self-service choice.

New users are stored with the non-admin `donor` role until onboarding completes;
joining or creating an organization is what marks the account as set up.

## Protected routes

```ts
import { requireRole, requireUser } from "@/lib/auth/guards";

export default async function Page() {
  const user = await requireUser(); // redirect("/signin") when anonymous
  // const admin = await requireRole(["admin"]); // redirect("/dashboard") otherwise
}
```

`/onboarding` uses the guard today. Apply the same helper to any other route
that must not be public. The prototype demo pages remain explorable without a
session; they are not protected.

shortcut: joining an organization by public slug has no invite token, so any
signed-in user can join any organization; replace with invite tokens before
production.

## Manual checks for a human

- Sign in with a Google test account; confirm a `users` and `profiles` row is
  created once and reused on a second sign-in.
- Confirm onboarding forces a role choice, rejects `admin`, and sets an active
  organization that appears in the session and JWT.
- Sign out and back in; confirm the role and organization persist.
- Cancel Google consent and use a wrong callback URL; confirm Auth.js returns a
  clear error rather than creating a partial user.
