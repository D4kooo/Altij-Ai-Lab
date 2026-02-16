import { fetchApi } from './client';

// Veille (RSS Feeds) Types
export interface Feed {
  id: string;
  name: string;
  url: string;
  favicon?: string;
  userId?: string | null;
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

  addFeed: async (data: { url: string; name?: string; isOrgLevel?: boolean }): Promise<Feed> => {
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
  userIds: string[];
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
    userIds?: string[];
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
    userIds: string[];
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
