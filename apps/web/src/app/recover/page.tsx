import { AccountLayout } from "@/components/account-layout";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Account recovery", alternates: { canonical: "/recover" } };

export default function RecoverAccountPage() {
  return <AccountLayout title="Let’s get you back in." description="AahaarLoop uses Google sign-in.">
    <div className="account-actions">
      <p className="account-footnote">Your password is managed by Google, so AahaarLoop cannot send a password reset email. Recover access through your Google account, then return here to sign in.</p>
      <Link className="account-action account-action-primary" href="/signin">Back to sign in</Link>
    </div>
  </AccountLayout>;
}
