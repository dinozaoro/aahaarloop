import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getClaimsForDonor } from "@/lib/data/store";
import { DONOR_ORG_ID } from "@/lib/data/constants";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const claims = [...await getClaimsForDonor(DONOR_ORG_ID)].sort((a,b) => b.updatedAt.localeCompare(a.updatedAt));
  const title = (status: string) => status === "pending" ? "A kitchen requested your donation" : status === "pickup_scheduled" ? "Pickup is scheduled" : status === "delivered" ? "Delivery completed" : status === "picked_up" ? "Your food was collected" : "Donation claim confirmed";
  const description = (claim: (typeof claims)[number]) => `${claim.servings} portions of ${claim.donationTitle} · ${claim.recipientName}`;
  return <WorkspaceShell><div className="notifications-page"><div className="page-heading"><div><p className="page-kicker">Bengaluru</p><h1>Your loop, up to date.</h1><p>Useful updates. Only when they matter.</p></div></div><div className="notifications-toolbar"><span>All updates</span><Link href="/settings/notifications">Notification preferences <ArrowUpRight aria-hidden="true" size={14} /></Link></div><section className="notifications-panel" aria-label="Recent claim activity">{claims.map((claim) => <article className="notification-row" key={claim.id}><div><h2>{title(claim.status)}</h2><p>{description(claim)}</p></div><time>{new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(claim.updatedAt))}</time></article>)}</section>{claims.length === 0 ? <p className="dashboard-empty">No updates yet.</p> : null}<p className="sample-note">Notifications and read status are not connected to the shared API.</p></div></WorkspaceShell>;
}
