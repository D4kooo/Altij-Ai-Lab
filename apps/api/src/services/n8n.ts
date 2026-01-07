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
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
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
