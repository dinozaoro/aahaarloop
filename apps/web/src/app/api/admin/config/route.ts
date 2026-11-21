import { z } from "zod";

import { forbidUnlessRole } from "@/lib/auth/guards";
import {
  getAdminConfig,
  getConfigVersion,
  updateAdminConfig,
} from "@/lib/config/admin-config";
import { withApiHandler } from "@/lib/api/handler";

export const runtime = "nodejs";

export async function GET() {
  const denied = await forbidUnlessRole(["admin"]);
  if (denied) return denied;
  return Response.json({ config: getAdminConfig(), version: getConfigVersion() });
}

const weight = z.number().min(0).finite();
const patchSchema = z.object({
  city: z.string().min(1).max(80).optional(),
  donorSegment: z.string().min(1).max(80).optional(),
  safetyBufferMinutes: z.number().min(0).finite().optional(),
  urgencyThresholds: z
    .object({
      criticalHours: z.number().positive().finite().optional(),
      highHours: z.number().positive().finite().optional(),
      mediumHours: z.number().positive().finite().optional(),
    })
    .optional(),
  matchingWeights: z
    .object({
      urgency: weight.optional(),
      distance: weight.optional(),
      quantity: weight.optional(),
      needs: weight.optional(),
      availability: weight.optional(),
      logistics: weight.optional(),
    })
    .optional(),
});

export const PATCH = withApiHandler({ bodySchema: patchSchema }, async ({ body }) => {
  const denied = await forbidUnlessRole(["admin"]);
  if (denied) return denied;
  const config = updateAdminConfig(body);
  return Response.json({ config, version: getConfigVersion() });
});
