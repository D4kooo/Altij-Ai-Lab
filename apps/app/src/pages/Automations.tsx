import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, Star, Clock, Loader2 } from 'lucide-react';
import { automationsApi, favoritesApi } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { cn, formatDuration } from '@/lib/utils';
import { DynamicIcon } from '@/components/DynamicIcon';

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
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par catégorie">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
              selectedCategory === null
                ? 'border-transparent bg-primary text-primary-foreground'
                : 'border-border hover:bg-muted'
            )}
          >
            Toutes
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
                selectedCategory === category
                  ? 'border-transparent bg-primary text-primary-foreground'
                  : 'border-border hover:bg-muted'
              )}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Automations — flat rows */}
      <div className="space-y-px">
        {filteredAutomations?.map((automation) => (
          <Link
            key={automation.id}
            to={`/automations/${automation.id}`}
            className="group flex items-center gap-4 rounded-lg px-3 py-3 -mx-3 hover:bg-muted/50 transition-colors"
          >
            {/* Icon */}
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{
                backgroundColor: `${automation.color}10`,
                color: automation.color,
              }}
            >
              <DynamicIcon name={automation.icon} className="h-5 w-5" strokeWidth={1.5} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{automation.name}</p>
              </div>
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {automation.description}
              </p>
            </div>

            {/* Duration */}
            {automation.estimatedDuration && (
              <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground/50 shrink-0">
                <Clock className="h-3 w-3" />
                {formatDuration(automation.estimatedDuration)}
              </span>
            )}

            {/* Category */}
            <Badge variant="outline" className="hidden sm:inline-flex shrink-0">
              {automation.category}
            </Badge>

            {/* Favorite */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite(automation.id);
              }}
              aria-label={isFavorite(automation.id) ? `Retirer ${automation.name} des favoris` : `Ajouter ${automation.name} aux favoris`}
              className={cn(
                'p-1.5 rounded-md transition-all duration-100 shrink-0',
                isFavorite(automation.id)
                  ? 'text-amber-400'
                  : 'text-muted-foreground/0 group-hover:text-muted-foreground/30 hover:!text-amber-400'
              )}
            >
              <Star className={cn('h-4 w-4', isFavorite(automation.id) && 'fill-current')} strokeWidth={1.5} />
            </button>
          </Link>
        ))}
      </div>

      {filteredAutomations?.length === 0 && (
        <div className="py-16 text-center">
          <Zap className="h-5 w-5 text-muted-foreground/20 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">
            {selectedCategory
              ? 'Aucune automatisation dans cette catégorie'
              : 'Aucune automatisation disponible'}
          </p>
        </div>
      )}
    </div>
  );
}
