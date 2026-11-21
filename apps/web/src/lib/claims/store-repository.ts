import {
  findClaimByIdempotencyKey,
  getDonation,
  upsertClaim,
  upsertDonation,
} from "@/lib/data/store";

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
