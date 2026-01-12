import type { Context, Next } from 'hono';

interface BodyLimitOptions {
  maxSize: number; // Maximum body size in bytes
  message?: string;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB default

/**
 * Body size limit middleware
 * Prevents memory exhaustion attacks from large payloads
 */
export function bodyLimit(options: Partial<BodyLimitOptions> = {}) {
  const { maxSize = DEFAULT_MAX_SIZE, message = 'Request body too large' } = options;

  return async (c: Context, next: Next) => {
    const contentLength = c.req.header('content-length');

    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > maxSize) {
        console.warn(`[BODY_LIMIT] Request too large: ${size} bytes (max: ${maxSize})`);
        return c.json(
          {
            success: false,
            error: message,
            maxSize: `${Math.round(maxSize / 1024 / 1024)}MB`,
          },
          413
        );
      }
    }

    await next();
  };
}

// Pre-configured limits
export const defaultBodyLimit = bodyLimit({ maxSize: 10 * 1024 * 1024 }); // 10MB
export const smallBodyLimit = bodyLimit({ maxSize: 1 * 1024 * 1024 }); // 1MB for JSON
export const largeBodyLimit = bodyLimit({ maxSize: 50 * 1024 * 1024 }); // 50MB for file uploads
