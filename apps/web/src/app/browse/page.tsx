import type { Metadata } from "next";

import { WorkspaceShell } from "@/components/workspace-shell";
import { DEMO_RECIPIENT_ORG_ID } from "@/lib/data/constants";
import { getAllDonations, getOrganization } from "@/lib/data/store";

import { BrowseExperience } from "./browse-experience";

export const metadata: Metadata = { title: "Discover food" };

function distanceInKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = radians(b.latitude - a.latitude);
  const longitudeDelta = radians(b.longitude - a.longitude);
  const distance = 2 * 6371 * Math.asin(Math.sqrt(
    Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(longitudeDelta / 2) ** 2,
  ));
  return Math.round(distance * 10) / 10;
}

export default function BrowsePage() {
  const recipient = getOrganization(DEMO_RECIPIENT_ORG_ID);
  const offers = getAllDonations()
    .filter((donation) => donation.servingsAvailable > 0 && donation.status === "published")
    .map((donation) => {
      const donor = getOrganization(donation.organizationId);
      return {
        donation,
        donorName: donor?.name ?? "Food partner",
        distanceKm: recipient && donor ? distanceInKm(recipient.location, donor.location) : null,
        donorLocation: donor?.location ?? null,
      };
    });

  return <WorkspaceShell>
    <div className="page-heading browse-page-heading"><div><p className="page-kicker">Bengaluru / Demo · Today, {new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date())}</p><h1>Find food. Make room for possibility.</h1><p>Matches based on location, needs and collection times — not an unexplained score.</p></div></div>
    <BrowseExperience offers={offers} recipientLocation={recipient?.location ?? null} />
    <p className="sample-note">Preview workspace · availability and distances use seeded data for {getOrganization(DEMO_RECIPIENT_ORG_ID)?.area ?? "your area"}.</p>
  </WorkspaceShell>;
}
