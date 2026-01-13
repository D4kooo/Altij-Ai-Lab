import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bot, Star, Pin, ArrowRight } from 'lucide-react';
import { assistantsApi, favoritesApi } from '@/lib/api';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

function DynamicIcon({ name, className, strokeWidth = 1.5 }: { name: string; className?: string; strokeWidth?: number }) {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>>)[name] || Bot;
  return <Icon className={className} strokeWidth={strokeWidth} />;
}

export function Assistants() {
  const queryClient = useQueryClient();
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

  const { data: assistants, isLoading } = useQuery({
    queryKey: ['assistants'],
    queryFn: assistantsApi.list,
  });

  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: favoritesApi.list,
  });

  const addFavorite = useMutation({
    mutationFn: ({ itemType, itemId }: { itemType: 'assistant' | 'automation'; itemId: string }) =>
      favoritesApi.add(itemType, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const removeFavorite = useMutation({
    mutationFn: ({ itemType, itemId }: { itemType: 'assistant' | 'automation'; itemId: string }) =>
      favoritesApi.removeByItem(itemType, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const isFavorite = (id: string) => favorites?.some((f) => f.itemType === 'assistant' && f.itemId === id);

  const toggleFavorite = (id: string) => {
    if (isFavorite(id)) {
      removeFavorite.mutate({ itemType: 'assistant', itemId: id });
    } else {
      addFavorite.mutate({ itemType: 'assistant', itemId: id });
    }
  };

  const filteredAssistants = selectedSpecialty
    ? assistants?.filter((a) => a.specialty === selectedSpecialty)
    : assistants;

  const specialties = [...new Set(assistants?.map((a) => a.specialty) || [])];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Assistants</h1>
        <p className="text-muted-foreground">
          Sélectionnez un assistant pour démarrer une conversation
        </p>
      </div>

      {/* Filters - Premium pill style */}
      {specialties.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedSpecialty(null)}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200',
              selectedSpecialty === null
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-primary/[0.03]'
            )}
          >
            Tous
          </button>
          {specialties.map((specialty) => (
            <button
              key={specialty}
              onClick={() => setSelectedSpecialty(specialty)}
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200',
                selectedSpecialty === specialty
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-primary/[0.03]'
              )}
            >
              {specialty}
            </button>
          ))}
        </div>
      )}

      {/* Grid - Premium cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAssistants?.map((assistant) => (
          <Card
            key={assistant.id}
            className={cn(
              "group relative overflow-hidden hover:shadow-premium hover:-translate-y-0.5",
              assistant.isPinned && "ring-2 ring-primary/20"
            )}
          >
            {/* Pinned indicator */}
            {assistant.isPinned && (
              <div className="absolute left-4 top-4 z-10">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-xs">
                  <Pin className="h-3 w-3 mr-1" strokeWidth={2} />
                  Recommande
                </Badge>
              </div>
            )}

            {/* Favorite button - refined */}
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleFavorite(assistant.id);
              }}
              className={cn(
                'absolute right-4 top-4 z-10 p-1.5 rounded-full transition-all duration-200',
                isFavorite(assistant.id)
                  ? 'bg-amber-50'
                  : 'opacity-0 group-hover:opacity-100 hover:bg-primary/[0.03]'
              )}
            >
              <Star
                className={cn(
                  'h-4 w-4 transition-colors',
                  isFavorite(assistant.id) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'
                )}
                strokeWidth={1.5}
              />
            </button>

            <CardContent className={cn("p-6", assistant.isPinned && "pt-12")}>
              {/* Icon with refined container */}
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                  style={{
                    backgroundColor: `${assistant.color}12`,
                    color: assistant.color,
                  }}
                >
                  <DynamicIcon name={assistant.icon} className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1 pr-8">
                  <h3 className="font-semibold text-foreground truncate tracking-tight">
                    {assistant.name}
                  </h3>
                  <Badge
                    variant="secondary"
                    className="mt-1.5 text-xs font-medium bg-primary/[0.03] text-muted-foreground border-0"
                  >
                    {assistant.specialty}
                  </Badge>
                </div>
              </div>

              {/* Description - refined typography */}
              <CardDescription className="line-clamp-2 mb-5 text-sm leading-relaxed">
                {assistant.description}
              </CardDescription>

              {/* CTA Button - Premium minimalist style */}
              <Button
                asChild
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all duration-200 group/btn"
                size="sm"
              >
                <Link to={`/assistants/${assistant.id}`}>
                  <span>Démarrer</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" strokeWidth={1.5} />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state - refined */}
      {filteredAssistants?.length === 0 && (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Bot className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <p className="text-muted-foreground">Aucun assistant trouvé</p>
        </div>
      )}
    </div>
  );
}
