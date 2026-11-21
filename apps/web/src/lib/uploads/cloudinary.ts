import { createHash, randomUUID } from "node:crypto";

import { z } from "zod";

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export const UploadRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(ALLOWED_IMAGE_TYPES),
  sizeBytes: z.number().int().positive().max(MAX_IMAGE_BYTES),
  donationId: z.string().uuid().optional(),
});
export type UploadRequest = z.infer<typeof UploadRequestSchema>;

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder?: string;
}

export interface SignedUpload {
  url: string;
  publicId: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

function extension(fileName: string): string {
  const value = fileName.split(".").pop()?.toLowerCase() ?? "";
  return /^(jpg|jpeg|png|webp)$/.test(value) ? value : "bin";
}

/** Direct-upload signature. The secret is only ever used to compute the hash. */
export function createCloudinarySigner(
  config: CloudinaryConfig,
  now: () => number = () => Math.floor(Date.now() / 1000),
) {
  const folder = config.folder ?? "aahaarloop/donations";
  return (request: UploadRequest): SignedUpload => {
    const publicId = `${folder}/${randomUUID()}.${extension(request.fileName)}`;
    const timestamp = now();
    const toSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}`;
    const signature = createHash("sha1")
      .update(`${toSign}${config.apiSecret}`)
      .digest("hex");
    return {
      url: `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
      publicId,
      apiKey: config.apiKey,
      timestamp,
      folder,
      signature,
    };
  };
}

export function cloudinaryConfigFromEnv(
  env: Record<string, string | undefined>,
): CloudinaryConfig {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary is not configured");
  }
  return {
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    apiSecret: CLOUDINARY_API_SECRET,
  };
}
