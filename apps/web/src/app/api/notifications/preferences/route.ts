import { z } from "zod";

import { auth } from "@/auth";
import { ApiError } from "@/lib/api/errors";
import { withApiHandler } from "@/lib/api/handler";
import { NOTIFICATION_TYPES } from "@/lib/notifications/service";
import { notificationService } from "@/lib/notifications/store-repository";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) throw new ApiError("unauthorized", "Sign in required");
  return Response.json(notificationService.getPreferences(session.user.id));
}

const patchSchema = z.object({
  channel: z.enum(["in_app", "email", "push"]).optional(),
  enabled: z.partialRecord(z.enum(NOTIFICATION_TYPES), z.boolean()).optional(),
});

export const PATCH = withApiHandler({ bodySchema: patchSchema }, async ({ body }) => {
  const session = await auth();
  if (!session?.user?.id) throw new ApiError("unauthorized", "Sign in required");
  return Response.json(
    notificationService.updatePreferences(session.user.id, body),
  );
});
