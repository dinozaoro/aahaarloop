import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Donations" };

export default function DonationsPage() {
  return (
    <ComingSoon
      issue={25}
      title="Donation management"
      description="The donation list, detail timeline, edit and cancel actions arrive with the donation management issue."
    />
  );
}
