import * as dal from "@/lib/data/dal";

import { createClaimLifecycle } from "./cancellation.ts";
import { createClaimService, type ClaimRepository } from "./transaction.ts";

export const claimRepository: ClaimRepository = {
  findDonation: dal.findDonation,
  findByIdempotencyKey: dal.findClaimByIdempotencyKey,
  commit: dal.commitClaim,
};

export const claimService = createClaimService(claimRepository);

export const claimLifecycle = createClaimLifecycle({
  allClaims: dal.listClaims,
  findClaim: dal.findClaim,
  findDonation: dal.findDonation,
  saveClaim: dal.saveClaim,
  saveDonation: dal.saveDonation,
  appendEvent: dal.appendDonationEvent,
});
