import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  User,
  Assistant,
  AssistantDocument,
  CreateAssistantRequest,
  Conversation,
  ConversationWithMessages,
  Automation,
  AutomationRun,
  Favorite,
  DashboardStats,
  RecentActivity,
  OpenRouterModel,
} from '@altij/shared';

const API_BASE = '/api';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !data.success) {
    if (response.status === 401) {
      // Try to refresh token
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        // Retry the request with new token
        return fetchApi(endpoint, options);
      }
      // Clear auth and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    throw new ApiError(data.error || 'An error occurred', response.status);
  }

  return data.data as T;
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = (await response.json()) as ApiResponse<{
      token: string;
      refreshToken: string;
    }>;

    if (data.success && data.data) {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

// Auth API
export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const data = await fetchApi<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data;
  },

  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      await fetchApi('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  },

  me: async (): Promise<User> => {
    return fetchApi<User>('/auth/me');
  },

  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<AuthResponse> => {
    const response = await fetchApi<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    localStorage.setItem('token', response.token);
    localStorage.setItem('refreshToken', response.refreshToken);
    return response;
  },
};

// Admin User type
export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLoginAt: string | null;
}

// Users API (Admin only)
export const usersApi = {
  list: async (): Promise<AdminUser[]> => {
    return fetchApi<AdminUser[]>('/users');
  },

  get: async (id: string): Promise<AdminUser> => {
    return fetchApi<AdminUser>(`/users/${id}`);
  },

  create: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'admin' | 'user';
  }): Promise<AdminUser> => {
    return fetchApi<AdminUser>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: string,
    data: {
      email?: string;
      firstName?: string;
      lastName?: string;
      role?: 'admin' | 'user';
      password?: string;
    }
  ): Promise<AdminUser> => {
    return fetchApi<AdminUser>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    await fetchApi(`/users/${id}`, { method: 'DELETE' });
  },
};

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

  // Admin: List available OpenRouter models
  listModels: async (): Promise<OpenRouterModel[]> => {
    return fetchApi<OpenRouterModel[]>('/assistants/models');
  },

  // Documents (RAG Knowledge Base)
  listDocuments: async (assistantId: string): Promise<AssistantDocument[]> => {
    return fetchApi<AssistantDocument[]>(`/assistants/${assistantId}/documents`);
  },

  uploadDocument: async (assistantId: string, file: File, name?: string): Promise<AssistantDocument> => {
    const token = localStorage.getItem('token');
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
};

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
    onChunk: (chunk: string) => void
  ): Promise<void> => {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE}/chat/conversations/${conversationId}/messages`, {
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

  uploadFile: async (
    conversationId: string,
    file: File
  ): Promise<{ fileId: string; fileName: string }> => {
    const token = localStorage.getItem('token');
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

// Lettre de Mission Types
export interface LMPreviewResult {
  pdf: string; // base64
  html: string;
  mimeType: string;
  filename: string;
}

export interface LMGenerateResult {
  documentId: string;
  pdf: string; // base64
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

// Lettre de Mission API
export const lettreMissionApi = {
  // Generate PDF preview
  preview: async (formData: Record<string, unknown>): Promise<LMPreviewResult> => {
    return fetchApi<LMPreviewResult>('/lettre-mission/preview', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  },

  // Generate HTML preview (faster)
  previewHtml: async (formData: Record<string, unknown>): Promise<{ html: string }> => {
    return fetchApi<{ html: string }>('/lettre-mission/preview-html', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  },

  // Generate and save PDF
  generate: async (formData: Record<string, unknown>): Promise<LMGenerateResult> => {
    return fetchApi<LMGenerateResult>('/lettre-mission/generate', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  },

  // Send for signature via Yousign
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

// Favorites API
export const favoritesApi = {
  list: async (): Promise<Favorite[]> => {
    return fetchApi<Favorite[]>('/favorites');
  },

  add: async (itemType: 'assistant' | 'automation', itemId: string): Promise<Favorite> => {
    return fetchApi<Favorite>('/favorites', {
      method: 'POST',
      body: JSON.stringify({ itemType, itemId }),
    });
  },

  remove: async (id: string): Promise<void> => {
    await fetchApi(`/favorites/${id}`, { method: 'DELETE' });
  },

  removeByItem: async (itemType: 'assistant' | 'automation', itemId: string): Promise<void> => {
    await fetchApi(`/favorites/item/${itemType}/${itemId}`, { method: 'DELETE' });
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    return fetchApi<DashboardStats>('/dashboard/stats');
  },

  getRecentActivity: async (): Promise<RecentActivity[]> => {
    return fetchApi<RecentActivity[]>('/dashboard/recent');
  },
};

// Veille (RSS Feeds) Types
export interface Feed {
  id: string;
  name: string;
  url: string;
  favicon?: string;
  lastFetchedAt?: string;
  createdAt: string;
}

export interface Article {
  id: string;
  feedId: string;
  feedName: string;
  title: string;
  description?: string;
  url: string;
  image?: string;
  publishedAt: string;
  isRead: boolean;
  isFavorite: boolean;
}

// Veille API
export const veilleApi = {
  listFeeds: async (): Promise<Feed[]> => {
    return fetchApi<Feed[]>('/veille/feeds');
  },

  addFeed: async (data: { url: string; name?: string }): Promise<Feed> => {
    return fetchApi<Feed>('/veille/feeds', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteFeed: async (id: string): Promise<void> => {
    await fetchApi(`/veille/feeds/${id}`, { method: 'DELETE' });
  },

  refreshFeeds: async (): Promise<void> => {
    await fetchApi('/veille/feeds/refresh', { method: 'POST' });
  },

  listArticles: async (feedId?: string): Promise<Article[]> => {
    const params = feedId ? `?feedId=${feedId}` : '';
    return fetchApi<Article[]>(`/veille/articles${params}`);
  },

  markArticleAsRead: async (id: string): Promise<void> => {
    await fetchApi(`/veille/articles/${id}/read`, { method: 'POST' });
  },

  toggleArticleFavorite: async (id: string): Promise<void> => {
    await fetchApi(`/veille/articles/${id}/favorite`, { method: 'POST' });
  },
};

// Newsletter Types
export interface Newsletter {
  id: string;
  userId: string;
  name: string;
  email: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  feedIds: string[];
  isActive: boolean;
  lastSentAt?: string;
  createdAt: string;
}

// Newsletter API
export const newsletterApi = {
  list: async (): Promise<Newsletter[]> => {
    return fetchApi<Newsletter[]>('/veille/newsletters');
  },

  create: async (data: {
    name: string;
    email: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    feedIds: string[];
  }): Promise<Newsletter> => {
    return fetchApi<Newsletter>('/veille/newsletters', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<{
    name: string;
    email: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    feedIds: string[];
    isActive: boolean;
  }>): Promise<Newsletter> => {
    return fetchApi<Newsletter>(`/veille/newsletters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    await fetchApi(`/veille/newsletters/${id}`, { method: 'DELETE' });
  },

  send: async (id: string): Promise<void> => {
    await fetchApi(`/veille/newsletters/${id}/send`, { method: 'POST' });
  },
};

