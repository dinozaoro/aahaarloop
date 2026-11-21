import { auth } from "@/auth";
import { recordAudit } from "@/lib/audit/log";
import { ApiError } from "@/lib/api/errors";
import { withApiHandler } from "@/lib/api/handler";
import { getDb } from "@/lib/db";
import { donationService } from "@/lib/donations/store-repository";

export const runtime = "nodejs";

export const POST = withApiHandler({}, async (_input, { request }) => {
  const session = await auth();
  if (!session?.user?.id) throw new ApiError("unauthorized", "Sign in required");
  if (session.user.role !== "donor" && session.user.role !== "admin") {
    throw new ApiError("forbidden", "Only donors can publish donations");
  }
  const id = new URL(request.url).pathname.split("/")[3];
  const donation = donationService.publish(
    id,
    session.user.activeOrganizationId ?? "",
    session.user.id,
  );
  try {
    await recordAudit(await getDb(), {
      actorType: session.user.role === "admin" ? "admin" : "donor",
      actorId: session.user.id,
      action: "donation.publish",
      entityType: "donation",
      entityId: donation.id,
      after: { status: donation.status },
    });
  } catch {
    // Publishing already succeeded; audit availability must not undo it.
  }
  return Response.json(donation);
});
