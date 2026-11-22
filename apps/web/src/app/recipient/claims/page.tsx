import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { DEMO_RECIPIENT_ORG_ID } from "@/lib/data/constants";
import { getClaimsForOrganization, getDonation, getOrganization } from "@/lib/data/store";

export const metadata: Metadata = { title: "My collections" };

const steps = ["Posted", "Claimed", "Pickup scheduled", "Collected", "Delivered"];
const eventTypes = ["created", "confirmed", "pickup_scheduled", "picked_up", "delivered"];
const time = (value: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(value));

export default function RecipientClaimsPage() {
  const claims = [...getClaimsForOrganization(DEMO_RECIPIENT_ORG_ID)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return <WorkspaceShell><div className="site-shell py-10 sm:py-14">
    <div className="page-heading"><div><p className="page-kicker">Collection coordination</p><h1>My collections</h1><p>Track the donations your organisation has claimed.</p></div></div>
    {claims.length ? <section className="pickup-list">{claims.map((claim) => {
      const donor = getOrganization(claim.donorOrganizationId);
      const donation = getDonation(claim.donationId);
      const active = claim.status === "pickup_scheduled" ? 2 : claim.status === "picked_up" ? 3 : claim.status === "delivered" ? 4 : 1;
      return <article key={claim.id} className="pickup-card"><div className="pickup-head"><div><span className="food-category">{donation?.pickupArea ?? "Local pickup"}</span><h2>{claim.donationTitle}</h2><p>{claim.servings} servings · from {donor?.name ?? "local food donor"}</p></div><span className={`status status-${claim.status}`}>{claim.status.replaceAll("_", " ")}</span></div><div className="timeline">{steps.map((step, index) => { const event = claim.history.find((entry) => entry.type === eventTypes[index]); return <div key={step} className={`timeline-step${index < active ? " done" : index === active ? " current" : ""}`}><span className="timeline-dot">{index < active ? <Check size={12} aria-hidden="true" /> : null}</span><strong>{step}</strong><small>{event ? time(event.at) : index === active + 1 ? "Next" : ""}</small></div>; })}</div><div className="pickup-details"><div><span>Pickup window</span><strong>{time(donation?.pickupDeadlineAt ?? claim.updatedAt)}</strong></div><div><span>Pickup point</span><strong>{donation?.pickupAddress ?? "Address to be confirmed"}</strong></div><div><span>Volunteer</span><strong>{claim.history.find((event) => event.type === "pickup_scheduled")?.actor ?? "Not assigned yet"}</strong></div></div></article>;
    })}</section> : <section className="recipient-empty"><h2>No collections yet</h2><p>Claimed donations and their pickup progress will appear here.</p><Link href="/browse">Discover available food <ArrowRight aria-hidden="true" size={14} /></Link></section>}
    <p className="sample-note">Preview workspace · collection progress reflects seeded examples.</p>
  </div></WorkspaceShell>;
}
