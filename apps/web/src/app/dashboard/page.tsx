import { foodPhoto } from "@/lib/food-photo";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowUpRight, Plus, Utensils } from "lucide-react";

import { WorkspaceShell } from "@/components/workspace-shell";
import { SchematicMap } from "@/components/schematic-map";
import { DONOR_ORG_ID, RECIPIENT_ORG_ID } from "@/lib/data/constants";
import { getClaimsForDonor, getDonation, getDonationsForOrganization, getOrganization } from "@/lib/data/store";
import { DONATION_STATUS_LABELS, type Donation } from "@/lib/domain/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard" };

const dateTime = (date: string) => new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
}).format(new Date(date));

function distanceInKm(a: Donation["location"], b: Donation["location"]) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const lat = radians(b.latitude - a.latitude);
  const lon = radians(b.longitude - a.longitude);
  return (2 * 6371 * Math.asin(Math.sqrt(Math.sin(lat / 2) ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(lon / 2) ** 2))).toFixed(1);
}

export default async function DashboardPage() {
  const donations = [...await getDonationsForOrganization(DONOR_ORG_ID)].sort((a, b) => a.pickupDeadlineAt.localeCompare(b.pickupDeadlineAt));
  const claims = [...await getClaimsForDonor(DONOR_ORG_ID)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const organization = await getOrganization(DONOR_ORG_ID);
  const nearbyKitchen = await getOrganization(RECIPIENT_ORG_ID);
  const active = donations.filter((donation) => ["published", "claimed", "pickup_scheduled"].includes(donation.status));
  const scheduledClaim = claims.find((claim) => claim.status === "pickup_scheduled");
  const scheduledDonation = scheduledClaim ? await getDonation(scheduledClaim.donationId) : undefined;
  const pickupRecipient = scheduledClaim ? await getOrganization(scheduledClaim.recipientOrgId) : undefined;
  const completedThisMonth = claims.filter((claim) => claim.status === "delivered" && new Date(claim.updatedAt).getMonth() === new Date().getMonth()).length;
  const rescuedKg = claims.filter((claim) => claim.status === "delivered").reduce((sum, claim) => sum + claim.weightKg, 0);
  const awaitingPickup = claims.filter((claim) => ["pending", "confirmed"].includes(claim.status)).length;
  const recentClaims = claims.slice(0, 3);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Intl.DateTimeFormat("en-IN", { weekday: "long", hour: "numeric", minute: "2-digit" }).format(new Date());

  return (
    <WorkspaceShell>
      <div className="dashboard-page">
        <div className="page-heading dashboard-heading">
          <div><p className="page-kicker">Bengaluru · Today, {today}</p><h1>{greeting}, {organization?.contactName.split(" ")[0] ?? "there"}.</h1><p>Here’s what’s moving from your kitchen today.</p></div>
          <Link href="/donations/new" className="primary-action"><Plus aria-hidden="true" /> Post surplus</Link>
        </div>

        <section className="dashboard-metrics" aria-label="Donation summary">
          <div><strong>{active.length.toString().padStart(2, "0")}</strong><span>Active donations</span></div>
          <div><strong>{awaitingPickup.toString().padStart(2, "0")}</strong><span>Awaiting pickup</span></div>
          <div><strong>{completedThisMonth.toString().padStart(2, "0")}</strong><span>Completed this month</span></div>
          <div><strong>{rescuedKg.toLocaleString("en-IN")} kg</strong><span>Food rescued</span></div>
        </section>

        <div className="dashboard-columns">
          <section className="dashboard-main-column">
            <div className="dashboard-section-title"><h2>Ready for their next destination</h2><Link href="/donations">Manage donations <ArrowUpRight aria-hidden="true" /></Link></div>
            {active.length ? <div className="dashboard-offer-list">{active.slice(0, 2).map((donation) => {
              const image = foodPhoto(donation.title);
              return <article className="dashboard-offer-card" key={donation.id}><Link href={`/donations/${donation.id}`} className="dashboard-offer-photo" aria-label={`Manage ${donation.title}`}>{image ? <Image src={image} fill sizes="80px" alt="" /> : <Utensils aria-hidden="true" />}</Link><div><h3>{donation.title}</h3><p>{donation.servingsTotal} portions · {donation.weightKg} kg</p><small>Collect by {dateTime(donation.pickupDeadlineAt)}</small><span className={`status status-${donation.status}`}>{DONATION_STATUS_LABELS[donation.status]}</span></div><Link href={`/donations/${donation.id}`} className="outline-action">Manage</Link></article>;
            })}</div> : <p className="dashboard-empty">No active donations yet. Post surplus when your kitchen has food to share.</p>}
            <section className="dashboard-recent"><div className="dashboard-section-title"><h2>Recent activity</h2><Link href="/claims">All activity <ArrowUpRight aria-hidden="true" /></Link></div>{recentClaims.length ? recentClaims.map((claim) => <article key={claim.id}><time>{dateTime(claim.updatedAt)}</time><p>{claimStatusLine(claim.status, claim.donationTitle)} <strong>{claim.recipientName}</strong></p></article>) : <p className="dashboard-empty">New activity will appear here.</p>}</section>
          </section>

          <aside className="dashboard-side-column">
            <section className="dashboard-collection-card"><p className="page-kicker">Next collection</p>{scheduledClaim && scheduledDonation ? <><h2>A simple handover.<br />A meaningful meal.</h2><p>{scheduledClaim.donationTitle} · {scheduledClaim.servings} portions</p><SchematicMap className="dashboard-route-map" from={scheduledDonation.location} to={pickupRecipient?.location ?? null} fromLabel={scheduledDonation.pickupArea} toLabel={pickupRecipient?.name ?? "Community kitchen"} href="/claims" /><p>{pickupRecipient?.contactName ?? scheduledClaim.recipientName} · Volunteer<br />{dateTime(scheduledDonation.pickupDeadlineAt)} · Collection entrance</p><Link href="/claims" className="primary-action">View pickup</Link></> : <><h2>No collection scheduled yet.</h2><p>Confirmed pickup details will appear here.</p><Link href="/claims" className="primary-action">View activity</Link></>}</section>
          </aside>
        </div>
        {nearbyKitchen && organization ? <Link href="/browse" className="dashboard-community-link"><span><strong>A nearby kitchen could use your next donation</strong><small>{nearbyKitchen.name} · {nearbyKitchen.area} · {distanceInKm(organization.location, nearbyKitchen.location)} km away</small></span><span>See community needs <ArrowUpRight aria-hidden="true" /></span></Link> : null}
      </div>
    </WorkspaceShell>
  );
}

function claimStatusLine(status: string, donationTitle: string) {
  if (status === "pending") return `requested ${donationTitle}.`;
  if (status === "pickup_scheduled") return `pickup arranged for ${donationTitle}.`;
  if (status === "delivered") return `received ${donationTitle}.`;
  if (status === "picked_up") return `collected ${donationTitle}.`;
  return `confirmed ${donationTitle}.`;
}
