import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { WorkspaceShell } from "@/components/workspace-shell";
import { getClaimsForDonation, getDonation } from "@/lib/data/store";
import { DONATION_STATUS_LABELS } from "@/lib/domain/types";

export const metadata: Metadata = { title: "Manage donation" };

const steps = ["Posted", "Claimed", "Pickup scheduled", "Collected", "Delivered"];

function foodPhoto(title: string) {
  const name = title.toLocaleLowerCase("en-IN");
  if (name.includes("biryani")) return "/images/food-biryani.png";
  if (name.includes("idli")) return "/images/food-idli.png";
  if (name.includes("fruit")) return "/images/food-fruit-packs.png";
  return null;
}

export default async function ManageDonationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const donation = getDonation(id);
  if (!donation) notFound();
  const claims = [...getClaimsForDonation(id)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const claim = claims[0];
  const status = claim?.status ?? donation.status;
  const active = status === "delivered" ? 4 : status === "picked_up" ? 3 : status === "pickup_scheduled" ? 2 : ["pending", "confirmed"].includes(status) ? 1 : 0;
  const image = foodPhoto(donation.title);

  return <WorkspaceShell><div className="manage-donation-page">
    <div className="page-heading"><div><p className="page-kicker">Bengaluru / Demo</p><h1>{donation.status === "published" ? "Your donation is live." : `Your donation is ${DONATION_STATUS_LABELS[donation.status].toLowerCase()}.`}</h1><p>{donation.title} · {donation.servingsTotal} portions · {donation.weightKg} kg · Reference {donation.id.toUpperCase()}</p></div></div>
    <ol className="donation-lifecycle" aria-label="Donation progress">{steps.map((step, index) => <li key={step} className={index <= active ? "done" : ""}><span aria-hidden="true" />{step}</li>)}</ol>
    <div className="manage-donation-layout"><section className="manage-donation-status"><h2>{claim ? claim.status === "pickup_scheduled" ? "Pickup is scheduled" : claim.status === "delivered" ? "Food reached its destination" : claim.status === "pending" ? "A kitchen has requested your food" : "Finding its next destination" : "Finding its next destination"}</h2>
      {image ? <Image className="manage-donation-photo" src={image} width={760} height={240} alt={`${donation.title} prepared food`} /> : null}
      <p>Posted {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(donation.createdAt))}<br />Collect by {new Intl.DateTimeFormat("en-IN", { dateStyle: "short", timeStyle: "short" }).format(new Date(donation.pickupDeadlineAt))}<br />Use by {new Intl.DateTimeFormat("en-IN", { dateStyle: "short", timeStyle: "short" }).format(new Date(donation.foodExpiryAt))} · {donation.allergens.length ? `Contains ${donation.allergens.join(", ")}` : "No allergens listed"}</p>
      <strong className="manage-donation-state">{claim ? DONATION_STATUS_LABELS[donation.status] : "No claim yet"}</strong>
      <p>{claim ? `${claim.recipientName} ${claim.status === "pending" ? "requested this donation." : claim.status === "pickup_scheduled" ? "has a collection arranged." : claim.status === "delivered" ? "has received the food." : "confirmed the collection."}` : "Nearby organisations can discover your donation. Claim management is not connected to the shared API in this preview."}</p>
      <div className="manage-donation-actions"><Link href="/donations/new" className="outline-action">Post another donation</Link><Link href="/donations" className="outline-action">Back to donations</Link></div>
    </section><aside className="manage-donation-note"><h2>Keep food ready.<br />We’ll keep you updated.</h2><p>Only confirm collection once the food has actually been handed over.</p><small>Next actions unlock when the shared claim workflow is connected.</small><Link href="/dashboard" className="outline-action">Back to home</Link></aside></div>
  </div></WorkspaceShell>;
}
