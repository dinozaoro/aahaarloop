import type { Metadata } from "next";
import { DonationBasicsForm } from "./donation-basics-form";
import { WorkspaceShell } from "@/components/workspace-shell";

export const metadata: Metadata = { title: "Offer surplus food" };

const STEPS = ["Food details", "Pickup & handling"];

export default function NewDonationPage() {
  return (
    <WorkspaceShell><div className="site-shell new-donation-page py-10 sm:py-14">
      <div className="new-donation-heading">
        <p className="page-kicker">Bengaluru / Demo · Today, 5:45 PM</p>
        <h1>Share what’s good.</h1>
        <p>A quick listing now. A better destination next.</p>
      </div>
      <ol aria-label="Donation steps" className="donation-progress">
        {STEPS.map((step, index) => (
          <li key={step} aria-current={index === 0 ? "step" : undefined} className="flex items-center gap-2 pr-2 text-xs font-medium sm:text-sm">
            <span className={index === 0 ? "text-primary" : "text-muted-foreground"}>0{index + 1}</span>
            <span className={index === 0 ? "text-foreground" : "text-muted-foreground"}>{step}</span>
          </li>
        ))}
      </ol>
      <div className="donation-step-content"><DonationBasicsForm /></div>
    </div></WorkspaceShell>
  );
}
