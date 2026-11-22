import { forbidUnlessRole } from "@/lib/auth/guards";
import { moderationService } from "@/lib/moderation/store-repository";

export const runtime = "nodejs";

export async function GET() {
  const denied = await forbidUnlessRole(["admin"]);
  if (denied) return denied;
  // Admin view: includes AI authenticity signals.
  return Response.json({ data: await moderationService.list("admin") });
}
