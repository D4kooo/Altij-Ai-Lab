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
  Mail,
  Newspaper,
  Brain,
  Sparkles,
  Building2,
  ChevronRight,
  FileText,
  Calendar,
  MoreVertical,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { formatRelativeTime, cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import {
  veilleApi,
  veilleIaApi,
  type Feed,
  type Article,
  type VeilleIa,
  type VeilleIaEdition,
  type VeilleIaItem,
  type Department,
} from '@/lib/api';

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
  biweekly: 'Bi-hebdomadaire',
  monthly: 'Mensuel',
};

export function Veille() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [mainTab, setMainTab] = useState<'rss' | 'ia'>('rss');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Veille</h1>
        <p className="text-muted-foreground mt-1">
          Suivez l'actualité juridique via vos flux RSS et les veilles IA
        </p>
      </div>

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as 'rss' | 'ia')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="rss" className="gap-2">
            <Rss className="h-4 w-4" />
            Flux RSS
          </TabsTrigger>
          <TabsTrigger value="ia" className="gap-2">
            <Brain className="h-4 w-4" />
            Veille IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rss" className="mt-6">
          <RssSection />
        </TabsContent>

        <TabsContent value="ia" className="mt-6">
          <VeilleIaSection isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================
// SECTION FLUX RSS
// ============================================

