import type { Need } from "@/lib/domain/types";

import { auth } from "@/auth";
import { ApiError } from "@/lib/api/errors";
import { withApiHandler } from "@/lib/api/handler";
import { forbidUnlessRole } from "@/lib/auth/guards";
import * as dal from "@/lib/data/dal";
import { z } from "zod";

export const runtime = "nodejs";

const NeedBodySchema = z.object({
  id: z.string().uuid().optional(),
  category: z.enum([
    "produce",
    "bakery",
    "dairy",
    "prepared",
    "pantry",
    "beverages",
    "other",
  ]),
  servings: z.number().int().positive(),
  deadline_at: z.string().datetime({ offset: true }),
  notes: z.string().trim().max(500).default(""),
});

async function recipient() {
  const denied = await forbidUnlessRole(["recipient"]);
  if (denied) throw new ApiError("forbidden", "Recipient role required");
  const session = await auth();
  const organizationId = session?.user?.activeOrganizationId;
  if (!session?.user?.id || !organizationId) {
    throw new ApiError("forbidden", "No active recipient organization");
  }
  return { userId: session.user.id, organizationId };
}

export const GET = withApiHandler({}, async () => {
  const { organizationId } = await recipient();
  return Response.json({
    organizationId,
    needs: await dal.listNeeds(organizationId),
  });
});

export const POST = withApiHandler(
  { bodySchema: NeedBodySchema },
  async ({ body }) => {
    const { userId, organizationId } = await recipient();
    const need: Need = {
      id: crypto.randomUUID(),
      organizationId,
      category: body.category,
      servings: body.servings,
      deadlineAt: body.deadline_at,
      // shortcut: priority is derived from the deadline by the DAL.
      priority: "normal",
      notes: body.notes,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await dal.saveNeed(need, userId);
    return Response.json({ need }, { status: 201 });
  },
);

export const PATCH = withApiHandler(
  { bodySchema: NeedBodySchema.required({ id: true }) },
  async ({ body }) => {
    const { userId, organizationId } = await recipient();
    const id = body.id as string;
    const current = (await dal.listNeeds(organizationId)).find((need) => need.id === id);
    if (!current) throw new ApiError("not_found", "Need not found");
    const need: Need = {
      ...current,
      category: body.category,
      servings: body.servings,
      deadlineAt: body.deadline_at,
      notes: body.notes,
      updatedAt: new Date().toISOString(),
    };
    await dal.saveNeed(need, userId);
    return Response.json({ need });
  },
);

export const DELETE = withApiHandler({}, async (_, { request }) => {
  const { organizationId } = await recipient();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) throw new ApiError("validation_error", "Need id is required");
  const current = (await dal.listNeeds(organizationId)).find((need) => need.id === id);
  if (!current) throw new ApiError("not_found", "Need not found");
  await dal.closeNeed(id);
  return Response.json({ id });
});
