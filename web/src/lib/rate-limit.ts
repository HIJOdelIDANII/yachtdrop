/**
 * Simple in-memory sliding-window rate limiter for API routes.
 *
 * Uses a Map of IP → timestamp[] to track requests. Old timestamps
 * outside the window are pruned on each check. Not suitable for
 * multi-instance deployments (use Redis for that), but fine for
 * Vercel serverless where each function instance has its own memory.
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 10 });
 *   // In your route handler:
 *   const result = limiter.check(request);
 *   if (!result.allowed) return Response.json({ error: "Too many requests" }, { status: 429 });
 */

interface RateLimiterOptions {
  windowMs: number;     // Time window in milliseconds
  maxRequests: number;  // Max requests per window per IP
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;      // Unix timestamp when the window resets
}

const ipMap = new Map<string, number[]>();

// Periodic cleanup to prevent memory leaks from old IPs
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  const cutoff = now - windowMs;
  for (const [ip, timestamps] of ipMap) {
    const valid = timestamps.filter((t) => t > cutoff);
    if (valid.length === 0) {
      ipMap.delete(ip);
    } else {
      ipMap.set(ip, valid);
    }
  }
}

export function createRateLimiter({ windowMs, maxRequests }: RateLimiterOptions) {
  return {
    check(request: Request): RateLimitResult {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";

      const now = Date.now();
      const cutoff = now - windowMs;

      cleanup(windowMs);

      const timestamps = (ipMap.get(ip) || []).filter((t) => t > cutoff);
      timestamps.push(now);
      ipMap.set(ip, timestamps);

      const allowed = timestamps.length <= maxRequests;
      const remaining = Math.max(0, maxRequests - timestamps.length);
      const resetAt = timestamps.length > 0 ? timestamps[0] + windowMs : now + windowMs;

      return { allowed, remaining, resetAt };
    },
  };
}

/** Pre-configured limiter for order creation: 5 orders per minute per IP */
export const orderRateLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 5,
});

/** Pre-configured limiter for search: 60 requests per minute per IP */
export const searchRateLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 60,
});
