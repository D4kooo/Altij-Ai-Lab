import crypto from 'crypto';

interface N8nWebhookPayload {
  automationRunId: string;
  userId: string;
  inputs: Record<string, unknown>;
  files?: { name: string; url: string; mimeType: string }[];
  callbackUrl: string;
}

interface N8nCallbackResult {
  output?: Record<string, unknown>;
  fileUrl?: string;
  error?: string;
}

// SECURITY: Shared secret for HMAC callback verification
const CALLBACK_SECRET = process.env.N8N_CALLBACK_SECRET || process.env.JWT_SECRET || '';

export function generateCallbackSignature(body: string): string {
  return crypto.createHmac('sha256', CALLBACK_SECRET).update(body).digest('hex');
}

export function verifyCallbackSignature(body: string, signature: string): boolean {
  if (!CALLBACK_SECRET) return false;
  const expected = generateCallbackSignature(body);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
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
      // Include the callback secret so n8n can sign its response
      'X-Callback-Secret': CALLBACK_SECRET,
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
