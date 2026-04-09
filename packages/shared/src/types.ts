// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  isStaff: boolean; // Data Ring staff members have access to Lab tools
  canEditCitizenSpace: boolean; // Permission to edit citizen space (courses, campaigns, templates)
  accountType?: 'particulier' | 'organisation';
  organizationName?: string;
  organizationRole?: string;
  department?: string | null;
  organizationId?: string | null; // Multi-tenant: lien vers l'organisation
  isOnboarded?: boolean; // Multi-tenant: onboarding complété
  createdAt: string;
  lastLoginAt: string | null;
}

// Organization types (Multi-tenant)
export type OrganizationType = 'work' | 'family';

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  ownerId?: string | null;
  settings?: OrganizationSettings;
  createdAt: string;
}

export interface OrganizationSettings {
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
  };
  modelRestrictions?: {
    allowedModels?: string[];
    maxTokensPerDay?: number;
  };
  features?: {
    voiceEnabled?: boolean;
    parentalControls?: boolean;
    maxUsersPerOrg?: number;
  };
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'admin' | 'user';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface AssistantToolConfig {
  id: string;
  type: 'builtin' | 'mcp';
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface ToolCallRecord {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: string;
}

// Assistant types
export type AssistantType = 'openrouter' | 'webhook';

export interface Assistant {
  id: string;
  type: AssistantType;
  // OpenRouter configuration
  model: string | null;
  systemPrompt: string | null;
  temperature: number;
  maxTokens: number;
  // Webhook configuration
  webhookUrl: string | null;
  // Metadata
  name: string;
  description: string;
  specialty: string;
  icon: string;
  color: string;
  suggestedPrompts: string[];
  dataSources: string[];
  tools: AssistantToolConfig[];
  isPinned: boolean;
  pinOrder: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssistantRequest {
  type?: AssistantType;
  // OpenRouter configuration
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  // Webhook configuration
  webhookUrl?: string;
  // Metadata
  name: string;
  description: string;
  specialty: string;
  icon: string;
  color: string;
  suggestedPrompts?: string[];
  dataSources?: string[];
  isPinned?: boolean;
  pinOrder?: number;
}

// Assistant document types (RAG knowledge base)
export type DocumentStatus = 'processing' | 'ready' | 'error';

export interface AssistantDocument {
  id: string;
  assistantId: string;
  name: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  status: DocumentStatus;
  errorMessage?: string | null;
  chunksCount?: number;
  createdAt: string;
  updatedAt?: string;
}

// OpenRouter model type
export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  contextLength: number | null;
  pricing: {
    prompt: string;
    completion: string;
  };
  supportedModalities: string[];
}

// Conversation types
export interface Conversation {
  id: string;
  userId: string;
  assistantId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  assistant?: Assistant;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  attachments: string[] | null;
  toolCalls?: ToolCallRecord[] | null;
  createdAt: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface SendMessageRequest {
  content: string;
  attachments?: string[];
}

// Automation types
export interface InputFieldOption {
  label: string;
  value: string;
}

export interface InputFieldCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'in';
  value: string | string[];
}

export interface InputField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'file' | 'multifile' | 'date' | 'checkbox' | 'email' | 'tel';
  required: boolean;
  placeholder?: string;
  options?: InputFieldOption[];
  accept?: string;
  maxFiles?: number;
  helpText?: string;
  // Progressive form features
  section?: string;
  sectionTitle?: string;
  sectionDescription?: string;
  showWhen?: InputFieldCondition[];
  defaultValue?: string | number | boolean;
  // Grid layout
  width?: 'full' | 'half' | 'third';
}

export interface Automation {
  id: string;
  n8nWorkflowId: string;
  n8nWebhookUrl: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  inputSchema: InputField[];
  outputType: 'file' | 'text' | 'json' | 'redirect';
  estimatedDuration: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAutomationRequest {
  n8nWorkflowId: string;
  n8nWebhookUrl: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  inputSchema: InputField[];
  outputType: 'file' | 'text' | 'json' | 'redirect';
  estimatedDuration?: number;
}

export interface AutomationRun {
  id: string;
  automationId: string;
  userId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  outputFileUrl: string | null;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
  automation?: Automation;
}

export interface RunAutomationRequest {
  inputs: Record<string, unknown>;
  files?: { name: string; url: string; mimeType: string }[];
}

// Favorite types
export interface Favorite {
  id: string;
  userId: string;
  itemType: 'assistant' | 'automation';
  itemId: string;
  createdAt: string;
}

export interface CreateFavoriteRequest {
  itemType: 'assistant' | 'automation';
  itemId: string;
}

// Dashboard types
export interface DashboardStats {
  conversationsThisMonth: number;
  automationsThisMonth: number;
  estimatedTimeSaved: number; // in minutes
}

export interface RecentActivity {
  type: 'conversation' | 'automation';
  id: string;
  title: string;
  assistantOrAutomationName: string;
  timestamp: string;
  status?: 'completed' | 'failed' | 'running';
  icon?: string;
  color?: string;
}

// Skill types
export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  systemPromptOverride: string | null;
  tools: AssistantToolConfig[];
  dataSources: string[];
  isActive: boolean;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
