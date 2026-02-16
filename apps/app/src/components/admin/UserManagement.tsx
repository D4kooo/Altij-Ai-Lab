import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Pencil, Trash2, Loader2, Shield, User } from 'lucide-react';
import { usersApi, AdminUser } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface UserManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ViewMode = 'list' | 'create' | 'edit';

export function UserManagement({ open, onOpenChange }: UserManagementProps) {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: usersApi.list,
    enabled: open,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      resetForm();
      setViewMode('list');
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError('Une erreur est survenue lors de la création');
      }
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof usersApi.update>[1] }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      resetForm();
      setViewMode('list');
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError('Une erreur est survenue lors de la mise à jour');
      }
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        alert(error.message);
      }
    },
  });

  const resetForm = () => {
    setEmail('');
    setFirstName('');
    setLastName('');
    setRole('user');
    setPassword('');
    setConfirmPassword('');
    setEditingUser(null);
    setFormError(null);
  };

  const handleCreate = () => {
    resetForm();
    setViewMode('create');
  };

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setEmail(user.email);
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setRole(user.role);
    setPassword('');
    setConfirmPassword('');
    setViewMode('edit');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate required fields
    if (!email.trim()) {
      setFormError('L\'email est requis');
      return;
    }
    if (!firstName.trim()) {
      setFormError('Le prénom est requis');
      return;
    }
    if (!lastName.trim()) {
      setFormError('Le nom est requis');
      return;
    }

    if (viewMode === 'create') {
      if (!password) {
        setFormError('Le mot de passe est requis');
        return;
      }
      if (password.length < 8) {
        setFormError('Le mot de passe doit contenir au moins 8 caractères');
        return;
      }
      if (password !== confirmPassword) {
        setFormError('Les mots de passe ne correspondent pas');
        return;
      }

      createMutation.mutate({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
        password,
      });
    } else if (editingUser) {
      // Validate password if provided
      if (password) {
        if (password.length < 8) {
          setFormError('Le mot de passe doit contenir au moins 8 caractères');
          return;
        }
        if (password !== confirmPassword) {
          setFormError('Les mots de passe ne correspondent pas');
          return;
        }
      }

      const updateData: Parameters<typeof usersApi.update>[1] = {
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
      };

      if (password) {
        updateData.password = password;
      }

      updateMutation.mutate({ id: editingUser.id, data: updateData });
    }
  };

  const handleDelete = (user: AdminUser) => {
    if (user.id === currentUser?.id) {
      alert('Vous ne pouvez pas supprimer votre propre compte');
      return;
    }
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${user.firstName} ${user.lastName} ?`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const handleClose = () => {
    resetForm();
    setViewMode('list');
    onOpenChange(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {viewMode === 'list' && 'Gestion des utilisateurs'}
            {viewMode === 'create' && 'Créer un utilisateur'}
            {viewMode === 'edit' && 'Modifier l\'utilisateur'}
          </DialogTitle>
          <DialogDescription>
            {viewMode === 'list' && 'Gérez les utilisateurs de l\'application'}
            {viewMode === 'create' && 'Ajoutez un nouvel utilisateur'}
            {viewMode === 'edit' && 'Modifiez les informations de l\'utilisateur'}
          </DialogDescription>
        </DialogHeader>

        {viewMode === 'list' ? (
          <>
            <div className="flex justify-end">
              <Button onClick={handleCreate} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nouvel utilisateur
              </Button>
            </div>

            <ScrollArea className="flex-1 -mx-6 px-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : users && users.length > 0 ? (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-primary/[0.04] hover:bg-primary/[0.02] transition-colors"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/[0.06] text-sm font-medium">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">
                            {user.firstName} {user.lastName}
                          </p>
                          {user.role === 'admin' && (
                            <Badge variant="default" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                          {user.id === currentUser?.id && (
                            <Badge variant="outline" className="text-xs">Vous</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground text-right hidden sm:block">
                        <p>Créé le {formatDate(user.createdAt)}</p>
                        <p>Dernière connexion: {formatDate(user.lastLoginAt)}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(user)}
                          disabled={deleteMutation.isPending || user.id === currentUser?.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun utilisateur
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 pb-4">
                {formError && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom *</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jean"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom *</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Dupont"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jean.dupont@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Rôle</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as 'admin' | 'user')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Utilisateur
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Administrateur
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    Mot de passe {viewMode === 'create' ? '*' : '(laisser vide pour ne pas changer)'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    minLength={8}
                    required={viewMode === 'create'}
                  />
                  <p className="text-xs text-muted-foreground">Minimum 8 caractères</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="********"
                    required={viewMode === 'create' || password.length > 0}
                  />
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setViewMode('list');
                }}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {viewMode === 'edit' ? 'Enregistrer' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
