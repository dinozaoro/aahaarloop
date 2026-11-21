import {
  getAllDonations,
  getDonation,
  upsertDonation,
} from "@/lib/data/store";

import { createDonationService } from "./service.ts";

export const donationService = createDonationService({
  all: getAllDonations,
  find: getDonation,
  save: upsertDonation,
});
