import { auditLogs } from "@aahaarloop/database";

import { parsePagination } from "@/lib/api/pagination";
import { withApiHandler } from "@/lib/api/handler";
import { forbidUnlessRole } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";
import { desc } from "drizzle-orm";
import { z } from "zod";

export const runtime = "nodejs";

const querySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  entityType: z.string().max(64).optional(),
});

/**
 * Admin-only, append-only audit trail. No POST/PATCH/DELETE export exists, so
 * the application cannot modify an entry — Next.js answers those with 405.
 */
export const GET = withApiHandler({ querySchema }, async (_input, { request }) => {
  const denied = await forbidUnlessRole(["admin"]);
  if (denied) return denied;

  const db = await getDb();
  const { page, limit, offset } = parsePagination(
    new URL(request.url).searchParams,
  );
  const entries = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      actorType: auditLogs.actorType,
      actorId: auditLogs.actorId,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      before: auditLogs.before,
      after: auditLogs.after,
      occurredAt: auditLogs.occurredAt,
    })
    .from(auditLogs)
    .orderBy(desc(auditLogs.occurredAt))
    .limit(limit)
    .offset(offset);

  return Response.json({ page, limit, offset, data: entries });
});
