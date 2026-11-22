import { requireUser } from "@/lib/auth/guards";
import { SELF_ASSIGNABLE_ROLES } from "@/lib/auth/onboarding";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Logo } from "@/components/logo";
import { completeOnboarding } from "./actions";

export const metadata: Metadata = { title: "Choose your role", alternates: { canonical: "/onboarding" } };

const ROLE_DETAILS = {
  donor: { title: "Share surplus", description: "List food, coordinate collections and see your impact.", audience: "Food donors · Restaurants, cafés and caterers" },
  recipient: { title: "Find food", description: "Discover relevant donations and arrange reliable pickups.", audience: "NGOs & community kitchens" },
  volunteer: { title: "Move food forward", description: "Collect and deliver food in your neighbourhood.", audience: "Volunteers" },
} as const;

const ERRORS: Record<string, string> = {
  "invalid-role": "Choose donor, recipient or volunteer.",
  "invalid-mode": "Choose whether to create or join an organization.",
  "invalid-name": "Organization name must be 2 to 120 characters.",
  "invalid-slug": "Enter a valid organization slug.",
  "not-found": "No organization has that slug. Check it or create one.",
};

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser();
  const { error } = await searchParams;
  const message = error ? (ERRORS[error] ?? "Please check your details.") : null;

  return <div className="onboarding-page">
    <header className="account-header"><Link href="/" aria-label="AahaarLoop home"><Logo /></Link><span>Bengaluru</span></header>
    <main id="main" className="onboarding-main">
      <p className="onboarding-kicker">01 / Your place in the loop</p>
      <h1>How would you like to help?</h1>
      <p className="onboarding-intro">Choose a starting role. You can request another role from your profile later.</p>
      <p className="onboarding-signed-in">Signed in as {user.email}</p>
      <form action={completeOnboarding} className="onboarding-form">
        <fieldset className="role-options">
          <legend className="sr-only">Choose your role</legend>
          {SELF_ASSIGNABLE_ROLES.map((role) => {
            const details = ROLE_DETAILS[role];
            return <label key={role} className="role-option">
              <input type="radio" name="role" value={role} defaultChecked={user.role === role} required />
              <span className="role-option-copy"><strong>{details.title}</strong><span>{details.description}</span><small>{details.audience}</small></span>
              <span className="role-option-action" aria-hidden="true">Choose role <ArrowRight size={14} /></span>
            </label>;
          })}
        </fieldset>

        <section className="onboarding-organization" aria-labelledby="organization-title">
          <div><p className="onboarding-kicker">02 / A few useful details</p><h2 id="organization-title">Set up your organization</h2></div>
          <fieldset className="organization-mode">
            <legend>Organization</legend>
            <label><input type="radio" name="orgMode" value="create" defaultChecked /> Create a new organization</label>
            <label><input type="radio" name="orgMode" value="join" /> Join an existing organization</label>
          </fieldset>
          <div className="onboarding-fields">
            <label htmlFor="orgName">Organization name</label>
            <input id="orgName" name="orgName" placeholder="Hope Shelter" minLength={2} maxLength={120} />
            <label htmlFor="joinSlug">Organization slug <span>(for joining)</span></label>
            <input id="joinSlug" name="joinSlug" placeholder="hope-shelter" pattern="[a-z0-9]+(-[a-z0-9]+)*" />
            
          </div>
        </section>

        {message ? <p role="alert" className="onboarding-error">{message}</p> : null}
        <button type="submit" className="account-action account-action-primary onboarding-submit">Finish setup</button>
      </form>
      <p className="onboarding-disclosure">Only your role and organization name are saved by this setup flow. Contact, pickup and food-handling details are not collected here.</p>
    </main>
  </div>;
}
