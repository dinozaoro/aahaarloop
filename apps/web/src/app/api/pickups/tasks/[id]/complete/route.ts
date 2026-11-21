import { auth } from "@/auth";
import { forbidUnlessRole } from "@/lib/auth/guards";
import { pickupService } from "@/lib/pickups/store-repository";

export const runtime = "nodejs";

export const POST = async (request: Request) => {
  const denied = await forbidUnlessRole(["volunteer", "admin"]);
  if (denied) return denied;
  const session = await auth();
  const taskId = new URL(request.url).pathname.split("/")[3];
  const completed = pickupService.complete(taskId, session?.user?.id ?? "volunteer");
  return Response.json(completed);
};
