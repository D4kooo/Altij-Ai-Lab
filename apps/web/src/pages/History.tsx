import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MessageSquare,
  Zap,
  CheckCircle,
  XCircle,
  Loader2,
  Bot,
} from 'lucide-react';
import { chatApi, automationsApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] || Bot;
  return <Icon className={className} />;
}

export function History() {
  const [activeTab, setActiveTab] = useState('conversations');

  const { data: conversations, isLoading: loadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: chatApi.listConversations,
  });

  const { data: runs, isLoading: loadingRuns } = useQuery({
    queryKey: ['automation-runs'],
    queryFn: automationsApi.listRuns,
  });

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="conversations" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversations
            {conversations && (
              <Badge variant="secondary" className="ml-1">
                {conversations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="automations" className="gap-2">
            <Zap className="h-4 w-4" />
            Automatisations
            {runs && (
              <Badge variant="secondary" className="ml-1">
                {runs.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="mt-6">
          {loadingConversations ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : conversations && conversations.length > 0 ? (
            <div className="space-y-3">
              {conversations.map((conv) => (
                <Link
                  key={conv.id}
                  to={`/assistants/${conv.assistantId}/chat/${conv.id}`}
                  className="block"
                >
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: `${(conv as any).assistant?.color}20`,
                          color: (conv as any).assistant?.color,
                        }}
                      >
                        <DynamicIcon
                          name={(conv as any).assistant?.icon || 'MessageSquare'}
                          className="h-5 w-5"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {conv.title || 'Nouvelle conversation'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(conv as any).assistant?.name}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>{formatRelativeTime(conv.updatedAt)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-lg font-medium">Aucune conversation</p>
              <p className="text-sm text-muted-foreground">
                Commencez une conversation avec un assistant IA
              </p>
              <Button asChild className="mt-4">
                <Link to="/assistants">
                  <Bot className="mr-2 h-4 w-4" />
                  Voir les assistants
                </Link>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="automations" className="mt-6">
          {loadingRuns ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : runs && runs.length > 0 ? (
            <div className="space-y-3">
              {runs.map((run) => (
                <Link
                  key={run.id}
                  to={`/automations/runs/${run.id}`}
                  className="block"
                >
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: `${(run as any).automation?.color}20`,
                          color: (run as any).automation?.color,
                        }}
                      >
                        <DynamicIcon
                          name={(run as any).automation?.icon || 'Zap'}
                          className="h-5 w-5"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {(run as any).automation?.name || 'Automatisation'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(run.startedAt)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          run.status === 'completed'
                            ? 'success'
                            : run.status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {run.status === 'completed' && (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Terminée
                          </>
                        )}
                        {run.status === 'failed' && (
                          <>
                            <XCircle className="mr-1 h-3 w-3" />
                            Échec
                          </>
                        )}
                        {(run.status === 'running' || run.status === 'pending') && (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            En cours
                          </>
                        )}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Zap className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-lg font-medium">Aucune exécution</p>
              <p className="text-sm text-muted-foreground">
                Lancez votre première automatisation
              </p>
              <Button asChild className="mt-4">
                <Link to="/automations">
                  <Zap className="mr-2 h-4 w-4" />
                  Voir les automatisations
                </Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
