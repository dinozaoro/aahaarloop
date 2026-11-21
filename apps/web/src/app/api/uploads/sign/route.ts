import { auth } from "@/auth";
import { ApiError } from "@/lib/api/errors";
import { withApiHandler } from "@/lib/api/handler";
import { createRateLimiter } from "@/lib/api/rate-limit";
import {
  cloudinaryConfigFromEnv,
  createCloudinarySigner,
  UploadRequestSchema,
} from "@/lib/uploads/cloudinary";

export const runtime = "nodejs";

const signLimit = createRateLimiter({ maxRequests: 20, windowMs: 60_000 });

export const POST = withApiHandler(
  { bodySchema: UploadRequestSchema, rateLimit: signLimit },
  async ({ body }) => {
    const session = await auth();
    if (!session?.user?.id) throw new ApiError("unauthorized", "Sign in required");
    if (session.user.role !== "donor" && session.user.role !== "admin") {
      throw new ApiError("forbidden", "Only donors can upload donation images");
    }
    let config;
    try {
      config = cloudinaryConfigFromEnv(process.env);
    } catch {
      throw new ApiError("internal_error", "Image uploads are unavailable");
    }
    return Response.json(createCloudinarySigner(config)(body));
  },
);
