import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Read-only proof that the pooled Neon connection works at runtime. */
export async function GET() {
  try {
    const db = await getDb();
    const result = await db.execute(sql`select 1 as ok`);
    const rows = (result as unknown as { rows?: Array<{ ok: number }> }).rows;
    return Response.json({ ok: rows?.[0]?.ok === 1 });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 503 },
    );
  }
}
