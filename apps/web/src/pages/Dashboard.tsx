import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MessageSquare,
  Zap,
  Clock,
  ArrowRight,
  Bot,
  Star,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { dashboardApi, favoritesApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime, formatDuration } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

function DynamicIcon({ name, className, strokeWidth = 1.5 }: { name: string; className?: string; strokeWidth?: number }) {
  const Icon = (LucideIcons as Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>>)[name] || Bot;
  return <Icon className={className} strokeWidth={strokeWidth} />;
}

export function Dashboard() {
  const { user } = useAuthStore();

  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardApi.getStats,
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['dashboard', 'recent'],
    queryFn: dashboardApi.getRecentActivity,
  });

  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: favoritesApi.list,
  });

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Bonjour' : currentHour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div className="space-y-8">
      {/* Header - Premium serif greeting */}
      <div className="space-y-1">
        <h1 className="text-2xl font-serif tracking-tight">
          {greeting}, <span className="font-medium">{user?.firstName}</span>
        </h1>
        <p className="text-muted-foreground">
          Voici un aperçu de votre activité
        </p>
      </div>

      {/* Stats - Premium cards with refined styling */}
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="group hover:shadow-premium hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversations ce mois
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.03]">
              <MessageSquare className="h-4 w-4 text-foreground" strokeWidth={1.5} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-semibold tracking-tight">{stats?.conversationsThisMonth || 0}</p>
              <span className="flex items-center text-xs text-emerald-600 font-medium">
                <TrendingUp className="h-3 w-3 mr-0.5" strokeWidth={2} />
                +12%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-premium hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Automatisations lancées
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.03]">
              <Zap className="h-4 w-4 text-foreground" strokeWidth={1.5} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-semibold tracking-tight">{stats?.automationsThisMonth || 0}</p>
              <span className="flex items-center text-xs text-emerald-600 font-medium">
                <TrendingUp className="h-3 w-3 mr-0.5" strokeWidth={2} />
                +8%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-premium hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Temps estimé gagné
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.03]">
              <Clock className="h-4 w-4 text-foreground" strokeWidth={1.5} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">{formatDuration(stats?.estimatedTimeSaved || 0)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Favorites */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Star className="h-4 w-4" strokeWidth={1.5} />
              Favoris
            </CardTitle>
          </CardHeader>
          <CardContent>
            {favorites && favorites.length > 0 ? (
              <div className="space-y-1">
                {favorites.slice(0, 5).map((favorite) => (
                  <Link
                    key={favorite.id}
                    to={
                      favorite.itemType === 'assistant'
                        ? `/assistants/${favorite.itemId}`
                        : `/automations/${favorite.itemId}`
                    }
                    className="group flex items-center gap-3 rounded-xl p-2.5 -mx-2.5 hover:bg-primary/[0.02] transition-colors"
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105"
                      style={{
                        backgroundColor: `${(favorite as any).item?.color}12`,
                        color: (favorite as any).item?.color,
                      }}
                    >
                      <DynamicIcon name={(favorite as any).item?.icon || 'Star'} className="h-4 w-4" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{(favorite as any).item?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {favorite.itemType === 'assistant'
                          ? (favorite as any).item?.specialty
                          : (favorite as any).item?.category}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Star className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-muted-foreground">Aucun favori</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Activité récente</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground -mr-2">
              <Link to="/history">
                Voir tout
                <ArrowRight className="ml-1 h-3.5 w-3.5" strokeWidth={1.5} />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-1">
                {recentActivity.slice(0, 5).map((activity) => (
                  <Link
                    key={`${activity.type}-${activity.id}`}
                    to={
                      activity.type === 'conversation'
                        ? `/assistants/chat/${activity.id}`
                        : `/automations/runs/${activity.id}`
                    }
                    className="group flex items-center gap-3 rounded-xl p-2.5 -mx-2.5 hover:bg-primary/[0.02] transition-colors"
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105"
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
                    {activity.status && (
                      <Badge
                        variant={activity.status === 'completed' ? 'success' : activity.status === 'failed' ? 'destructive' : 'secondary'}
                        className="font-medium"
                      >
                        {activity.status === 'completed' ? 'Terminé' : activity.status === 'failed' ? 'Échec' : 'En cours'}
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Clock className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-muted-foreground">Aucune activité récente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Premium minimalist style */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/assistants" className="group">
          <Card className="hover:shadow-premium hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/[0.04] transition-transform duration-200 group-hover:scale-105">
                <Bot className="h-5 w-5 text-foreground" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="font-semibold tracking-tight">Assistants</p>
                <p className="text-sm text-muted-foreground">Discutez avec un assistant IA</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={1.5} />
            </CardContent>
          </Card>
        </Link>

        <Link to="/automations" className="group">
          <Card className="hover:shadow-premium hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/[0.04] transition-transform duration-200 group-hover:scale-105">
                <Zap className="h-5 w-5 text-foreground" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="font-semibold tracking-tight">Automatisations</p>
                <p className="text-sm text-muted-foreground">Lancez un workflow automatisé</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={1.5} />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
