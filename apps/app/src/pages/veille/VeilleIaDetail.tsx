import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
  ExternalLink,
  Loader2,
  Trash2,
  Clock,
  Sparkles,
  Building2,
  ArrowLeft,
  FileText,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import ReactMarkdown from 'react-markdown';
import { formatRelativeTime, cn } from '@/lib/utils';
import { veilleIaApi, type VeilleIa } from '@/lib/api';
import { FREQUENCY_LABELS } from './utils';

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 28, stiffness: 300 } },
};

export function VeilleIaDetail({
  veille,
  isAdmin,
  onBack,
}: {
  veille: VeilleIa;
  isAdmin: boolean;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'content' | 'history'>('content');

  const { data: fullVeille, isLoading } = useQuery({
    queryKey: ['veille-ia', veille.id],
    queryFn: () => veilleIaApi.get(veille.id),
  });

  const { data: editions } = useQuery({
    queryKey: ['veille-ia-editions', veille.id],
    queryFn: () => veilleIaApi.getEditions(veille.id),
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: veilleIaApi.getDepartments,
  });

  const generateMutation = useMutation({
    mutationFn: () => veilleIaApi.generate(veille.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veille-ia', veille.id] });
      queryClient.invalidateQueries({ queryKey: ['veille-ia-editions', veille.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => veilleIaApi.delete(veille.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veilles-ia'] });
      onBack();
    },
  });

  const latestEdition = fullVeille?.latestEdition || editions?.[0];

  const tabs = [
    { id: 'content' as const, label: 'Newsletter' },
    { id: 'history' as const, label: `Historique (${editions?.length || 0})` },
  ];

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
    >
      {/* Back + header */}
      <motion.div variants={fadeUp} className="space-y-4">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
          Veilles IA
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{veille.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{veille.description}</p>
          </div>
          {isAdmin && (
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="h-8 text-[13px] gap-1.5"
              >
                {generateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Generer
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Supprimer cette veille ?</DialogTitle>
                    <DialogDescription>
                      Cette action est irreversible. Toutes les editions seront supprimees.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Annuler</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                      {deleteMutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                      Supprimer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </motion.div>

      {/* Meta badges */}
      <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="gap-1 text-[11px] font-normal">
          <Calendar className="h-3 w-3" />
          {FREQUENCY_LABELS[veille.frequency]}
        </Badge>
        {editions && editions.length > 0 && (
          <Badge variant="secondary" className="gap-1 text-[11px] font-normal">
            <FileText className="h-3 w-3" />
            {editions.length} edition{editions.length > 1 ? 's' : ''}
          </Badge>
        )}
        {veille.departments.map((dept) => (
          <Badge key={dept} variant="secondary" className="gap-1 text-[11px] font-normal">
            <Building2 className="h-3 w-3" />
            {departments?.find((d) => d.id === dept)?.label || dept}
          </Badge>
        ))}
      </motion.div>

      {/* Tabs — flat */}
      <motion.div variants={fadeUp} className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors duration-100',
              activeTab === tab.id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Content */}
      <motion.div variants={fadeUp}>
        {activeTab === 'content' ? (
          isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/30" />
            </div>
          ) : latestEdition ? (
            <div className="space-y-4">
              <p className="text-[12px] text-muted-foreground/50">
                Generee {formatRelativeTime(latestEdition.generatedAt)}
                {latestEdition.newItemsCount !== undefined && latestEdition.newItemsCount > 0 && (
                  <span className="ml-1.5 text-primary">({latestEdition.newItemsCount} nouveaux sujets)</span>
                )}
              </p>

              {/* Markdown content — using existing .markdown class */}
              <div className="markdown text-[14px] max-w-none">
                <ReactMarkdown
                  components={{
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {latestEdition.content}
                </ReactMarkdown>
              </div>

              {/* Sources */}
              {latestEdition.sources.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/40 mb-2">Sources</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {latestEdition.sources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-primary transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                        {source.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center rounded-lg border border-dashed border-border">
              <FileText className="h-5 w-5 text-muted-foreground/20 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">Aucune edition</p>
              {isAdmin && <p className="text-[12px] text-muted-foreground/50 mt-1">Cliquez "Generer" pour creer la premiere edition.</p>}
            </div>
          )
        ) : (
          /* History tab */
          editions && editions.length > 0 ? (
            <div className="space-y-px">
              {editions.map((edition, idx) => (
                <div
                  key={edition.id}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-3 py-2.5 -mx-3',
                    idx === 0 ? 'bg-muted/50' : 'hover:bg-muted/30 transition-colors'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground/30 shrink-0" strokeWidth={1.5} />
                    <div>
                      <span className="text-[13px] font-medium">
                        {new Date(edition.generatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="text-[12px] text-muted-foreground/50 ml-2">
                        {new Date(edition.generatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {idx === 0 && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">Derniere</Badge>}
                  </div>
                  <span className="text-[11px] text-muted-foreground/40">{edition.sources.length} sources</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Clock className="h-5 w-5 text-muted-foreground/20 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">Aucun historique</p>
            </div>
          )
        )}
      </motion.div>
    </motion.div>
  );
}
