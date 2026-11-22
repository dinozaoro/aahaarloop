import { forbidUnlessRole } from "@/lib/auth/guards";
import { claimLifecycle } from "@/lib/claims/store-repository";

export const runtime = "nodejs";

/** Admin-triggered sweep; swap the guard for a cron secret when a scheduler exists. */
export async function POST() {
  const denied = await forbidUnlessRole(["admin"]);
  if (denied) return denied;
  return Response.json({ expired: await claimLifecycle.expire() });
}
