import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
  Plus,
  Loader2,
  Star,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';
import { veilleIaApi, type VeilleIa } from '@/lib/api';
import { FREQUENCY_LABELS } from './utils';
import { VeilleIaDetail } from './VeilleIaDetail';
import { VeilleIaForm } from './VeilleIaForm';

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.03 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 28, stiffness: 300 } },
};

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

  if (selectedVeille) {
    return <VeilleIaDetail veille={selectedVeille} isAdmin={isAdmin} onBack={() => setSelectedVeille(null)} />;
  }

  if (showCreateForm && isAdmin) {
    return (
      <VeilleIaForm
        departments={departments || []}
        onCancel={() => setShowCreateForm(false)}
        onSuccess={() => { setShowCreateForm(false); queryClient.invalidateQueries({ queryKey: ['veilles-ia'] }); }}
      />
    );
  }

  return (
    <motion.div className="space-y-6" variants={stagger} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/40">
          Veilles automatiques
        </p>
        {isAdmin && (
          <Button size="sm" variant="outline" onClick={() => setShowCreateForm(true)} className="h-7 text-[12px] gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Nouvelle veille
          </Button>
        )}
      </motion.div>

      {/* List — flat rows */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/30" />
        </div>
      ) : veilles && veilles.length > 0 ? (
        <motion.div variants={fadeUp} className="space-y-px">
          {veilles.map((veille) => (
            <button
              key={veille.id}
              onClick={() => setSelectedVeille(veille)}
              className="group w-full flex items-center gap-4 rounded-lg px-3 py-3 -mx-3 text-left hover:bg-muted/50 transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500 shrink-0">
                <Sparkles className="h-4 w-4" strokeWidth={1.5} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{veille.name}</p>
                  {veille.isFavorite && <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />}
                </div>
                <p className="text-[12px] text-muted-foreground truncate mt-0.5">{veille.description}</p>
              </div>

              {/* Meta */}
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-muted-foreground/40">{FREQUENCY_LABELS[veille.frequency]}</span>
                {veille.departments.slice(0, 1).map((dept) => (
                  <Badge key={dept} variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                    {departments?.find((d) => d.id === dept)?.label || dept}
                  </Badge>
                ))}
                {veille.departments.length > 1 && (
                  <span className="text-[10px] text-muted-foreground/30">+{veille.departments.length - 1}</span>
                )}
              </div>

              {/* Time + arrow */}
              <span className="text-[11px] text-muted-foreground/40 shrink-0">
                {veille.latestEdition ? formatRelativeTime(veille.latestEdition.generatedAt) : 'Jamais'}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/30 transition-colors shrink-0" strokeWidth={1.5} />
            </button>
          ))}
        </motion.div>
      ) : (
        <div className="py-16 text-center rounded-lg border border-dashed border-border">
          <Sparkles className="h-5 w-5 text-violet-400/20 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">
            {isAdmin ? 'Aucune veille IA creee' : 'Aucune veille disponible pour votre pole'}
          </p>
          {isAdmin && (
            <p className="text-[12px] text-muted-foreground/50 mt-1">Creez une veille pour recevoir un briefing automatique.</p>
          )}
        </div>
      )}
    </motion.div>
  );
}
