import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Users,
  Shield,
  Bot,
  Zap,
  Check,
  X,
  Pencil,
  UserPlus,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  rolesApi,
  permissionsApi,
  usersApi,
  assistantsApi,
  automationsApi,
  type Role,
  type AdminUser,
} from '@/lib/api';
import { cn } from '@/lib/utils';

export function AdminPermissions() {
  const [activeTab, setActiveTab] = useState('roles');
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const queryClient = useQueryClient();

  // Fetch data
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.list,
  });

  const { data: selectedRole } = useQuery({
    queryKey: ['roles', selectedRoleId],
    queryFn: () => rolesApi.get(selectedRoleId!),
    enabled: !!selectedRoleId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
  });

  const { data: assistants = [] } = useQuery({
    queryKey: ['assistants-admin'],
    queryFn: assistantsApi.list,
  });

  const { data: automations = [] } = useQuery({
    queryKey: ['automations-admin'],
    queryFn: automationsApi.list,
  });

  const { data: selectedUserPermissions } = useQuery({
    queryKey: ['user-permissions', selectedUserId],
    queryFn: () => permissionsApi.getUserPermissions(selectedUserId!),
    enabled: !!selectedUserId,
  });

  // Mutations
  const createRole = useMutation({
    mutationFn: rolesApi.create,
    onSuccess: (newRole) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSelectedRoleId(newRole.id);
      setIsCreatingRole(false);
    },
  });

  const updateRole = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof rolesApi.update>[1] }) =>
      rolesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsEditingRole(false);
    },
  });

  const deleteRole = useMutation({
    mutationFn: rolesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSelectedRoleId(null);
    },
  });

  const updateRolePermissions = useMutation({
    mutationFn: ({
      roleId,
      permissions,
    }: {
      roleId: string;
      permissions: { resourceType: 'assistant' | 'automation'; resourceId: string }[];
    }) => permissionsApi.updateRolePermissions(roleId, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', selectedRoleId] });
    },
  });

  const addMemberToRole = useMutation({
    mutationFn: ({ roleId, userId }: { roleId: string; userId: string }) =>
      rolesApi.addMember(roleId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', selectedRoleId] });
      setIsAddingMember(false);
    },
  });

  const removeMemberFromRole = useMutation({
    mutationFn: ({ roleId, userId }: { roleId: string; userId: string }) =>
      rolesApi.removeMember(roleId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', selectedRoleId] });
    },
  });

  const updateUserRoles = useMutation({
    mutationFn: ({ userId, roleIds }: { userId: string; roleIds: string[] }) =>
      permissionsApi.updateUserRoles(userId, roleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions', selectedUserId] });
    },
  });

  const updateUserDirectPermissions = useMutation({
    mutationFn: ({
      userId,
      permissions,
    }: {
      userId: string;
      permissions: { resourceType: 'assistant' | 'automation'; resourceId: string }[];
    }) => permissionsApi.updateUserPermissions(userId, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions', selectedUserId] });
    },
  });

  // Filtered users for search
  const filteredUsers = users.filter(
    (user) =>
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle permission for role
  const handleToggleRolePermission = (resourceType: 'assistant' | 'automation', resourceId: string) => {
    if (!selectedRole) return;

    const currentPermissions = selectedRole.permissions || [];
    const exists = currentPermissions.some(
      (p) => p.resourceType === resourceType && p.resourceId === resourceId
    );

    let newPermissions: { resourceType: 'assistant' | 'automation'; resourceId: string }[];
    if (exists) {
      newPermissions = currentPermissions
        .filter((p) => !(p.resourceType === resourceType && p.resourceId === resourceId))
        .map((p) => ({ resourceType: p.resourceType as 'assistant' | 'automation', resourceId: p.resourceId }));
    } else {
      newPermissions = [
        ...currentPermissions.map((p) => ({ resourceType: p.resourceType as 'assistant' | 'automation', resourceId: p.resourceId })),
        { resourceType, resourceId },
      ];
    }

    updateRolePermissions.mutate({ roleId: selectedRole.id, permissions: newPermissions });
  };

  // Check if role has permission
  const roleHasPermission = (resourceType: string, resourceId: string) => {
    if (!selectedRole) return false;
    return selectedRole.permissions?.some(
      (p) => p.resourceType === resourceType && p.resourceId === resourceId
    );
  };

  // Toggle direct permission for user
  const handleToggleUserPermission = (resourceType: 'assistant' | 'automation', resourceId: string) => {
    if (!selectedUserPermissions || !selectedUserId) return;

    const currentPermissions = selectedUserPermissions.directPermissions || [];
    const exists = currentPermissions.some(
      (p) => p.resourceType === resourceType && p.resourceId === resourceId
    );

    let newPermissions: { resourceType: 'assistant' | 'automation'; resourceId: string }[];
    if (exists) {
      newPermissions = currentPermissions
        .filter((p) => !(p.resourceType === resourceType && p.resourceId === resourceId))
        .map((p) => ({ resourceType: p.resourceType as 'assistant' | 'automation', resourceId: p.resourceId }));
    } else {
      newPermissions = [
        ...currentPermissions.map((p) => ({ resourceType: p.resourceType as 'assistant' | 'automation', resourceId: p.resourceId })),
        { resourceType, resourceId },
      ];
    }

    updateUserDirectPermissions.mutate({ userId: selectedUserId, permissions: newPermissions });
  };

  // Check if user has permission (via role or direct)
  const userHasPermission = (resourceType: string, resourceId: string) => {
    if (!selectedUserPermissions) return { hasPermission: false, source: null };

    // Check direct permissions
    const hasDirect = selectedUserPermissions.directPermissions?.some(
      (p) => p.resourceType === resourceType && p.resourceId === resourceId
    );
    if (hasDirect) return { hasPermission: true, source: 'direct' };

    // Check role permissions
    const rolePermission = selectedUserPermissions.rolePermissions?.find(
      (p) => p.resourceType === resourceType && p.resourceId === resourceId
    );
    if (rolePermission) {
      const role = selectedUserPermissions.roles?.find((r) => r.id === rolePermission.roleId);
      return { hasPermission: true, source: role?.name || 'role' };
    }

    return { hasPermission: false, source: null };
  };

  // Toggle user role
  const handleToggleUserRole = (roleId: string) => {
    if (!selectedUserPermissions || !selectedUserId) return;

    const currentRoleIds = selectedUserPermissions.roles?.map((r) => r.id) || [];
    const newRoleIds = currentRoleIds.includes(roleId)
      ? currentRoleIds.filter((id) => id !== roleId)
      : [...currentRoleIds, roleId];

    updateUserRoles.mutate({ userId: selectedUserId, roleIds: newRoleIds });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Gestion des acces</h1>
          <p className="text-sm text-muted-foreground">
            Gerez les roles et les permissions d'acces aux ressources
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Utilisateurs
          </TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <div className="flex gap-4 h-[calc(100vh-16rem)]">
            {/* Roles List */}
            <div className="w-64 flex flex-col border rounded-lg bg-card">
              <div className="p-3 border-b flex items-center justify-between">
                <span className="text-sm font-medium">Roles ({roles.length})</span>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsCreatingRole(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {roles.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Aucun role cree
                    </p>
                  ) : (
                    roles.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => setSelectedRoleId(role.id)}
                        className={cn(
                          'w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm',
                          'hover:bg-muted transition-colors',
                          selectedRoleId === role.id && 'bg-primary/10 text-primary'
                        )}
                      >
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: role.color }}
                        />
                        <span className="truncate">{role.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Role Details */}
            <div className="flex-1 border rounded-lg bg-card overflow-hidden">
              {selectedRole ? (
                <div className="h-full flex flex-col">
                  {/* Role Header */}
                  <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${selectedRole.color}20`, color: selectedRole.color }}
                      >
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-medium">{selectedRole.name}</h3>
                        {selectedRole.description && (
                          <p className="text-xs text-muted-foreground">{selectedRole.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setIsEditingRole(true)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteRole.mutate(selectedRole.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-6">
                      {/* Assistants Permissions */}
                      <div>
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          Assistants
                        </h4>
                        <div className="space-y-2">
                          {assistants.map((assistant) => (
                            <label
                              key={assistant.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                            >
                              <Checkbox
                                checked={roleHasPermission('assistant', assistant.id)}
                                onCheckedChange={() => handleToggleRolePermission('assistant', assistant.id)}
                              />
                              <div
                                className="h-6 w-6 rounded flex items-center justify-center"
                                style={{ backgroundColor: `${assistant.color}20`, color: assistant.color }}
                              >
                                <Bot className="h-3 w-3" />
                              </div>
                              <span className="text-sm">{assistant.name}</span>
                            </label>
                          ))}
                          {assistants.length === 0 && (
                            <p className="text-xs text-muted-foreground">Aucun assistant disponible</p>
                          )}
                        </div>
                      </div>

                      {/* Automations Permissions */}
                      <div>
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Automations
                        </h4>
                        <div className="space-y-2">
                          {automations.map((automation) => (
                            <label
                              key={automation.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                            >
                              <Checkbox
                                checked={roleHasPermission('automation', automation.id)}
                                onCheckedChange={() => handleToggleRolePermission('automation', automation.id)}
                              />
                              <div
                                className="h-6 w-6 rounded flex items-center justify-center"
                                style={{ backgroundColor: `${automation.color}20`, color: automation.color }}
                              >
                                <Zap className="h-3 w-3" />
                              </div>
                              <span className="text-sm">{automation.name}</span>
                            </label>
                          ))}
                          {automations.length === 0 && (
                            <p className="text-xs text-muted-foreground">Aucune automation disponible</p>
                          )}
                        </div>
                      </div>

                      {/* Members */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Membres ({selectedRole.members?.length || 0})
                          </h4>
                          <Button size="sm" variant="outline" onClick={() => setIsAddingMember(true)}>
                            <UserPlus className="h-3.5 w-3.5 mr-1" />
                            Ajouter
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {selectedRole.members?.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                            >
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                  {member.firstName[0]}
                                  {member.lastName[0]}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    {member.firstName} {member.lastName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{member.email}</p>
                                </div>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() =>
                                  removeMemberFromRole.mutate({ roleId: selectedRole.id, userId: member.id })
                                }
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                          {(!selectedRole.members || selectedRole.members.length === 0) && (
                            <p className="text-xs text-muted-foreground text-center py-2">
                              Aucun membre assigne
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Shield className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Selectionnez un role pour voir ses details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex gap-4 h-[calc(100vh-16rem)]">
            {/* Users List */}
            <div className="w-72 flex flex-col border rounded-lg bg-card">
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className={cn(
                        'w-full flex items-center gap-2 p-2 rounded-lg text-left',
                        'hover:bg-muted transition-colors',
                        selectedUserId === user.id && 'bg-primary/10 text-primary'
                      )}
                    >
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      {user.role === 'admin' && (
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                          Admin
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* User Permissions */}
            <div className="flex-1 border rounded-lg bg-card overflow-hidden">
              {selectedUserId && selectedUserPermissions ? (
                <div className="h-full flex flex-col">
                  {/* User Header */}
                  <div className="p-4 border-b">
                    {(() => {
                      const user = users.find((u) => u.id === selectedUserId);
                      if (!user) return null;
                      return (
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {user.firstName[0]}
                            {user.lastName[0]}
                          </div>
                          <div>
                            <h3 className="font-medium">
                              {user.firstName} {user.lastName}
                            </h3>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                          {user.role === 'admin' && (
                            <Badge className="ml-auto">Administrateur</Badge>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-6">
                      {/* User Roles */}
                      <div>
                        <h4 className="text-sm font-medium mb-3">Roles assignes</h4>
                        <div className="flex flex-wrap gap-2">
                          {roles.map((role) => {
                            const isAssigned = selectedUserPermissions.roles?.some((r) => r.id === role.id);
                            return (
                              <button
                                key={role.id}
                                onClick={() => handleToggleUserRole(role.id)}
                                className={cn(
                                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-colors',
                                  isAssigned
                                    ? 'bg-primary/10 border-primary/30 text-primary'
                                    : 'bg-muted/50 border-transparent hover:border-muted-foreground/30'
                                )}
                              >
                                <div
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: role.color }}
                                />
                                {role.name}
                                {isAssigned && <Check className="h-3 w-3" />}
                              </button>
                            );
                          })}
                          {roles.length === 0 && (
                            <p className="text-xs text-muted-foreground">Aucun role disponible</p>
                          )}
                        </div>
                      </div>

                      {/* Inherited Permissions */}
                      {selectedUserPermissions.rolePermissions &&
                        selectedUserPermissions.rolePermissions.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                              Permissions heritees (via roles)
                            </h4>
                            <div className="space-y-1">
                              {selectedUserPermissions.rolePermissions.map((perm, idx) => {
                                const role = selectedUserPermissions.roles?.find((r) => r.id === perm.roleId);
                                const resource =
                                  perm.resourceType === 'assistant'
                                    ? assistants.find((a) => a.id === perm.resourceId)
                                    : automations.find((a) => a.id === perm.resourceId);
                                return (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2 text-sm text-muted-foreground p-2 rounded bg-muted/30"
                                  >
                                    {perm.resourceType === 'assistant' ? (
                                      <Bot className="h-3.5 w-3.5" />
                                    ) : (
                                      <Zap className="h-3.5 w-3.5" />
                                    )}
                                    <span>{resource?.name || perm.resourceId}</span>
                                    <span className="text-xs opacity-60">via {role?.name}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      {/* Direct Permissions */}
                      <div>
                        <h4 className="text-sm font-medium mb-3">Permissions individuelles</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {/* Assistants */}
                          <div>
                            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                              <Bot className="h-3 w-3" /> Assistants
                            </p>
                            <div className="space-y-1">
                              {assistants.map((assistant) => {
                                const permission = userHasPermission('assistant', assistant.id);
                                return (
                                  <label
                                    key={assistant.id}
                                    className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                                  >
                                    <Checkbox
                                      checked={
                                        selectedUserPermissions.directPermissions?.some(
                                          (p) => p.resourceType === 'assistant' && p.resourceId === assistant.id
                                        ) || false
                                      }
                                      onCheckedChange={() => handleToggleUserPermission('assistant', assistant.id)}
                                    />
                                    <span className="text-sm">{assistant.name}</span>
                                    {permission.source && permission.source !== 'direct' && (
                                      <span className="text-[10px] text-muted-foreground ml-auto">
                                        (via {permission.source})
                                      </span>
                                    )}
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          {/* Automations */}
                          <div>
                            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                              <Zap className="h-3 w-3" /> Automations
                            </p>
                            <div className="space-y-1">
                              {automations.map((automation) => {
                                const permission = userHasPermission('automation', automation.id);
                                return (
                                  <label
                                    key={automation.id}
                                    className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                                  >
                                    <Checkbox
                                      checked={
                                        selectedUserPermissions.directPermissions?.some(
                                          (p) => p.resourceType === 'automation' && p.resourceId === automation.id
                                        ) || false
                                      }
                                      onCheckedChange={() => handleToggleUserPermission('automation', automation.id)}
                                    />
                                    <span className="text-sm">{automation.name}</span>
                                    {permission.source && permission.source !== 'direct' && (
                                      <span className="text-[10px] text-muted-foreground ml-auto">
                                        (via {permission.source})
                                      </span>
                                    )}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Selectionnez un utilisateur pour gerer ses acces</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Role Dialog */}
      <CreateRoleDialog
        open={isCreatingRole}
        onOpenChange={setIsCreatingRole}
        onSubmit={(data) => createRole.mutate(data)}
        isPending={createRole.isPending}
      />

      {/* Edit Role Dialog */}
      {selectedRole && (
        <EditRoleDialog
          open={isEditingRole}
          onOpenChange={setIsEditingRole}
          role={selectedRole}
          onSubmit={(data) => updateRole.mutate({ id: selectedRole.id, data })}
          isPending={updateRole.isPending}
        />
      )}

      {/* Add Member Dialog */}
      {selectedRole && (
        <AddMemberDialog
          open={isAddingMember}
          onOpenChange={setIsAddingMember}
          users={users.filter(
            (u) => !selectedRole.members?.some((m) => m.id === u.id)
          )}
          onSubmit={(userId) =>
            addMemberToRole.mutate({ roleId: selectedRole.id, userId })
          }
          isPending={addMemberToRole.isPending}
        />
      )}
    </div>
  );
}

// Dialog Components
function CreateRoleDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; description?: string; color?: string }) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description: description || undefined, color });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Creer un role</DialogTitle>
          <DialogDescription>
            Creez un nouveau role pour regrouper des permissions
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nom</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Equipe MNA"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description optionnelle..."
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Couleur</label>
            <div className="flex gap-2">
              {['#6366f1', '#ec4899', '#22c55e', '#f59e0b', '#3b82f6', '#8b5cf6'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'h-8 w-8 rounded-full transition-transform',
                    color === c && 'ring-2 ring-offset-2 ring-primary scale-110'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              Creer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditRoleDialog({
  open,
  onOpenChange,
  role,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
  onSubmit: (data: { name?: string; description?: string; color?: string }) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description || '');
  const [color, setColor] = useState(role.color);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description: description || undefined, color });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier le role</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nom</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Couleur</label>
            <div className="flex gap-2">
              {['#6366f1', '#ec4899', '#22c55e', '#f59e0b', '#3b82f6', '#8b5cf6'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'h-8 w-8 rounded-full transition-transform',
                    color === c && 'ring-2 ring-offset-2 ring-primary scale-110'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddMemberDialog({
  open,
  onOpenChange,
  users,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: AdminUser[];
  onSubmit: (userId: string) => void;
  isPending: boolean;
}) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un membre</DialogTitle>
          <DialogDescription>Selectionnez un utilisateur a ajouter au role</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Selectionnez un utilisateur" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => onSubmit(selectedUserId)}
            disabled={isPending || !selectedUserId}
          >
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
