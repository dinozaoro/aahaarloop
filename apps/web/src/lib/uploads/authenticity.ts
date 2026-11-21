import {
  buildSightengineRequestUrl,
  checkImageAuthenticity,
  createRateLimiter,
  type AuthenticityResult,
  type SightengineClient,
  type SightengineResponse,
} from "@aahaarloop/food-recognition";

import { logStructured } from "../monitoring/log.ts";

export type SightengineEnv = Record<string, string | undefined>;

const limiter = createRateLimiter({ maxRequests: 30, windowMs: 60_000 });
const results = new Map<string, AuthenticityResult>();

export function getAuthenticity(
  donationId: string,
): AuthenticityResult | undefined {
  return results.get(donationId);
}

export function createSightengineClient(
  env: SightengineEnv,
): SightengineClient | null {
  const { SIGHTENGINE_API_USER: user, SIGHTENGINE_API_SECRET: secret } = env;
  if (!user || !secret) {
    return null;
  }
  return {
    async check({ imageUrl }, { signal }) {
      const response = await fetch(
        buildSightengineRequestUrl(user, secret, imageUrl),
        {
          signal,
        },
      );
      if (!response.ok) {
        throw new Error(`Sightengine returned ${response.status}`);
      }
      return (await response.json()) as SightengineResponse;
    },
  };
}

/**
 * Never blocks publishing: a missing key, timeout or provider failure all
 * resolve to an `unavailable` signal with no personal data in logs.
 */
export async function analyzeDonationImage(
  donationId: string,
  imageUrl: string,
  env: SightengineEnv = process.env,
): Promise<AuthenticityResult> {
  const client = createSightengineClient(env);
  if (!client) {
    return { status: "unavailable", signal: null };
  }
  const result = await checkImageAuthenticity(
    { donationId, imageUrl },
    {
      client,
      limiter,
      log: (event, detail) => logStructured(event, detail),
    },
  );
  results.set(donationId, result);
  return result;
}
