import Link from "next/link";
import type { Metadata } from "next";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getDonationsForOrganization } from "@/lib/data/store";
import { DEMO_DONOR_ORG_ID } from "@/lib/data/constants";
import { CATEGORY_LABELS, DONATION_STATUS_LABELS } from "@/lib/domain/types";

export const metadata: Metadata = { title: "My donations" };

export default function DonationsPage() {
  const donations = [...getDonationsForOrganization(DEMO_DONOR_ORG_ID)].sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  return <WorkspaceShell><div className="page-heading"><div><p className="page-kicker">Your kitchen’s activity</p><h1>My donations</h1><p>Every offer, from the first post to the final handover.</p></div><Link href="/donations/new" className="primary-action">Post surplus</Link></div>
    <div className="table-panel"><div className="donation-table"><div className="table-head"><span>Food</span><span>Quantity</span><span>Pickup deadline</span><span>Status</span><span /></div>{donations.map((item) => <Link className="table-row" key={item.id} href={`/donations/${item.id}`}><span className="table-food"><span className="table-thumb" aria-hidden="true">{CATEGORY_LABELS[item.category].slice(0, 1)}</span><span><small>{CATEGORY_LABELS[item.category]}</small><strong>{item.title}</strong></span></span><span>{item.servingsAvailable} servings</span><span>{new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(item.pickupDeadlineAt))}</span><span className={`status status-${item.status}`}>{DONATION_STATUS_LABELS[item.status]}</span></Link>)}</div><p className="sample-note">Preview workspace · donation examples are seeded and reset when the server restarts.</p></div>
  </WorkspaceShell>;
}
