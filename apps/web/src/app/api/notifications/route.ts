import { auth } from "@/auth";
import { ApiError } from "@/lib/api/errors";
import { notificationService } from "@/lib/notifications/store-repository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) throw new ApiError("unauthorized", "Sign in required");
  const params = new URL(request.url).searchParams;
  return Response.json(
    await notificationService.list(session.user.id, {
      page: Number(params.get("page") ?? 1),
      pageSize: Number(params.get("pageSize") ?? 20),
      unreadOnly: params.get("unread") === "1",
    }),
  );
}
