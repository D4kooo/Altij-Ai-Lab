import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Lock, User, Shield, Bot, Users, Zap, BarChart3, KeyRound } from 'lucide-react';
import { AssistantManagement } from '@/components/admin/AssistantManagement';
import { UserManagement } from '@/components/admin/UserManagement';

export function Settings() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isAssistantModalOpen, setIsAssistantModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 8 caractères' });
      return;
    }

    setIsChangingPassword(true);
    setPasswordMessage(null);

    // TODO: Implement password change API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setPasswordMessage({ type: 'success', text: 'Mot de passe modifié avec succès' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsChangingPassword(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Profil</CardTitle>
          </div>
          <CardDescription>
            Informations de votre compte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-medium text-primary">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div>
              <p className="text-lg font-medium">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Badge variant="outline" className="mt-1">
                {user?.role === 'admin' ? (
                  <>
                    <Shield className="mr-1 h-3 w-3" />
                    Administrateur
                  </>
                ) : (
                  'Utilisateur'
                )}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <CardTitle>Sécurité</CardTitle>
          </div>
          <CardDescription>
            Modifier votre mot de passe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordMessage && (
              <div
                className={`rounded-lg p-3 text-sm ${
                  passwordMessage.type === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-destructive/10 text-destructive'
                }`}
              >
                {passwordMessage.text}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 8 caractères
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword ? 'Modification...' : 'Modifier le mot de passe'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Admin Section */}
      {user?.role === 'admin' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Administration</CardTitle>
            </div>
            <CardDescription>
              Options réservées aux administrateurs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => setIsUserModalOpen(true)}
              >
                <Users className="h-4 w-4 mr-2" />
                Gérer les utilisateurs
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => setIsAssistantModalOpen(true)}
              >
                <Bot className="h-4 w-4 mr-2" />
                Gérer les assistants
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => navigate('/admin/permissions')}
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Gérer les accès
              </Button>
              <Button variant="outline" className="justify-start">
                <Zap className="h-4 w-4 mr-2" />
                Gérer les automatisations
              </Button>
              <Button variant="outline" className="justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                Voir les statistiques
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assistant Management Modal */}
      <AssistantManagement
        open={isAssistantModalOpen}
        onOpenChange={setIsAssistantModalOpen}
      />

      {/* User Management Modal */}
      <UserManagement
        open={isUserModalOpen}
        onOpenChange={setIsUserModalOpen}
      />
    </div>
  );
}
