import type { Context, Next } from 'hono';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store for rate limiting
// For production with multiple instances, use Redis instead
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum requests per window
  keyGenerator?: (c: Context) => string; // Custom key generator
  message?: string; // Custom error message
}

/**
 * Rate limiting middleware factory
 * @param options Rate limit configuration
 */
export function rateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    keyGenerator = (c) => c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
    message = 'Too many requests, please try again later',
  } = options;

  return async (c: Context, next: Next) => {
    const key = keyGenerator(c);
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt < now) {
      // Create new entry or reset expired one
      entry = {
        count: 1,
        resetAt: now + windowMs,
      };
      rateLimitStore.set(key, entry);
    } else {
      entry.count++;
    }

    // Set rate limit headers
    const remaining = Math.max(0, max - entry.count);
    const resetTime = Math.ceil(entry.resetAt / 1000);

    c.header('X-RateLimit-Limit', max.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', resetTime.toString());

    if (entry.count > max) {
      c.header('Retry-After', Math.ceil((entry.resetAt - now) / 1000).toString());
      console.warn(`[RATE_LIMIT] Exceeded for key: ${key}, count: ${entry.count}`);
      return c.json({ success: false, error: message }, 429);
    }

    await next();
  };
}

// Pre-configured rate limiters for common use cases

/**
 * Failed login limiter — only counts failed attempts, not successful ones.
 * 5 failed attempts per 15 minutes per IP.
 */
const failedLoginStore = new Map<string, { count: number; resetAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of failedLoginStore.entries()) {
    if (entry.resetAt < now) failedLoginStore.delete(key);
  }
}, 5 * 60 * 1000);

export const loginFailRateLimit = {
  check(ip: string): boolean {
    const entry = failedLoginStore.get(ip);
    if (!entry || entry.resetAt < Date.now()) return false;
    return entry.count >= 5;
  },
  record(ip: string): void {
    const now = Date.now();
    const entry = failedLoginStore.get(ip);
    if (!entry || entry.resetAt < now) {
      failedLoginStore.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    } else {
      entry.count++;
    }
  },
};

/**
 * Standard rate limiter for API endpoints
 * 100 requests per minute
 */
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many requests, please slow down',
});

/**
 * Strict rate limiter for sensitive operations
 * 10 requests per hour
 */
export const sensitiveRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many requests for this operation, please try again later',
});
