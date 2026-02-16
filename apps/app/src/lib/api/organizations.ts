import type { AssistantDocument } from '@altij/shared';
import { fetchApi } from './client';

// Documents API
export const documentsApi = {
  list: async (assistantId: string): Promise<AssistantDocument[]> => {
    return fetchApi<AssistantDocument[]>(`/assistants/${assistantId}/documents`);
  },
};

// Organizations API
export const organizationsApi = {
  getCurrent: async () => {
    return fetchApi<{ id: string; name: string; type: string }>('/organizations/current');
  },
};
