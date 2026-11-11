import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Recipient dashboard" };

export default function RecipientPage() {
  return (
    <ComingSoon
      issue={31}
      title="Recipient dashboard"
      description="Ranked matches with urgency, distance, quantity fit and claim actions arrive with the recipient dashboard issue."
    />
  );
}
