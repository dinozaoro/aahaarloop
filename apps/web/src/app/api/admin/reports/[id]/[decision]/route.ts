import { z } from "zod";

import { auth } from "@/auth";
import { ApiError } from "@/lib/api/errors";
import { withApiHandler } from "@/lib/api/handler";
import { forbidUnlessRole } from "@/lib/auth/guards";
import { moderationService } from "@/lib/moderation/store-repository";

export const runtime = "nodejs";

const schema = z.object({ note: z.string().max(2000).optional() });

interface Params {
  params: Promise<{ id: string; decision: string }>;
}

const decisions = ["resolve", "dismiss"] as const;

export const POST = (request: Request, context: Params) =>
  withApiHandler({ bodySchema: schema }, async ({ body }) => {
    const denied = await forbidUnlessRole(["admin"]);
    if (denied) return denied;
    const { id, decision } = await context.params;
    if (!decisions.includes(decision as (typeof decisions)[number])) {
      throw new ApiError("validation_error", "Unknown moderation decision");
    }
    const session = await auth();
    if (!session?.user?.id) throw new ApiError("unauthorized", "Sign in required");
    const report = await moderationService.decide(
      id,
      decision as (typeof decisions)[number],
      { id: session.user.id, role: "admin" },
      body.note,
    );
    return Response.json(report);
  })(request);
