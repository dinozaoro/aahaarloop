import { env } from "@/config/env";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export interface ApiDonation {
  id: string;
  title: string;
  description?: string;
  status: string;
  category?: string;
  storage?: string;
  servingsTotal?: number;
  servingsAvailable?: number;
  pickupAddress?: string;
  pickupArea?: string;
  location?: { latitude: number; longitude: number };
  foodExpiryAt?: string;
  bestBeforeAt?: string;
  pickupDeadlineAt?: string;
  photoName?: string;
  organizationId?: string;
  updatedAt?: string;
}

export interface ApiClaim {
  id: string;
  donationId: string;
  recipientId: string;
  status: string;
  servings: number;
  createdAt?: string;
}

type ApiRequestOptions = RequestInit & { idempotencyKey?: string };

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (options.idempotencyKey) headers.set("idempotency-key", options.idempotencyKey);

  let response: Response;
  try {
    response = await fetch(`${env.apiUrl.replace(/\/$/, "")}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : "Network unavailable", 0);
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = text;
    }
  }
  if (!response.ok) {
    const object = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
    const nested = object.error && typeof object.error === "object" ? object.error as Record<string, unknown> : {};
    const message = String(nested.message ?? object.message ?? object.error ?? response.statusText ?? "Request failed");
    throw new ApiError(message, response.status, typeof nested.code === "string" ? nested.code : undefined);
  }
  return payload as T;
}

export function isOfflineError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 0;
}

export function formatDeadline(value?: string): string {
  if (!value) return "Pickup time to be confirmed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
}
