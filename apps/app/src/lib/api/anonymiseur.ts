import type { ApiResponse } from '@altij/shared';
import { ApiError, API_BASE } from './client';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('staff_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchFormData<T>(endpoint: string, formData: FormData): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });

  const data = await response.json() as ApiResponse<T>;
  if (!response.ok || !data.success) {
    throw new ApiError(data.error || 'Request failed', response.status);
  }
  return data.data as T;
}

async function fetchFormDataBlob(endpoint: string, formData: FormData): Promise<Blob> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new ApiError(errorData.error || 'Request failed', response.status);
  }
  return response.blob();
}

// Anonymiseur Types
export interface RedactionTerm {
  id: string;
  original: string;
  replacement: string;
  type: 'person' | 'company' | 'address' | 'other';
}

export interface AnalysisResult {
  fileName: string;
  textLength: number;
  analysis: {
    term: RedactionTerm;
    count: number;
    previews: string[];
  }[];
}

export interface AnonymizeTextResult {
  originalName: string;
  anonymizedText: string;
  report: (RedactionTerm & { count: number })[];
  stats: {
    originalLength: number;
    anonymizedLength: number;
    totalReplacements: number;
  };
}

export type EntityType =
  | 'email'
  | 'phone'
  | 'siret'
  | 'siren'
  | 'nir'
  | 'iban'
  | 'bic'
  | 'rcs'
  | 'tva'
  | 'date'
  | 'address'
  | 'postal_code'
  | 'name'
  | 'custom';

export interface DetectedEntity {
  id: string;
  type: EntityType;
  value: string;
  replacement: string;
  position: {
    start: number;
    end: number;
  };
  confidence: number;
}

export interface AutoDetectResult {
  fileName: string;
  textLength: number;
  extractionMethod: 'poppler' | 'pdf-parse';
  entities: DetectedEntity[];
  groupedByType: Record<EntityType, DetectedEntity[]>;
  summary: {
    type: string;
    label: string;
    count: number;
  }[];
}

export interface MissedEntity {
  type: EntityType;
  value: string;
  suggestion: string;
  context: string;
  reason: string;
}

export interface AIVerificationResult {
  isComplete: boolean;
  missedEntities: MissedEntity[];
  confidence: number;
  suggestions: string[];
}

export interface VerifyResult {
  verification: AIVerificationResult;
  anonymizedPreview: string;
  stats: {
    termsApplied: number;
    autoDetectedApplied: number;
    missedByAI: number;
    aiConfidence: number;
  };
}

export interface AnonymiseurStatus {
  popplerAvailable: boolean;
  ocrMethod: 'poppler' | 'pdf-parse';
}

export interface CensorPreviewResult {
  fileName: string;
  textLength: number;
  extractionMethod: 'poppler' | 'pdf-parse';
  terms: {
    original: string;
    replacement: string;
    fromTerm: string;
    count: number;
  }[];
  totalOccurrences: number;
  termsFound: number;
}

export interface PreviewPdfResult {
  text: string;
  totalReplacements: number;
  termsFound: {
    original: string;
    replacement: string;
    count: number;
  }[];
}

// Anonymiseur API
export const anonymiseurApi = {
  analyze: async (file: File, terms: RedactionTerm[]): Promise<AnalysisResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('terms', JSON.stringify(terms));
    return fetchFormData<AnalysisResult>('/anonymiseur/analyze', formData);
  },

  anonymize: async (file: File, terms: RedactionTerm[]): Promise<Blob> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('terms', JSON.stringify(terms));
    return fetchFormDataBlob('/anonymiseur/anonymize', formData);
  },

  anonymizeText: async (file: File, terms: RedactionTerm[]): Promise<AnonymizeTextResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('terms', JSON.stringify(terms));
    return fetchFormData<AnonymizeTextResult>('/anonymiseur/anonymize-text', formData);
  },

  getStatus: async (): Promise<AnonymiseurStatus> => {
    const response = await fetch(`${API_BASE}/anonymiseur/status`, {
      headers: authHeaders(),
    });
    const data = await response.json() as ApiResponse<AnonymiseurStatus>;
    if (!response.ok || !data.success) {
      throw new ApiError(data.error || 'Failed to get status', response.status);
    }
    return data.data as AnonymiseurStatus;
  },

  autoDetect: async (file: File): Promise<AutoDetectResult> => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchFormData<AutoDetectResult>('/anonymiseur/auto-detect', formData);
  },

  verify: async (
    file: File,
    terms: RedactionTerm[],
    autoDetected: DetectedEntity[]
  ): Promise<VerifyResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('terms', JSON.stringify(terms));
    formData.append('autoDetected', JSON.stringify(autoDetected));
    return fetchFormData<VerifyResult>('/anonymiseur/verify', formData);
  },

  fullPipeline: async (
    file: File,
    terms: RedactionTerm[],
    autoDetected: DetectedEntity[],
    aiSuggestions: MissedEntity[],
    skipAI: boolean = false
  ): Promise<Blob> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('terms', JSON.stringify(terms));
    formData.append('autoDetected', JSON.stringify(autoDetected));
    formData.append('aiSuggestions', JSON.stringify(aiSuggestions));
    formData.append('skipAI', skipAI.toString());
    return fetchFormDataBlob('/anonymiseur/full-pipeline', formData);
  },

  censorPreview: async (file: File, terms: string[]): Promise<CensorPreviewResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('terms', JSON.stringify(terms));
    return fetchFormData<CensorPreviewResult>('/anonymiseur/censor-preview', formData);
  },

  censor: async (file: File, terms: string[]): Promise<Blob> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('terms', JSON.stringify(terms));
    return fetchFormDataBlob('/anonymiseur/censor', formData);
  },

  previewPdf: async (file: File, terms: string[]): Promise<PreviewPdfResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('terms', JSON.stringify(terms));
    return fetchFormData<PreviewPdfResult>('/anonymiseur/preview-pdf', formData);
  },

  censorWithZones: async (
    file: File,
    zones: Array<{
      id: string;
      pageNumber: number;
      x: number;
      y: number;
      width: number;
      height: number;
    }>
  ): Promise<Blob> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('zones', JSON.stringify(zones));
    return fetchFormDataBlob('/anonymiseur/censor-zones', formData);
  },
};
