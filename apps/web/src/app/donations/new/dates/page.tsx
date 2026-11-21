import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

import { DonationDatesForm } from "./donation-dates-form";
import { WorkspaceShell } from "@/components/workspace-shell";

export const metadata: Metadata = {
  title: "Donation dates and storage",
  alternates: { canonical: "/donations/new/dates" },
};

export default function DonationDatesPage() {
  return (
    <WorkspaceShell><div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit">
          Step 2 of 3
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight">
          Dates, storage and allergens
        </h1>
        <p className="text-muted-foreground">
          Separate the food-safety use-by date from the quality best-before date
          and the operational pickup deadline.
        </p>
      </div>
      <DonationDatesForm />
    </div></WorkspaceShell>
  );
}
