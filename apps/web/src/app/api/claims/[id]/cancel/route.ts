import { z } from "zod";

import { auth } from "@/auth";
import { recordAudit } from "@/lib/audit/log";
import { ApiError } from "@/lib/api/errors";
import { withApiHandler } from "@/lib/api/handler";
import { claimLifecycle } from "@/lib/claims/store-repository";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

const bodySchema = z.object({
  reason: z.string().trim().min(1).max(500),
});

export const POST = withApiHandler({ bodySchema }, async ({ body }, { request }) => {
  const session = await auth();
  if (!session?.user?.id) throw new ApiError("unauthorized", "Sign in required");
  const id = new URL(request.url).pathname.split("/")[3];
  const claim = await claimLifecycle.cancel(
    id,
    {
      id: session.user.id,
      role: session.user.role,
      organizationId: session.user.activeOrganizationId,
    },
    body.reason,
  );
  try {
    await recordAudit(await getDb(), {
      actorType: session.user.role,
      actorId: session.user.id,
      action: "claim.cancel",
      entityType: "claim",
      entityId: claim.id,
      after: { status: claim.status, reason: body.reason },
    });
  } catch {
    // Cancellation is committed; audit availability must not undo the release.
  }
  return Response.json(claim);
});
