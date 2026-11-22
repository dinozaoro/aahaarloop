import { z } from "zod";

import { forbidUnlessRole } from "@/lib/auth/guards";
import { getClaim, getDonation } from "@/lib/data/store";
import { ApiError } from "@/lib/api/errors";
import { withApiHandler } from "@/lib/api/handler";
import { listPickupTasks, pickupService } from "@/lib/pickups/store-repository";

export const runtime = "nodejs";

export async function GET() {
  const denied = await forbidUnlessRole(["volunteer", "admin"]);
  if (denied) return denied;
  return Response.json({ tasks: await listPickupTasks() });
}

export const POST = withApiHandler(
  { bodySchema: z.object({ claimId: z.string().min(1) }) },
  async ({ body }) => {
    const denied = await forbidUnlessRole(["admin", "recipient"]);
    if (denied) return denied;
    const claim = await getClaim(body.claimId);
    if (!claim) throw new ApiError("not_found", "Claim not found");
    const donation = await getDonation(claim.donationId);
    if (!donation) throw new ApiError("not_found", "Donation not found");
    return Response.json(await pickupService.generateForClaim(claim, donation), { status: 201 });
  },
);
