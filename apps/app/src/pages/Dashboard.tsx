import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Newspaper,
  Sparkles,
  FileText,
  ExternalLink,
  MessageCircle,
  Star,
  Play,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { dashboardApi, assistantsApi, veilleApi, veilleIaApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';
import { DynamicIcon } from '@/components/DynamicIcon';
import { cn } from '@/lib/utils';

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 28, stiffness: 280 } },
};

export function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: recentActivity, isLoading: loadingActivity } = useQuery({
    queryKey: ['dashboard', 'recent'],
    queryFn: dashboardApi.getRecentActivity,
  });

  const { data: assistants, isLoading: loadingAssistants } = useQuery({
    queryKey: ['assistants'],
    queryFn: assistantsApi.list,
  });

  const { data: articles, isLoading: loadingArticles } = useQuery({
    queryKey: ['veille', 'articles'],
    queryFn: () => veilleApi.listArticles(),
  });

  const { data: veillesIaFavorites } = useQuery({
    queryKey: ['veille-ia-favorites'],
    queryFn: veilleIaApi.listFavorites,
  });


  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Bonjour' : currentHour < 18 ? 'Bon après-midi' : 'Bonsoir';

  // Last conversations to "resume"
  const lastConversations = recentActivity
    ?.filter((a) => a.type === 'conversation')
    .slice(0, 3) || [];

  return (
    <motion.div
      className="max-w-4xl mx-auto space-y-10"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* ─── Greeting ─── big, Notion-style */}
      <motion.div variants={fadeUp} className="pt-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          {greeting}, {user?.firstName}
        </h1>
      </motion.div>

      {/* ─── Resume — last conversations ─── */}
      {loadingActivity ? (
        <motion.div variants={fadeUp} className="space-y-3">
          <div className="h-3 w-20 bg-muted animate-pulse rounded" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 -mx-3">
              <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-40 bg-muted animate-pulse rounded" />
                <div className="h-3 w-28 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </motion.div>
      ) : lastConversations.length > 0 ? (
        <motion.div variants={fadeUp} className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/40">
            Reprendre
          </p>
          <div className="space-y-1">
            {lastConversations.map((activity) => (
              <Link
                key={activity.id}
                to={`/chat/${activity.id}`}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 -mx-3 hover:bg-muted/50 transition-colors"
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `${activity.color || '#737373'}10`,
                    color: activity.color || '#737373',
                  }}
                >
                  <DynamicIcon
                    name={activity.icon || 'MessageSquare'}
                    className="h-4 w-4"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {activity.title || 'Conversation'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.assistantOrAutomationName} · {formatRelativeTime(activity.timestamp)}
                  </p>
                </div>
                <Play className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" strokeWidth={1.5} />
              </Link>
            ))}
          </div>
        </motion.div>
      ) : null}

      {/* ─── Assistants — adaptive grid ─── */}
      <motion.div variants={fadeUp} className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/40">
            Assistants
          </p>
          <Link to="/assistants" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            Voir tout <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
          </Link>
        </div>
        {loadingAssistants ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg p-3">
                <div className="h-9 w-9 rounded-lg bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={cn(
            'grid gap-2',
            assistants && assistants.length <= 2 ? 'grid-cols-2' :
            assistants && assistants.length <= 3 ? 'grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'
          )}>
            {/* New chat shortcut */}
            <motion.button
              variants={fadeUp}
              onClick={() => navigate('/chat')}
              className="group flex items-center gap-3 rounded-lg p-3 text-left hover:bg-muted/50 transition-colors"
              whileHover={{ x: 2 }}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Nouveau chat</p>
                <p className="text-xs text-muted-foreground">Chat libre</p>
              </div>
            </motion.button>

            {(assistants || []).slice(0, 5).map((assistant) => (
              <motion.button
                key={assistant.id}
                variants={fadeUp}
                onClick={() => navigate(`/assistants/${assistant.id}`)}
                className="group flex items-center gap-3 rounded-lg p-3 text-left hover:bg-muted/50 transition-colors"
                whileHover={{ x: 2 }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `${assistant.color}10`,
                    color: assistant.color,
                  }}
                >
                  <DynamicIcon name={assistant.icon || 'Bot'} className="h-[18px] w-[18px]" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{assistant.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{assistant.specialty}</p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>

      {/* ─── Veille — full-width, no cards ─── */}
      <motion.div variants={fadeUp} className="grid gap-8 lg:grid-cols-2">
        {/* Legal News */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/40">
              Actualités juridiques
            </p>
            <Link to="/veille" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              Voir tout <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
            </Link>
          </div>
          {loadingArticles ? (
            <div className="space-y-0.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 px-3 py-2 -mx-3">
                  <div className="h-4 w-4 bg-muted animate-pulse rounded shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-full bg-muted animate-pulse rounded" />
                    <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : articles && articles.length > 0 ? (
            <div className="space-y-0.5">
              {articles.slice(0, 5).map((article) => (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 rounded-lg px-3 py-2 -mx-3 hover:bg-muted/50 transition-colors"
                >
                  <FileText className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1 group-hover:text-foreground">{article.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {article.feedName} · {formatRelativeTime(article.publishedAt)}
                    </p>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors shrink-0 mt-1" strokeWidth={1.5} />
                </a>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center rounded-lg border border-dashed border-border">
              <Newspaper className="h-5 w-5 text-muted-foreground/20 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">Aucun article</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Ajoutez des flux RSS pour suivre l'actualité juridique.</p>
              <Button variant="outline" size="sm" asChild className="mt-3 h-8 text-xs">
                <Link to="/veille">Configurer la veille</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Veille IA */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/40 flex items-center gap-1.5">
              Veille IA <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            </p>
            <Link to="/veille?tab=ia" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              Voir tout <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
            </Link>
          </div>
          {veillesIaFavorites && veillesIaFavorites.length > 0 ? (
            <div className="space-y-0.5">
              {veillesIaFavorites.slice(0, 4).map((veille) => (
                <Link
                  key={veille.id}
                  to={`/veille?tab=ia&id=${veille.id}`}
                  className="group flex items-start gap-3 rounded-lg px-3 py-2 -mx-3 hover:bg-muted/50 transition-colors"
                >
                  <Sparkles className="h-4 w-4 text-violet-400/50 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{veille.name}</p>
                    {veille.summary && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{veille.summary}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1">
                      {veille.latestEdition?.newItemsCount !== undefined && veille.latestEdition.newItemsCount > 0 && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                          {veille.latestEdition.newItemsCount} nouveau{veille.latestEdition.newItemsCount > 1 ? 'x' : ''}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground/60">
                        {veille.latestEdition && formatRelativeTime(veille.latestEdition.generatedAt)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center rounded-lg border border-dashed border-border">
              <Sparkles className="h-5 w-5 text-violet-400/20 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">Veille IA automatique</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Recevez un briefing quotidien généré par IA sur vos sujets.</p>
              <Button variant="outline" size="sm" asChild className="mt-3 h-8 text-xs">
                <Link to="/veille?tab=ia">Créer une veille IA</Link>
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── Activity — flat list, no card wrapper ─── */}
      {recentActivity && recentActivity.length > 0 && (
        <motion.div variants={fadeUp} className="space-y-3 pb-8">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/40">
              Activité récente
            </p>
            <Link to="/history" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              Voir tout <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
            </Link>
          </div>
          <div className="space-y-px">
            {recentActivity.slice(0, 6).map((activity) => (
              <Link
                key={`${activity.type}-${activity.id}`}
                to={
                  activity.type === 'conversation'
                    ? `/chat/${activity.id}`
                    : `/automations/runs/${activity.id}`
                }
                className="group flex items-center gap-3 rounded-lg px-3 py-2 -mx-3 hover:bg-muted/50 transition-colors"
              >
                <div
                  className={cn(
                    'h-1.5 w-1.5 rounded-full shrink-0',
                    activity.status === 'completed' ? 'bg-emerald-500' :
                    activity.status === 'failed' ? 'bg-red-500' :
                    activity.status === 'running' ? 'bg-amber-500' :
                    'bg-muted-foreground/25'
                  )}
                />
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                  style={{
                    backgroundColor: `${activity.color || '#737373'}08`,
                    color: activity.color || '#737373',
                  }}
                >
                  <DynamicIcon
                    name={activity.icon || (activity.type === 'conversation' ? 'MessageSquare' : 'Zap')}
                    className="h-3.5 w-3.5"
                    strokeWidth={1.5}
                  />
                </div>
                <p className="text-sm flex-1 min-w-0 truncate">{activity.title}</p>
                <span className="text-xs text-muted-foreground/50 shrink-0">
                  {formatRelativeTime(activity.timestamp)}
                </span>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
