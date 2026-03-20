import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Bot, Star, ArrowRight } from 'lucide-react';
import { assistantsApi, favoritesApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { DynamicIcon } from '@/components/DynamicIcon';

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.03, delayChildren: 0.02 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 28, stiffness: 300 } },
};

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

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground/10 border-t-foreground/50" />
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-semibold tracking-tight">Assistants</h1>
      </motion.div>

      {/* Filters — flat text tabs */}
      {specialties.length > 1 && (
        <motion.div variants={fadeUp} className="flex flex-wrap gap-1">
          <button
            onClick={() => setSelectedSpecialty(null)}
            className={cn(
              'px-3 py-1 text-[13px] font-medium rounded-md transition-colors duration-100',
              selectedSpecialty === null
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            Tous
          </button>
          {specialties.map((specialty) => (
            <button
              key={specialty}
              onClick={() => setSelectedSpecialty(specialty)}
              className={cn(
                'px-3 py-1 text-[13px] font-medium rounded-md transition-colors duration-100',
                selectedSpecialty === specialty
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {specialty}
            </button>
          ))}
        </motion.div>
      )}

      {/* List — flat rows, no cards */}
      <motion.div variants={fadeUp} className="space-y-px">
        {filteredAssistants?.map((assistant) => (
          <Link
            key={assistant.id}
            to={`/assistants/${assistant.id}`}
            className="group flex items-center gap-4 rounded-lg px-3 py-3 -mx-3 hover:bg-muted/50 transition-colors"
          >
            {/* Icon */}
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{
                backgroundColor: `${assistant.color}10`,
                color: assistant.color,
              }}
            >
              <DynamicIcon name={assistant.icon} className="h-5 w-5" strokeWidth={1.5} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{assistant.name}</p>
                {assistant.isPinned && (
                  <span className="text-[10px] text-primary font-medium uppercase tracking-wider">Recommandé</span>
                )}
              </div>
              <p className="text-[13px] text-muted-foreground truncate mt-0.5">
                {assistant.description}
              </p>
            </div>

            {/* Specialty */}
            <span className="hidden sm:block text-[12px] text-muted-foreground/50 shrink-0">
              {assistant.specialty}
            </span>

            {/* Favorite */}
            <button
              onClick={(e) => toggleFavorite(e, assistant.id)}
              aria-label={isFavorite(assistant.id) ? `Retirer ${assistant.name} des favoris` : `Ajouter ${assistant.name} aux favoris`}
              className={cn(
                'p-1.5 rounded-md transition-all duration-100 shrink-0',
                isFavorite(assistant.id)
                  ? 'text-amber-400'
                  : 'text-muted-foreground/0 group-hover:text-muted-foreground/30 hover:!text-amber-400'
              )}
            >
              <Star className={cn('h-4 w-4', isFavorite(assistant.id) && 'fill-current')} strokeWidth={1.5} />
            </button>

            {/* Arrow */}
            <ArrowRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground/40 transition-colors shrink-0" strokeWidth={1.5} />
          </Link>
        ))}
      </motion.div>

      {/* Empty state */}
      {filteredAssistants?.length === 0 && (
        <div className="py-16 text-center">
          <Bot className="h-5 w-5 text-muted-foreground/20 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">Aucun assistant trouvé</p>
        </div>
      )}
    </motion.div>
  );
}
