import type { Metadata } from "next";
import { Circle, CircleDot } from "lucide-react";

import { DonationDatesForm } from "./donation-dates-form";
import { WorkspaceShell } from "@/components/workspace-shell";
import { DonationLocationForm } from "../location/donation-location-form";

export const metadata: Metadata = {
  title: "Pickup and handling",
  alternates: { canonical: "/donations/new/dates" },
};

export default function DonationDatesPage() {
  return (
    <WorkspaceShell><div className="site-shell donation-step-page py-10 sm:py-14">
      <p className="page-kicker">Bengaluru / Demo · Today, 5:45 PM</p>
      <h1>A few details for a reliable pickup.</h1>
      <p className="donation-step-description">Step 2 of 2 · Food details saved as a draft</p>
      <ol aria-label="Donation steps" className="donation-progress"><li><Circle aria-hidden="true" size={12} /> 1&nbsp; Food details</li><li aria-current="step"><CircleDot aria-hidden="true" size={12} /> 2&nbsp; Pickup &amp; handling</li></ol>
      <div className="donation-pickup-grid"><div><DonationDatesForm /></div><div id="pickup-location"><DonationLocationForm /></div></div>
    </div></WorkspaceShell>
  );
}
