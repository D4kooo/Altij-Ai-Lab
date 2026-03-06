import { fetchApi, ApiError, API_BASE } from './client';

export interface SegaConversation {
  id: string;
  userId: string;
  model: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SegaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface SegaConversationWithMessages extends SegaConversation {
  messages: SegaMessage[];
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  contextLength: number | null;
  pricing: {
    prompt: string;
    completion: string;
  };
  supportedModalities: string[];
}

export const segaApi = {
  listModels: async (): Promise<OpenRouterModel[]> => {
    return fetchApi<OpenRouterModel[]>('/sega/models');
  },

  listConversations: async (): Promise<SegaConversation[]> => {
    return fetchApi<SegaConversation[]>('/sega/conversations');
  },

  createConversation: async (model: string): Promise<SegaConversation> => {
    return fetchApi<SegaConversation>('/sega/conversations', {
      method: 'POST',
      body: JSON.stringify({ model }),
    });
  },

  getConversation: async (id: string): Promise<SegaConversationWithMessages> => {
    return fetchApi<SegaConversationWithMessages>(`/sega/conversations/${id}`);
  },

  deleteConversation: async (id: string): Promise<void> => {
    await fetchApi(`/sega/conversations/${id}`, { method: 'DELETE' });
  },

  updateConversation: async (id: string, model: string): Promise<SegaConversation> => {
    return fetchApi<SegaConversation>(`/sega/conversations/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ model }),
    });
  },

  sendMessage: async (
    conversationId: string,
    content: string,
    onChunk: (chunk: string) => void
  ): Promise<void> => {
    const token = localStorage.getItem('staff_token');

    const response = await fetch(`${API_BASE}/sega/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
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

      const text = decoder.decode(value);
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.chunk) {
              onChunk(data.chunk);
            }
            if (data.error) {
              throw new Error(data.error);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    }
  },
};
