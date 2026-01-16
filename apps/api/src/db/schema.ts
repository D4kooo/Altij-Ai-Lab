import { pgTable, text, integer, boolean, timestamp, jsonb, uuid, pgEnum, uniqueIndex, real, customType } from 'drizzle-orm/pg-core';
import type { InputField } from '@altij/shared';

// Custom type for pgvector
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    // Parse "[1,2,3]" format from PostgreSQL
    const clean = value.replace(/[\[\]]/g, '');
    return clean.split(',').map(Number);
  },
});

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'user']);
export const departmentEnum = pgEnum('department', ['affaires', 'family_office', 'mna', 'it', 'ip', 'data', 'social', 'rh']);
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant']);
export const outputTypeEnum = pgEnum('automation_output_type', ['file', 'text', 'json', 'redirect']);
export const runStatusEnum = pgEnum('automation_run_status', ['pending', 'running', 'completed', 'failed']);
export const favoriteTypeEnum = pgEnum('favorite_item_type', ['assistant', 'automation']);
export const assistantTypeEnum = pgEnum('assistant_type', ['openrouter', 'webhook']);
export const resourceTypeEnum = pgEnum('resource_type', ['assistant', 'automation']);
export const organizationTypeEnum = pgEnum('organization_type', ['work', 'family']);
// Document status is stored as TEXT (not enum) for flexibility

// Organisations (Multi-tenant: Work & Family)
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: organizationTypeEnum('type').notNull(),
  ownerId: uuid('owner_id'),
  settings: jsonb('settings').$type<OrganizationSettings>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Type pour les settings d'organisation
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

// Utilisateurs
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  role: userRoleEnum('role').default('user').notNull(),
  isStaff: boolean('is_staff').default(false).notNull(), // Data Ring staff members
  department: departmentEnum('department'),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'set null' }),
  isOnboarded: boolean('is_onboarded').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
});

