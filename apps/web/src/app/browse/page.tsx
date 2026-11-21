import { ComingSoon } from "@/components/coming-soon";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Browse donations" };

export default function BrowsePage() {
  return (
    <ComingSoon
      issue={32}
      title="Browse donations"
      description="The full filter system with shareable URL state arrives with the donation browse issue."
    />
  );
}
