import { getAllDonations, getClaims, getOrganizations } from "@/lib/data/store";
import { listPickupTasks } from "@/lib/pickups/store-repository";

import type { AdminResource } from "./data.ts";

export type AdminRow = Record<string, unknown> & { id: string };

/** Aggregates the in-memory stores into flat, display-ready admin rows. */
export function adminRows(): Record<AdminResource, AdminRow[]> {
  const users: AdminRow[] = [];
  const organizations = getOrganizations().map((organization) => ({
    id: organization.id,
    name: organization.name,
    kind: organization.kind,
    area: organization.area,
    verified: organization.verified,
  }));
  const donations = getAllDonations().map((donation) => ({
    id: donation.id,
    title: donation.title,
    status: donation.status,
    category: donation.category,
    pickupArea: donation.pickupArea,
    organizationId: donation.organizationId,
  }));
  const claims = getClaims().map((claim) => ({
    id: claim.id,
    donationTitle: claim.donationTitle,
    status: claim.status,
    recipientName: claim.recipientName,
    servings: claim.servings,
  }));
  const missions = listPickupTasks().map((task) => ({
    id: task.id,
    donationId: task.donationId,
    status: task.status,
    address: task.address,
    volunteerId: null,
  }));

  return { users, organizations, donations, claims, missions };
}
