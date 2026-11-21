import { z } from "zod";

import { auth } from "@/auth";
import { ApiError } from "@/lib/api/errors";
import { withApiHandler } from "@/lib/api/handler";
import { forbidUnlessRole } from "@/lib/auth/guards";
import { getAllDonations } from "@/lib/data/store";
import { favoriteService } from "@/lib/favorites/service";

export const runtime = "nodejs";

export async function GET() {
  const denied = await forbidUnlessRole(["recipient"]);
  if (denied) return denied;
  const session = await auth();
  const organizationId = session?.user?.activeOrganizationId;
  if (!session?.user?.id || !organizationId) {
    throw new ApiError("forbidden", "No active recipient organization");
  }
  return Response.json(favoriteService.list(session.user.id, organizationId, getAllDonations()));
}

const favoriteSchema = z.object({
  donationId: z.string().min(1),
  favorite: z.boolean(),
});

export const POST = withApiHandler({ bodySchema: favoriteSchema }, async ({ body }) => {
  const denied = await forbidUnlessRole(["recipient"]);
  if (denied) return denied;
  const session = await auth();
  const organizationId = session?.user?.activeOrganizationId;
  if (!session?.user?.id || !organizationId) {
    throw new ApiError("forbidden", "No active recipient organization");
  }
  const donation = getAllDonations().find((item) => item.id === body.donationId);
  if (!donation || donation.status !== "published") {
    throw new ApiError("not_found", "Donation is not available");
  }
  if (body.favorite) {
    return Response.json(favoriteService.add(session.user.id, organizationId, body.donationId), { status: 201 });
  }
  favoriteService.remove(session.user.id, body.donationId);
  return Response.json({ donationId: body.donationId, favorite: false });
});
