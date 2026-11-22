import { DonationInputSchema } from "@aahaarloop/shared";

import { auth } from "@/auth";
import { recordAudit } from "@/lib/audit/log";
import { ApiError } from "@/lib/api/errors";
import { withApiHandler } from "@/lib/api/handler";
import { createRateLimiter } from "@/lib/api/rate-limit";
import { getDb } from "@/lib/db";
import { donationService } from "@/lib/donations/store-repository";
import { telemetry } from "@/lib/telemetry/store-repository";
import { z } from "zod";

export const runtime = "nodejs";

export async function currentActor() {
  const session = await auth();
  if (!session?.user?.id) throw new ApiError("unauthorized", "Sign in required");
  return session.user;
}

const createLimit = createRateLimiter({ maxRequests: 30, windowMs: 60_000 });

export const GET = withApiHandler(
  {
    querySchema: z.object({ organizationId: z.string().optional() }),
  },
  async () => {
    const user = await currentActor();
    const own = user.role === "donor" ? user.activeOrganizationId : undefined;
    return Response.json({ donations: await donationService.list(own ?? undefined) });
  },
);

export const POST = withApiHandler(
  { bodySchema: DonationInputSchema, rateLimit: createLimit },
  async ({ body }) => {
    const user = await currentActor();
    if (user.role !== "donor" && user.role !== "admin") {
      throw new ApiError("forbidden", "Only donors can create donations");
    }
    const donation = await donationService.create(
      body,
      user.activeOrganizationId ?? "",
      user.id,
    );
    void telemetry.track(
      "donation_created",
      {
        category: donation.category,
        servings: donation.servingsTotal,
        storage: donation.storage,
        hasPhoto: Boolean(donation.photoName),
      },
      { eventId: `donation_created:${donation.id}` },
    );
    try {
      await recordAudit(await getDb(), {
        actorType: user.role === "admin" ? "admin" : "donor",
        actorId: user.id,
        action: "donation.create",
        entityType: "donation",
        entityId: donation.id,
        after: { title: donation.title, status: donation.status },
      });
    } catch {
      // The donation is already persisted; a missing audit backend must not roll it back.
    }
    return Response.json(donation, { status: 201 });
  },
);