function RssSection() {
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
    mutationFn: (data: { url: string; name?: string }) => veilleApi.addFeed(data),
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
                feeds.map((feed) => (
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
                    <span className="truncate max-w-[180px]">{feed.name}</span>
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
                  </div>
                ))
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

// ============================================
// SECTION VEILLE IA
// ============================================

function VeilleIaSection({ isAdmin }: { isAdmin: boolean }) {
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
    return (
      <VeilleIaDetail
        veille={selectedVeille}
        isAdmin={isAdmin}
        onBack={() => setSelectedVeille(null)}
      />
    );
  }

  if (showCreateForm && isAdmin) {
    return (
      <VeilleIaCreateForm
        departments={departments || []}
        onCancel={() => setShowCreateForm(false)}
        onSuccess={() => {
          setShowCreateForm(false);
          queryClient.invalidateQueries({ queryKey: ['veilles-ia'] });
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Veilles IA
          </h2>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? 'Créez et gérez des veilles automatiques générées par IA'
              : 'Consultez les veilles juridiques de votre pôle'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle veille IA
          </Button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : veilles && veilles.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {veilles.map((veille) => (
            <Card
              key={veille.id}
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => setSelectedVeille(veille)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      {veille.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {veille.description}
                    </CardDescription>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    {FREQUENCY_LABELS[veille.frequency]}
                  </Badge>
                  {veille.departments.slice(0, 2).map((dept) => (
                    <Badge key={dept} variant="secondary" className="gap-1">
                      <Building2 className="h-3 w-3" />
                      {departments?.find((d) => d.id === dept)?.label || dept}
                    </Badge>
                  ))}
                  {veille.departments.length > 2 && (
                    <Badge variant="secondary">+{veille.departments.length - 2}</Badge>
                  )}
                </div>
                {veille.latestEdition && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Dernière édition : {formatRelativeTime(veille.latestEdition.generatedAt)}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Brain className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-lg font-medium">Aucune veille IA</p>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? 'Créez votre première veille IA pour commencer'
              : 'Aucune veille n\'est disponible pour votre pôle'}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// VEILLE IA DETAIL
// ============================================

const CATEGORY_LABELS: Record<string, string> = {
  jurisprudence: 'Jurisprudence',
  legislation: 'Législation',
  regulation: 'Régulation',
  cybersecurite: 'Cybersécurité',
  data: 'Data/RGPD',
  doctrine: 'Doctrine',
  actualite: 'Actualité',
};

const CATEGORY_COLORS: Record<string, string> = {
  jurisprudence: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  legislation: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  regulation: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  cybersecurite: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  data: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  doctrine: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  actualite: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

function VeilleIaDetail({
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
                    <div dangerouslySetInnerHTML={{ __html: markdownToHtml(latestEdition.content) }} />
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

// ============================================
// VEILLE IA CREATE FORM
// ============================================

function VeilleIaCreateForm({
  departments,
  onCancel,
  onSuccess,
}: {
  departments: Department[];
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  const createMutation = useMutation({
    mutationFn: () =>
      veilleIaApi.create({
        name,
        description,
        prompt,
        frequency,
        departments: selectedDepartments,
      }),
    onSuccess,
  });

  const toggleDepartment = (id: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
          Retour
        </Button>
        <div>
          <h2 className="text-lg font-semibold">Nouvelle veille IA</h2>
          <p className="text-sm text-muted-foreground">
            Créez une veille automatique générée par Perplexity
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la veille</Label>
            <Input
              id="name"
              placeholder="ex: Veille Droit Social"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="ex: Actualités du droit social français"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt pour l'IA</Label>
            <Textarea
              id="prompt"
              placeholder="ex: Fais-moi une synthèse des dernières actualités en droit social français : jurisprudence, réformes législatives, décisions importantes..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Ce prompt sera envoyé à Perplexity pour générer le contenu de la veille.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Fréquence</Label>
            <div className="flex flex-wrap gap-2">
              {(['daily', 'weekly', 'biweekly', 'monthly'] as const).map((freq) => (
                <Button
                  key={freq}
                  variant={frequency === freq ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFrequency(freq)}
                >
                  {FREQUENCY_LABELS[freq]}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Pôles concernés</Label>
            <div className="grid grid-cols-2 gap-2">
              {departments.map((dept) => (
                <div key={dept.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={dept.id}
                    checked={selectedDepartments.includes(dept.id)}
                    onCheckedChange={() => toggleDepartment(dept.id)}
                  />
                  <Label htmlFor={dept.id} className="cursor-pointer">
                    {dept.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Annuler
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={
                !name ||
                !description ||
                !prompt ||
                selectedDepartments.length === 0 ||
                createMutation.isPending
              }
              className="flex-1"
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Créer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// UTILS
// ============================================

function markdownToHtml(markdown: string): string {
  // Enhanced markdown to HTML conversion for newsletter format
  return markdown
    // Headers with emojis
    .replace(/^### (\d+)\. (.+)$/gim, '<h3 class="text-base font-semibold mt-6 mb-2 flex items-center gap-2"><span class="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">$1</span>$2</h3>')
    .replace(/^## 📰 (.+)$/gim, '<h2 class="text-lg font-bold mb-4 pb-2 border-b flex items-center gap-2">📰 $1</h2>')
    .replace(/^## 📋 (.+)$/gim, '<h2 class="text-lg font-bold mt-6 mb-3 pb-2 border-b flex items-center gap-2">📋 $1</h2>')
    .replace(/^## 🔗 (.+)$/gim, '<h2 class="text-lg font-bold mt-6 mb-3 pb-2 border-b flex items-center gap-2">🔗 $1</h2>')
    .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold mb-4">$1</h1>')
    // Metadata fields
    .replace(/\*\*📅 Date\*\* : (.+)/gim, '<div class="text-xs text-muted-foreground mb-1">📅 $1</div>')
    .replace(/\*\*🏷️ Catégorie\*\* : (.+)/gim, '<span class="inline-block px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full mb-2">🏷️ $1</span>')
    .replace(/\*\*🔗 Source\*\* : (.+)/gim, '<div class="text-xs mt-2 text-muted-foreground">🔗 $1</div>')
    // Bold and italic
    .replace(/\*\*([^*]+)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/gim, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>')
    // Lists
    .replace(/^[-•] (.+)$/gim, '<li class="ml-4 mb-1">$1</li>')
    .replace(/^(\d+)\. (?!<)(.+)$/gim, '<li class="ml-4 mb-1"><span class="font-medium">$1.</span> $2</li>')
    // Horizontal rules
    .replace(/^---+$/gim, '<hr class="my-4 border-border" />')
    // Line breaks
    .replace(/\n\n/gim, '</p><p class="mb-3">')
    .replace(/\n/gim, '<br />');
}
