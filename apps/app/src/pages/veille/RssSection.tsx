import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Rss,
  Plus,
  ExternalLink,
  Loader2,
  RefreshCw,
  Star,
  StarOff,
  Trash2,
  Clock,
  Globe,
  Search,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [isOrgLevel, setIsOrgLevel] = useState(false);
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
      setIsOrgLevel(false);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => veilleApi.markArticleAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  const refreshFeedsMutation = useMutation({
    mutationFn: () => veilleApi.refreshFeeds(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      // Refetch immédiatement pour mettre à jour l'affichage
      queryClient.refetchQueries({ queryKey: ['articles'] });
      console.log('Feeds refreshed:', data);
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

  const handleAddFeed = () => {
    if (newFeedUrl) {
      addFeedMutation.mutate({
        url: newFeedUrl,
        name: newFeedName || undefined,
        isOrgLevel: isOrgLevel || undefined,
      });
    }
  };

  return (
    <div className="flex h-[calc(100vh-14rem)] gap-4">
      {/* Sidebar */}
      <Card className="w-72 shrink-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Sources</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>

          {showAddForm && (
            <div className="mt-3 space-y-3 rounded-md border bg-muted/50 p-3">
              <div className="space-y-1">
                <Label htmlFor="feed-url" className="text-xs">
                  URL (RSS ou site web)
                </Label>
                <Input
                  id="feed-url"
                  placeholder="https://example.com"
                  value={newFeedUrl}
                  onChange={(e) => setNewFeedUrl(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="feed-name" className="text-xs">
                  Nom (optionnel)
                </Label>
                <Input
                  id="feed-name"
                  placeholder="Mon flux"
                  value={newFeedName}
                  onChange={(e) => setNewFeedName(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              {isAdmin && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="org-level"
                    checked={isOrgLevel}
                    onCheckedChange={(checked) => setIsOrgLevel(checked === true)}
                  />
                  <Label htmlFor="org-level" className="text-xs cursor-pointer">
                    Flux organisationnel (partagé)
                  </Label>
                </div>
              )}
              <Button
                size="sm"
                className="w-full"
                onClick={handleAddFeed}
                disabled={!newFeedUrl || addFeedMutation.isPending}
              >
                {addFeedMutation.isPending && (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                )}
                Ajouter
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-22rem)]">
            <div className="space-y-1 p-2">
              <button
                onClick={() => setSelectedFeed(null)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                  !selectedFeed
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
              >
                <Globe className="h-4 w-4" />
                Tous les flux
                {articles && (
                  <Badge variant="secondary" className="ml-auto">
                    {articles.length}
                  </Badge>
                )}
              </button>

              {loadingFeeds ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : feeds && feeds.length > 0 ? (
                feeds.map((feed) => {
                  const isOrgFeed = feed.userId === null;
                  const canDelete = !isOrgFeed || isAdmin;
                  return (
                    <div
                      key={feed.id}
                      className={cn(
                        'group flex items-center rounded-md pl-3 pr-1 py-2 text-sm transition-colors cursor-pointer overflow-hidden',
                        selectedFeed === feed.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      )}
                      onClick={() => setSelectedFeed(feed.id)}
                    >
                      {feed.favicon ? (
                        <img src={feed.favicon} alt="" className="h-4 w-4 rounded shrink-0 mr-2" />
                      ) : (
                        <Rss className="h-4 w-4 shrink-0 mr-2" />
                      )}
                      <span className="truncate max-w-[140px]">{feed.name}</span>
                      {isOrgFeed && (
                        <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 shrink-0">
                          Org
                        </Badge>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            'h-6 w-6 ml-1 shrink-0',
                            selectedFeed === feed.id
                              ? 'text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary-foreground/10'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFeedMutation.mutate(feed.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                  Aucune source
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Content */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans les articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refreshFeedsMutation.mutate()}
            disabled={refreshFeedsMutation.isPending}
          >
            <RefreshCw className={cn('h-4 w-4', refreshFeedsMutation.isPending && 'animate-spin')} />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <Rss className="h-4 w-4" />
              Tous
              {articles && <Badge variant="secondary" className="ml-1">{articles.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="unread" className="gap-2">
              <Clock className="h-4 w-4" />
              Non lus
              <Badge variant="secondary" className="ml-1">{unreadCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2">
              <Star className="h-4 w-4" />
              Favoris
              <Badge variant="secondary" className="ml-1">{favoritesCount}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loadingArticles ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredArticles && filteredArticles.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-26rem)]">
                <div className="space-y-3 pr-4">
                  {filteredArticles.map((article) => (
                    <Card
                      key={article.id}
                      className={cn(
                        'transition-all hover:shadow-md',
                        !article.isRead && 'border-l-4 border-l-primary'
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {article.image && (
                            <img
                              src={article.image}
                              alt=""
                              className="h-24 w-32 rounded-md object-cover shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <a
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium hover:text-primary line-clamp-2"
                                onClick={() => {
                                  if (!article.isRead) {
                                    markAsReadMutation.mutate(article.id);
                                  }
                                }}
                              >
                                {article.title}
                              </a>
                              <div className="flex shrink-0 gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => toggleFavoriteMutation.mutate(article.id)}
                                >
                                  {article.isFavorite ? (
                                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                  ) : (
                                    <StarOff className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                  <a href={article.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              </div>
                            </div>
                            {article.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {article.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Rss className="h-3 w-3" />
                                {article.feedName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatRelativeTime(article.publishedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Rss className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-lg font-medium">Aucun article</p>
                <p className="text-sm text-muted-foreground">
                  {feeds && feeds.length === 0
                    ? 'Ajoutez des sources pour commencer votre veille'
                    : 'Aucun article ne correspond à vos critères'}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
