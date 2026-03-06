import type { AuthResponse, LoginRequest, User } from '@altij/shared';
import { fetchApi } from './client';

// Admin User type
export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  canEditCitizenSpace: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

// Auth API
export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const data = await fetchApi<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ ...credentials, context: 'staff' }),
    });
    localStorage.setItem('staff_token', data.token);
    localStorage.setItem('staff_refreshToken', data.refreshToken);
    return data;
  },

  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('staff_refreshToken');
    try {
      await fetchApi('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } finally {
      localStorage.removeItem('staff_token');
      localStorage.removeItem('staff_refreshToken');
    }
  },

  me: async (): Promise<User> => {
    return fetchApi<User>('/auth/me');
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    return fetchApi<{ message: string }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationType: 'work' | 'family';
    organizationName: string;
  }): Promise<AuthResponse & { organization: { id: string; name: string; type: string; isOwner: boolean } }> => {
    const response = await fetchApi<AuthResponse & { organization: { id: string; name: string; type: string; isOwner: boolean } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    localStorage.setItem('staff_token', response.token);
    localStorage.setItem('staff_refreshToken', response.refreshToken);
    return response;
  },
};

// Users API (Admin only)
export const usersApi = {
  list: async (): Promise<AdminUser[]> => {
    return fetchApi<AdminUser[]>('/users');
  },

  get: async (id: string): Promise<AdminUser> => {
    return fetchApi<AdminUser>(`/users/${id}`);
  },

  create: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'admin' | 'user';
  }): Promise<AdminUser> => {
    return fetchApi<AdminUser>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: string,
    data: {
      email?: string;
      firstName?: string;
      lastName?: string;
      role?: 'admin' | 'user';
      password?: string;
      canEditCitizenSpace?: boolean;
    }
  ): Promise<AdminUser> => {
    return fetchApi<AdminUser>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    await fetchApi(`/users/${id}`, { method: 'DELETE' });
  },
};
