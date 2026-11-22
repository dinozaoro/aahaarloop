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

/** Interface for a mobile API donation. */
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

/** Interface for a mobile API claim. */
export interface ApiClaim {
  id: string;
  donationId: string;
  recipientId: string;
  status: string;
  servings: number;
  createdAt?: string;
}

/** Result of getting a mobile auth token. */
export interface MobileAuthResult {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    role?: string | null;
    activeOrganizationId?: string | null;
  };
}

// Auth.js session cookie handed off by the web app after Google sign-in.
let sessionCookie: string | null = null;
export function setSessionCookie(cookie: string | null) {
  sessionCookie = cookie;
}

/** Options for API requests. */
type ApiRequestOptions = RequestInit & {
  idempotencyKey?: string;
  /** Optional bearer token for authenticated requests. */
  authToken?: string;
};

/** Fetch from the API with optional auth token and error handling. */
export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (sessionCookie) headers.set("Cookie", sessionCookie);

  // Set authorization header if token provided
  if (options.authToken) {
    headers.set("Authorization", `Bearer ${options.authToken}`);
  }

  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const base = env.apiUrl.replace(/\/$/, "");
  const url = `${base}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
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

/** Check if the error is an offline/network error (no credentials sent). */
export function isOfflineError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 0;
}

/** Format a deadline date string for display. */
export function formatDeadline(value?: string): string {
  if (!value) return "Pickup time to be confirmed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
}

/** Get a mobile auth token from the API. */
export async function getMobileAuthToken(): Promise<MobileAuthResult> {
  return apiFetch<MobileAuthResult>("/api/mobile-token");
}

/** Register a push notification token for the current user. */
export async function registerPushToken(token: string, platform: "ios" | "android" = "android"): Promise<{ success: boolean }> {
  const response = await fetch(`${env.apiUrl}/api/push-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(sessionCookie ? { Cookie: sessionCookie } : {}),
      ...(env.apiUrl.includes("localhost") || env.apiUrl.includes("10.0.2.2")
        ? {}
        : { "x-expo-token": token }),
    },
    body: JSON.stringify({ token, platform }),
    credentials: "include",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new ApiError(data.message || "Failed to register push token", response.status);
  }
  return { success: true };
}