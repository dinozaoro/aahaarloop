import { z } from "zod";

import { auth } from "@/auth";
import { ApiError } from "@/lib/api/errors";
import { withApiHandler } from "@/lib/api/handler";
import { REPORT_REASONS } from "@/lib/moderation/reports";
import { moderationService } from "@/lib/moderation/store-repository";

export const runtime = "nodejs";

const schema = z.object({
  targetType: z.enum(["donation", "user"]),
  targetId: z.string().min(1),
  reason: z.enum(REPORT_REASONS),
  details: z.string().max(2000).optional(),
});

export const POST = withApiHandler({ bodySchema: schema }, async ({ body }) => {
  const session = await auth();
  if (!session?.user?.id) throw new ApiError("unauthorized", "Sign in required");
  const report = await moderationService.submit({
    ...body,
    reporterId: session.user.id,
  });
  return Response.json(report, { status: 201 });
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) throw new ApiError("unauthorized", "Sign in required");
  // Reporter view: AI authenticity is stripped by toReportView.
  return Response.json({ data: moderationService.list("reporter", session.user.id) });
}
