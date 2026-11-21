import type { Metadata } from "next";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getDonationsForOrganization, getClaimsForDonor } from "@/lib/data/store";
import { DEMO_DONOR_ORG_ID } from "@/lib/data/constants";

export const metadata: Metadata = { title: "Impact" };

export default function ImpactPage() {
  const donations = getDonationsForOrganization(DEMO_DONOR_ORG_ID);
  const claims = getClaimsForDonor(DEMO_DONOR_ORG_ID);
  const servings = donations.reduce((sum, item) => sum + item.servingsTotal - item.servingsAvailable, 0);
  const kilograms = donations.reduce((sum, item) => sum + item.weightKg * ((item.servingsTotal - item.servingsAvailable) / Math.max(item.servingsTotal, 1)), 0);
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const count = donations.filter((item) => {
      const updated = new Date(item.updatedAt);
      return `${updated.getFullYear()}-${updated.getMonth()}` === key;
    }).reduce((sum, item) => sum + item.servingsTotal - item.servingsAvailable, 0);
    return { label: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(date), count };
  });
  const chartMax = Math.max(1, ...months.map((month) => month.count));
  const organisations = new Set(claims.map((claim) => claim.recipientOrgId)).size;
  return <WorkspaceShell><div className="page-heading"><div><p className="page-kicker">The value of what you share</p><h1>Your impact, made visible.</h1><p>Small surpluses add up when they reach the right people.</p></div><button className="outline-action">This month⌄</button></div>
    <section className="impact-highlight"><div><span>Estimated meals shared</span><strong>{servings.toLocaleString("en-IN")}</strong><p>Estimated from servings recorded across your donations.</p></div><div className="impact-mark">{organisations}<small>partner organisations</small></div></section>
    <section className="impact-stats"><article><span>Food redirected</span><strong>{kilograms.toFixed(0)} <small>kg</small></strong><p>Estimated from claimed quantities.</p></article><article><span>Completed handovers</span><strong>{claims.filter((item) => item.status === "delivered").length}</strong><p>Marked delivered by the recipient.</p></article><article><span>Organisations reached</span><strong>{organisations}</strong><p>Unique recipient organisations in preview claims.</p></article></section>
    <section className="trend-panel"><div className="panel-heading"><div><h2>Food rescued over time</h2><p>Recorded servings grouped by donation activity</p></div><span className="chart-legend"><i /> Servings</span></div><div className="chart-area" role="img" aria-label="Bar chart showing recorded rescued servings over the past six months"><div className="chart-y"><span>{chartMax}</span><span>{Math.round(chartMax * .66)}</span><span>{Math.round(chartMax * .33)}</span><span>0</span></div><div className="chart-bars">{months.map(({count, label})=><div className="chart-col" key={label}><div className="chart-bar" style={{height:`${count ? Math.max(8, count / chartMax * 100) : 0}%`}} /><span>{label}</span></div>)}</div></div><p className="chart-footnote">Seeded preview activity only; impact estimates are directional and not independently verified.</p></section>
  </WorkspaceShell>;
}
