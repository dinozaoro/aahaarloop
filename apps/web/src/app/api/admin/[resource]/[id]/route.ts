import { forbidUnlessRole } from "@/lib/auth/guards";
import {
  ADMIN_RESOURCES,
  resourceDetail,
  type AdminResource,
} from "@/lib/admin/data";
import { adminRows } from "@/lib/admin/data-source";

export const runtime = "nodejs";

interface Params {
  params: Promise<{ resource: string; id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const denied = await forbidUnlessRole(["admin"]);
  if (denied) return denied;
  const { resource, id } = await params;
  if (!ADMIN_RESOURCES.includes(resource as AdminResource)) {
    return Response.json({ error: "Unknown resource" }, { status: 400 });
  }
  try {
    const row = resourceDetail((await adminRows())[resource as AdminResource], id);
    return Response.json(row);
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
}
