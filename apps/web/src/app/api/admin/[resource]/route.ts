import { forbidUnlessRole } from "@/lib/auth/guards";
import {
  ADMIN_RESOURCES,
  queryResource,
  type AdminResource,
} from "@/lib/admin/data";
import { adminRows } from "@/lib/admin/data-source";

export const runtime = "nodejs";

interface Params {
  params: Promise<{ resource: string }>;
}

export async function GET(request: Request, { params }: Params) {
  const denied = await forbidUnlessRole(["admin"]);
  if (denied) return denied;
  const { resource } = await params;
  if (!ADMIN_RESOURCES.includes(resource as AdminResource)) {
    return Response.json({ error: "Unknown resource" }, { status: 400 });
  }
  const url = new URL(request.url);
  const result = queryResource(resource as AdminResource, (await adminRows())[resource as AdminResource], {
    search: url.searchParams.get("search") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    page: Number(url.searchParams.get("page") ?? 1),
    pageSize: Number(url.searchParams.get("pageSize") ?? 20),
  });
  return Response.json(result);
}
