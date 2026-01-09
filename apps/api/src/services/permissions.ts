import { eq, and, inArray } from 'drizzle-orm';
import { db, schema } from '../db';

type ResourceType = 'assistant' | 'automation';

/**
 * Vérifie si un utilisateur a accès à une ressource spécifique.
 * Les admins ont accès à tout.
 */
export async function hasAccess(
  userId: string,
  userRole: string,
  resourceType: ResourceType,
  resourceId: string
): Promise<boolean> {
  // Les admins ont accès à tout
  if (userRole === 'admin') {
    return true;
  }

  // Vérifier les permissions individuelles
  const [directPermission] = await db
    .select()
    .from(schema.userPermissions)
    .where(
      and(
        eq(schema.userPermissions.userId, userId),
        eq(schema.userPermissions.resourceType, resourceType),
        eq(schema.userPermissions.resourceId, resourceId)
      )
    )
    .limit(1);

  if (directPermission) {
    return true;
  }

  // Vérifier les permissions via les rôles
  const userRolesList = await db
    .select({ roleId: schema.userRoles.roleId })
    .from(schema.userRoles)
    .where(eq(schema.userRoles.userId, userId));

  if (userRolesList.length === 0) {
    return false;
  }

  const roleIds = userRolesList.map((ur) => ur.roleId);

  const [rolePermission] = await db
    .select()
    .from(schema.rolePermissions)
    .where(
      and(
        inArray(schema.rolePermissions.roleId, roleIds),
        eq(schema.rolePermissions.resourceType, resourceType),
        eq(schema.rolePermissions.resourceId, resourceId)
      )
    )
    .limit(1);

  return !!rolePermission;
}

/**
 * Récupère toutes les ressources accessibles par un utilisateur pour un type donné.
 * Les admins reçoivent null (signifiant "tout").
 */
export async function getAccessibleResourceIds(
  userId: string,
  userRole: string,
  resourceType: ResourceType
): Promise<string[] | null> {
  // Les admins ont accès à tout
  if (userRole === 'admin') {
    return null; // null = pas de filtre, accès à tout
  }

  const accessibleIds = new Set<string>();

  // Récupérer les permissions individuelles
  const directPermissions = await db
    .select({ resourceId: schema.userPermissions.resourceId })
    .from(schema.userPermissions)
    .where(
      and(
        eq(schema.userPermissions.userId, userId),
        eq(schema.userPermissions.resourceType, resourceType)
      )
    );

  directPermissions.forEach((p) => accessibleIds.add(p.resourceId));

  // Récupérer les rôles de l'utilisateur
  const userRolesList = await db
    .select({ roleId: schema.userRoles.roleId })
    .from(schema.userRoles)
    .where(eq(schema.userRoles.userId, userId));

  if (userRolesList.length > 0) {
    const roleIds = userRolesList.map((ur) => ur.roleId);

    // Récupérer les permissions des rôles
    const rolePermissionsList = await db
      .select({ resourceId: schema.rolePermissions.resourceId })
      .from(schema.rolePermissions)
      .where(
        and(
          inArray(schema.rolePermissions.roleId, roleIds),
          eq(schema.rolePermissions.resourceType, resourceType)
        )
      );

    rolePermissionsList.forEach((p) => accessibleIds.add(p.resourceId));
  }

  return Array.from(accessibleIds);
}

/**
 * Récupère les permissions complètes d'un utilisateur (rôles + individuelles).
 */
export async function getUserPermissions(userId: string) {
  // Récupérer les rôles de l'utilisateur
  const userRolesList = await db
    .select({
      role: schema.roles,
    })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .where(eq(schema.userRoles.userId, userId));

  const roles = userRolesList.map((ur) => ur.role);
  const roleIds = roles.map((r) => r.id);

  // Récupérer les permissions des rôles
  let rolePermissionsList: { resourceType: string; resourceId: string; roleId: string }[] = [];
  if (roleIds.length > 0) {
    rolePermissionsList = await db
      .select({
        resourceType: schema.rolePermissions.resourceType,
        resourceId: schema.rolePermissions.resourceId,
        roleId: schema.rolePermissions.roleId,
      })
      .from(schema.rolePermissions)
      .where(inArray(schema.rolePermissions.roleId, roleIds));
  }

  // Récupérer les permissions individuelles
  const directPermissions = await db
    .select({
      resourceType: schema.userPermissions.resourceType,
      resourceId: schema.userPermissions.resourceId,
    })
    .from(schema.userPermissions)
    .where(eq(schema.userPermissions.userId, userId));

  return {
    roles,
    rolePermissions: rolePermissionsList,
    directPermissions,
  };
}

/**
 * Récupère les permissions d'un rôle.
 */
export async function getRolePermissions(roleId: string) {
  const permissions = await db
    .select({
      id: schema.rolePermissions.id,
      resourceType: schema.rolePermissions.resourceType,
      resourceId: schema.rolePermissions.resourceId,
    })
    .from(schema.rolePermissions)
    .where(eq(schema.rolePermissions.roleId, roleId));

  return permissions;
}

/**
 * Met à jour les permissions d'un rôle (remplace toutes les permissions existantes).
 */
export async function updateRolePermissions(
  roleId: string,
  permissions: { resourceType: ResourceType; resourceId: string }[]
) {
  // Supprimer les anciennes permissions
  await db
    .delete(schema.rolePermissions)
    .where(eq(schema.rolePermissions.roleId, roleId));

  // Ajouter les nouvelles permissions
  if (permissions.length > 0) {
    await db.insert(schema.rolePermissions).values(
      permissions.map((p) => ({
        roleId,
        resourceType: p.resourceType,
        resourceId: p.resourceId,
      }))
    );
  }
}

/**
 * Met à jour les permissions individuelles d'un utilisateur.
 */
export async function updateUserPermissions(
  userId: string,
  permissions: { resourceType: ResourceType; resourceId: string }[]
) {
  // Supprimer les anciennes permissions
  await db
    .delete(schema.userPermissions)
    .where(eq(schema.userPermissions.userId, userId));

  // Ajouter les nouvelles permissions
  if (permissions.length > 0) {
    await db.insert(schema.userPermissions).values(
      permissions.map((p) => ({
        userId,
        resourceType: p.resourceType,
        resourceId: p.resourceId,
      }))
    );
  }
}

/**
 * Récupère les utilisateurs assignés à un rôle.
 */
export async function getRoleUsers(roleId: string) {
  const users = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      firstName: schema.users.firstName,
      lastName: schema.users.lastName,
    })
    .from(schema.userRoles)
    .innerJoin(schema.users, eq(schema.userRoles.userId, schema.users.id))
    .where(eq(schema.userRoles.roleId, roleId));

  return users;
}

/**
 * Assigne un rôle à un utilisateur.
 */
export async function assignRoleToUser(userId: string, roleId: string) {
  // Vérifier si déjà assigné
  const [existing] = await db
    .select()
    .from(schema.userRoles)
    .where(
      and(eq(schema.userRoles.userId, userId), eq(schema.userRoles.roleId, roleId))
    )
    .limit(1);

  if (existing) {
    return existing;
  }

  const [userRole] = await db
    .insert(schema.userRoles)
    .values({ userId, roleId })
    .returning();

  return userRole;
}

/**
 * Retire un rôle d'un utilisateur.
 */
export async function removeRoleFromUser(userId: string, roleId: string) {
  await db
    .delete(schema.userRoles)
    .where(
      and(eq(schema.userRoles.userId, userId), eq(schema.userRoles.roleId, roleId))
    );
}
