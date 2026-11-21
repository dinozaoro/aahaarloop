import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getDonation, getOrganization } from "@/lib/data/store";
import { CATEGORY_LABELS, STORAGE_LABELS } from "@/lib/domain/types";

export const metadata: Metadata = { title: "Donation details" };

export default async function DonationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const donation = getDonation(id);
  if (!donation) notFound();
  const donor = getOrganization(donation.organizationId);
  return <WorkspaceShell><Link href="/browse" className="back-link">← Back to offers</Link><div className="detail-layout"><div><div className="detail-photo"><Image src="/images/tasty-bowl.webp" width={1200} height={800} alt="A serving of freshly prepared Indian food" /><span>{CATEGORY_LABELS[donation.category]}</span></div><section className="detail-section"><h2>About this food</h2><p>{donation.description}</p><div className="detail-facts"><div><span>Available quantity</span><strong>{donation.servingsAvailable} servings · {donation.weightKg} kg total</strong></div><div><span>Best before</span><strong>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(donation.foodExpiryAt))}</strong></div><div><span>Collection by</span><strong>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(donation.pickupDeadlineAt))}</strong></div><div><span>Storage</span><strong>{STORAGE_LABELS[donation.storage]}</strong></div><div><span>Allergens</span><strong>{donation.allergens.length ? donation.allergens.join(", ") : "None listed"}</strong></div><div><span>Packaging</span><strong>{donation.packaging}</strong></div></div></section><section className="detail-section"><h2>Pickup instructions</h2><p>Collect from the main entrance. Please bring clean, covered containers for transport.</p></section></div><aside className="claim-panel"><span className="match-ribbon">A good fit for your organisation</span><h1>{donation.title}</h1><p className="donor-name">Offered by {donor?.name ?? "Food partner"}</p><div className="claim-metric"><strong>{donation.servingsAvailable}</strong><span>servings available</span></div><div className="claim-location"><span>⌖</span><div><strong>{donation.pickupArea}, Bengaluru</strong><small>About 2.4 km from your kitchen</small></div></div><div className="match-reason"><strong>Why this may work</strong><p>Quantity fits your kitchen capacity, and collection is within your preferred distance.</p></div><Link href="/signin" className="primary-action claim-button">Request this donation <span>→</span></Link><p className="safety-note">Please confirm food condition, allergens and safe transport directly with the donor before collection.</p></aside></div></WorkspaceShell>;
}
