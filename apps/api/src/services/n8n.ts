import crypto from 'crypto';

// SECURITY: Webhook secret for HMAC signature verification
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || process.env.JWT_SECRET;

if (!WEBHOOK_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('CRITICAL: WEBHOOK_SECRET or JWT_SECRET must be set in production');
}

interface N8nWebhookPayload {
  automationRunId: string;
  userId: string;
  inputs: Record<string, unknown>;
  files?: { name: string; url: string; mimeType: string }[];
  callbackUrl: string;
  callbackSignature: string; // HMAC signature to include in callback
}

interface N8nCallbackResult {
  output?: Record<string, unknown>;
  fileUrl?: string;
  error?: string;
}

export async function triggerWorkflow(
  webhookUrl: string,
  payload: N8nWebhookPayload
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.N8N_API_KEY && {
        Authorization: `Bearer ${process.env.N8N_API_KEY}`,
      }),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`n8n webhook failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
}

export function buildCallbackUrl(runId: string): string {
  const baseUrl = process.env.API_URL || process.env.APP_URL || 'http://localhost:3000';
  return `${baseUrl}/api/automations/callback`;
}

/**
 * Build callback data including signature for n8n to use
 */
export function buildCallbackData(runId: string): { callbackUrl: string; signature: string } {
  return {
    callbackUrl: buildCallbackUrl(runId),
    signature: generateWebhookSignature(runId),
  };
}

export interface CallbackPayload {
  runId: string;
  status: 'completed' | 'failed';
  result?: N8nCallbackResult;
}

export function validateCallbackPayload(body: unknown): CallbackPayload | null {
  if (typeof body !== 'object' || body === null) {
    return null;
  }

  const payload = body as Record<string, unknown>;

  if (typeof payload.runId !== 'string') {
    return null;
  }

  if (payload.status !== 'completed' && payload.status !== 'failed') {
    return null;
  }

  return {
    runId: payload.runId,
    status: payload.status,
    result: payload.result as N8nCallbackResult | undefined,
  };
}

/**
 * Generate HMAC signature for webhook callback
 * This signature should be included in the callback from n8n
 */
export function generateWebhookSignature(runId: string): string {
  const secret = WEBHOOK_SECRET || 'dev-secret';
  return crypto.createHmac('sha256', secret).update(runId).digest('hex');
}

/**
 * Verify HMAC signature from webhook callback
 */
export function verifyWebhookSignature(runId: string, signature: string): boolean {
  const expectedSignature = generateWebhookSignature(runId);

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
}
