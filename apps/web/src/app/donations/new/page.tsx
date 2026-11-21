import { ComingSoon } from "@/components/coming-soon";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New donation" };

export default function NewDonationPage() {
  return (
    <ComingSoon
      issue={18}
      title="Create a donation"
      description="The under-one-minute food basics step, draft autosave and inline validation arrive with the donation creation issue."
    />
  );
}
