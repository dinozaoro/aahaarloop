import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getDonationsForOrganization, getClaimsForDonor } from "@/lib/data/store";
import { DEMO_DONOR_ORG_ID } from "@/lib/data/constants";
import { CATEGORY_LABELS, DONATION_STATUS_LABELS } from "@/lib/domain/types";

export const metadata: Metadata = { title: "Dashboard" };
const stamp = (date: string) => new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(date));

export default function DashboardPage() {
  const donations = [...getDonationsForOrganization(DEMO_DONOR_ORG_ID)].sort((a, b) => a.pickupDeadlineAt.localeCompare(b.pickupDeadlineAt));
  const claims = getClaimsForDonor(DEMO_DONOR_ORG_ID);
  const open = donations.filter((item) => ["published", "claimed", "pickup_scheduled"].includes(item.status));
  const urgent = open[0];
  const rescued = donations.reduce((sum, item) => sum + item.servingsTotal - item.servingsAvailable, 0);
  return <WorkspaceShell>
    <div className="page-heading"><div><p className="page-kicker">Saturday, 21 November</p><h1>Good afternoon, Meera.</h1><p>Let’s make today’s surplus count.</p></div><Link href="/donations/new" className="primary-action"><span>＋</span> Post surplus</Link></div>
    <section className="stat-strip" aria-label="Donation summary"><div><span>Food rescued</span><strong>{rescued}<small> servings</small></strong><em>Across all posted donations</em></div><div><span>Active donations</span><strong>{open.length.toString().padStart(2, "0")}</strong><em>Visible to nearby organisations</em></div><div><span>Awaiting pickup</span><strong>{claims.filter((claim) => ["confirmed", "pickup_scheduled"].includes(claim.status)).length.toString().padStart(2, "0")}</strong><em>{urgent ? `Next deadline at ${stamp(urgent.pickupDeadlineAt)}` : "No pickups scheduled"}</em></div></section>
    <div className="dashboard-columns">
      <section className="panel donations-panel"><div className="panel-heading"><div><h2>Your active donations</h2><p>Keep an eye on what is ready to move.</p></div><Link href="/donations" className="text-link">View all <span>↗</span></Link></div>
        <div className="donation-list">{open.slice(0, 3).map((donation, index) => <article className="donation-row" key={donation.id}><div className={`food-thumb food-thumb-${index}`}><Image src="/images/tasty-bowl.webp" width={180} height={140} alt="" /></div><div className="donation-copy"><span className="food-category">{CATEGORY_LABELS[donation.category]}</span><h3>{donation.title}</h3><p>{donation.servingsAvailable} servings left · {donation.pickupArea}</p></div><div className="donation-state"><span className={`status status-${donation.status}`}>{DONATION_STATUS_LABELS[donation.status]}</span><small>Pickup by {stamp(donation.pickupDeadlineAt)}</small></div></article>)}</div>
        <p className="sample-note">Preview workspace · seeded examples reset when the server restarts.</p>
      </section>
      <aside className="right-rail"><section className="urgent-panel"><div className="urgent-label"><i /> Upcoming pickup</div><h2>{urgent?.title ?? "No urgent pickups"}</h2><p>{urgent ? `${urgent.servingsAvailable} servings are ready for collection` : "New matches will appear here."}</p><div className="urgent-time"><span className="tiny-icon">◷</span><span>Pickup deadline<strong>{urgent ? stamp(urgent.pickupDeadlineAt) : "—"}</strong></span></div><Link href="/claims" className="urgent-link">Coordinate pickup <span>→</span></Link></section>
        <section className="activity-panel"><div className="panel-heading"><div><h2>Matching activity</h2><p>Nearby organisations are responding.</p></div></div><div className="activity-item"><span className="activity-avatar">HS</span><div><p><strong>Hope Shelter</strong> claimed 30 servings of vegetable biryani.</p><small>Today, 11:15 am</small></div></div><div className="activity-item"><span className="activity-avatar indigo">SK</span><div><p><strong>Sunrise Kitchen</strong> is a good fit for your produce crates.</p><small>Today, 10:42 am</small></div></div><Link href="/browse" className="text-link activity-link">See nearby matches <span>↗</span></Link></section></aside>
    </div>
    <section className="journey-banner"><div><span className="banner-overline">The handover, at a glance</span><h2>Good food is already on its way.</h2><p>Follow each pickup from the first claim to the final delivery.</p></div><div className="journey-steps"><span className="done">Posted</span><i /><span className="done">Claimed</span><i /><span className="current">Pickup scheduled</span><i /><span>Delivered</span></div><Link href="/claims" className="banner-link" aria-label="Track pickups">→</Link></section>
  </WorkspaceShell>;
}
