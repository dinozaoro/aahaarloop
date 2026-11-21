import { signIn } from "@/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowRight, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

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
        <p className="eyebrow">Welcome to AahaarLoop</p>
        <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-muted-foreground">
          Sign in with Google to create your Aahaarloop identity and choose your
          role.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Continue with Google</CardTitle>
          <CardDescription>
            New accounts can choose a role and set up their organisation after signing in.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/onboarding" });
            }}
          >
            <Button type="submit" variant="outline" className="w-full">
              Continue with Google
            </Button>
          </form>
          <p className="text-sm text-muted-foreground">
            Requires <code>AUTH_SECRET</code>, <code>AUTH_GOOGLE_ID</code> and{" "}
            <code>AUTH_GOOGLE_SECRET</code>. See the authentication docs.
          </p>
          <Link href="/dashboard" className={cn(buttonVariants(), "w-full")}>
            Explore the product preview
            <ArrowRight aria-hidden="true" />
          </Link>
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            This opens sample product data. It is not a signed-in account, and changes may only stay in this browser session.
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
