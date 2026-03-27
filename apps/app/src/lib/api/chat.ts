import type { Conversation, ConversationWithMessages } from '@altij/shared';
import { fetchApi, ApiError, API_BASE } from './client';

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
    const token = localStorage.getItem('staff_token');

    const response = await fetch(`${API_BASE}/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        content,
        ...(options?.activeTools?.length && { activeTools: options.activeTools }),
        ...(options?.activeSkills?.length && { activeSkills: options.activeSkills }),
        ...(options?.activeDataSources?.length && { activeDataSources: options.activeDataSources }),
      }),
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
