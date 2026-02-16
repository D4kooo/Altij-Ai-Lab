import { fetchApi } from './client';

// Types for Roles & Permissions
export interface Role {
  id: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoleWithDetails extends Role {
  permissions: RolePermission[];
  members: RoleMember[];
}

export interface RolePermission {
  id: string;
  resourceType: 'assistant' | 'automation';
  resourceId: string;
}

export interface RoleMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface UserPermissions {
  roles: Role[];
  rolePermissions: { resourceType: string; resourceId: string; roleId: string }[];
  directPermissions: { resourceType: string; resourceId: string }[];
}

// Roles API
export const rolesApi = {
  list: () => fetchApi<Role[]>('/roles'),
  get: (id: string) => fetchApi<RoleWithDetails>(`/roles/${id}`),
  create: (data: { name: string; description?: string; color?: string }) =>
    fetchApi<Role>('/roles', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; description?: string; color?: string }) =>
    fetchApi<Role>(`/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi<void>(`/roles/${id}`, { method: 'DELETE' }),
  addMember: (roleId: string, userId: string) =>
    fetchApi<void>(`/roles/${roleId}/members`, { method: 'POST', body: JSON.stringify({ userId }) }),
  removeMember: (roleId: string, userId: string) =>
    fetchApi<void>(`/roles/${roleId}/members/${userId}`, { method: 'DELETE' }),
};

// Permissions API
export const permissionsApi = {
  checkAccess: (resourceType: 'assistant' | 'automation', resourceId: string) =>
    fetchApi<{ hasAccess: boolean }>(`/permissions/check/${resourceType}/${resourceId}`),
  getRolePermissions: (roleId: string) =>
    fetchApi<RolePermission[]>(`/permissions/roles/${roleId}`),
  updateRolePermissions: (
    roleId: string,
    permissions: { resourceType: 'assistant' | 'automation'; resourceId: string }[]
  ) => fetchApi<void>(`/permissions/roles/${roleId}`, { method: 'PUT', body: JSON.stringify({ permissions }) }),
  getUserPermissions: (userId: string) =>
    fetchApi<UserPermissions>(`/permissions/users/${userId}`),
  updateUserPermissions: (
    userId: string,
    permissions: { resourceType: 'assistant' | 'automation'; resourceId: string }[]
  ) => fetchApi<void>(`/permissions/users/${userId}`, { method: 'PUT', body: JSON.stringify({ permissions }) }),
  updateUserRoles: (userId: string, roleIds: string[]) =>
    fetchApi<void>(`/permissions/users/${userId}/roles`, { method: 'PUT', body: JSON.stringify({ roleIds }) }),
  addUserRole: (userId: string, roleId: string) =>
    fetchApi<void>(`/permissions/users/${userId}/roles/${roleId}`, { method: 'POST' }),
  removeUserRole: (userId: string, roleId: string) =>
    fetchApi<void>(`/permissions/users/${userId}/roles/${roleId}`, { method: 'DELETE' }),
};
