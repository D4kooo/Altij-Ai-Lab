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
