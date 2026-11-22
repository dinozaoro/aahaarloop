import { auth } from "@/auth";
import { forbidUnlessRole } from "@/lib/auth/guards";
import { pickupService } from "@/lib/pickups/store-repository";
import { telemetry } from "@/lib/telemetry/store-repository";

export const runtime = "nodejs";

export const POST = async (request: Request) => {
  const denied = await forbidUnlessRole(["volunteer", "admin"]);
  if (denied) return denied;
  const session = await auth();
  const taskId = new URL(request.url).pathname.split("/")[3];
  const completed = pickupService.complete(taskId, session?.user?.id ?? "volunteer");
  void telemetry.track(
    "donation_delivered",
    { weightKg: completed.weightKg },
    { eventId: `donation_delivered:${completed.id}` },
  );
  return Response.json(completed);
};
