import { auth } from "@/auth";
import { ApiError } from "@/lib/api/errors";
import { notificationService } from "@/lib/notifications/store-repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) throw new ApiError("unauthorized", "Sign in required");
  const id = new URL(request.url).pathname.split("/")[3];
  return Response.json(notificationService.markRead(id, session.user.id));
}
