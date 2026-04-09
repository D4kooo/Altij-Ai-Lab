const CMS_BASE = import.meta.env.VITE_CMS_URL || '';

interface PayloadResponse<T> {
  docs: T[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

async function fetchCMS<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${CMS_BASE}/api${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`CMS error: ${response.status}`);
  }
  return response.json();
}

// Types
export interface CMSPage {
  id: string;
  title: string;
  slug: string;
  description?: string;
  content?: Record<string, unknown>;
  sections?: CMSBlock[];
  status: 'draft' | 'published';
  meta?: { metaTitle?: string; metaDescription?: string; ogImage?: CMSMedia };
}

export interface CMSBlock {
  blockType: 'hero' | 'features' | 'cta' | 'richContent' | 'imageText';
  [key: string]: unknown;
}

export interface CMSArticle {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: Record<string, unknown>;
  coverImage?: CMSMedia;
  category?: string;
  tags?: { tag: string }[];
  author?: { name: string };
  publishedAt?: string;
  status: 'draft' | 'published';
}

export interface CMSNewsletter {
  id: string;
  subject: string;
  preheader?: string;
  content: Record<string, unknown>;
  coverImage?: CMSMedia;
  sections?: { title?: string; body?: Record<string, unknown>; image?: CMSMedia; link?: string; linkText?: string }[];
  status: 'draft' | 'scheduled' | 'sent';
  sentAt?: string;
}

export interface CMSFAQ {
  id: string;
  question: string;
  answer: Record<string, unknown>;
  category: string;
  order: number;
}

export interface CMSMedia {
  id: string;
  url: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface CMSSiteSettings {
  general: { siteName: string; tagline?: string; logo?: CMSMedia; logoDark?: CMSMedia; favicon?: CMSMedia };
  contact: { email?: string; phone?: string; address?: string };
  social: { linkedin?: string; twitter?: string; github?: string };
  footer: { copyright?: string; links?: { label: string; url: string }[] };
}

export interface CMSCourse {
  id: string;
  name: string;
  description: string;
  audience: 'juniors' | 'adultes' | 'seniors' | 'organisation';
  category?: string;
  icon: string;
  color: string;
  thumbnail?: CMSMedia;
  isPublished: boolean;
  order: number;
}

// API functions
export const cmsApi = {
  // Pages
  getPage: async (slug: string): Promise<CMSPage | null> => {
    const data = await fetchCMS<PayloadResponse<CMSPage>>(`/pages?where[slug][equals]=${slug}&where[status][equals]=published&limit=1`);
    return data.docs[0] || null;
  },

  getPages: async (): Promise<CMSPage[]> => {
    const data = await fetchCMS<PayloadResponse<CMSPage>>(`/pages?where[status][equals]=published&sort=-updatedAt`);
    return data.docs;
  },

  // Articles
  getArticles: async (category?: string, page = 1, limit = 10): Promise<PayloadResponse<CMSArticle>> => {
    let url = `/articles?where[status][equals]=published&sort=-publishedAt&page=${page}&limit=${limit}`;
    if (category) url += `&where[category][equals]=${category}`;
    return fetchCMS<PayloadResponse<CMSArticle>>(url);
  },

  getArticle: async (slug: string): Promise<CMSArticle | null> => {
    const data = await fetchCMS<PayloadResponse<CMSArticle>>(`/articles?where[slug][equals]=${slug}&where[status][equals]=published&limit=1`);
    return data.docs[0] || null;
  },

  // Newsletters
  getNewsletters: async (page = 1, limit = 10): Promise<PayloadResponse<CMSNewsletter>> => {
    return fetchCMS<PayloadResponse<CMSNewsletter>>(`/newsletters?where[status][equals]=sent&sort=-sentAt&page=${page}&limit=${limit}`);
  },

  getNewsletter: async (id: string): Promise<CMSNewsletter> => {
    return fetchCMS<CMSNewsletter>(`/newsletters/${id}`);
  },

  // FAQ
  getFAQ: async (category?: string): Promise<CMSFAQ[]> => {
    let url = `/faq?where[isPublished][equals]=true&sort=order&limit=100`;
    if (category) url += `&where[category][equals]=${category}`;
    const data = await fetchCMS<PayloadResponse<CMSFAQ>>(url);
    return data.docs;
  },

  // Courses (from CMS instead of custom API)
  getCourses: async (audience?: string): Promise<CMSCourse[]> => {
    let url = `/courses?where[isPublished][equals]=true&sort=order`;
    if (audience) url += `&where[audience][equals]=${audience}`;
    const data = await fetchCMS<PayloadResponse<CMSCourse>>(url);
    return data.docs;
  },

  // Site Settings (global)
  getSiteSettings: async (): Promise<CMSSiteSettings> => {
    return fetchCMS<CMSSiteSettings>(`/globals/site-settings`);
  },
};
