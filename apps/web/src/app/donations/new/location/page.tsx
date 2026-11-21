import type { Metadata } from "next";

import { DonationLocationForm } from "./donation-location-form";
import { WorkspaceShell } from "@/components/workspace-shell";

export const metadata: Metadata = {
  title: "Pickup and handling",
  alternates: { canonical: "/donations/new/location" },
};

export default function DonationLocationPage() {
  return (
    <WorkspaceShell><div className="site-shell donation-step-page py-10 sm:py-14">
      <p className="page-kicker">Bengaluru / Demo · Today, 5:45 PM</p>
      <h1>A few details for a reliable pickup.</h1>
      <p className="donation-step-description">Step 2 of 2 · Add collection location and review the draft</p>
      <ol aria-label="Donation steps" className="donation-progress"><li><span aria-hidden="true">○</span> 1&nbsp; Food details</li><li aria-current="step"><span aria-hidden="true">●</span> 2&nbsp; Pickup &amp; handling</li></ol>
      <DonationLocationForm />
    </div></WorkspaceShell>
  );
}
