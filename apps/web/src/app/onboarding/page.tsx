import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireUser } from "@/lib/auth/guards";
import { SELF_ASSIGNABLE_ROLES } from "@/lib/auth/onboarding";
import type { Metadata } from "next";
import Link from "next/link";

import { completeOnboarding } from "./actions";

export const metadata: Metadata = {
  title: "Set up your account",
  alternates: { canonical: "/onboarding" },
};

const ERRORS: Record<string, string> = {
  "invalid-role": "Choose donor, recipient or volunteer.",
  "invalid-mode": "Choose whether to create or join an organization.",
  "invalid-name": "Organization name must be 2 to 120 characters.",
  "invalid-slug": "Enter a valid organization slug.",
  "not-found": "No organization has that slug. Check it or create one.",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { error } = await searchParams;
  const message = error
    ? (ERRORS[error] ?? "Please check your details.")
    : null;

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-16 sm:px-6"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Set up your account
        </h1>
        <p className="text-muted-foreground">
          Signed in as {user.email}. Choose your role and an organization to
          finish setting up Aahaarloop.
        </p>
        {user.needsOnboarding ? null : (
          <p className="text-sm text-muted-foreground">
            Your account is already set up. You can update it below or{" "}
            <Link className="underline" href="/dashboard">
              go to your dashboard
            </Link>
            .
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your role</CardTitle>
          <CardDescription>
            Admins are assigned by an existing admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={completeOnboarding} className="flex flex-col gap-8">
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-2 text-sm font-medium">I am a…</legend>
              {SELF_ASSIGNABLE_ROLES.map((role) => (
                <div key={role} className="flex items-center gap-3">
                  <input
                    type="radio"
                    id={`role-${role}`}
                    name="role"
                    value={role}
                    defaultChecked={user.role === role}
                    required
                  />
                  <Label htmlFor={`role-${role}`} className="capitalize">
                    {role}
                  </Label>
                </div>
              ))}
            </fieldset>

            <fieldset className="flex flex-col gap-3">
              <legend className="mb-2 text-sm font-medium">Organization</legend>
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="org-create"
                  name="orgMode"
                  value="create"
                  defaultChecked
                />
                <Label htmlFor="org-create">Create a new organization</Label>
              </div>
              <div className="flex items-center gap-3">
                <input type="radio" id="org-join" name="orgMode" value="join" />
                <Label htmlFor="org-join">Join an existing organization</Label>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="orgName">Organization name</Label>
                <Input
                  id="orgName"
                  name="orgName"
                  placeholder="Hope Shelter"
                  minLength={2}
                  maxLength={120}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="joinSlug">Or join by organization slug</Label>
                <Input
                  id="joinSlug"
                  name="joinSlug"
                  placeholder="hope-shelter"
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                />
                <p className="text-xs text-muted-foreground">
                  Slug joining is a demo mechanism; production needs invite
                  tokens.
                </p>
              </div>
            </fieldset>

            {message ? (
              <p role="alert" className="text-sm text-destructive">
                {message}
              </p>
            ) : null}

            <Button type="submit">Finish setup</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
