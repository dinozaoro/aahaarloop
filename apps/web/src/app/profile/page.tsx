import Link from "next/link";
import type { Metadata } from "next";

import { WorkspaceShell } from "@/components/workspace-shell";
import { DONOR_ORG_ID } from "@/lib/data/constants";
import { getOrganization } from "@/lib/data/store";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  const organization = getOrganization(DONOR_ORG_ID);
  if (!organization) return <WorkspaceShell><p>Organisation profile unavailable.</p></WorkspaceShell>;
  return <WorkspaceShell><div className="profile-page">
    <div className="page-heading"><div><p className="page-kicker">Bengaluru</p><h1>Your place in the loop.</h1><p>{organization.contactName} · Food donor</p></div></div>
    <div className="profile-information">
      <section><h2>Profile information</h2><div className="profile-value"><span>Full name</span><strong>{organization.contactName}</strong></div><div className="profile-value"><span>Contact number</span><strong>{organization.contactPhone}</strong></div><div className="profile-value"><span>Role</span><strong>Food donor</strong></div></section>
      <section><h2>{organization.name}</h2><div className="profile-value"><span>Organization type</span><strong>Food donor</strong></div><div className="profile-value"><span>Collection neighbourhood</span><strong>{organization.area}, Bengaluru</strong></div><div className="profile-value"><span>Pickup address</span><strong>{organization.address}</strong></div><div className="profile-value"><span>Collection capacity</span><strong>Up to {organization.transportCapacityKg} kg · {organization.capacityServings} servings</strong></div><p className="profile-private-note">Pickup details are shared for confirmed handovers.</p><Link className="outline-action profile-action" href="/settings">Account &amp; notifications</Link><Link className="outline-action profile-action" href="/onboarding">Request another role</Link></section>
    </div>
  </div></WorkspaceShell>;
}
