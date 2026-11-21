import { auth } from "@/auth";
import { forbidUnlessRole } from "@/lib/auth/guards";
import { pickupService } from "@/lib/pickups/store-repository";

export const runtime = "nodejs";

/** A volunteer takes a mission that was offered to them. */
export async function POST(request: Request) {
  const denied = await forbidUnlessRole(["volunteer", "admin"]);
  if (denied) {
    return denied;
  }
  const session = await auth();
  const taskId =
    new URL(request.url).pathname.match(/\/pickups\/tasks\/([^/]+)\/accept/)?.[1] ?? "";
  const assignment = pickupService.assign(
    taskId,
    session?.user?.id ?? "",
    session?.user?.id ?? "",
  );
  return Response.json(assignment, { status: 201 });
}
