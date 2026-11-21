import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Donor dashboard" };

export default function DashboardPage() {
  return (
    <ComingSoon
      issue={17}
      title="Donor dashboard"
      description="Active donations, expiring-soon alerts, claims and impact stats arrive with the donor dashboard issue."
    />
  );
}
