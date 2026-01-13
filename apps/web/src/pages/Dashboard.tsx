import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Bot,
  Star,
  Newspaper,
  Sparkles,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { dashboardApi, assistantsApi, veilleApi, veilleIaApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

function DynamicIcon({ name, className, strokeWidth = 1.5 }: { name: string; className?: string; strokeWidth?: number }) {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>>)[name] || Bot;
  return <Icon className={className} strokeWidth={strokeWidth} />;
}

export function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: recentActivity } = useQuery({
    queryKey: ['dashboard', 'recent'],
    queryFn: dashboardApi.getRecentActivity,
  });

  const { data: assistants } = useQuery({
    queryKey: ['assistants'],
    queryFn: assistantsApi.list,
  });

  const { data: articles } = useQuery({
    queryKey: ['veille', 'articles'],
    queryFn: () => veilleApi.listArticles(),
  });

  const { data: veillesIa } = useQuery({
    queryKey: ['veille-ia'],
    queryFn: veilleIaApi.list,
  });

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Bonjour' : currentHour < 18 ? 'Bon après-midi' : 'Bonsoir';

  // Raccourcis rapides
  const quickActions = [
    {
      title: 'Automatisations',
      description: 'Lancez un workflow automatisé',
      icon: 'Zap',
      color: '#f59e0b',
      href: '/automations',
    },
    {
      title: 'Anonymiseur',
      description: 'Anonymisez vos documents',
      icon: 'Shield',
      color: '#8b5cf6',
      href: '/anonymiseur',
    },
    {
      title: 'Veille juridique',
      description: 'Consultez les actualités',
      icon: 'Newspaper',
      color: '#06b6d4',
      href: '/veille',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-serif tracking-tight">
          {greeting}, <span className="font-medium">{user?.firstName}</span>
        </h1>
        <p className="text-muted-foreground">
          Que souhaitez-vous faire aujourd'hui ?
        </p>
      </div>

      {/* Accès rapide aux assistants */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5" strokeWidth={1.5} />
            Assistants IA
          </h2>
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground -mr-2">
            <Link to="/assistants">
              Voir tout
              <ArrowRight className="ml-1 h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {assistants?.slice(0, 4).map((assistant) => (
            <Card
              key={assistant.id}
              className="group cursor-pointer hover:shadow-premium hover:-translate-y-0.5 transition-all"
              onClick={() => navigate(`/assistants/${assistant.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                    style={{
                      backgroundColor: `${assistant.color}15`,
                      color: assistant.color,
                    }}
                  >
                    <DynamicIcon name={assistant.icon || 'Bot'} className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{assistant.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{assistant.specialty}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Raccourcis rapides */}
      <div className="grid gap-3 sm:grid-cols-3">
        {quickActions.map((action) => (
          <Link key={action.href} to={action.href} className="group">
            <Card className="hover:shadow-premium hover:-translate-y-0.5 transition-all h-full">
              <CardContent className="flex items-center gap-4 p-4">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                  style={{
                    backgroundColor: `${action.color}15`,
                    color: action.color,
                  }}
                >
                  <DynamicIcon name={action.icon} className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{action.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={1.5} />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Veille Juridique - Articles RSS */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Newspaper className="h-4 w-4" strokeWidth={1.5} />
              Actualités juridiques
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground -mr-2">
              <Link to="/veille">
                Voir tout
                <ArrowRight className="ml-1 h-3.5 w-3.5" strokeWidth={1.5} />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {articles && articles.length > 0 ? (
              <div className="space-y-1">
                {articles.slice(0, 4).map((article) => (
                  <a
                    key={article.id}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 rounded-xl p-2.5 -mx-2.5 hover:bg-primary/[0.02] transition-colors"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600">
                      <FileText className="h-4 w-4" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">{article.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{article.feedName}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{formatRelativeTime(article.publishedAt)}</span>
                      </div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" strokeWidth={1.5} />
                  </a>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Newspaper className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-muted-foreground">Aucun article disponible</p>
                <Button variant="link" size="sm" asChild className="mt-2">
                  <Link to="/veille">Configurer la veille</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Veille IA */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="h-4 w-4" strokeWidth={1.5} />
              Veille IA
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground -mr-2">
              <Link to="/veille?tab=ia">
                Voir tout
                <ArrowRight className="ml-1 h-3.5 w-3.5" strokeWidth={1.5} />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {veillesIa && veillesIa.length > 0 ? (
              <div className="space-y-1">
                {veillesIa.filter(v => v.latestEdition).slice(0, 4).map((veille) => (
                  <Link
                    key={veille.id}
                    to={`/veille?tab=ia&id=${veille.id}`}
                    className="group flex items-start gap-3 rounded-xl p-2.5 -mx-2.5 hover:bg-primary/[0.02] transition-colors"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
                      <Sparkles className="h-4 w-4" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{veille.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {veille.latestEdition?.newItemsCount !== undefined && veille.latestEdition.newItemsCount > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {veille.latestEdition.newItemsCount} nouveau{veille.latestEdition.newItemsCount > 1 ? 'x' : ''}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {veille.latestEdition && formatRelativeTime(veille.latestEdition.generatedAt)}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" strokeWidth={1.5} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Sparkles className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-muted-foreground">Aucune veille IA configurée</p>
                <Button variant="link" size="sm" asChild className="mt-2">
                  <Link to="/veille?tab=ia">Créer une veille IA</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activité récente */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Star className="h-4 w-4" strokeWidth={1.5} />
            Activité récente
          </CardTitle>
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground -mr-2">
            <Link to="/history">
              Voir tout
              <ArrowRight className="ml-1 h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentActivity && recentActivity.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {recentActivity.slice(0, 6).map((activity) => (
                <Link
                  key={`${activity.type}-${activity.id}`}
                  to={
                    activity.type === 'conversation'
                      ? `/assistants/chat/${activity.id}`
                      : `/automations/runs/${activity.id}`
                  }
                  className="group flex items-center gap-3 rounded-xl p-3 hover:bg-primary/[0.02] transition-colors border"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105"
                    style={{
                      backgroundColor: `${(activity as any).color || '#18181b'}12`,
                      color: (activity as any).color || '#18181b',
                    }}
                  >
                    <DynamicIcon
                      name={(activity as any).icon || (activity.type === 'conversation' ? 'MessageSquare' : 'Zap')}
                      className="h-4 w-4"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(activity.timestamp)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Aucune activité récente</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
