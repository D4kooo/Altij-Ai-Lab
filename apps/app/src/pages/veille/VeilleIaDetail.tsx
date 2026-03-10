import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ExternalLink,
  Loader2,
  Trash2,
  Clock,
  Newspaper,
  Sparkles,
  Building2,
  ChevronRight,
  FileText,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { formatRelativeTime, cn } from '@/lib/utils';
import { veilleIaApi, type VeilleIa } from '@/lib/api';
import { FREQUENCY_LABELS } from './utils';

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
            Retour
          </Button>
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {veille.name}
            </h2>
            <p className="text-sm text-muted-foreground">{veille.description}</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Générer maintenant
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => {
                if (confirm('Supprimer cette veille IA ?')) {
                  deleteMutation.mutate();
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="gap-1">
          <Calendar className="h-3 w-3" />
          {FREQUENCY_LABELS[veille.frequency]}
        </Badge>
        {editions && editions.length > 0 && (
          <Badge variant="outline" className="gap-1">
            <FileText className="h-3 w-3" />
            {editions.length} édition{editions.length > 1 ? 's' : ''}
          </Badge>
        )}
        {veille.departments.map((dept) => (
          <Badge key={dept} variant="secondary" className="gap-1">
            <Building2 className="h-3 w-3" />
            {departments?.find((d) => d.id === dept)?.label || dept}
          </Badge>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'content' | 'history')}>
        <TabsList>
          <TabsTrigger value="content" className="gap-2">
            <Newspaper className="h-4 w-4" />
            Newsletter
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Clock className="h-4 w-4" />
            Historique ({editions?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="mt-4">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : latestEdition ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Dernière édition
                </CardTitle>
                <CardDescription>
                  Générée {formatRelativeTime(latestEdition.generatedAt)}
                  {latestEdition.newItemsCount !== undefined && (
                    <span className="ml-2 text-primary">
                      ({latestEdition.newItemsCount} nouveaux sujets)
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
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
                </ScrollArea>
                {latestEdition.sources.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Sources :</p>
                    <div className="flex flex-wrap gap-2">
                      {latestEdition.sources.map((source, idx) => (
                        <a
                          key={idx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {source.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-lg font-medium">Aucune édition</p>
              <p className="text-sm text-muted-foreground">
                {isAdmin
                  ? 'Cliquez sur "Générer maintenant" pour créer la première édition'
                  : 'Cette veille n\'a pas encore d\'édition'}
              </p>
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4">
          {editions && editions.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Historique des éditions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {editions.map((edition, idx) => (
                    <div
                      key={edition.id}
                      className={cn(
                        "flex items-center justify-between rounded-md border p-3",
                        idx === 0 && "border-primary bg-primary/5"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-sm font-medium">
                            {new Date(edition.generatedAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {new Date(edition.generatedAt).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {idx === 0 && (
                          <Badge variant="default" className="text-xs">Dernière</Badge>
                        )}
                      </div>
                      <Badge variant="secondary">
                        {edition.sources.length} sources
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-lg font-medium">Aucun historique</p>
              <p className="text-sm text-muted-foreground">
                L'historique des éditions apparaîtra ici.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
