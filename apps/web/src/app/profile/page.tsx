import type { Metadata } from "next";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getOrganization } from "@/lib/data/store";
import { DEMO_DONOR_ORG_ID } from "@/lib/data/constants";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  const organization = getOrganization(DEMO_DONOR_ORG_ID);
  if (!organization) return <WorkspaceShell><p>Organisation profile unavailable.</p></WorkspaceShell>;
  return <WorkspaceShell><div className="page-heading"><div><p className="page-kicker">Your workspace</p><h1>Organisation profile</h1><p>Details recipients use to coordinate a safe, timely pickup.</p></div><span className="status status-delivered">Verified partner</span></div><section className="profile-card"><div className="profile-cover"><span className="avatar profile-large">{organization.name.split(" ").map((word) => word[0]).slice(0,2).join("")}</span><div><h2>{organization.name}</h2><p>{organization.area}, Bengaluru</p></div></div><div className="profile-fields"><div><span>Primary contact</span><strong>{organization.contactName}</strong></div><div><span>Phone</span><strong>{organization.contactPhone}</strong></div><div><span>Pickup address</span><strong>{organization.address}</strong></div><div><span>Collection capacity</span><strong>Up to {organization.transportCapacityKg} kg</strong></div><div><span>Food storage</span><strong>{organization.storage}</strong></div><div><span>Serving capacity</span><strong>{organization.capacityServings} people</strong></div></div><p className="sample-note">Preview organisation · profile edits are not connected to an account yet.</p></section></WorkspaceShell>;
}
