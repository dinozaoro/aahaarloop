import { ComingSoon } from "@/components/coming-soon";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Claims" };

export default function ClaimsPage() {
  return (
    <ComingSoon
      issue={36}
      title="Claim tracking"
      description="Recipient and donor claim views with status, next action and guarded cancellation arrive with the claim tracking issue."
    />
  );
}
