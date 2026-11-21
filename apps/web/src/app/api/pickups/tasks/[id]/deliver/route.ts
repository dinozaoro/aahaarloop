import { auth } from "@/auth";
import { withApiHandler } from "@/lib/api/handler";
import { forbidUnlessRole } from "@/lib/auth/guards";
import { deliveryService } from "@/lib/delivery/store-repository";
import { z } from "zod";

export const runtime = "nodejs";

const deliverySchema = z.object({
  proof: z.object({
    type: z.enum(["signature", "photo"]),
    value: z.string().min(1),
  }),
  deliveredQuantity: z.number().positive(),
  discrepancyNote: z.string().trim().max(500).optional(),
});

export const POST = withApiHandler(
  { bodySchema: deliverySchema },
  async ({ body }, context) => {
    const denied = await forbidUnlessRole(["volunteer", "admin"]);
    if (denied) {
      return denied;
    }
    const session = await auth();
    const taskId =
      new URL(context.request.url).pathname.match(
        /\/pickups\/tasks\/([^/]+)\/deliver/,
      )?.[1] ?? "";
    return Response.json(
      deliveryService.confirm({
        taskId,
        volunteerId: session?.user?.id ?? "",
        ...body,
      }),
    );
  },
);
