import { z } from "zod";

import { auth } from "@/auth";
import { applyAdminAction } from "@/lib/admin/actions";
import { ApiError } from "@/lib/api/errors";
import { withApiHandler } from "@/lib/api/handler";
import { recordAudit } from "@/lib/audit/log";
import { forbidUnlessRole } from "@/lib/auth/guards";
import {
  getDonation,
  getOrganization,
  upsertDonation,
  upsertOrganization,
} from "@/lib/data/store";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

const bodySchema = z.object({
  action: z.enum(["unpublish_donation", "verify_organization"]),
  entityType: z.enum(["donation", "organization", "claim"]),
  entityId: z.string().min(1),
});

export const POST = withApiHandler({ bodySchema }, async ({ body }) => {
  const denied = await forbidUnlessRole(["admin"]);
  if (denied) return denied;
  const session = await auth();
  const actorId = session?.user?.id;
  if (!actorId) throw new ApiError("unauthorized", "Sign in required");

  const [donation, organization] = await Promise.all([
    getDonation(body.entityId),
    getOrganization(body.entityId),
  ]);
  const result = applyAdminAction(
    {
      findDonation: () => donation,
      saveDonation: upsertDonation,
      findOrganization: () => organization,
      saveOrganization: upsertOrganization,
      findClaim: () => undefined,
      audit: async (input) => {
        try {
          await recordAudit(await getDb(), {
            actorType: "admin",
            actorId: input.actorId,
            action: input.action,
            entityType: input.entityType,
            entityId: input.entityId,
            after: input.after,
          });
        } catch {
          // The action is committed; an unavailable audit backend must not undo it.
        }
      },
    },
    { ...body, actorId },
  );
  return Response.json(result);
});
