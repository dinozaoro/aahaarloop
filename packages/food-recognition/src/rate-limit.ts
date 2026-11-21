export interface RateLimiter {
  tryAcquire(key: string): boolean;
}

export interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
  now?: () => number;
}

interface WindowEntry {
  windowStart: number;
  count: number;
}

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const now = options.now ?? (() => Date.now());
  const windows = new Map<string, WindowEntry>();

  return {
    tryAcquire(key: string): boolean {
      const t = now();
      let entry = windows.get(key);
      if (!entry || t - entry.windowStart >= options.windowMs) {
        entry = { windowStart: t, count: 0 };
        windows.set(key, entry);
      }
      if (entry.count >= options.maxRequests) return false;
      entry.count++;
      return true;
    },
  };
}
