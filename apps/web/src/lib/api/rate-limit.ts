export interface RateLimitHook {
  tryAcquire(key: string): boolean;
}

export interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
  now?: () => number;
}

export function createRateLimiter(options: RateLimiterOptions): RateLimitHook {
  const now = options.now ?? (() => Date.now());
  const windows = new Map<string, { start: number; count: number }>();

  return {
    tryAcquire(key: string): boolean {
      const time = now();
      let window = windows.get(key);
      if (!window || time - window.start >= options.windowMs) {
        window = { start: time, count: 0 };
        windows.set(key, window);
      }
      if (window.count >= options.maxRequests) return false;
      window.count++;
      return true;
    },
  };
}
