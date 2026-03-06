import { fetchApi } from './client';

export interface SupervisionStats {
  totalTokens: number;
  totalCost: number;
  activeUsers: number;
  totalRequests: number;
  activeConversations: number;
}

export interface SupervisionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  creditLimit: number | null;
  createdAt: string;
  totalTokens: number;
  totalCost: number;
  requestCount: number;
  conversationCount: number;
}

export interface SupervisionConversation {
  id: string;
  type: 'assistant' | 'sega';
  title: string;
  assistantName?: string;
  model?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupervisionMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export const supervisionApi = {
  getStats: () => fetchApi<SupervisionStats>('/admin/supervision/stats'),

  getUsers: () => fetchApi<SupervisionUser[]>('/admin/supervision/users'),

  getUserConversations: (userId: string) =>
    fetchApi<{ assistant: SupervisionConversation[]; sega: SupervisionConversation[] }>(
      `/admin/supervision/users/${userId}/conversations`
    ),

  getConversationMessages: (type: 'assistant' | 'sega', conversationId: string) =>
    fetchApi<SupervisionMessage[]>(
      `/admin/supervision/conversations/${type}/${conversationId}/messages`
    ),

  setCreditLimit: (userId: string, creditLimit: number | null) =>
    fetchApi<{ id: string; creditLimit: number | null }>(
      `/admin/supervision/users/${userId}/credit-limit`,
      {
        method: 'PUT',
        body: JSON.stringify({ creditLimit }),
      }
    ),
};
