import { fetchApi } from './client';

// CMS Types
export interface Course {
  id: string;
  organizationId: string | null;
  createdBy: string | null;
  name: string;
  description: string | null;
  audience: 'juniors' | 'adultes' | 'seniors';
  icon: string;
  color: string;
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

export interface CourseWithModules extends Course {
  modules: Module[];
}

export interface ModuleWithDetails extends Module {
  lessons: Lesson[];
  quiz: Quiz | null;
}

// Courses API (CMS Admin)
export const coursesApi = {
  list: async (audience?: string): Promise<Course[]> => {
    const params = audience ? `?audience=${audience}` : '';
    return fetchApi<Course[]>(`/courses${params}`);
  },
  get: async (id: string): Promise<CourseWithModules> => {
    return fetchApi<CourseWithModules>(`/courses/${id}`);
  },
  create: async (data: {
    name: string;
    description?: string;
    audience: 'juniors' | 'adultes' | 'seniors';
    icon?: string;
    color?: string;
    isPublished?: boolean;
    order?: number;
  }): Promise<Course> => {
    return fetchApi<Course>('/courses', { method: 'POST', body: JSON.stringify(data) });
  },
  update: async (id: string, data: Partial<{
    name: string;
    description: string;
    audience: 'juniors' | 'adultes' | 'seniors';
    icon: string;
    color: string;
    isPublished: boolean;
    order: number;
  }>): Promise<Course> => {
    return fetchApi<Course>(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  delete: async (id: string): Promise<void> => {
    await fetchApi(`/courses/${id}`, { method: 'DELETE' });
  },
  getModule: async (id: string): Promise<ModuleWithDetails> => {
    return fetchApi<ModuleWithDetails>(`/courses/modules/${id}`);
  },
  createModule: async (data: {
    courseId: string;
    title: string;
    description?: string;
    icon?: string;
    duration?: string;
    difficulty?: 'facile' | 'moyen' | 'expert';
    category?: string;
    order?: number;
  }): Promise<Module> => {
    return fetchApi<Module>('/courses/modules', { method: 'POST', body: JSON.stringify(data) });
  },
  updateModule: async (id: string, data: Partial<{
    title: string;
    description: string;
    icon: string;
    duration: string;
    difficulty: 'facile' | 'moyen' | 'expert';
    category: string;
    order: number;
  }>): Promise<Module> => {
    return fetchApi<Module>(`/courses/modules/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  deleteModule: async (id: string): Promise<void> => {
    await fetchApi(`/courses/modules/${id}`, { method: 'DELETE' });
  },
  reorderModules: async (courseId: string, moduleIds: string[]): Promise<void> => {
    await fetchApi('/courses/modules/reorder', { method: 'POST', body: JSON.stringify({ courseId, moduleIds }) });
  },
  createLesson: async (data: {
    moduleId: string;
    title: string;
    content?: string;
    contentType?: 'text' | 'video' | 'image' | 'audio';
    mediaUrl?: string;
    duration?: string;
    order?: number;
  }): Promise<Lesson> => {
    return fetchApi<Lesson>('/courses/lessons', { method: 'POST', body: JSON.stringify(data) });
  },
  updateLesson: async (id: string, data: Partial<{
    title: string;
    content: string;
    contentType: 'text' | 'video' | 'image' | 'audio';
    mediaUrl: string;
    duration: string;
    order: number;
  }>): Promise<Lesson> => {
    return fetchApi<Lesson>(`/courses/lessons/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  deleteLesson: async (id: string): Promise<void> => {
    await fetchApi(`/courses/lessons/${id}`, { method: 'DELETE' });
  },
  createQuiz: async (data: {
    moduleId: string;
    title: string;
    description?: string;
    passingScore?: number;
  }): Promise<Quiz> => {
    return fetchApi<Quiz>('/courses/quizzes', { method: 'POST', body: JSON.stringify(data) });
  },
  updateQuiz: async (id: string, data: Partial<{
    title: string;
    description: string;
    passingScore: number;
  }>): Promise<Quiz> => {
    return fetchApi<Quiz>(`/courses/quizzes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  deleteQuiz: async (id: string): Promise<void> => {
    await fetchApi(`/courses/quizzes/${id}`, { method: 'DELETE' });
  },
  addQuestion: async (quizId: string, data: {
    question: string;
    questionType?: 'multiple_choice' | 'true_false';
    options: QuizOption[];
    explanation?: string;
    order?: number;
  }): Promise<QuizQuestion> => {
    return fetchApi<QuizQuestion>(`/courses/quizzes/${quizId}/questions`, { method: 'POST', body: JSON.stringify(data) });
  },
  updateQuestion: async (id: string, data: Partial<{
    question: string;
    questionType: 'multiple_choice' | 'true_false';
    options: QuizOption[];
    explanation: string;
    order: number;
  }>): Promise<QuizQuestion> => {
    return fetchApi<QuizQuestion>(`/courses/questions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  deleteQuestion: async (id: string): Promise<void> => {
    await fetchApi(`/courses/questions/${id}`, { method: 'DELETE' });
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

// Campaigns API
export const campaignsApi = {
  list: async (status?: string): Promise<Campaign[]> => {
    const params = status ? `?status=${status}` : '';
    return fetchApi<Campaign[]>(`/campaigns${params}`);
  },
  get: async (id: string): Promise<Campaign> => {
    return fetchApi<Campaign>(`/campaigns/${id}`);
  },
  create: async (data: {
    title: string;
    description?: string;
    target?: string;
    category?: string;
    status?: 'draft' | 'active' | 'upcoming' | 'completed';
    participantGoal?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<Campaign> => {
    return fetchApi<Campaign>('/campaigns', { method: 'POST', body: JSON.stringify(data) });
  },
  update: async (id: string, data: Partial<{
    title: string;
    description: string;
    target: string;
    category: string;
    status: 'draft' | 'active' | 'upcoming' | 'completed';
    participantGoal: number;
    startDate: string;
    endDate: string;
  }>): Promise<Campaign> => {
    return fetchApi<Campaign>(`/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  delete: async (id: string): Promise<void> => {
    await fetchApi(`/campaigns/${id}`, { method: 'DELETE' });
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

export interface TemplateStats {
  totalDownloads: number;
  byCategory: {
    category: string;
    count: number;
    downloads: number;
  }[];
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
  create: async (data: {
    title: string;
    description?: string;
    category?: 'RGPD' | 'Publicité' | 'Réclamation' | 'Autre';
    content?: string;
    fileUrl?: string;
  }): Promise<DocumentTemplate> => {
    return fetchApi<DocumentTemplate>('/templates', { method: 'POST', body: JSON.stringify(data) });
  },
  update: async (id: string, data: Partial<{
    title: string;
    description: string;
    category: 'RGPD' | 'Publicité' | 'Réclamation' | 'Autre';
    content: string;
    fileUrl: string;
  }>): Promise<DocumentTemplate> => {
    return fetchApi<DocumentTemplate>(`/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  delete: async (id: string): Promise<void> => {
    await fetchApi(`/templates/${id}`, { method: 'DELETE' });
  },
  getStats: async (): Promise<TemplateStats> => {
    return fetchApi<TemplateStats>('/templates/stats/global');
  },
  getCategories: async (): Promise<TemplateCategory[]> => {
    return fetchApi<TemplateCategory[]>('/templates/categories/list');
  },
};
