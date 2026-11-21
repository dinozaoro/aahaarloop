import { auth } from "@/auth";
import { ApiError } from "@/lib/api/errors";
import { withApiHandler } from "@/lib/api/handler";
import { type DonationPatch } from "@/lib/donations/service";
import { donationService } from "@/lib/donations/store-repository";
import { z } from "zod";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const user = session.user;
  const own = user.role === "donor" ? user.activeOrganizationId : undefined;
  try {
    return Response.json(donationService.get(id, own ?? undefined));
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json(
        { error: { code: error.code, message: error.message } },
        { status: error.code === "not_found" ? 404 : 403 },
      );
    }
    throw error;
  }
}

const patchSchema = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().max(2000).optional(),
    servingsAvailable: z.number().int().nonnegative().optional(),
    pickupAddress: z.string().trim().min(1).max(500).optional(),
  })
  .strict();

export const PATCH = withApiHandler(
  { bodySchema: patchSchema },
  async ({ body }, { request }) => {
    const session = await auth();
    if (!session?.user?.id) throw new ApiError("unauthorized", "Sign in required");
    if (session.user.role !== "donor" && session.user.role !== "admin") {
      throw new ApiError("forbidden", "Only donors can edit donations");
    }
    const id = new URL(request.url).pathname.split("/")[3];
    const donation = donationService.update(
      id,
      session.user.activeOrganizationId ?? "",
      session.user.id,
      body as DonationPatch,
    );
    return Response.json(donation);
  },
);
