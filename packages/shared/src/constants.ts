// API Routes
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    REFRESH: '/api/auth/refresh',
  },
  ASSISTANTS: {
    LIST: '/api/assistants',
    DETAIL: (id: string) => `/api/assistants/${id}`,
  },
  CHAT: {
    CONVERSATIONS: '/api/chat/conversations',
    CONVERSATION: (id: string) => `/api/chat/conversations/${id}`,
    MESSAGES: (conversationId: string) => `/api/chat/conversations/${conversationId}/messages`,
    UPLOAD: (conversationId: string) => `/api/chat/conversations/${conversationId}/upload`,
  },
  AUTOMATIONS: {
    LIST: '/api/automations',
    DETAIL: (id: string) => `/api/automations/${id}`,
    RUN: (id: string) => `/api/automations/${id}/run`,
    RUNS: '/api/automations/runs',
    RUN_DETAIL: (id: string) => `/api/automations/runs/${id}`,
    DOWNLOAD: (id: string) => `/api/automations/runs/${id}/download`,
    CALLBACK: '/api/automations/callback',
  },
  FAVORITES: {
    LIST: '/api/favorites',
    CREATE: '/api/favorites',
    DELETE: (id: string) => `/api/favorites/${id}`,
  },
  USERS: {
    LIST: '/api/users',
    DETAIL: (id: string) => `/api/users/${id}`,
  },
} as const;

// Legal specialties
export const LEGAL_SPECIALTIES = [
  'Droit social',
  'Droit des affaires',
  'Propriété intellectuelle',
  'RGPD / Protection des données',
  'Droit fiscal',
  'Droit immobilier',
  'Contentieux',
  'Droit des contrats',
  'Droit commercial',
  'Compliance',
] as const;

// Automation categories
export const AUTOMATION_CATEGORIES = [
  'Analyse',
  'Génération',
  'Veille',
  'Extraction',
  'Traduction',
  'Résumé',
] as const;

// Colors for assistants and automations
export const THEME_COLORS = {
  blue: '#3b82f6',
  indigo: '#6366f1',
  purple: '#8b5cf6',
  pink: '#ec4899',
  red: '#ef4444',
  orange: '#f97316',
  amber: '#f59e0b',
  green: '#22c55e',
  teal: '#14b8a6',
  cyan: '#06b6d4',
} as const;

// Icons available for assistants and automations (Lucide icon names)
export const AVAILABLE_ICONS = [
  'Scale',
  'FileText',
  'Shield',
  'Building',
  'Users',
  'Briefcase',
  'Gavel',
  'BookOpen',
  'FileSearch',
  'ClipboardList',
  'PenTool',
  'Search',
  'Globe',
  'Lock',
  'AlertTriangle',
  'CheckCircle',
  'MessageSquare',
  'Send',
  'Upload',
  'Download',
  'Zap',
  'Bot',
  'Brain',
  'Sparkles',
] as const;

// File upload limits
export const FILE_LIMITS = {
  MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB
  MAX_FILES: 10,
  ALLOWED_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'image/png',
    'image/jpeg',
  ],
  ALLOWED_EXTENSIONS: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv', '.png', '.jpg', '.jpeg'],
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;
