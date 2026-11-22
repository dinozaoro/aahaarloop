import { auth, signIn } from "@/auth";
import { AccountLayout } from "@/components/account-layout";
import { safeCallbackUrl } from "@/lib/auth/callbacks";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Create an account",
  alternates: { canonical: "/register" },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const session = await auth();
  const redirectTo = safeCallbackUrl(
    callbackUrl,
    session?.user?.needsOnboarding ? "/onboarding" : "/dashboard",
  );
  return (
    <AccountLayout
      title="Make room for good."
      description="Start by creating your account with Google."
    >
      <div className="account-actions">
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo });
          }}
        >
          <button
            type="submit"
            className="account-action account-action-primary"
          >
            Create account with Google
          </button>
        </form>
        <p className="account-footnote">
          Next, choose your role and create or join an organization. If you
          already have an account, Google will sign you in.
        </p>
      </div>
      <div className="account-links">
        <span>Already have an account?</span>
        <Link className="account-action" href="/signin">
          Sign in
        </Link>
      </div>
      <p className="account-footnote">
        Google verifies your identity. AahaarLoop never sees your Google
        password.
      </p>
    </AccountLayout>
  );
}
