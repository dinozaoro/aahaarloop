import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Utensils } from "lucide-react";
import { ClaimButton } from "@/components/claim-button";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getDonation, getOrganization } from "@/lib/data/store";
import { CATEGORY_LABELS, STORAGE_LABELS } from "@/lib/domain/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Donation details" };

export default async function DonationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const donation = await getDonation(id);
  if (!donation) notFound();
  const donor = await getOrganization(donation.organizationId);
  const image = donation.title.toLocaleLowerCase("en-IN").includes("biryani") ? "/images/food-biryani.png" : donation.title.toLocaleLowerCase("en-IN").includes("idli") ? "/images/food-idli.png" : donation.title.toLocaleLowerCase("en-IN").includes("fruit") ? "/images/food-fruit-packs.png" : null;
  const timestamp = (value: string) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  return <WorkspaceShell><div className="page-heading donation-detail-heading"><div><p className="page-kicker">{donor?.area ?? donation.pickupArea} · Posted {timestamp(donation.createdAt)}</p><h1>{donation.title}</h1><p>{donor?.name ?? "Food partner"} · {donation.pickupArea}, Bengaluru</p></div></div><div className="detail-layout"><div><div className="detail-photo">{image ? <Image src={image} fill sizes="(max-width: 700px) 100vw, 55vw" alt={`${donation.title} food photo`} /> : <Utensils className="detail-category-mark" aria-hidden="true" />}<span>{CATEGORY_LABELS[donation.category]}</span></div><section className="detail-section"><h2>Freshly made, ready to share.</h2><p>{donation.description}</p><div className="detail-facts"><div><span>Available quantity</span><strong>{donation.servingsAvailable} servings · {donation.weightKg} kg total</strong></div><div><span>Prepared</span><strong>{timestamp(donation.createdAt)}</strong></div><div><span>Use by · donor reported</span><strong>{timestamp(donation.foodExpiryAt)}</strong></div><div><span>Collect by</span><strong>{timestamp(donation.pickupDeadlineAt)}</strong></div><div><span>Storage &amp; handling</span><strong>{STORAGE_LABELS[donation.storage]} · {donation.packaging}</strong></div><div><span>Allergens</span><strong>{donation.allergens.length ? donation.allergens.join(", ") : "None listed by donor"}</strong></div></div></section><section className="detail-section"><h2>Pickup instructions</h2><p>{donation.pickupAddress}. {donation.description}</p></section><p className="safety-note">Food and handling details are donor-provided. AahaarLoop does not certify food safety.</p></div><aside className="claim-panel"><span className="match-ribbon">{donation.status === "published" ? "Posted · Available to view" : "Donation status · " + donation.status.replaceAll("_", " ")}</span><h2>Pickup within the posted window</h2><p className="donor-name">{timestamp(donation.pickupDeadlineAt)}<br />{donation.pickupArea}, Bengaluru</p><div className="claim-metric"><strong>{donation.servingsAvailable}</strong><span>servings available · {donation.weightKg} kg total</span></div><ClaimButton donationId={donation.id} available={donation.servingsAvailable} status={donation.status} /><p className="safety-note">Check food condition, allergens and transport directly with the donor before pickup.</p><Link href="/browse" className="outline-action detail-back-link">Back to discoveries</Link></aside></div></WorkspaceShell>;
}
