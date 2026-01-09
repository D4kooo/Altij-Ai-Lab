import { pgTable, text, integer, boolean, timestamp, jsonb, uuid, pgEnum } from 'drizzle-orm/pg-core';
import type { InputField } from '@altij/shared';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'user']);
export const departmentEnum = pgEnum('department', ['affaires', 'family_office', 'mna', 'it', 'ip', 'data', 'social', 'rh']);
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant']);
export const outputTypeEnum = pgEnum('automation_output_type', ['file', 'text', 'json', 'redirect']);
export const runStatusEnum = pgEnum('automation_run_status', ['pending', 'running', 'completed', 'failed']);
export const favoriteTypeEnum = pgEnum('favorite_item_type', ['assistant', 'automation']);
export const assistantTypeEnum = pgEnum('assistant_type', ['openai', 'webhook']);
export const resourceTypeEnum = pgEnum('resource_type', ['assistant', 'automation']);

// Utilisateurs
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  role: userRoleEnum('role').default('user').notNull(),
  department: departmentEnum('department'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
});

// Assistants IA
export const assistants = pgTable('assistants', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: assistantTypeEnum('type').default('openai').notNull(),
  openaiAssistantId: text('openai_assistant_id'), // Optional for webhook type
  webhookUrl: text('webhook_url'), // For webhook type assistants (n8n, etc.)
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

// Conversations avec les assistants
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  assistantId: uuid('assistant_id').notNull().references(() => assistants.id, { onDelete: 'cascade' }),
  openaiThreadId: text('openai_thread_id'), // Optional - only for OpenAI assistants
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
  name: text('name').notNull().unique(),
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
});

// Newsletter frequency enum
export const newsletterFrequencyEnum = pgEnum('newsletter_frequency', ['daily', 'weekly', 'monthly']);

// Newsletters (RSS personnalisées par utilisateur)
export const newsletters = pgTable('newsletters', {
  id: uuid('id').primaryKey().defaultRandom(),
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
  name: text('name').notNull(),
  description: text('description').notNull(),
  prompt: text('prompt').notNull(), // Le prompt envoyé à Perplexity
  frequency: veilleIaFrequencyEnum('frequency').default('weekly').notNull(),
  departments: jsonb('departments').$type<string[]>().default([]), // Pôles ciblés
  isActive: boolean('is_active').default(true).notNull(),
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

// Type exports for use in application
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
