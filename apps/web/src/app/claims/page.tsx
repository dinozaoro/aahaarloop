import type { Metadata } from "next";
import { Check } from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getClaimsForDonor, getDonation, getOrganization } from "@/lib/data/store";
import { DONOR_ORG_ID } from "@/lib/data/constants";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pickups" };
const STEPS = ["Posted", "Claimed", "Pickup scheduled", "Collected", "Delivered"];
const EVENT_TYPES = ["created", "confirmed", "pickup_scheduled", "picked_up", "delivered"];
const formatTime = (date: string) => new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(date));

export default async function ClaimsPage() {
  const claims = await getClaimsForDonor(DONOR_ORG_ID);
  return <WorkspaceShell><div className="page-heading"><div><p className="page-kicker">Collection coordination</p><h1>Pickups</h1><p>Follow each handover and see what needs your attention.</p></div></div>
    <section className="pickup-list">{await Promise.all(claims.map(async (claim) => { const recipient = await getOrganization(claim.recipientOrgId); const donation = await getDonation(claim.donationId); const active = claim.status === "pickup_scheduled" ? 2 : claim.status === "picked_up" ? 3 : claim.status === "delivered" ? 4 : 1; const scheduled = claim.history.find((event) => event.type === "pickup_scheduled"); const pickupEvent = scheduled?.note ?? "Collection time to be confirmed"; return <article key={claim.id} className="pickup-card"><div className="pickup-head"><div><span className="food-category">{donation?.pickupArea ?? "Local pickup"} · {formatTime(claim.createdAt)}</span><h2>{claim.donationTitle}</h2><p>{claim.servings} servings · for {recipient?.name ?? claim.recipientName}</p></div><span className={`status status-${claim.status}`}>{claim.status.replaceAll("_", " ")}</span></div><div className="timeline">{STEPS.map((step, i) => { const event = claim.history.find((entry) => entry.type === EVENT_TYPES[i]); return <div key={step} className={`timeline-step${i < active ? " done" : i === active ? " current" : ""}`}><span className="timeline-dot">{i < active ? <Check size={12} aria-hidden="true" /> : null}</span><strong>{step}</strong><small>{event ? formatTime(event.at) : i === active + 1 ? "Next" : ""}</small></div>; })}</div><div className="pickup-details"><div><span>Pickup window</span><strong>{pickupEvent}</strong></div><div><span>Pickup point</span><strong>{donation?.pickupAddress ?? "Address to be confirmed"}</strong></div><div><span>Volunteer</span><strong>{scheduled?.actor ?? "Not assigned yet"}</strong></div></div></article>; }))}</section>
    {claims.length === 0 ? <p className="dashboard-empty">No pickup activity yet.</p> : null}
  </WorkspaceShell>;
}
