import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  User,
} from '@altij/shared';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

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
  const token = localStorage.getItem('citizen_token');

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
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        return fetchApi(endpoint, options);
      }
      localStorage.removeItem('citizen_token');
      localStorage.removeItem('citizen_refreshToken');
      window.location.href = '/citizen/login';
    }
    throw new ApiError(data.error || 'An error occurred', response.status);
  }

  return data.data as T;
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('citizen_refreshToken');
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
      localStorage.setItem('citizen_token', data.data.token);
      localStorage.setItem('citizen_refreshToken', data.data.refreshToken);
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
      body: JSON.stringify({ ...credentials, context: 'citizen' }),
    });
    localStorage.setItem('citizen_token', data.token);
    localStorage.setItem('citizen_refreshToken', data.refreshToken);
    return data;
  },

  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('citizen_refreshToken');
    try {
      await fetchApi('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } finally {
      localStorage.removeItem('citizen_token');
      localStorage.removeItem('citizen_refreshToken');
    }
  },

  me: async (): Promise<User> => {
    return fetchApi<User>('/auth/me');
  },

  registerCitizen: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<AuthResponse> => {
    const response = await fetchApi<AuthResponse>('/auth/register-citizen', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    localStorage.setItem('citizen_token', response.token);
    localStorage.setItem('citizen_refreshToken', response.refreshToken);
    return response;
  },
};

// Course Types
export interface Course {
  id: string;
  organizationId: string | null;
  createdBy: string | null;
  name: string;
  description: string | null;
  audience: 'juniors' | 'adultes' | 'seniors';
  icon: string;
  color: string;
  category: string | null;
  isPublished: boolean;
  isActive: boolean;
  order: number;
  moduleCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  icon: string;
  duration: string;
  difficulty: 'facile' | 'moyen' | 'expert';
  category: string | null;
  hasAudio: boolean;
  audioUrl: string | null;
  isLocked: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  progress?: UserProgress | null;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content: string | null;
  contentType: 'text' | 'video' | 'image' | 'audio';
  mediaUrl: string | null;
  duration: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Quiz {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  passingScore: number;
  createdAt: string;
  updatedAt: string;
  questions?: QuizQuestion[];
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  question: string;
  questionType: 'multiple_choice' | 'true_false';
  options: QuizOption[];
  explanation: string | null;
  order: number;
  createdAt: string;
}

export interface UserProgress {
  id: string;
  userId: string;
  moduleId: string;
  completed: boolean;
  completedAt: string | null;
  quizScore: number | null;
  quizAttempts: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseWithModules extends Course {
  modules: Module[];
}

export interface ModuleWithDetails extends Module {
  lessons: Lesson[];
  quiz: Quiz | null;
  progress: UserProgress | null;
}

export interface QuizSubmitResult {
  score: number;
  passed: boolean;
  passingScore: number;
  correctAnswers: number;
  totalQuestions: number;
  results: {
    questionId: string;
    correct: boolean;
    correctOptionId?: string;
    explanation?: string;
  }[];
}

export interface CourseProgress {
  course: {
    id: string;
    name: string;
    audience: string;
    icon: string;
    color: string;
  };
  completedModules: number;
  totalModules: number;
  progress: number;
}

// Courses API
export const coursesApi = {
  list: async (audience?: string): Promise<Course[]> => {
    const params = audience ? `?audience=${audience}` : '';
    return fetchApi<Course[]>(`/courses${params}`);
  },

  get: async (id: string): Promise<CourseWithModules> => {
    return fetchApi<CourseWithModules>(`/courses/${id}`);
  },

  getModule: async (id: string): Promise<ModuleWithDetails> => {
    return fetchApi<ModuleWithDetails>(`/courses/modules/${id}`);
  },

  submitQuiz: async (quizId: string, answers: { questionId: string; selectedOptionId: string }[]): Promise<QuizSubmitResult> => {
    return fetchApi<QuizSubmitResult>(`/courses/quizzes/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },

  getMyProgress: async (): Promise<CourseProgress[]> => {
    return fetchApi<CourseProgress[]>('/courses/progress/me');
  },

  completeModule: async (moduleId: string): Promise<void> => {
    await fetchApi(`/courses/progress/${moduleId}/complete`, { method: 'POST' });
  },
};

// Campaign Types
export interface Campaign {
  id: string;
  organizationId: string | null;
  createdBy: string | null;
  title: string;
  description: string | null;
  target: string | null;
  category: string | null;
  status: 'draft' | 'active' | 'upcoming' | 'completed';
  participantGoal: number;
  startDate: string | null;
  endDate: string | null;
  participants: number;
  isParticipating: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignStats {
  totalParticipants: number;
  activeCampaigns: number;
  completedCampaigns: number;
}

export interface CampaignParticipation {
  participationId: string;
  joinedAt: string;
  campaign: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    target: string | null;
    category: string | null;
  };
}

// Campaigns API
export const campaignsApi = {
  list: async (status?: string): Promise<Campaign[]> => {
    const params = status ? `?status=${status}` : '';
    return fetchApi<Campaign[]>(`/campaigns${params}`);
  },

  get: async (id: string): Promise<Campaign> => {
    return fetchApi<Campaign>(`/campaigns/${id}`);
  },

  join: async (id: string): Promise<{ participationId: string; participants: number }> => {
    return fetchApi<{ participationId: string; participants: number }>(`/campaigns/${id}/join`, {
      method: 'POST',
    });
  },

  leave: async (id: string): Promise<{ participants: number }> => {
    return fetchApi<{ participants: number }>(`/campaigns/${id}/leave`, {
      method: 'DELETE',
    });
  },

  getMyParticipations: async (): Promise<CampaignParticipation[]> => {
    return fetchApi<CampaignParticipation[]>('/campaigns/my/participations');
  },

  getStats: async (): Promise<CampaignStats> => {
    return fetchApi<CampaignStats>('/campaigns/stats/global');
  },
};

// Template Types
export interface DocumentTemplate {
  id: string;
  organizationId: string | null;
  createdBy: string | null;
  title: string;
  description: string | null;
  category: 'RGPD' | 'Publicité' | 'Réclamation' | 'Autre' | null;
  content: string | null;
  fileUrl: string | null;
  downloadCount: number;
  hasFile?: boolean;
  hasContent?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateCategory {
  value: string;
  label: string;
  description: string;
}

// Templates API
export const templatesApi = {
  list: async (category?: string): Promise<DocumentTemplate[]> => {
    const params = category ? `?category=${category}` : '';
    return fetchApi<DocumentTemplate[]>(`/templates${params}`);
  },

  get: async (id: string): Promise<DocumentTemplate> => {
    return fetchApi<DocumentTemplate>(`/templates/${id}`);
  },

  download: async (id: string): Promise<DocumentTemplate> => {
    return fetchApi<DocumentTemplate>(`/templates/${id}/download`);
  },

  getCategories: async (): Promise<TemplateCategory[]> => {
    return fetchApi<TemplateCategory[]>('/templates/categories/list');
  },
};

export { ApiError };
