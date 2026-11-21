import type { Metadata } from "next";
import { DonationBasicsForm } from "./donation-basics-form";
import { WorkspaceShell } from "@/components/workspace-shell";

export const metadata: Metadata = { title: "Offer surplus food" };

const STEPS = ["Food details", "Timing & handling", "Pickup point"];

export default function NewDonationPage() {
  return (
    <WorkspaceShell><div className="site-shell max-w-4xl py-10 sm:py-14">
      <div className="max-w-2xl">
        <p className="eyebrow">Offer surplus</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Share what your kitchen has extra.</h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">A few practical details help a nearby organisation decide if it can collect in time.</p>
      </div>
      <ol aria-label="Donation steps" className="mt-8 grid grid-cols-3 border-y border-border py-4">
        {STEPS.map((step, index) => (
          <li key={step} aria-current={index === 0 ? "step" : undefined} className="flex items-center gap-2 pr-2 text-xs font-medium sm:text-sm">
            <span className={index === 0 ? "text-primary" : "text-muted-foreground"}>0{index + 1}</span>
            <span className={index === 0 ? "text-foreground" : "text-muted-foreground"}>{step}</span>
          </li>
        ))}
      </ol>
      <div className="mt-7"><DonationBasicsForm /></div>
    </div></WorkspaceShell>
  );
}
