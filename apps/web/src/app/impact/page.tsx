import type { Metadata } from "next";
import { WorkspaceShell } from "@/components/workspace-shell";
import { DEMO_DONOR_ORG_ID } from "@/lib/data/constants";
import { getClaimsForDonor, getOrganization } from "@/lib/data/store";

export const metadata: Metadata = { title: "Impact" };

const MONTHLY_GOAL_KG = 200;
const kgFormat = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const time = (value: string) => new Intl.DateTimeFormat("en-IN", { weekday: "short", hour: "numeric", minute: "2-digit" }).format(new Date(value));

export default function ImpactPage() {
  const claims = [...getClaimsForDonor(DEMO_DONOR_ORG_ID)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const delivered = claims.filter((claim) => claim.status === "delivered");
  const rescuedKg = delivered.reduce((sum, claim) => sum + claim.weightKg, 0);
  const meals = Math.round(rescuedKg / 0.3);
  const completedDonations = new Set(delivered.map((claim) => claim.donationId)).size;
  const organizations = new Set(delivered.map((claim) => claim.recipientOrgId)).size;
  const monthDelivered = delivered.filter((claim) => {
    const date = new Date(claim.updatedAt);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  const monthKg = monthDelivered.reduce((sum, claim) => sum + claim.weightKg, 0);

  return <WorkspaceShell><div className="impact-page">
    <div className="page-heading"><div><p className="page-kicker">Bengaluru / Demo</p><h1>Good food. A growing difference.</h1><p>Your kitchen’s impact · This month · Based on recorded handovers</p></div></div>
    <section className="impact-metrics" aria-label="Impact totals">
      <div><strong>{kgFormat.format(rescuedKg)}</strong><span>kg of food rescued</span></div>
      <div><strong>{meals.toLocaleString("en-IN")}</strong><span>Meals estimated</span></div>
      <div><strong>{completedDonations}</strong><span>Completed donations</span></div>
      <div><strong>{organizations}</strong><span>Organizations helped</span></div>
    </section>
    <div className="impact-content">
      <section className="impact-goal"><h2>A little closer, every day.</h2><strong>{kgFormat.format(monthKg)} / {MONTHLY_GOAL_KG} kg monthly goal</strong><div className="impact-progress" role="progressbar" aria-label="Monthly food rescue goal" aria-valuemin={0} aria-valuemax={MONTHLY_GOAL_KG} aria-valuenow={Math.min(monthKg, MONTHLY_GOAL_KG)}><span style={{ width: `${Math.min(100, monthKg / MONTHLY_GOAL_KG * 100)}%` }} /></div><p>{monthDelivered.length} completed {monthDelivered.length === 1 ? "handover" : "handovers"} recorded this month.</p><small>Meals are estimated at 0.3 kg per meal and rounded. Actual portions vary; these preview figures are not verified impact.</small></section>
      <section className="impact-story"><h2>The story behind the numbers</h2>{delivered.length ? delivered.slice(0, 5).map((claim) => { const recipient = getOrganization(claim.recipientOrgId); return <article key={claim.id}><time>{time(claim.updatedAt)}</time><h3>{claim.donationTitle} → {recipient?.name ?? claim.recipientName}</h3><p>{kgFormat.format(claim.weightKg)} kg rescued · {claim.servings} portions</p></article>; }) : <p className="dashboard-empty">Completed handovers will appear here.</p>}</section>
    </div>
  </div></WorkspaceShell>;
}
