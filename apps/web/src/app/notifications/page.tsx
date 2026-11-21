import type { Metadata } from "next";
import { WorkspaceShell } from "@/components/workspace-shell";
import { Papicon } from "@/components/papicon";
import { getClaimsForDonor } from "@/lib/data/store";
import { DEMO_DONOR_ORG_ID } from "@/lib/data/constants";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  const claims = [...getClaimsForDonor(DEMO_DONOR_ORG_ID)].sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  return <WorkspaceShell><div className="page-heading"><div><p className="page-kicker">AahaarLoop updates</p><h1>Notifications</h1><p>Claims and pickup changes from your partner organisations.</p></div><button className="outline-action">Mark all as read</button></div><section className="notifications-panel">{claims.map((claim) => <article className="notification-row" key={claim.id}><span className="notification-icon"><Papicon name="bell" /></span><div><p><strong>{claim.recipientName}</strong> {claim.status === "pending" ? "requested" : claim.status === "pickup_scheduled" ? "scheduled a pickup for" : claim.status === "delivered" ? "completed the handover for" : "confirmed"} <strong>{claim.servings} servings of {claim.donationTitle}</strong>.</p><small>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(claim.updatedAt))}</small></div><i className="notification-unread" /></article>)}</section><p className="sample-note">Preview notifications are generated from seeded claim activity.</p></WorkspaceShell>;
}
