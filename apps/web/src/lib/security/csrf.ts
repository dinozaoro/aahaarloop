const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function isUnsafeMethod(method: string): boolean {
  return UNSAFE_METHODS.has(method.toUpperCase());
}

/**
 * Browser cross-site requests always carry an Origin header. A missing Origin
 * means a non-browser client (curl, mobile app); a present Origin must match
 * the request host. A malformed Origin is treated as cross-origin.
 */
export function isCrossOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const originHost = new URL(origin).host;
    const hosts = new Set([new URL(request.url).host]);
    const forwarded = request.headers
      .get("x-forwarded-host")
      ?.split(",")[0]
      ?.trim();
    if (forwarded) hosts.add(forwarded);
    return !hosts.has(originHost);
  } catch {
    return true;
  }
}
