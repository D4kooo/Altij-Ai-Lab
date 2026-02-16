import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Loader2,
  Star,
  StarOff,
  Brain,
  Sparkles,
  Building2,
  ChevronRight,
  Calendar,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';
import { veilleIaApi, usersApi, type VeilleIa } from '@/lib/api';
import { FREQUENCY_LABELS } from './utils';
import { VeilleIaDetail } from './VeilleIaDetail';
import { VeilleIaForm } from './VeilleIaForm';

export function VeilleIaSection({ isAdmin }: { isAdmin: boolean }) {
  const [selectedVeille, setSelectedVeille] = useState<VeilleIa | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: veilles, isLoading } = useQuery({
    queryKey: ['veilles-ia'],
    queryFn: veilleIaApi.list,
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: veilleIaApi.getDepartments,
  });

  const { data: orgUsers } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
    enabled: isAdmin,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (id: string) => veilleIaApi.toggleFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veilles-ia'] });
      queryClient.invalidateQueries({ queryKey: ['veille-ia'] });
    },
  });

  if (selectedVeille) {
    return (
      <VeilleIaDetail
        veille={selectedVeille}
        isAdmin={isAdmin}
        onBack={() => setSelectedVeille(null)}
      />
    );
  }

  if (showCreateForm && isAdmin) {
    return (
      <VeilleIaForm
        departments={departments || []}
        onCancel={() => setShowCreateForm(false)}
        onSuccess={() => {
          setShowCreateForm(false);
          queryClient.invalidateQueries({ queryKey: ['veilles-ia'] });
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Veilles IA
          </h2>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? 'Créez et gérez des veilles automatiques générées par IA'
              : 'Consultez les veilles juridiques de votre pôle'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle veille IA
          </Button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : veilles && veilles.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {veilles.map((veille) => (
            <Card
              key={veille.id}
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => setSelectedVeille(veille)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      {veille.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {veille.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteMutation.mutate(veille.id);
                        }}
                      >
                        {veille.isFavorite ? (
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        ) : (
                          <StarOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    )}
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    {FREQUENCY_LABELS[veille.frequency]}
                  </Badge>
                  {veille.departments.slice(0, 2).map((dept) => (
                    <Badge key={dept} variant="secondary" className="gap-1">
                      <Building2 className="h-3 w-3" />
                      {departments?.find((d) => d.id === dept)?.label || dept}
                    </Badge>
                  ))}
                  {veille.departments.length > 2 && (
                    <Badge variant="secondary">+{veille.departments.length - 2}</Badge>
                  )}
                  {veille.userIds?.slice(0, 2).map((uid) => {
                    const u = orgUsers?.find((u) => u.id === uid);
                    return (
                      <Badge key={uid} variant="outline" className="gap-1">
                        <User className="h-3 w-3" />
                        {u ? `${u.firstName} ${u.lastName[0]}.` : uid.slice(0, 8)}
                      </Badge>
                    );
                  })}
                  {(veille.userIds?.length ?? 0) > 2 && (
                    <Badge variant="outline">+{veille.userIds.length - 2}</Badge>
                  )}
                </div>
                {veille.latestEdition && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Dernière édition : {formatRelativeTime(veille.latestEdition.generatedAt)}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Brain className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-lg font-medium">Aucune veille IA</p>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? 'Créez votre première veille IA pour commencer'
              : 'Aucune veille n\'est disponible pour votre pôle'}
          </p>
        </div>
      )}
    </div>
  );
}
