import type { Conversation, ConversationWithMessages } from '@altij/shared';
import { fetchApi, ApiError, API_BASE, streamSSE } from './client';

// Chat API
export const chatApi = {
  listConversations: async (): Promise<Conversation[]> => {
    return fetchApi<Conversation[]>('/chat/conversations');
  },

  createConversation: async (assistantId: string): Promise<Conversation> => {
    return fetchApi<Conversation>('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ assistantId }),
    });
  },

  getConversation: async (id: string): Promise<ConversationWithMessages> => {
    return fetchApi<ConversationWithMessages>(`/chat/conversations/${id}`);
  },

  deleteConversation: async (id: string): Promise<void> => {
    await fetchApi(`/chat/conversations/${id}`, { method: 'DELETE' });
  },

  sendMessage: async (
    conversationId: string,
    content: string,
    onChunk: (chunk: string) => void,
    options?: { activeTools?: string[]; activeSkills?: string[]; activeDataSources?: string[] }
  ): Promise<void> => {
    await streamSSE(
      `/chat/conversations/${conversationId}/messages`,
      {
        content,
        ...(options?.activeTools?.length && { activeTools: options.activeTools }),
        ...(options?.activeSkills?.length && { activeSkills: options.activeSkills }),
        ...(options?.activeDataSources?.length && { activeDataSources: options.activeDataSources }),
      },
      onChunk
    );
  },

  uploadFile: async (
    conversationId: string,
    file: File
  ): Promise<{ fileId: string; fileName: string }> => {
    const token = localStorage.getItem('staff_token');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/chat/conversations/${conversationId}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new ApiError(data.error || 'Upload failed', response.status);
    }

    return data.data;
  },
};
