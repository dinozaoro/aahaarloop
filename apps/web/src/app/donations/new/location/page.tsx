import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

import { DonationLocationForm } from "./donation-location-form";
import { WorkspaceShell } from "@/components/workspace-shell";

export const metadata: Metadata = {
  title: "Donation pickup location",
  alternates: { canonical: "/donations/new/location" },
};

export default function DonationLocationPage() {
  return (
    <WorkspaceShell><div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit">
          Step 3 of 3
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight">
          Pickup location and publish
        </h1>
        <p className="text-muted-foreground">
          Choose an exact pickup point, add contact instructions and review
          every field before the donation becomes available to recipients.
        </p>
      </div>
      <DonationLocationForm />
    </div></WorkspaceShell>
  );
}
