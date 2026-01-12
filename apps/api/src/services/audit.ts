import type { Context } from 'hono';
import { db, schema } from '../db';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'role_assigned'
  | 'role_removed'
  | 'permission_granted'
  | 'permission_revoked'
  | 'automation_run'
  | 'settings_changed'
  | 'security_alert';

interface AuditLogParams {
  userId?: string | null;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event to the database
 * Non-blocking - errors are logged but don't fail the request
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    await db.insert(schema.auditLogs).values({
      userId: params.userId || null,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      details: params.details,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  } catch (error) {
    // Log error but don't fail the request
    console.error('[AUDIT] Failed to log audit event:', error, params);
  }
}

/**
 * Extract client info from Hono context for audit logging
 */
export function getClientInfo(c: Context): { ipAddress: string; userAgent: string } {
  return {
    ipAddress:
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      c.req.header('x-real-ip') ||
      'unknown',
    userAgent: c.req.header('user-agent') || 'unknown',
  };
}

/**
 * Helper for auth events
 */
export async function logAuthEvent(
  c: Context,
  action: 'login' | 'logout' | 'login_failed',
  userId: string | null,
  details?: Record<string, unknown>
): Promise<void> {
  const { ipAddress, userAgent } = getClientInfo(c);
  await logAudit({
    userId,
    action,
    resourceType: 'auth',
    details,
    ipAddress,
    userAgent,
  });
}

/**
 * Helper for user management events
 */
export async function logUserEvent(
  c: Context,
  action: 'user_created' | 'user_updated' | 'user_deleted',
  actorUserId: string,
  targetUserId: string,
  details?: Record<string, unknown>
): Promise<void> {
  const { ipAddress, userAgent } = getClientInfo(c);
  await logAudit({
    userId: actorUserId,
    action,
    resourceType: 'user',
    resourceId: targetUserId,
    details,
    ipAddress,
    userAgent,
  });
}

/**
 * Helper for permission events
 */
export async function logPermissionEvent(
  c: Context,
  action: 'permission_granted' | 'permission_revoked' | 'role_assigned' | 'role_removed',
  actorUserId: string,
  targetUserId: string,
  details?: Record<string, unknown>
): Promise<void> {
  const { ipAddress, userAgent } = getClientInfo(c);
  await logAudit({
    userId: actorUserId,
    action,
    resourceType: 'permission',
    resourceId: targetUserId,
    details,
    ipAddress,
    userAgent,
  });
}

/**
 * Helper for security alerts
 */
export async function logSecurityAlert(
  c: Context,
  alertType: string,
  details?: Record<string, unknown>
): Promise<void> {
  const { ipAddress, userAgent } = getClientInfo(c);
  await logAudit({
    userId: null,
    action: 'security_alert',
    resourceType: 'security',
    details: { alertType, ...details },
    ipAddress,
    userAgent,
  });

  // Also log to console for immediate visibility
  console.warn(`[SECURITY_ALERT] ${alertType}:`, details);
}
