import { getGatewayStatus } from "@/lib/ai/gateway";
import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Single probe for uptime checks: database plus branch-scoped AI Gateway. */
export async function GET() {
  const checks: Record<string, unknown> = {};

  try {
    const db = await getDb();
    await db.execute(sql`select 1`);
    checks.database = { ok: true };
  } catch (error) {
    checks.database = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  try {
    checks.aiGateway = { ok: true, ...(await getGatewayStatus()) };
  } catch (error) {
    checks.aiGateway = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const ok = Object.values(checks).every(
    (check) => (check as { ok?: boolean }).ok === true,
  );
  return Response.json(
    { ok, at: new Date().toISOString(), checks },
    { status: ok ? 200 : 503 },
  );
}
