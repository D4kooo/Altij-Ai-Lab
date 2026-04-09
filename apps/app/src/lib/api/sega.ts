import { fetchApi, streamSSE } from './client';

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
    await streamSSE(
      `/sega/conversations/${conversationId}/messages`,
      { content },
      onChunk
    );
  },
};
