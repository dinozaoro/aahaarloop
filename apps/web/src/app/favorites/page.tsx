import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { WorkspaceShell } from "@/components/workspace-shell";
import { requireRole } from "@/lib/auth/guards";
import { getAllDonations, getOrganization } from "@/lib/data/store";
import { favoriteService } from "@/lib/favorites/service";

export const metadata: Metadata = { title: "Saved donations" };

export default async function FavoritesPage() {
  const user = await requireRole(["recipient"]);
  const organizationId = user.activeOrganizationId;
  const saved = organizationId
    ? favoriteService.list(user.id, organizationId, getAllDonations())
    : [];
  const donations = saved
    .map((favorite) => getAllDonations().find((donation) => donation.id === favorite.donationId))
    .filter((donation) => donation?.status === "published");

  return (
    <WorkspaceShell>
      <div className="page-heading">
        <div><p className="page-kicker">Your shortlist</p><h1>Saved donations.</h1><p>Keep promising offers close while you coordinate collection.</p></div>
        <Link href="/browse" className="outline-action">Browse offers</Link>
      </div>
      {donations.length ? (
        <section className="offer-list" aria-label="Saved donations">
          {donations.map((donation) => donation && <article className="offer-card" key={donation.id}>
            <div className="offer-content"><span className="food-category">{donation.pickupArea}</span><h2>{donation.title}</h2><p>{getOrganization(donation.organizationId)?.name ?? "Food partner"}</p><div className="offer-meta"><span><b>{donation.servingsAvailable}</b> servings</span><span>Collect by {new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(donation.pickupDeadlineAt))}</span></div><Link href={`/browse/${donation.id}`} className="offer-open">View donation <ArrowRight aria-hidden="true" size={14} /></Link></div>
          </article>)}
        </section>
      ) : <div className="empty-state"><h2>No saved donations yet.</h2><p>Save an offer from the browse list when you find a good fit.</p><Link href="/browse" className="primary-action">Find surplus <ArrowRight aria-hidden="true" size={14} /></Link></div>}
    </WorkspaceShell>
  );
}
