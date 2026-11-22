import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Utensils } from "lucide-react";
import type { Metadata } from "next";

import { WorkspaceShell } from "@/components/workspace-shell";

function getCurrentTime() { return Date.now(); }
import { RECIPIENT_ORG_ID } from "@/lib/data/constants";
import { getAllDonations, getClaimsForOrganization, getNeedsForOrganization, getOrganization } from "@/lib/data/store";
import { type Donation } from "@/lib/domain/types";

export const metadata: Metadata = { title: "Recipient dashboard" };

function distanceKm(a: Donation["location"], b: Donation["location"]) {
  const rad = (degrees: number) => degrees * Math.PI / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)) * 10) / 10;
}

function offerPhoto(title: string) {
  const name = title.toLocaleLowerCase("en-IN");
  if (name.includes("biryani")) return "/images/food-biryani.png";
  if (name.includes("idli")) return "/images/food-idli.png";
  if (name.includes("fruit")) return "/images/food-fruit-packs.png";
  return null;
}

export default function RecipientPage() {
  const organization = getOrganization(RECIPIENT_ORG_ID);
  const now = getCurrentTime();
  const needs = getNeedsForOrganization(RECIPIENT_ORG_ID).filter((need) => need.status === "active" && new Date(need.deadlineAt).getTime() > now);
  const claims = [...getClaimsForOrganization(RECIPIENT_ORG_ID)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const offers = organization ? getAllDonations().filter((donation) => {
    const distance = distanceKm(organization.location, donation.location);
    return donation.status === "published"
      && donation.servingsAvailable > 0
      && new Date(donation.pickupDeadlineAt).getTime() > now
      && distance <= 25
      && (!needs.length || needs.some((need) => need.category === donation.category));
  }).map((donation) => ({ donation, distance: distanceKm(organization.location, donation.location), donor: getOrganization(donation.organizationId) }))
    .sort((a, b) => a.distance - b.distance) : [];
  const nextPickup = claims.find((claim) => claim.status === "pickup_scheduled");
  const pickupDonation = nextPickup ? getAllDonations().find((donation) => donation.id === nextPickup.donationId) : undefined;
  const pickupDonor = pickupDonation ? getOrganization(pickupDonation.organizationId) : undefined;
  const completedServings = claims.filter((claim) => claim.status === "delivered").reduce((sum, claim) => sum + claim.servings, 0);
  const claimedCount = claims.filter((claim) => !["cancelled", "expired"].includes(claim.status)).length;
  const fmt = (value: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(value));

  return <WorkspaceShell><div className="recipient-home">
    <div className="page-heading recipient-heading"><div><p className="page-kicker">Bengaluru · {new Intl.DateTimeFormat("en-IN", { weekday: "long", hour: "numeric", minute: "2-digit" }).format(new Date())}</p><h1>Good evening, {organization?.contactName.split(" ")[0] ?? "there"}.</h1><p>{offers.length ? `A few nearby offers for ${organization?.name ?? "your kitchen"}.` : "Current offers and active needs will appear here."}</p></div><Link href="/browse" className="primary-action">Discover food</Link></div>
    <section className="stat-strip recipient-stats" aria-label="Recipient activity summary">
      <div><span>Nearby donations</span><strong>{String(offers.length).padStart(2, "0")}</strong><em>Available and within 25 km</em></div>
      <div><span>Claimed donations</span><strong>{String(claimedCount).padStart(2, "0")}</strong><em>Based on your claims</em></div>
      <div><span>Upcoming pickup</span><strong>{String(claims.filter((claim) => claim.status === "pickup_scheduled").length).padStart(2, "0")}</strong><em>{nextPickup ? fmt(nextPickup.updatedAt) : "No pickup scheduled"}</em></div>
      <div><span>Meals received</span><strong>{completedServings}</strong><em>Portions in delivered claims</em></div>
    </section>
    <nav className="recipient-quick-links" aria-label="Organisation tools"><Link href="/recipient/needs">Manage food needs <ArrowRight aria-hidden="true" size={14} /></Link><Link href="/recipient/profile">Organisation details <ArrowRight aria-hidden="true" size={14} /></Link><Link href="/recipient/claims">My collections <ArrowRight aria-hidden="true" size={14} /></Link></nav>
    {nextPickup ? <section className="recipient-next-pickup"><div><strong>Your next collection is scheduled · {pickupDonation ? fmt(pickupDonation.pickupDeadlineAt) : fmt(nextPickup.updatedAt)}</strong><p>{nextPickup.donationTitle} · {pickupDonor?.name ?? "Local donor"} · {nextPickup.servings} servings</p></div><Link href="/recipient/claims" className="outline-action">Coordinate pickup</Link></section> : null}
    <div className="recipient-offer-heading"><h2>Food that fits your needs</h2><span>Nearby · Based on active needs</span></div>
    {offers.length ? <section className="recipient-offer-grid" aria-label="Nearby donations">
      {offers.slice(0, 3).map(({ donation, distance, donor }) => <article className="recipient-offer-card" key={donation.id}>
        <Link href={`/browse/${donation.id}`} className="recipient-offer-photo" aria-label={`View ${donation.title}`}>
          {offerPhoto(donation.title) ? <Image src={offerPhoto(donation.title)!} fill sizes="(max-width: 700px) 100vw, 32vw" alt="" /> : <Utensils aria-hidden="true" />}
        </Link>
        <div className="recipient-offer-copy"><h3><Link href={`/browse/${donation.id}`}>{donation.title}</Link></h3><p>{donor?.name ?? "Food partner"} · {donation.pickupArea}</p><strong>{donation.servingsAvailable} servings · {donation.weightKg} kg</strong><span className="recipient-pickup-time">Collect by {fmt(donation.pickupDeadlineAt)}</span><small>{distance} km · fits your pickup area</small></div>
      </article>)}
    </section> : <section className="recipient-empty"><h2>No nearby offers fit the current needs.</h2><p>Review active food needs or check Discover for all available donations.</p><Link href="/recipient/needs">Manage food needs <ArrowRight aria-hidden="true" size={14} /></Link></section>}
    {claims.some((claim) => claim.status === "delivered") ? <p className="recipient-delivery-note">Recent delivery · {claims.find((claim) => claim.status === "delivered")?.servings} servings received.</p> : null}
  </div></WorkspaceShell>;
}
