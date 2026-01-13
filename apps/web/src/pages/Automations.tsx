import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, Star, Clock } from 'lucide-react';
import { automationsApi, favoritesApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatDuration } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] || Zap;
  return <Icon className={className} />;
}

export function Automations() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: automations, isLoading } = useQuery({
    queryKey: ['automations'],
    queryFn: automationsApi.list,
  });

  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: favoritesApi.list,
  });

  const addFavorite = useMutation({
    mutationFn: ({ itemType, itemId }: { itemType: 'assistant' | 'automation'; itemId: string }) =>
      favoritesApi.add(itemType, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const removeFavorite = useMutation({
    mutationFn: ({ itemType, itemId }: { itemType: 'assistant' | 'automation'; itemId: string }) =>
      favoritesApi.removeByItem(itemType, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const isFavorite = (automationId: string) => {
    return favorites?.some(
      (f) => f.itemType === 'automation' && f.itemId === automationId
    );
  };

  const toggleFavorite = (automationId: string) => {
    if (isFavorite(automationId)) {
      removeFavorite.mutate({ itemType: 'automation', itemId: automationId });
    } else {
      addFavorite.mutate({ itemType: 'automation', itemId: automationId });
    }
  };

  const filteredAutomations = selectedCategory
    ? automations?.filter((a) => a.category === selectedCategory)
    : automations;

  const categories = [...new Set(automations?.map((a) => a.category) || [])];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div>
        <p className="text-muted-foreground">
          Lancez des automatisations pour traiter vos documents et données. Chaque automatisation génère un résultat téléchargeable ou affichable.
        </p>
      </div>

      {/* Category Filters */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedCategory === null ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedCategory(null)}
          >
            Toutes
          </Badge>
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      )}

      {/* Automations Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAutomations?.map((automation) => (
          <Card
            key={automation.id}
            className="group relative overflow-hidden transition-shadow hover:shadow-lg"
          >
            {/* Favorite button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 h-8 w-8"
              onClick={(e) => {
                e.preventDefault();
                toggleFavorite(automation.id);
              }}
            >
              <Star
                className={cn(
                  'h-4 w-4',
                  isFavorite(automation.id)
                    ? 'fill-gold text-gold'
                    : 'text-muted-foreground'
                )}
              />
            </Button>

            <CardHeader className="pb-3">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${automation.color}20`,
                    color: automation.color,
                  }}
                >
                  <DynamicIcon name={automation.icon} className="h-6 w-6" />
                </div>
                <div className="flex-1 pr-8">
                  <CardTitle className="text-lg">{automation.name}</CardTitle>
                  <Badge variant="outline" className="mt-1">
                    {automation.category}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <CardDescription className="line-clamp-3">
                {automation.description}
              </CardDescription>

              {automation.estimatedDuration && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Durée estimée : {formatDuration(automation.estimatedDuration)}</span>
                </div>
              )}

              <Button asChild className="w-full">
                <Link to={`/automations/${automation.id}`}>
                  <Zap className="mr-2 h-4 w-4" />
                  Lancer
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAutomations?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Zap className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-lg font-medium">Aucune automatisation trouvée</p>
          <p className="text-sm text-muted-foreground">
            {selectedCategory
              ? 'Essayez de sélectionner une autre catégorie'
              : 'Les automatisations seront bientôt disponibles'}
          </p>
        </div>
      )}
    </div>
  );
}
