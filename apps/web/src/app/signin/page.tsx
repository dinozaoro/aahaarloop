import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to Aahaarloop as a donor, recipient organisation or volunteer.",
  alternates: { canonical: "/signin" },
};

export default function SignInPage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-16 sm:px-6">
      <div className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit">
          Issue #8
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-muted-foreground">
          Google sign-in and role onboarding land with the authentication issue.
          Until then this prototype runs on a demo session so every screen stays
          explorable.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Continue with Google</CardTitle>
          <CardDescription>
            Available once Auth.js and onboarding are implemented (#8).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <button
            type="button"
            disabled
            aria-describedby="google-disabled-reason"
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            Continue with Google
          </button>
          <p id="google-disabled-reason" className="text-sm text-muted-foreground">
            Google sign-in is not configured yet. Use the demo session below to
            review the screens.
          </p>
          <Link href="/dashboard" className={cn(buttonVariants(), "w-full")}>
            Continue with the demo session
            <ArrowRight aria-hidden="true" />
          </Link>
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            The demo session is seeded with sample data and is not a real
            account. No credentials are stored.
          </p>
        </CardContent>
      </Card>

      <Link
        href="/"
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Back to the landing page
      </Link>
    </div>
  );
}
