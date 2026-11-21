import { auth } from "@/auth";
import { forbidUnlessRole } from "@/lib/auth/guards";
import { pickupService } from "@/lib/pickups/store-repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const denied = await forbidUnlessRole(["volunteer", "admin"]);
  if (denied) {
    return denied;
  }
  const session = await auth();
  const taskId =
    new URL(request.url).pathname.match(/\/pickups\/tasks\/([^/]+)\/start/)?.[1] ?? "";
  return Response.json(pickupService.start(taskId, session?.user?.id ?? ""));
}
