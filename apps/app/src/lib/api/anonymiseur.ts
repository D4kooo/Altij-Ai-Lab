import type { ApiResponse } from '@altij/shared';
import { ApiError, API_BASE } from './client';

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
    const token = localStorage.getItem('staff_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('terms', JSON.stringify(terms));

    const response = await fetch(`${API_BASE}/anonymiseur/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await response.json() as ApiResponse<AnalysisResult>;
    if (!response.ok || !data.success) {
      throw new ApiError(data.error || 'Failed to analyze', response.status);
    }
    return data.data as AnalysisResult;
  },

  anonymize: async (file: File, terms: RedactionTerm[]): Promise<Blob> => {
    const token = localStorage.getItem('staff_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('terms', JSON.stringify(terms));

    const response = await fetch(`${API_BASE}/anonymiseur/anonymize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new ApiError(errorData.error || 'Failed to anonymize', response.status);
    }
    return response.blob();
  },

  anonymizeText: async (file: File, terms: RedactionTerm[]): Promise<AnonymizeTextResult> => {
    const token = localStorage.getItem('staff_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('terms', JSON.stringify(terms));

    const response = await fetch(`${API_BASE}/anonymiseur/anonymize-text`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await response.json() as ApiResponse<AnonymizeTextResult>;
    if (!response.ok || !data.success) {
      throw new ApiError(data.error || 'Failed to anonymize', response.status);
    }
    return data.data as AnonymizeTextResult;
  },

  getStatus: async (): Promise<AnonymiseurStatus> => {
    const token = localStorage.getItem('staff_token');
    const response = await fetch(`${API_BASE}/anonymiseur/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json() as ApiResponse<AnonymiseurStatus>;
    if (!response.ok || !data.success) {
      throw new ApiError(data.error || 'Failed to get status', response.status);
    }
    return data.data as AnonymiseurStatus;
  },

  autoDetect: async (file: File): Promise<AutoDetectResult> => {
    const token = localStorage.getItem('staff_token');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/anonymiseur/auto-detect`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await response.json() as ApiResponse<AutoDetectResult>;
    if (!response.ok || !data.success) {
      throw new ApiError(data.error || 'Failed to auto-detect', response.status);
    }
    return data.data as AutoDetectResult;
  },

  verify: async (
    file: File,
    terms: RedactionTerm[],
    autoDetected: DetectedEntity[]
  ): Promise<VerifyResult> => {
    const token = localStorage.getItem('staff_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('terms', JSON.stringify(terms));
    formData.append('autoDetected', JSON.stringify(autoDetected));

    const response = await fetch(`${API_BASE}/anonymiseur/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await response.json() as ApiResponse<VerifyResult>;
    if (!response.ok || !data.success) {
      throw new ApiError(data.error || 'Failed to verify', response.status);
    }
    return data.data as VerifyResult;
  },

  fullPipeline: async (
    file: File,
    terms: RedactionTerm[],
    autoDetected: DetectedEntity[],
    aiSuggestions: MissedEntity[],
    skipAI: boolean = false
  ): Promise<Blob> => {
    const token = localStorage.getItem('staff_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('terms', JSON.stringify(terms));
    formData.append('autoDetected', JSON.stringify(autoDetected));
    formData.append('aiSuggestions', JSON.stringify(aiSuggestions));
    formData.append('skipAI', skipAI.toString());

    const response = await fetch(`${API_BASE}/anonymiseur/full-pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new ApiError(errorData.error || 'Failed to process', response.status);
    }
    return response.blob();
  },

  censorPreview: async (file: File, terms: string[]): Promise<CensorPreviewResult> => {
    const token = localStorage.getItem('staff_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('terms', JSON.stringify(terms));

    const response = await fetch(`${API_BASE}/anonymiseur/censor-preview`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await response.json() as ApiResponse<CensorPreviewResult>;
    if (!response.ok || !data.success) {
      throw new ApiError(data.error || 'Failed to preview', response.status);
    }
    return data.data as CensorPreviewResult;
  },

  censor: async (file: File, terms: string[]): Promise<Blob> => {
    const token = localStorage.getItem('staff_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('terms', JSON.stringify(terms));

    const response = await fetch(`${API_BASE}/anonymiseur/censor`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new ApiError(errorData.error || 'Failed to censor', response.status);
    }
    return response.blob();
  },

  previewPdf: async (file: File, terms: string[]): Promise<PreviewPdfResult> => {
    const token = localStorage.getItem('staff_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('terms', JSON.stringify(terms));

    const response = await fetch(`${API_BASE}/anonymiseur/preview-pdf`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await response.json() as ApiResponse<PreviewPdfResult>;
    if (!response.ok || !data.success) {
      throw new ApiError(data.error || 'Failed to preview PDF', response.status);
    }
    return data.data as PreviewPdfResult;
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
    const token = localStorage.getItem('staff_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('zones', JSON.stringify(zones));

    const response = await fetch(`${API_BASE}/anonymiseur/censor-zones`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new ApiError(errorData.error || 'Failed to censor with zones', response.status);
    }
    return response.blob();
  },
};
