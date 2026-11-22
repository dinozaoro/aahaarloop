import { ClaimInputSchema } from "@aahaarloop/shared";

import { auth } from "@/auth";
import { recordAudit } from "@/lib/audit/log";
import { ApiError } from "@/lib/api/errors";
import { withApiHandler } from "@/lib/api/handler";
import { createRateLimiter } from "@/lib/api/rate-limit";
import { forbidUnlessRole } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";
import { getClaimsForDonor, getClaimsForOrganization } from "@/lib/data/store";
import { claimService } from "@/lib/claims/store-repository";
import { telemetry } from "@/lib/telemetry/store-repository";
import { z } from "zod";

export const runtime = "nodejs";

const createLimit = createRateLimiter({ maxRequests: 20, windowMs: 60_000 });

export const GET = withApiHandler({}, async () => {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.activeOrganizationId) {
    return Response.json({ claims: [] });
  }
  const own = user.role === "donor"
    ? await getClaimsForDonor(user.activeOrganizationId)
    : user.role === "recipient"
      ? await getClaimsForOrganization(user.activeOrganizationId)
      : [];
  return Response.json({ claims: own });
});

const PartialClaimSchema = ClaimInputSchema.extend({
  items: z
    .array(
      z.object({
        donationItemId: z.string().uuid().optional(),
        name: z.string().trim().min(1).max(120),
        quantity: z.number().int().positive(),
      }),
    )
    .optional(),
});

export const POST = withApiHandler(
  { bodySchema: PartialClaimSchema, rateLimit: createLimit },
  async ({ body }, { request }) => {
    const denied = await forbidUnlessRole(["recipient"]);
    if (denied) return denied;
    const session = await auth();
    const user = session?.user;
    if (!user?.activeOrganizationId || body.recipient_id !== user.activeOrganizationId) {
      throw new ApiError("forbidden", "A recipient may only claim for its own organization");
    }
    const key = request.headers.get("idempotency-key");
    if (!key) throw new ApiError("validation_error", "idempotency-key header is required");

    const claim = await claimService.create({
      donationId: body.donation_id,
      recipientOrgId: body.recipient_id,
      servings: body.servings,
      ...(body.note ? { note: body.note } : {}),
      actorId: user.id,
      idempotencyKey: key,
      ...(body.items ? { items: body.items } : {}),
    });
    void telemetry.track(
      "donation_claimed",
      {
        servings: claim.servings,
        isPartial: Boolean(claim.items && claim.items.length > 0),
      },
      { eventId: `donation_claimed:${claim.id}` },
    );
    try {
      await recordAudit(await getDb(), {
        actorType: "recipient",
        actorId: user.id,
        action: "claim.create",
        entityType: "claim",
        entityId: claim.id,
        after: { donationId: claim.donationId, servings: claim.servings },
      });
    } catch {
      // The claim is committed; an unavailable audit backend must not undo it.
    }
    return Response.json(claim, { status: 201 });
  },
);
