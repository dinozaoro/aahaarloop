import { ProfileInputSchema } from "@aahaarloop/shared";

import { auth } from "@/auth";
import { ApiError } from "@/lib/api/errors";
import { withApiHandler } from "@/lib/api/handler";
import { forbidUnlessRole } from "@/lib/auth/guards";
import * as dal from "@/lib/data/dal";

export const runtime = "nodejs";

export const GET = withApiHandler({}, async () => {
  const denied = await forbidUnlessRole(["donor", "recipient", "volunteer", "admin"]);
  if (denied) return denied;
  const session = await auth();
  const user = session?.user;
  if (!user?.id) throw new ApiError("unauthorized", "Sign in required");
  const userId = user.id;
  const organizationId = user.activeOrganizationId;
  return Response.json({
    profile: {
      user_id: userId,
      role: user.role,
      active_organization_id: organizationId ?? null,
      organization: organizationId ? await dal.findOrganization(organizationId) : undefined,
      volunteer: await dal.findVolunteerProfile(userId),
    },
  });
});

export const PATCH = withApiHandler({ bodySchema: ProfileInputSchema }, async ({ body }) => {
  const denied = await forbidUnlessRole(["donor", "recipient", "volunteer", "admin"]);
  if (denied) return denied;
  const session = await auth();
  const user = session?.user;
  if (!user?.id) throw new ApiError("unauthorized", "Sign in required");
  if (body.role !== user.role) {
    throw new ApiError("forbidden", "Profile role must match the signed-in role");
  }
  await dal.saveProfile({
    userId: user.id,
    organizationId: user.activeOrganizationId,
    role: body.role,
    displayName: body.display_name,
    ...(body.phone ? { phone: body.phone } : {}),
    ...(body.address ? { address: body.address } : {}),
    ...("organization_name" in body && body.organization_name
      ? { organizationName: body.organization_name }
      : {}),
    ...("transport_capacity_kg" in body && body.transport_capacity_kg != null
      ? { transportCapacityKg: body.transport_capacity_kg }
      : {}),
    ...("dietary_flags" in body ? { dietaryFlags: body.dietary_flags } : {}),
    ...("allergens_avoided" in body ? { allergensAvoided: body.allergens_avoided } : {}),
  });
  return Response.json({ profile: { user_id: user.id, role: user.role } });
});
