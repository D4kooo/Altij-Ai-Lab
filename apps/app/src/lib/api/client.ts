import type { ApiResponse } from '@altij/shared';

export const API_BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('staff_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !data.success) {
    if (response.status === 401 && !endpoint.startsWith('/auth/')) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        return fetchApi(endpoint, options);
      }
      localStorage.removeItem('staff_token');
      localStorage.removeItem('staff_refreshToken');
      window.location.href = `${import.meta.env.BASE_URL}login`;
    }
    throw new ApiError(data.error || 'An error occurred', response.status);
  }

  return data.data as T;
}

export async function streamSSE(
  endpoint: string,
  body: Record<string, unknown>,
  onChunk: (chunk: string) => void
): Promise<void> {
  const token = localStorage.getItem('staff_token');

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(error.error || 'Failed to send message', response.status);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value).split('\n')) {
      processSseLine(line, onChunk);
    }
  }
}

function processSseLine(line: string, onChunk: (chunk: string) => void): void {
  if (!line.startsWith('data: ')) return;
  let data: { chunk?: string; error?: string };
  try {
    data = JSON.parse(line.slice(6));
  } catch (e) {
    if (e instanceof SyntaxError) return;
    throw e;
  }
  if (data.chunk) onChunk(data.chunk);
  if (data.error) throw new Error(data.error);
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('staff_refreshToken');
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = (await response.json()) as ApiResponse<{
      token: string;
      refreshToken: string;
    }>;

    if (data.success && data.data) {
      localStorage.setItem('staff_token', data.data.token);
      localStorage.setItem('staff_refreshToken', data.data.refreshToken);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
