import { getGatewayStatus } from "@/lib/ai/gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Free, read-only health check: no paid inference call is made here. */
export async function GET() {
  try {
    const status = await getGatewayStatus();
    return Response.json({ ok: true, ...status });
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
