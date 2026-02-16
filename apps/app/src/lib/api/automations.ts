import type { Automation, AutomationRun } from '@altij/shared';
import { fetchApi } from './client';

// Lettre de Mission Types
export interface LMPreviewResult {
  pdf: string;
  html: string;
  mimeType: string;
  filename: string;
}

export interface LMGenerateResult {
  documentId: string;
  pdf: string;
  mimeType: string;
  filename: string;
  createdBy: string;
  createdAt: string;
}

export interface LMSendResult {
  runId: string;
  status: string;
  message: string;
}

// Automations API
export const automationsApi = {
  list: async (): Promise<Automation[]> => {
    return fetchApi<Automation[]>('/automations');
  },

  get: async (id: string): Promise<Automation> => {
    return fetchApi<Automation>(`/automations/${id}`);
  },

  run: async (
    id: string,
    data: { inputs: Record<string, unknown>; files?: { name: string; url: string; mimeType: string }[] }
  ): Promise<{ runId: string; status: string }> => {
    return fetchApi<{ runId: string; status: string }>(`/automations/${id}/run`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  listRuns: async (): Promise<AutomationRun[]> => {
    return fetchApi<AutomationRun[]>('/automations/runs');
  },

  getRun: async (id: string): Promise<AutomationRun> => {
    return fetchApi<AutomationRun>(`/automations/runs/${id}`);
  },

  create: async (data: Omit<Automation, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>): Promise<Automation> => {
    return fetchApi<Automation>('/automations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: string,
    data: Partial<Omit<Automation, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Automation> => {
    return fetchApi<Automation>(`/automations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    await fetchApi(`/automations/${id}`, { method: 'DELETE' });
  },
};

// Lettre de Mission API
export const lettreMissionApi = {
  preview: async (formData: Record<string, unknown>): Promise<LMPreviewResult> => {
    return fetchApi<LMPreviewResult>('/lettre-mission/preview', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  },

  previewHtml: async (formData: Record<string, unknown>): Promise<{ html: string }> => {
    return fetchApi<{ html: string }>('/lettre-mission/preview-html', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  },

  generate: async (formData: Record<string, unknown>): Promise<LMGenerateResult> => {
    return fetchApi<LMGenerateResult>('/lettre-mission/generate', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  },

  sendToSignature: async (
    automationId: string,
    formData: Record<string, unknown>
  ): Promise<LMSendResult> => {
    return fetchApi<LMSendResult>('/lettre-mission/send-to-signature', {
      method: 'POST',
      body: JSON.stringify({ automationId, formData }),
    });
  },
};
