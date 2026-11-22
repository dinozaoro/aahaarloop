import { auditLogs } from "@aahaarloop/database";

import { withApiHandler } from "@/lib/api/handler";
import { forbidUnlessRole } from "@/lib/auth/guards";
import { getDb } from "@/lib/db";
import { desc } from "drizzle-orm";

export const runtime = "nodejs";

/** Admin-only audit trail; demonstrates RBAC and the shared API wrapper. */
export const GET = withApiHandler({}, async () => {
  const denied = await forbidUnlessRole(["admin"]);
  if (denied) return denied;

  const db = await getDb();
  const entries = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      actorType: auditLogs.actorType,
      actorId: auditLogs.actorId,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      after: auditLogs.after,
      occurredAt: auditLogs.occurredAt,
    })
    .from(auditLogs)
    .orderBy(desc(auditLogs.occurredAt))
    .limit(50);

  return Response.json({ entries });
});
