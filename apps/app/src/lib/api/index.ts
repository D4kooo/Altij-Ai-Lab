export { fetchApi, ApiError, API_BASE } from './client';
export { authApi, usersApi } from './auth';
export type { AdminUser } from './auth';
export { assistantsApi } from './assistants';
export { chatApi } from './chat';
export { automationsApi, lettreMissionApi } from './automations';
export type { LMPreviewResult, LMGenerateResult, LMSendResult } from './automations';
export { favoritesApi } from './favorites';
export { dashboardApi } from './dashboard';
export { veilleApi, newsletterApi, veilleIaApi } from './veille';
export type {
  Feed,
  Article,
  Newsletter,
  Department,
  VeilleIa,
  VeilleIaEdition,
  VeilleIaItem,
  VeilleIaFavorite,
} from './veille';
export { anonymiseurApi } from './anonymiseur';
export type {
  RedactionTerm,
  AnalysisResult,
  AnonymizeTextResult,
  EntityType,
  DetectedEntity,
  AutoDetectResult,
  MissedEntity,
  AIVerificationResult,
  VerifyResult,
  AnonymiseurStatus,
  CensorPreviewResult,
  PreviewPdfResult,
} from './anonymiseur';
export { rolesApi, permissionsApi } from './admin';
export type {
  Role,
  RoleWithDetails,
  RolePermission,
  RoleMember,
  UserPermissions,
} from './admin';
export { documentsApi, organizationsApi } from './organizations';
export { coursesApi, campaignsApi, templatesApi } from './cms';
export { skillsApi, toolsApi } from './skills';
export type { Skill, BuiltinTool } from './skills';
export { segaApi } from './sega';
export type { SegaConversation, SegaConversationWithMessages, SegaMessage, OpenRouterModel } from './sega';
export { supervisionApi } from './supervision';
export type { SupervisionStats, SupervisionUser, SupervisionConversation, SupervisionMessage } from './supervision';
export type {
  Course,
  Module,
  Lesson,
  Quiz,
  QuizOption,
  QuizQuestion,
  CourseWithModules,
  ModuleWithDetails,
  Campaign,
  CampaignStats,
  DocumentTemplate,
  TemplateStats,
  TemplateCategory,
} from './cms';
