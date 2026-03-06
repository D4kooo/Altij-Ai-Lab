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