// Assistants IA
export const assistants = pgTable('assistants', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  type: assistantTypeEnum('type').default('openrouter').notNull(),
  // OpenRouter configuration
  model: text('model').default('anthropic/claude-sonnet-4'), // OpenRouter model ID
  systemPrompt: text('system_prompt'), // System prompt stored locally
  temperature: real('temperature').default(0.7),
  maxTokens: integer('max_tokens').default(4096),
  // Webhook configuration (for n8n, etc.)
  webhookUrl: text('webhook_url'),
  // Metadata
  name: text('name').notNull(),
  description: text('description').notNull(),
  specialty: text('specialty').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  suggestedPrompts: jsonb('suggested_prompts').$type<string[]>().default([]),
  isPinned: boolean('is_pinned').default(false).notNull(),
  pinOrder: integer('pin_order').default(0),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Documents pour la knowledge base des assistants (RAG)
export const assistantDocuments = pgTable('assistant_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  assistantId: uuid('assistant_id').notNull().references(() => assistants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  originalFilename: text('original_filename').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').notNull(),
  status: text('status').default('processing').notNull().$type<'processing' | 'ready' | 'error'>(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Chunks de documents avec embeddings vectoriels
export const documentChunks = pgTable('document_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => assistantDocuments.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  tokensCount: integer('tokens_count'),
  embedding: vector('embedding'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Conversations avec les assistants
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  assistantId: uuid('assistant_id').notNull().references(() => assistants.id, { onDelete: 'cascade' }),
  title: text('title'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Messages des conversations
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  attachments: jsonb('attachments').$type<string[]>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Automatisations (workflows n8n)
export const automations = pgTable('automations', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  n8nWorkflowId: text('n8n_workflow_id').notNull(),
  n8nWebhookUrl: text('n8n_webhook_url').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  inputSchema: jsonb('input_schema').$type<InputField[]>().default([]),
  outputType: outputTypeEnum('output_type').notNull(),
  estimatedDuration: integer('estimated_duration'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Exécutions d'automatisations
export const automationRuns = pgTable('automation_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  automationId: uuid('automation_id').notNull().references(() => automations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: runStatusEnum('status').notNull(),
  input: jsonb('input').$type<Record<string, unknown>>(),
  output: jsonb('output').$type<Record<string, unknown>>(),
  outputFileUrl: text('output_file_url'),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

// Favoris utilisateur
export const favorites = pgTable('favorites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  itemType: favoriteTypeEnum('item_type').notNull(),
  itemId: uuid('item_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Refresh tokens for JWT authentication
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Rôles personnalisés pour la gestion des accès
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').default('#6366f1'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Association utilisateur -> rôles (many-to-many)
export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Permissions des rôles sur les ressources
export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  resourceType: resourceTypeEnum('resource_type').notNull(),
  resourceId: uuid('resource_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Permissions individuelles utilisateur (en plus des rôles)
export const userPermissions = pgTable('user_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  resourceType: resourceTypeEnum('resource_type').notNull(),
  resourceId: uuid('resource_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Feed type enum
export const feedTypeEnum = pgEnum('feed_type', ['rss', 'web']);

// Feeds RSS (Veille)
export const feeds = pgTable('feeds', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  url: text('url').notNull(),
  type: feedTypeEnum('type').default('rss').notNull(),
  favicon: text('favicon'),
  lastFetchedAt: timestamp('last_fetched_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Articles RSS (Veille)
export const articles = pgTable('articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  feedId: uuid('feed_id').notNull().references(() => feeds.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  url: text('url').notNull(),
  image: text('image'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  isRead: boolean('is_read').default(false).notNull(),
  isFavorite: boolean('is_favorite').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('articles_feed_url_idx').on(table.feedId, table.url),
]);

// Newsletter frequency enum
export const newsletterFrequencyEnum = pgEnum('newsletter_frequency', ['daily', 'weekly', 'monthly']);

// Newsletters (RSS personnalisées par utilisateur)
export const newsletters = pgTable('newsletters', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  frequency: newsletterFrequencyEnum('frequency').default('weekly').notNull(),
  feedIds: jsonb('feed_ids').$type<string[]>().default([]),
  isActive: boolean('is_active').default(true).notNull(),
  lastSentAt: timestamp('last_sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Veille IA frequency enum (peut être différent des newsletters)
export const veilleIaFrequencyEnum = pgEnum('veille_ia_frequency', ['daily', 'weekly', 'biweekly', 'monthly']);

// Veilles IA (générées par Perplexity, admin only)
export const veillesIa = pgTable('veilles_ia', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  prompt: text('prompt').notNull(), // Le prompt envoyé à Perplexity
  frequency: veilleIaFrequencyEnum('frequency').default('weekly').notNull(),
  departments: jsonb('departments').$type<string[]>().default([]), // Pôles ciblés
  isActive: boolean('is_active').default(true).notNull(),
  isFavorite: boolean('is_favorite').default(false).notNull(), // Mis en avant sur le dashboard
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Editions de veilles IA (chaque génération)
export const veilleIaEditions = pgTable('veille_ia_editions', {
  id: uuid('id').primaryKey().defaultRandom(),
  veilleIaId: uuid('veille_ia_id').notNull().references(() => veillesIa.id, { onDelete: 'cascade' }),
  content: text('content').notNull(), // Contenu généré par Perplexity (markdown)
  sources: jsonb('sources').$type<{ title: string; url: string }[]>().default([]),
  generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Items individuels extraits des veilles IA (pour déduplication)
export const veilleIaItems = pgTable('veille_ia_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  veilleIaId: uuid('veille_ia_id').notNull().references(() => veillesIa.id, { onDelete: 'cascade' }),
  editionId: uuid('edition_id').notNull().references(() => veilleIaEditions.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  summary: text('summary'), // Résumé court de l'item
  sourceUrl: text('source_url'), // URL source si disponible
  contentHash: text('content_hash').notNull(), // Hash pour détecter les doublons
  category: text('category'), // Type: jurisprudence, legislation, doctrine, etc.
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Audit log action types
export const auditActionEnum = pgEnum('audit_action', [
  'login',
  'logout',
  'login_failed',
  'user_created',
  'user_updated',
  'user_deleted',
  'role_assigned',
  'role_removed',
  'permission_granted',
  'permission_revoked',
  'automation_run',
  'settings_changed',
  'security_alert',
]);

// Audit logs for security tracking
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }), // nullable for system events
  action: auditActionEnum('action').notNull(),
  resourceType: text('resource_type'), // 'user', 'role', 'permission', etc.
  resourceId: text('resource_id'), // ID of affected resource
  details: jsonb('details').$type<Record<string, unknown>>(), // Additional context
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// =====================================================
// CMS: COURS ET ACTIONS COLLECTIVES
// =====================================================

// Enums pour le CMS
export const courseAudienceEnum = pgEnum('course_audience', ['juniors', 'adultes', 'seniors']);
export const moduleDifficultyEnum = pgEnum('module_difficulty', ['facile', 'moyen', 'expert']);
export const lessonContentTypeEnum = pgEnum('lesson_content_type', ['text', 'video', 'image', 'audio']);
export const quizQuestionTypeEnum = pgEnum('quiz_question_type', ['multiple_choice', 'true_false']);
export const campaignStatusEnum = pgEnum('campaign_status', ['draft', 'active', 'upcoming', 'completed']);
export const templateCategoryEnum = pgEnum('template_category', ['RGPD', 'Publicité', 'Réclamation', 'Autre']);

// Cours (groupes de modules par audience)
export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),

  name: text('name').notNull(),
  description: text('description'),
  audience: courseAudienceEnum('audience').notNull(),
  icon: text('icon').default('BookOpen'),
  color: text('color').default('#57C5B6'),

  isPublished: boolean('is_published').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  order: integer('order').default(0),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Modules (sections d'un cours)
export const modules = pgTable('modules', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),

  title: text('title').notNull(),
  description: text('description'),
  icon: text('icon').default('FileText'),
  duration: text('duration').default('15 min'),
  difficulty: moduleDifficultyEnum('difficulty').default('facile'),
  category: text('category'),

  hasAudio: boolean('has_audio').default(false),
  audioUrl: text('audio_url'),
  isLocked: boolean('is_locked').default(false),
  order: integer('order').default(0),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Leçons (contenu d'un module)
export const lessons = pgTable('lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),

  title: text('title').notNull(),
  content: text('content'),
  contentType: lessonContentTypeEnum('content_type').default('text'),
  mediaUrl: text('media_url'),
  duration: text('duration'),
  order: integer('order').default(0),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Quiz (optionnel, lié à un module)
export const quizzes = pgTable('quizzes', {
  id: uuid('id').primaryKey().defaultRandom(),
  moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),

  title: text('title').notNull(),
  description: text('description'),
  passingScore: integer('passing_score').default(70),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Questions de quiz
export const quizQuestions = pgTable('quiz_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  quizId: uuid('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),

  question: text('question').notNull(),
  questionType: quizQuestionTypeEnum('question_type').default('multiple_choice'),
  options: jsonb('options').$type<QuizOption[]>().default([]),
  explanation: text('explanation'),
  order: integer('order').default(0),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Type pour les options de quiz
export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

// Progression utilisateur
export const userProgress = pgTable('user_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),

  completed: boolean('completed').default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  quizScore: integer('quiz_score'),
  quizAttempts: integer('quiz_attempts').default(0),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Campagnes (Actions Collectives)
export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),

  title: text('title').notNull(),
  description: text('description'),
  target: text('target'),
  category: text('category'),

  status: campaignStatusEnum('status').default('draft'),
  participantGoal: integer('participant_goal').default(1000),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),

  isActive: boolean('is_active').default(true).notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Participations aux campagnes
export const campaignParticipations = pgTable('campaign_participations', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
});

// Templates de documents
export const documentTemplates = pgTable('document_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),

  title: text('title').notNull(),
  description: text('description'),
  category: templateCategoryEnum('category'),

  content: text('content'),
  fileUrl: text('file_url'),
  downloadCount: integer('download_count').default(0),

  isActive: boolean('is_active').default(true).notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Type exports for use in application
export type OrganizationSelect = typeof organizations.$inferSelect;
export type OrganizationInsert = typeof organizations.$inferInsert;
export type UserSelect = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
export type AssistantSelect = typeof assistants.$inferSelect;
export type AssistantInsert = typeof assistants.$inferInsert;
export type ConversationSelect = typeof conversations.$inferSelect;
export type ConversationInsert = typeof conversations.$inferInsert;
export type MessageSelect = typeof messages.$inferSelect;
export type MessageInsert = typeof messages.$inferInsert;
export type AutomationSelect = typeof automations.$inferSelect;
export type AutomationInsert = typeof automations.$inferInsert;
export type AutomationRunSelect = typeof automationRuns.$inferSelect;
export type AutomationRunInsert = typeof automationRuns.$inferInsert;
export type FavoriteSelect = typeof favorites.$inferSelect;
export type FavoriteInsert = typeof favorites.$inferInsert;
export type FeedSelect = typeof feeds.$inferSelect;
export type FeedInsert = typeof feeds.$inferInsert;
export type ArticleSelect = typeof articles.$inferSelect;
export type ArticleInsert = typeof articles.$inferInsert;
export type NewsletterSelect = typeof newsletters.$inferSelect;
export type NewsletterInsert = typeof newsletters.$inferInsert;
export type VeilleIaSelect = typeof veillesIa.$inferSelect;
export type VeilleIaInsert = typeof veillesIa.$inferInsert;
export type VeilleIaEditionSelect = typeof veilleIaEditions.$inferSelect;
export type VeilleIaEditionInsert = typeof veilleIaEditions.$inferInsert;
export type VeilleIaItemSelect = typeof veilleIaItems.$inferSelect;
export type VeilleIaItemInsert = typeof veilleIaItems.$inferInsert;
export type RoleSelect = typeof roles.$inferSelect;
export type RoleInsert = typeof roles.$inferInsert;
export type UserRoleSelect = typeof userRoles.$inferSelect;
export type UserRoleInsert = typeof userRoles.$inferInsert;
export type RolePermissionSelect = typeof rolePermissions.$inferSelect;
export type RolePermissionInsert = typeof rolePermissions.$inferInsert;
export type UserPermissionSelect = typeof userPermissions.$inferSelect;
export type UserPermissionInsert = typeof userPermissions.$inferInsert;
export type AuditLogSelect = typeof auditLogs.$inferSelect;
export type AuditLogInsert = typeof auditLogs.$inferInsert;
export type AssistantDocumentSelect = typeof assistantDocuments.$inferSelect;
export type AssistantDocumentInsert = typeof assistantDocuments.$inferInsert;
export type DocumentChunkSelect = typeof documentChunks.$inferSelect;
export type DocumentChunkInsert = typeof documentChunks.$inferInsert;
