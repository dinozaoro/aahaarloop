import { z } from "zod";

import { auth } from "@/auth";
import { forbidUnlessRole } from "@/lib/auth/guards";
import { pickupService } from "@/lib/pickups/store-repository";

export const runtime = "nodejs";

export const POST = async (request: Request) => {
  const denied = await forbidUnlessRole(["admin"]);
  if (denied) return denied;
  const session = await auth();
  const taskId = new URL(request.url).pathname.split("/")[3];
  const { volunteerId } = z.object({ volunteerId: z.string().min(1) }).parse(await request.json());
  const assignment = await pickupService.assign(taskId, volunteerId, session?.user?.id ?? "admin");
  return Response.json(assignment, { status: 201 });
};
