import { auth, signIn } from "@/auth";
import { safeCallbackUrl } from "@/lib/auth/callbacks";
import { AccountLayout } from "@/components/account-layout";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Create an account", alternates: { canonical: "/register" } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl } = await searchParams;
  const session = await auth();
  const redirectTo = safeCallbackUrl(callbackUrl, session?.user?.needsOnboarding ? "/onboarding" : "/dashboard");
  return <AccountLayout title="Make room for good." description="One account. A community of possibilities.">
    <div className="account-actions">
      <form action={async () => {
        "use server";
        await signIn("google", { redirectTo });
      }}>
        <button type="submit" className="account-action account-action-primary">Create account with Google</button>
      </form>
      <p className="account-footnote">Your Google account is used to sign in. You will choose a role and set up your profile next.</p>
    </div>
    <div className="account-links"><span>Already have an account?</span><Link className="account-action" href="/signin">Sign in</Link></div>
    <p className="account-footnote">By continuing, you agree to our Terms and Privacy Policy.</p>
  </AccountLayout>;
}
