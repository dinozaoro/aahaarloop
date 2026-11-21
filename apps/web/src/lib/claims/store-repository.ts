import {
  findClaimByIdempotencyKey,
  getClaim,
  getClaims,
  getDonation,
  upsertClaim,
  upsertDonation,
} from "@/lib/data/store";

import { createClaimLifecycle } from "./cancellation.ts";
import { createClaimService, type ClaimRepository } from "./transaction.ts";

function appendEvent(donationId: string, type: "claimed" | "edited", actor: string) {
  const donation = getDonation(donationId);
  if (!donation) return;
  upsertDonation({
    ...donation,
    events: [
      ...donation.events,
      { id: crypto.randomUUID(), at: new Date().toISOString(), type, actor },
    ],
  });
}

export const claimRepository: ClaimRepository = {
  findDonation: getDonation,
  findByIdempotencyKey: findClaimByIdempotencyKey,
  saveDonation: upsertDonation,
  saveClaim: upsertClaim,
  appendEvent,
};

export const claimService = createClaimService(claimRepository);

export const claimLifecycle = createClaimLifecycle({
  allClaims: getClaims,
  findClaim: getClaim,
  findDonation: getDonation,
  saveClaim: upsertClaim,
  saveDonation: upsertDonation,
  appendEvent(donationId, type, actor) {
    const donation = getDonation(donationId);
    if (!donation) return;
    upsertDonation({
      ...donation,
      events: [
        ...donation.events,
        { id: crypto.randomUUID(), at: new Date().toISOString(), type, actor },
      ],
    });
  },
});
