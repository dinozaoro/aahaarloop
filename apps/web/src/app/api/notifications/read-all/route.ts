import { auth } from "@/auth";
import { ApiError } from "@/lib/api/errors";
import { notificationService } from "@/lib/notifications/store-repository";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) throw new ApiError("unauthorized", "Sign in required");
  return Response.json({ updated: await notificationService.markAllRead(session.user.id) });
}
