import { z } from "zod";

import { auth } from "@/auth";
import { ApiError } from "@/lib/api/errors";
import { withApiHandler } from "@/lib/api/handler";
import { forbidUnlessRole } from "@/lib/auth/guards";
import {
  getAdminConfig,
  getConfigVersion,
  onConfigChange,
  toMatchingConfig,
} from "@/lib/config/admin-config";
import {
  getAllDonations,
  getNeedsForOrganization,
  getOrganization,
} from "@/lib/data/store";
import {
  createMatchCache,
  rankMatches,
} from "@/lib/matching/ranked-matches";

export const runtime = "nodejs";

const querySchema = z.object({
  category: z.string().max(80).optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

const cache = createMatchCache(30_000);
onConfigChange(() => cache.invalidateAll());

export const GET = withApiHandler({ querySchema }, async ({ query }) => {
  const denied = await forbidUnlessRole(["recipient"]);
  if (denied) return denied;

  const session = await auth();
  const organizationId = session?.user?.activeOrganizationId;
  if (!organizationId) {
    throw new ApiError("forbidden", "No active recipient organization");
  }
  const organization = getOrganization(organizationId);
  if (!organization) throw new ApiError("not_found", "Organization not found");

  const key = [
    organizationId,
    getConfigVersion(),
    query.category ?? "",
    query.minScore ?? "",
    query.page,
    query.pageSize,
  ].join(":");
  const cached = cache.get<Awaited<ReturnType<typeof rankMatches>>>(key);
  if (cached) return Response.json(cached);

  const ranked = rankMatches(
    organization,
    getNeedsForOrganization(organizationId),
    getAllDonations(),
    query,
    new Date().toISOString(),
    toMatchingConfig(getAdminConfig()),
  );
  cache.set(key, ranked);
  return Response.json(ranked);
});
