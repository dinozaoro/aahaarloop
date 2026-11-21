import type { ImageAuthenticitySignal, ImageAuthenticityStatus } from "./types.ts";
import type { RateLimiter } from "./rate-limit.ts";

export interface SightengineResponse {
  status: string;
  type?: { ai_generated?: number };
  [key: string]: unknown;
}

export interface SightengineClient {
  check(input: { imageUrl: string }, options: { signal: AbortSignal }): Promise<SightengineResponse>;
}

export interface AuthenticityDeps {
  client: SightengineClient;
  timeoutMs?: number; // default 8000
  suspiciousThreshold?: number; // default 0.8
  limiter: RateLimiter;
  log?: (event: string, detail: Record<string, unknown>) => void;
}

export interface AuthenticityInput { donationId: string; imageUrl: string; }

export interface AuthenticityResult {
  status: ImageAuthenticityStatus;
  signal: ImageAuthenticitySignal | null;
}

// Pure helper, server-side only: the returned URL embeds the secret and must never be sent to a caller.
export function buildSightengineRequestUrl(apiUser: string, apiSecret: string, imageUrl: string): string {
  return "https://api.sightengine.com/1.0/check.json?models=genai"
    + `&api_user=${encodeURIComponent(apiUser)}`
    + `&api_secret=${encodeURIComponent(apiSecret)}`
    + `&url=${encodeURIComponent(imageUrl)}`;
}

const UNAVAILABLE: AuthenticityResult = { status: "unavailable", signal: null };

// A signal, never a verdict: never throws, and never blocks donation creation.
export async function checkImageAuthenticity(
  input: AuthenticityInput,
  deps: AuthenticityDeps,
): Promise<AuthenticityResult> {
  const timeoutMs = deps.timeoutMs ?? 8000;
  const threshold = deps.suspiciousThreshold ?? 0.8;

  const fail = (reason: string): AuthenticityResult => {
    try {
      deps.log?.("sightengine.failed", { donationId: input.donationId, reason });
    } catch {
      // Logging must not break the check.
    }
    return UNAVAILABLE;
  };

  try {
    if (!deps.limiter.tryAcquire(input.donationId)) {
      try {
        deps.log?.("sightengine.rate_limited", { donationId: input.donationId });
      } catch {
        // Logging must not break the check.
      }
      return UNAVAILABLE;
    }

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new Error("timeout"));
      }, timeoutMs);
    });

    try {
      const pending = deps.client.check({ imageUrl: input.imageUrl }, { signal: controller.signal });
      pending.catch(() => {}); // avoid unhandled rejection after the timeout wins
      const response = await Promise.race([pending, timeout]);
      if (response.status !== "success") return fail("provider_status");
      const score = response.type?.ai_generated;
      if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 1) {
        return fail("invalid_score");
      }
      return {
        status: score >= threshold ? "suspicious" : "clean",
        signal: { provider: "sightengine", score, signals: { ai_generated: score } },
      };
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    return fail(message.slice(0, 200));
  }
}
