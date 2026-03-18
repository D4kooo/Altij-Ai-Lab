import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';

const breachCheckRoutes = new Hono<Env>();

// Rate limit: 5 checks per hour per user (in-memory store)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

// Clean up expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 10 * 60 * 1000);

const checkEmailSchema = z.object({
  email: z.string().email(),
});

interface BreachResult {
  name: string;
  date: string;
  description: string;
  dataTypes: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

function classifySeverity(dataTypes: string[]): 'low' | 'medium' | 'high' | 'critical' {
  const lowerTypes = dataTypes.map(d => d.toLowerCase());
  const hasSensitive = lowerTypes.some(d =>
    ['passwords', 'password', 'credit cards', 'bank accounts', 'social security numbers', 'ssn'].includes(d)
  );
  const hasPersonal = lowerTypes.some(d =>
    ['phone numbers', 'physical addresses', 'dates of birth', 'ip addresses'].includes(d)
  );

  if (hasSensitive) return 'critical';
  if (hasPersonal && lowerTypes.length > 3) return 'high';
  if (lowerTypes.length > 2) return 'medium';
  return 'low';
}

breachCheckRoutes.use('*', authMiddleware);

// POST /api/breach-check - Check email for breaches
breachCheckRoutes.post('/', zValidator('json', checkEmailSchema), async (c) => {
  const user = c.get('user')!;
  const { email } = c.req.valid('json');

  // Rate limit check
  const rateCheck = checkRateLimit(user.id);
  if (!rateCheck.allowed) {
    return c.json({
      success: false,
      error: 'Limite de vérifications atteinte (5 par heure). Réessayez plus tard.',
    }, 429);
  }

  try {
    // Call XposedOrNot API
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch(
      `https://api.xposedornot.com/v1/check-email/${encodeURIComponent(email)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    // 404 means no breaches found
    if (response.status === 404) {
      return c.json({
        success: true,
        data: {
          email,
          breachCount: 0,
          breaches: [],
        },
      });
    }

    if (!response.ok) {
      throw new Error(`XposedOrNot API returned ${response.status}`);
    }

    const data = await response.json() as Record<string, unknown>;

    // Parse XposedOrNot response
    // The API returns: { "ExposedBreaches": { "breaches_details": [...], "breaches_count": N } }
    const exposed = data.ExposedBreaches as Record<string, unknown> | undefined;
    const breachDetails = (exposed?.breaches_details || []) as Array<Record<string, unknown>>;

    const breaches: BreachResult[] = breachDetails.map((b) => {
      const dataTypes = (typeof b.xposed_data === 'string'
        ? (b.xposed_data as string).split(';').map((s: string) => s.trim()).filter(Boolean)
        : Array.isArray(b.xposed_data) ? b.xposed_data as string[] : []
      );

      return {
        name: (b.breach as string) || (b.domain as string) || 'Inconnu',
        date: (b.xposed_date as string) || (b.breachDate as string) || '',
        description: (b.details as string) || (b.description as string) || '',
        dataTypes,
        severity: classifySeverity(dataTypes),
      };
    });

    return c.json({
      success: true,
      data: {
        email,
        breachCount: breaches.length,
        breaches,
        remaining: rateCheck.remaining,
      },
    });
  } catch (err) {
    // If the external API is unavailable, return a graceful fallback
    const isAbort = err instanceof Error && err.name === 'AbortError';
    const message = isAbort
      ? 'Le service externe a mis trop de temps à répondre.'
      : 'Le service de vérification est temporairement indisponible.';

    console.error('Breach check error:', err);

    return c.json({
      success: true,
      data: {
        email,
        breachCount: 0,
        breaches: [],
        message,
        remaining: rateCheck.remaining,
      },
    });
  }
});

export { breachCheckRoutes };
