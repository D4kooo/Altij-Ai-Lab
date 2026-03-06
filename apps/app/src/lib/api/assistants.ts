import type {
  ApiResponse,
  Assistant,
  AssistantDocument,
  CreateAssistantRequest,
  OpenRouterModel,
} from '@altij/shared';
import { fetchApi, ApiError, API_BASE } from './client';

// Assistants API
export const assistantsApi = {
  list: async (): Promise<Assistant[]> => {
    return fetchApi<Assistant[]>('/assistants');
  },

  get: async (id: string): Promise<Assistant> => {
    return fetchApi<Assistant>(`/assistants/${id}`);
  },

  create: async (data: CreateAssistantRequest): Promise<Assistant> => {
    return fetchApi<Assistant>('/assistants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: string,
    data: Partial<Omit<Assistant, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Assistant> => {
    return fetchApi<Assistant>(`/assistants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    await fetchApi(`/assistants/${id}`, { method: 'DELETE' });
  },

  listModels: async (): Promise<OpenRouterModel[]> => {
    return fetchApi<OpenRouterModel[]>('/assistants/models');
  },

  listDocuments: async (assistantId: string): Promise<AssistantDocument[]> => {
    return fetchApi<AssistantDocument[]>(`/assistants/${assistantId}/documents`);
  },

  uploadDocument: async (assistantId: string, file: File, name?: string): Promise<AssistantDocument> => {
    const token = localStorage.getItem('staff_token');
    const formData = new FormData();
    formData.append('file', file);
    if (name) {
      formData.append('name', name);
    }

    const response = await fetch(`${API_BASE}/assistants/${assistantId}/documents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json() as ApiResponse<AssistantDocument>;
    if (!response.ok || !data.success) {
      throw new ApiError(data.error || 'Upload failed', response.status);
    }

    return data.data as AssistantDocument;
  },

  deleteDocument: async (assistantId: string, documentId: string): Promise<void> => {
    await fetchApi(`/assistants/${assistantId}/documents/${documentId}`, { method: 'DELETE' });
  },

  getDataSourcesStatus: async (): Promise<Record<string, boolean>> => {
    return fetchApi<Record<string, boolean>>('/assistants/data-sources/status');
  },
};
