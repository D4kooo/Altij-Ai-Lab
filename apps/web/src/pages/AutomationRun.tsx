import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Zap,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  Download,
  RefreshCw,
} from 'lucide-react';
import { automationsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime, formatDuration, cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[name] || Zap;
  return <Icon className={className} />;
}

export function AutomationRun() {
  const { id } = useParams<{ id: string }>();

  const { data: run, isLoading, refetch } = useQuery({
    queryKey: ['automation-run', id],
    queryFn: () => automationsApi.getRun(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      // Poll every 3 seconds if still running
      const data = query.state.data;
      if (data?.status === 'pending' || data?.status === 'running') {
        return 3000;
      }
      return false;
    },
  });

  if (isLoading || !run) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isCompleted = run.status === 'completed';
  const isFailed = run.status === 'failed';
  const isRunning = run.status === 'running' || run.status === 'pending';

  const duration = run.completedAt
    ? Math.floor(
        (new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000
      )
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild>
        <Link to="/automations">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux automatisations
        </Link>
      </Button>

      {/* Status Card */}
      <Card
        className={cn(
          'border-2',
          isCompleted && 'border-green-500/50',
          isFailed && 'border-destructive/50',
          isRunning && 'border-primary/50'
        )}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {run.automation && (
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${run.automation.color}20`,
                    color: run.automation.color,
                  }}
                >
                  <DynamicIcon name={run.automation.icon} className="h-6 w-6" />
                </div>
              )}
              <div>
                <CardTitle>{run.automation?.name || 'Automatisation'}</CardTitle>
                <CardDescription>
                  Lancée le {formatDateTime(run.startedAt)}
                </CardDescription>
              </div>
            </div>
            <Badge
              variant={
                isCompleted
                  ? 'success'
                  : isFailed
                  ? 'destructive'
                  : 'secondary'
              }
              className="text-sm"
            >
              {isCompleted && (
                <>
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Terminée
                </>
              )}
              {isFailed && (
                <>
                  <XCircle className="mr-1 h-3 w-3" />
                  Échec
                </>
              )}
              {isRunning && (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  En cours
                </>
              )}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress for running */}
          {isRunning && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full border-4 border-primary/20">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center text-muted-foreground">
                Traitement en cours, veuillez patienter...
              </p>
              {run.automation?.estimatedDuration && (
                <p className="text-center text-sm text-muted-foreground">
                  Durée estimée : {formatDuration(run.automation.estimatedDuration)}
                </p>
              )}
            </div>
          )}

          {/* Success */}
          {isCompleted && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-medium text-green-600">
                  Automatisation terminée avec succès
                </p>
                {duration && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Durée d'exécution : {formatDuration(duration)}
                  </p>
                )}
              </div>

              {/* Output */}
              {run.outputFileUrl && (
                <div className="flex justify-center pt-4">
                  <Button asChild>
                    <a href={run.outputFileUrl} download>
                      <Download className="mr-2 h-4 w-4" />
                      Télécharger le résultat
                    </a>
                  </Button>
                </div>
              )}

              {run.output && !run.outputFileUrl && (
                <div className="rounded-lg bg-muted p-4">
                  <h4 className="mb-2 font-medium">Résultat :</h4>
                  <pre className="whitespace-pre-wrap text-sm">
                    {JSON.stringify(run.output, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {isFailed && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
                  <XCircle className="h-12 w-12 text-destructive" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-medium text-destructive">
                  Une erreur s'est produite
                </p>
                {run.errorMessage && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {run.errorMessage}
                  </p>
                )}
              </div>

              <div className="flex justify-center gap-2 pt-4">
                <Button variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Rafraîchir
                </Button>
                <Button asChild>
                  <Link to={`/automations/${run.automationId}`}>
                    <Zap className="mr-2 h-4 w-4" />
                    Réessayer
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Input summary */}
          {run.input && Object.keys(run.input).length > 0 && (
            <div className="border-t pt-4">
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                Paramètres utilisés :
              </h4>
              <div className="rounded-lg bg-muted p-3">
                <dl className="space-y-1 text-sm">
                  {Object.entries(run.input).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <dt className="text-muted-foreground">{key}</dt>
                      <dd className="font-medium">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <Link to="/history">
            <Clock className="mr-2 h-4 w-4" />
            Voir l'historique
          </Link>
        </Button>
        {!isRunning && (
          <Button asChild>
            <Link to={`/automations/${run.automationId}`}>
              <Zap className="mr-2 h-4 w-4" />
              Nouvelle exécution
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