// Veille IA Types
export interface Department {
  id: string;
  label: string;
}

export interface VeilleIa {
  id: string;
  name: string;
  description: string;
  prompt: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  departments: string[];
  isActive: boolean;
  isFavorite: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  latestEdition?: VeilleIaEdition;
}

export interface VeilleIaEdition {
  id: string;
  veilleIaId: string;
  content: string;
  sources: { title: string; url: string }[];
  generatedAt: string;
  newItemsCount?: number;
  totalItemsFound?: number;
}

export interface VeilleIaItem {
  id: string;
  veilleIaId: string;
  editionId: string;
  title: string;
  summary?: string;
  sourceUrl?: string;
  contentHash: string;
  category?: string;
  createdAt: string;
}

export interface VeilleIaFavorite {
  id: string;
  name: string;
  description: string;
  isFavorite: boolean;
  latestEdition?: VeilleIaEdition;
  summary?: string;
}

// Veille IA API
export const veilleIaApi = {
  list: async (): Promise<VeilleIa[]> => {
    return fetchApi<VeilleIa[]>('/veille-ia');
  },

  getDepartments: async (): Promise<Department[]> => {
    return fetchApi<Department[]>('/veille-ia/departments');
  },

  get: async (id: string): Promise<VeilleIa> => {
    return fetchApi<VeilleIa>(`/veille-ia/${id}`);
  },

  getEditions: async (id: string): Promise<VeilleIaEdition[]> => {
    return fetchApi<VeilleIaEdition[]>(`/veille-ia/${id}/editions`);
  },

  create: async (data: {
    name: string;
    description: string;
    prompt: string;
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    departments: string[];
  }): Promise<VeilleIa> => {
    return fetchApi<VeilleIa>('/veille-ia', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<{
    name: string;
    description: string;
    prompt: string;
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    departments: string[];
    isActive: boolean;
  }>): Promise<VeilleIa> => {
    return fetchApi<VeilleIa>(`/veille-ia/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    await fetchApi(`/veille-ia/${id}`, { method: 'DELETE' });
  },

  generate: async (id: string): Promise<VeilleIaEdition> => {
    return fetchApi<VeilleIaEdition>(`/veille-ia/${id}/generate`, {
      method: 'POST',
    });
  },

  getItems: async (id: string): Promise<VeilleIaItem[]> => {
    return fetchApi<VeilleIaItem[]>(`/veille-ia/${id}/items`);
  },

  toggleFavorite: async (id: string): Promise<VeilleIa> => {
    return fetchApi<VeilleIa>(`/veille-ia/${id}/favorite`, {
      method: 'POST',
    });
  },

  listFavorites: async (): Promise<VeilleIaFavorite[]> => {
    return fetchApi<VeilleIaFavorite[]>('/veille-ia/favorites/list');
  },
};

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

// New types for enhanced anonymization pipeline
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

// Censor preview result
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

// Preview result (with anonymized text)
export interface PreviewPdfResult {
  text: string; // anonymized text
  totalReplacements: number;
  termsFound: {
    original: string;
    replacement: string;
    count: number;
  }[];
}

// Anonymiseur API
export const anonymiseurApi = {
  // Analyser le PDF pour trouver les occurrences des termes
  analyze: async (file: File, terms: RedactionTerm[]): Promise<AnalysisResult> => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('terms', JSON.stringify(terms));

    const response = await fetch(`${API_BASE}/anonymiseur/analyze`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json() as ApiResponse<AnalysisResult>;
    if (!response.ok || !data.success) {
      throw new ApiError(data.error || 'Failed to analyze', response.status);
    }

    return data.data as AnalysisResult;
  },

  // Anonymiser et retourner le PDF
  anonymize: async (file: File, terms: RedactionTerm[]): Promise<Blob> => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('terms', JSON.stringify(terms));

    const response = await fetch(`${API_BASE}/anonymiseur/anonymize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new ApiError(errorData.error || 'Failed to anonymize', response.status);
    }

    return response.blob();
  },

  // Anonymiser et retourner le texte (JSON)
  anonymizeText: async (file: File, terms: RedactionTerm[]): Promise<AnonymizeTextResult> => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('terms', JSON.stringify(terms));

    const response = await fetch(`${API_BASE}/anonymiseur/anonymize-text`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json() as ApiResponse<AnonymizeTextResult>;
    if (!response.ok || !data.success) {
      throw new ApiError(data.error || 'Failed to anonymize', response.status);
    }

    return data.data as AnonymizeTextResult;
  },

  // Get OCR status (Poppler availability)
  getStatus: async (): Promise<AnonymiseurStatus> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/anonymiseur/status`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json() as ApiResponse<AnonymiseurStatus>;
    if (!response.ok || !data.success) {
      throw new ApiError(data.error || 'Failed to get status', response.status);
    }

    return data.data as AnonymiseurStatus;
  },

  // Auto-detect sensitive data using regex patterns
  autoDetect: async (file: File): Promise<AutoDetectResult> => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/anonymiseur/auto-detect`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json() as ApiResponse<AutoDetectResult>;
    if (!response.ok || !data.success) {
      throw new ApiError(data.error || 'Failed to auto-detect', response.status);
    }

    return data.data as AutoDetectResult;
  },

  // Verify anonymization with AI
  verify: async (
    file: File,
    terms: RedactionTerm[],
    autoDetected: DetectedEntity[]
  ): Promise<VerifyResult> => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('terms', JSON.stringify(terms));
    formData.append('autoDetected', JSON.stringify(autoDetected));

    const response = await fetch(`${API_BASE}/anonymiseur/verify`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json() as ApiResponse<VerifyResult>;
    if (!response.ok || !data.success) {
      throw new ApiError(data.error || 'Failed to verify', response.status);
    }

    return data.data as VerifyResult;
  },

  // Full pipeline: anonymize with all detected entities and AI suggestions
  fullPipeline: async (
    file: File,
    terms: RedactionTerm[],
    autoDetected: DetectedEntity[],
    aiSuggestions: MissedEntity[],
    skipAI: boolean = false
  ): Promise<Blob> => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('terms', JSON.stringify(terms));
    formData.append('autoDetected', JSON.stringify(autoDetected));
    formData.append('aiSuggestions', JSON.stringify(aiSuggestions));
    formData.append('skipAI', skipAI.toString());

    const response = await fetch(`${API_BASE}/anonymiseur/full-pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new ApiError(errorData.error || 'Failed to process', response.status);
    }

    return response.blob();
  },

  // Preview terms that will be censored
  censorPreview: async (file: File, terms: string[]): Promise<CensorPreviewResult> => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('terms', JSON.stringify(terms));

    const response = await fetch(`${API_BASE}/anonymiseur/censor-preview`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json() as ApiResponse<CensorPreviewResult>;
    if (!response.ok || !data.success) {
      throw new ApiError(data.error || 'Failed to preview', response.status);
    }

    return data.data as CensorPreviewResult;
  },

  // Censor PDF with specified terms (also censors individual words)
  censor: async (file: File, terms: string[]): Promise<Blob> => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('terms', JSON.stringify(terms));

    const response = await fetch(`${API_BASE}/anonymiseur/censor`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new ApiError(errorData.error || 'Failed to censor', response.status);
    }

    return response.blob();
  },

  // Preview PDF with terms replaced (returns base64)
  previewPdf: async (file: File, terms: string[]): Promise<PreviewPdfResult> => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('terms', JSON.stringify(terms));

    const response = await fetch(`${API_BASE}/anonymiseur/preview-pdf`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json() as ApiResponse<PreviewPdfResult>;
    if (!response.ok || !data.success) {
      throw new ApiError(data.error || 'Failed to preview PDF', response.status);
    }

    return data.data as PreviewPdfResult;
  },

  // Censor PDF with zone-based redaction (visual selection)
  censorWithZones: async (
    file: File,
    zones: Array<{
      id: string;
      pageNumber: number;
      x: number; // percentage from left
      y: number; // percentage from top
      width: number; // percentage
      height: number; // percentage
    }>
  ): Promise<Blob> => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('zones', JSON.stringify(zones));

    const response = await fetch(`${API_BASE}/anonymiseur/censor-zones`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new ApiError(errorData.error || 'Failed to censor with zones', response.status);
    }

    return response.blob();
  },
};

// Types for Roles & Permissions
export interface Role {
  id: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoleWithDetails extends Role {
  permissions: RolePermission[];
  members: RoleMember[];
}

export interface RolePermission {
  id: string;
  resourceType: 'assistant' | 'automation';
  resourceId: string;
}

export interface RoleMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface UserPermissions {
  roles: Role[];
  rolePermissions: { resourceType: string; resourceId: string; roleId: string }[];
  directPermissions: { resourceType: string; resourceId: string }[];
}

// Roles API
export const rolesApi = {
  list: () => fetchApi<Role[]>('/roles'),

  get: (id: string) => fetchApi<RoleWithDetails>(`/roles/${id}`),

  create: (data: { name: string; description?: string; color?: string }) =>
    fetchApi<Role>('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name?: string; description?: string; color?: string }) =>
    fetchApi<Role>(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<void>(`/roles/${id}`, { method: 'DELETE' }),

  addMember: (roleId: string, userId: string) =>
    fetchApi<void>(`/roles/${roleId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  removeMember: (roleId: string, userId: string) =>
    fetchApi<void>(`/roles/${roleId}/members/${userId}`, { method: 'DELETE' }),
};

// Permissions API
export const permissionsApi = {
  // Vérifier l'accès de l'utilisateur courant
  checkAccess: (resourceType: 'assistant' | 'automation', resourceId: string) =>
    fetchApi<{ hasAccess: boolean }>(`/permissions/check/${resourceType}/${resourceId}`),

  // Permissions d'un rôle
  getRolePermissions: (roleId: string) =>
    fetchApi<RolePermission[]>(`/permissions/roles/${roleId}`),

  updateRolePermissions: (
    roleId: string,
    permissions: { resourceType: 'assistant' | 'automation'; resourceId: string }[]
  ) =>
    fetchApi<void>(`/permissions/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    }),

  // Permissions d'un utilisateur
  getUserPermissions: (userId: string) =>
    fetchApi<UserPermissions>(`/permissions/users/${userId}`),

  updateUserPermissions: (
    userId: string,
    permissions: { resourceType: 'assistant' | 'automation'; resourceId: string }[]
  ) =>
    fetchApi<void>(`/permissions/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    }),

  // Rôles d'un utilisateur
  updateUserRoles: (userId: string, roleIds: string[]) =>
    fetchApi<void>(`/permissions/users/${userId}/roles`, {
      method: 'PUT',
      body: JSON.stringify({ roleIds }),
    }),

  addUserRole: (userId: string, roleId: string) =>
    fetchApi<void>(`/permissions/users/${userId}/roles/${roleId}`, { method: 'POST' }),

  removeUserRole: (userId: string, roleId: string) =>
    fetchApi<void>(`/permissions/users/${userId}/roles/${roleId}`, { method: 'DELETE' }),
};

export { ApiError };
