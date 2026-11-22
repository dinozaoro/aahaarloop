import { signIn } from "@/auth";
import { AccountLayout } from "@/components/account-layout";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to AahaarLoop with Google.",
  alternates: { canonical: "/signin" },
};

export default function SignInPage() {
  return <AccountLayout title="Welcome back." description="Sign in to pick up where you left off.">
    <div className="account-actions">
      <form action={async () => {
        "use server";
        await signIn("google", { redirectTo: "/onboarding" });
      }}>
        <button type="submit" className="account-action account-action-primary">Continue with Google</button>
      </form>
      <p className="account-footnote">AahaarLoop currently uses Google sign-in. Password sign-in and password reset are not available.</p>
      <Link className="account-action" href="/browse">Explore the Web preview</Link>
    </div>
    <div className="account-links"><span>New to AahaarLoop?</span><Link className="account-action" href="/register">Create an account</Link></div>
    <p className="account-footnote">By continuing, you agree to our Terms and Privacy Policy.</p>
  </AccountLayout>;
}
