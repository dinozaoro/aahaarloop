import { listGatewayModels } from "@/lib/ai/gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Read-only health check for the branch-scoped Neon AI Gateway. */
export async function GET() {
  try {
    const models = await listGatewayModels();
    return Response.json({
      ok: true,
      count: models.length,
      models: models.map((model) => ({
        id: model.id,
        enabled: model.enabled,
        ownedBy: model.owned_by,
        unavailableReason: model.unavailable_reason,
      })),
    });
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
