import { auth } from "@/auth";
import { ApiError } from "@/lib/api/errors";
import { withApiHandler } from "@/lib/api/handler";

export const runtime = "nodejs";

export const GET = withApiHandler({}, async () => {
  const session = await auth();
  if (!session?.user?.id) throw new ApiError("unauthorized", "Sign in required");
  return Response.json({
    user: {
      id: session.user.id,
      role: session.user.role,
      activeOrganizationId: session.user.activeOrganizationId ?? null,
    },
  });
});
