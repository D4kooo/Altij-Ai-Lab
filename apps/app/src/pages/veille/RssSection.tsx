import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import {
  Rss,
  Plus,
  ExternalLink,
  Loader2,
  RefreshCw,
  Star,
  Trash2,
  Globe,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatRelativeTime, cn } from '@/lib/utils';
import { veilleApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export function RssSection() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeed, setSelectedFeed] = useState<string | null>(null);
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [newFeedName, setNewFeedName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: feeds, isLoading: loadingFeeds } = useQuery({
    queryKey: ['feeds'],
    queryFn: veilleApi.listFeeds,
  });

  const { data: articles, isLoading: loadingArticles } = useQuery({
    queryKey: ['articles', selectedFeed],
    queryFn: () => veilleApi.listArticles(selectedFeed || undefined),
  });

  const addFeedMutation = useMutation({
    mutationFn: (data: { url: string; name?: string; isOrgLevel?: boolean }) => veilleApi.addFeed(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      setNewFeedUrl('');
      setNewFeedName('');
      setShowAddForm(false);
    },
  });

  const deleteFeedMutation = useMutation({
    mutationFn: (id: string) => veilleApi.deleteFeed(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      if (selectedFeed) setSelectedFeed(null);
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (id: string) => veilleApi.toggleArticleFavorite(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['articles'] }),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => veilleApi.markArticleAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['articles'] }),
  });

  const refreshFeedsMutation = useMutation({
    mutationFn: () => veilleApi.refreshFeeds(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  const filteredArticles = articles?.filter((article) => {
    const matchesSearch =
      !searchQuery ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'unread' && !article.isRead) ||
      (activeTab === 'favorites' && article.isFavorite);
    return matchesSearch && matchesTab;
  });

  const unreadCount = articles?.filter((a) => !a.isRead).length || 0;
  const favoritesCount = articles?.filter((a) => a.isFavorite).length || 0;

  const filterTabs = [
    { id: 'all', label: 'Tous', count: articles?.length },
    { id: 'unread', label: 'Non lus', count: unreadCount },
    { id: 'favorites', label: 'Favoris', count: favoritesCount },
  ];

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-0">
      {/* ─── Sources sidebar — flat, no card ─── */}
      <div className="w-64 shrink-0 flex flex-col border-r border-border pr-4 mr-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/40">Sources</p>
          {isAdmin && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAddForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>

        {/* Add form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden mb-3"
            >
              <div className="space-y-2 rounded-lg bg-muted/30 p-3">
                <Input
                  placeholder="https://example.com/rss"
                  value={newFeedUrl}
                  onChange={(e) => setNewFeedUrl(e.target.value)}
                  className="h-8 text-[13px]"
                />
                <Input
                  placeholder="Nom (optionnel)"
                  value={newFeedName}
                  onChange={(e) => setNewFeedName(e.target.value)}
                  className="h-8 text-[13px]"
                />
                <Button size="sm" className="w-full h-7 text-[12px]" onClick={() => newFeedUrl && addFeedMutation.mutate({ url: newFeedUrl, name: newFeedName || undefined })} disabled={!newFeedUrl || addFeedMutation.isPending}>
                  {addFeedMutation.isPending && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                  Ajouter
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feed list */}
        <div className="flex-1 overflow-y-auto space-y-px scrollbar-thin">
          <button
            onClick={() => setSelectedFeed(null)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors',
              !selectedFeed ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            <Globe className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span className="flex-1 text-left">Tous les flux</span>
            {articles && <span className="text-[11px] text-muted-foreground/50">{articles.length}</span>}
          </button>

          {loadingFeeds ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/30" />
            </div>
          ) : feeds?.map((feed) => {
            return (
              <div
                key={feed.id}
                className={cn(
                  'group flex items-center rounded-md px-2 py-1.5 text-[13px] transition-colors cursor-pointer',
                  selectedFeed === feed.id ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
                onClick={() => setSelectedFeed(feed.id)}
              >
                {feed.favicon ? (
                  <img src={feed.favicon} alt="" className="h-4 w-4 rounded shrink-0 mr-2" />
                ) : (
                  <Rss className="h-4 w-4 shrink-0 mr-2" strokeWidth={1.5} />
                )}
                <span className="truncate flex-1">{feed.name}</span>
                {isAdmin && (
                  <button
                    className="p-0.5 rounded opacity-0 group-hover:opacity-40 hover:!opacity-100 hover:text-destructive transition-all"
                    onClick={(e) => { e.stopPropagation(); deleteFeedMutation.mutate(feed.id); }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Articles — flat, no cards ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/30" strokeWidth={1.5} />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-[13px]"
            />
          </div>
          <button
            onClick={() => refreshFeedsMutation.mutate()}
            disabled={refreshFeedsMutation.isPending}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <RefreshCw className={cn('h-4 w-4', refreshFeedsMutation.isPending && 'animate-spin')} strokeWidth={1.5} />
          </button>
        </div>

        {/* Filter tabs — flat text */}
        <div className="flex gap-1 mb-4">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-2.5 py-1 text-[13px] font-medium rounded-md transition-colors duration-100',
                activeTab === tab.id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {tab.label}
              {tab.count !== undefined && <span className="ml-1.5 text-[11px] text-muted-foreground/50">{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* Article list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loadingArticles ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/30" />
            </div>
          ) : filteredArticles && filteredArticles.length > 0 ? (
            <div className="space-y-px">
              {filteredArticles.map((article) => (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => { if (!article.isRead) markAsReadMutation.mutate(article.id); }}
                  className={cn(
                    'group flex items-start gap-3 rounded-lg px-3 py-2.5 -mx-3 hover:bg-muted/50 transition-colors',
                    !article.isRead && 'font-medium'
                  )}
                >
                  {/* Unread dot */}
                  <div className="pt-2 shrink-0">
                    <div className={cn('h-1.5 w-1.5 rounded-full', !article.isRead ? 'bg-primary' : 'bg-transparent')} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-[13px] line-clamp-1', !article.isRead ? 'text-foreground' : 'text-muted-foreground')}>{article.title}</p>
                    {article.description && (
                      <p className="text-[12px] text-muted-foreground/60 line-clamp-1 mt-0.5">{article.description}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground/40 mt-1">
                      {article.feedName} · {formatRelativeTime(article.publishedAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 shrink-0 pt-0.5">
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavoriteMutation.mutate(article.id); }}
                      className={cn(
                        'p-1 rounded transition-all',
                        article.isFavorite ? 'text-amber-400' : 'text-muted-foreground/0 group-hover:text-muted-foreground/30 hover:!text-amber-400'
                      )}
                    >
                      <Star className={cn('h-3.5 w-3.5', article.isFavorite && 'fill-current')} strokeWidth={1.5} />
                    </button>
                    <ExternalLink className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground/30 transition-colors" strokeWidth={1.5} />
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Rss className="h-5 w-5 text-muted-foreground/20 mb-2" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">
                {feeds && feeds.length === 0 ? 'Ajoutez des sources pour commencer' : 'Aucun article'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
