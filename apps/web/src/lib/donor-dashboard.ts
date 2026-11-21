import type { Claim, Donation } from "@/lib/domain/types";

const ACTIVE_STATUSES = new Set(["published", "claimed", "pickup_scheduled"]);
const PICKUP_STATUSES = new Set(["confirmed", "pickup_scheduled"]);

export function buildDonorDashboard(donations: readonly Donation[], claims: readonly Claim[]) {
  const active = [...donations]
    .filter((donation) => ACTIVE_STATUSES.has(donation.status))
    .sort((a, b) => a.pickupDeadlineAt.localeCompare(b.pickupDeadlineAt));

  return {
    active,
    urgent: active[0],
    rescuedServings: donations.reduce(
      (total, donation) => total + donation.servingsTotal - donation.servingsAvailable,
      0,
    ),
    awaitingPickup: claims.filter((claim) => PICKUP_STATUSES.has(claim.status)),
  };
}
