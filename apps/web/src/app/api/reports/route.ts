import { z } from "zod";

import { auth } from "@/auth";
import { ApiError } from "@/lib/api/errors";
import { withApiHandler } from "@/lib/api/handler";
import { createRateLimiter } from "@/lib/api/rate-limit";
import { REPORT_REASONS } from "@/lib/moderation/reports";
import { moderationService } from "@/lib/moderation/store-repository";

export const runtime = "nodejs";

// Report spam is an abuse vector: cap submissions per client per minute.
const reportLimit = createRateLimiter({ maxRequests: 10, windowMs: 60_000 });

const schema = z.object({
  targetType: z.enum(["donation", "user"]),
  targetId: z.string().min(1),
  reason: z.enum(REPORT_REASONS),
  details: z.string().max(2000).optional(),
});

export const POST = withApiHandler(
  { bodySchema: schema, rateLimit: reportLimit },
  async ({ body }) => {
    const session = await auth();
    if (!session?.user?.id) throw new ApiError("unauthorized", "Sign in required");
    const report = await moderationService.submit({
      ...body,
      reporterId: session.user.id,
    });
    return Response.json(report, { status: 201 });
  },
);

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) throw new ApiError("unauthorized", "Sign in required");
  // Reporter view: AI authenticity is stripped by toReportView.
  return Response.json({ data: moderationService.list("reporter", session.user.id) });
}
