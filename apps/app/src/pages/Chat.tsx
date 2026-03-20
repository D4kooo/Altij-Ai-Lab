import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageCircle,
  Plus,
  ChevronDown,
  Check,
  Trash2,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { motion } from 'motion/react';
import { segaApi, chatApi, assistantsApi } from '@/lib/api';
import { useChatStore } from '@/stores/chatStore';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  ChatInput,
  ChatMessage,
  StreamingMessage,
} from '@/components/chat';
import { DynamicIcon } from '@/components/DynamicIcon';

// ─── Types ───────────────────────────────────────────────────────────

interface UnifiedConversation {
  id: string;
  title: string | null;
  type: 'assistant' | 'sega';
  assistantId?: string;
  assistantName?: string;
  assistantIcon?: string;
  assistantColor?: string;
  model?: string;
  createdAt: string;
  updatedAt: string;
}

type DateGroup = 'today' | 'yesterday' | 'week' | 'month' | 'older';

function getDateGroup(date: string): DateGroup {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays <= 7) return 'week';
  if (diffDays <= 30) return 'month';
  return 'older';
}

const groupLabels: Record<DateGroup, string> = {
  today: "Aujourd'hui",
  yesterday: 'Hier',
  week: '7 derniers jours',
  month: '30 derniers jours',
  older: 'Plus ancien',
};

const groupOrder: DateGroup[] = ['today', 'yesterday', 'week', 'month', 'older'];

// ─── Main ────────────────────────────────────────────────────────────

export function Chat() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-sonnet-4');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [conversationToDelete, setConversationToDelete] = useState<UnifiedConversation | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const modelPickerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const {
    streamingMessage, isStreaming, isThinking,
    setIsStreaming, setIsThinking, appendToStreamingMessage, clearStreamingMessage,
  } = useChatStore();

  // ─── Data ──────────────────────────────────────────────────────────

  const { data: models } = useQuery({
    queryKey: ['sega-models'], queryFn: segaApi.listModels, staleTime: 1000 * 60 * 30,
  });
  const { data: assistants } = useQuery({
    queryKey: ['assistants'], queryFn: assistantsApi.list,
  });
  const { data: assistantConvs } = useQuery({
    queryKey: ['conversations'], queryFn: chatApi.listConversations,
  });
  const { data: segaConvs } = useQuery({
    queryKey: ['sega-conversations'], queryFn: segaApi.listConversations,
  });

  // ─── Merge ─────────────────────────────────────────────────────────

  const allConversations = useMemo<UnifiedConversation[]>(() => {
    const result: UnifiedConversation[] = [];
    for (const conv of assistantConvs || []) {
      const a = assistants?.find((x) => x.id === conv.assistantId);
      result.push({
        id: conv.id, title: conv.title, type: 'assistant',
        assistantId: conv.assistantId, assistantName: a?.name || 'Assistant',
        assistantIcon: a?.icon, assistantColor: a?.color,
        createdAt: conv.createdAt as unknown as string,
        updatedAt: conv.updatedAt as unknown as string,
      });
    }
    for (const conv of segaConvs || []) {
      result.push({
        id: conv.id, title: conv.title, type: 'sega', model: conv.model,
        createdAt: conv.createdAt, updatedAt: conv.updatedAt,
      });
    }
    result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return result;
  }, [assistantConvs, segaConvs, assistants]);

  const currentConv = allConversations.find((c) => c.id === conversationId);
  const isSegaConversation = currentConv?.type === 'sega';
  const currentAssistant = currentConv?.type === 'assistant' && currentConv.assistantId
    ? assistants?.find((a) => a.id === currentConv.assistantId) : null;

  // ─── Conversation detail ───────────────────────────────────────────

  const { data: assistantConversation, refetch: refetchAssistantConv } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => chatApi.getConversation(conversationId!),
    enabled: !!conversationId && currentConv?.type === 'assistant',
  });
  const { data: segaConversation, refetch: refetchSegaConv } = useQuery({
    queryKey: ['sega-conversation', conversationId],
    queryFn: () => segaApi.getConversation(conversationId!),
    enabled: !!conversationId && currentConv?.type === 'sega',
  });
  const conversation = isSegaConversation ? segaConversation : assistantConversation;

  useEffect(() => {
    if (segaConversation?.model) setSelectedModel(segaConversation.model);
  }, [segaConversation?.model]);

  // Handle ?new=assistantId
  const newAssistantId = searchParams.get('new');
  const createAssistantConversation = useMutation({
    mutationFn: (aid: string) => chatApi.createConversation(aid),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      navigate(`/chat/${data.id}`, { replace: true });
    },
  });
  useEffect(() => {
    if (newAssistantId && !createAssistantConversation.isPending) {
      createAssistantConversation.mutate(newAssistantId);
    }
  }, [newAssistantId]);

  // ─── Close pickers ─────────────────────────────────────────────────

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modelPickerRef.current && !modelPickerRef.current.contains(e.target as Node)) setShowModelPicker(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Mutations ─────────────────────────────────────────────────────

  const createSegaConversation = useMutation({
    mutationFn: (model: string) => segaApi.createConversation(model),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sega-conversations'] });
      navigate(`/chat/${data.id}`);
    },
  });
  const createConvWithAssistant = useMutation({
    mutationFn: (aid: string) => chatApi.createConversation(aid),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      navigate(`/chat/${data.id}`);
    },
  });
  const deleteConversation = useMutation({
    mutationFn: (conv: UnifiedConversation) =>
      conv.type === 'sega' ? segaApi.deleteConversation(conv.id) : chatApi.deleteConversation(conv.id),
    onSuccess: (_, conv) => {
      queryClient.invalidateQueries({ queryKey: conv.type === 'sega' ? ['sega-conversations'] : ['conversations'] });
      if (conversationId === conv.id) navigate('/chat');
    },
  });
  const updateModel = useMutation({
    mutationFn: (model: string) => segaApi.updateConversation(conversationId!, model),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sega-conversation', conversationId] }),
  });

  // ─── Scroll ────────────────────────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  useEffect(() => { scrollToBottom(); }, [conversation?.messages, streamingMessage, isThinking, scrollToBottom]);

  // ─── Send ──────────────────────────────────────────────────────────

  const handleSendMessage = async () => {
    if (!message.trim() || isStreaming || !conversationId || !currentConv) return;
    const userMessage = message.trim();
    setMessage('');
    clearStreamingMessage();
    setIsStreaming(true);
    setIsThinking(true);

    const queryKey = isSegaConversation ? ['sega-conversation', conversationId] : ['conversation', conversationId];
    queryClient.setQueryData(queryKey, (old: any) => ({
      ...old,
      messages: [...(old?.messages || []), { id: `temp-${Date.now()}`, role: 'user', content: userMessage, createdAt: new Date().toISOString() }],
    }));

    try {
      if (isSegaConversation) {
        await segaApi.sendMessage(conversationId, userMessage, (chunk) => appendToStreamingMessage(chunk));
        await refetchSegaConv();
        queryClient.invalidateQueries({ queryKey: ['sega-conversations'] });
      } else {
        await chatApi.sendMessage(conversationId, userMessage, (chunk) => appendToStreamingMessage(chunk));
        await refetchAssistantConv();
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      clearStreamingMessage();
      setIsStreaming(false);
    }
  };

  // ─── Helpers ───────────────────────────────────────────────────────

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    setShowModelPicker(false);
    setModelSearch('');
    if (conversationId && isSegaConversation) updateModel.mutate(modelId);
  };
  const filteredModels = models?.filter((m) =>
    m.name.toLowerCase().includes(modelSearch.toLowerCase()) || m.id.toLowerCase().includes(modelSearch.toLowerCase())
  ) || [];
  const currentModelName = models?.find((m) => m.id === selectedModel)?.name || selectedModel.split('/').pop() || 'Modèle';

  const handleNewFreeChat = () => { createSegaConversation.mutate(selectedModel); };
  const handleNewAssistantChat = (aid: string) => { createConvWithAssistant.mutate(aid); };

  const chatColor = currentAssistant?.color || '#8b5cf6';
  const chatName = currentAssistant?.name || 'Chat libre';
  const chatSubtitle = currentAssistant?.specialty || (isSegaConversation ? currentModelName : '');
  const chatIcon = currentAssistant?.icon || 'MessageCircle';

  const AssistantIconComponent = currentAssistant
    ? () => <DynamicIcon name={chatIcon} className="h-4 w-4" />
    : MessageCircle;

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-7.5rem)] -m-6">
      <h1 className="sr-only">Chat</h1>

      {/* ─── Sidebar ─── flat, no box */}
      <div className={cn(
        'hidden lg:flex shrink-0 flex-col border-r border-border transition-[width] duration-200 ease-in-out overflow-hidden',
        sidebarOpen ? 'w-[260px]' : 'w-0 border-r-0'
      )}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-3 min-w-[260px]">
          <span className="text-sm font-medium text-muted-foreground">Conversations</span>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <Plus className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={8} className="w-60 overflow-visible">
                <DropdownMenuItem onClick={handleNewFreeChat} className="gap-2.5 py-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/10 text-violet-500 shrink-0">
                    <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Chat libre</p>
                    <p className="text-xs text-muted-foreground">Choisissez votre modèle</p>
                  </div>
                </DropdownMenuItem>
                {assistants && assistants.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground/60 font-semibold">
                      Assistants
                    </DropdownMenuLabel>
                    {assistants.map((a) => (
                      <DropdownMenuItem key={a.id} onClick={() => handleNewAssistantChat(a.id)} className="group/item relative gap-2.5 py-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md shrink-0" style={{ backgroundColor: `${a.color}12`, color: a.color }}>
                          <DynamicIcon name={a.icon || 'Bot'} className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{a.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{a.specialty}</p>
                        </div>
                        {a.description && (
                          <div className="pointer-events-none absolute left-full top-0 ml-2 w-64 rounded-lg border border-border bg-popover p-3 shadow-premium-lg opacity-0 scale-95 translate-y-1 group-hover/item:opacity-100 group-hover/item:scale-100 group-hover/item:translate-y-0 transition-all duration-150 z-[60]">
                            <p className="text-xs text-popover-foreground leading-relaxed">{a.description}</p>
                          </div>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Fermer la barre latérale"
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <PanelLeftClose className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Conversation list — flat scroll */}
        <div className="flex-1 overflow-y-auto px-2 pb-3 scrollbar-thin">
          {allConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare className="h-5 w-5 text-muted-foreground/20 mb-2" />
              <p className="text-[12px] text-muted-foreground/40">Aucune conversation</p>
            </div>
          ) : (
            <ConversationList conversations={allConversations} activeConversationId={conversationId} onDelete={setConversationToDelete} />
          )}
        </div>
      </div>

      {/* ─── Main content ─── flat, no box */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Thin top bar */}
        <div className="flex items-center gap-3 px-6 h-12 shrink-0 border-b border-border">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir la barre latérale"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors -ml-1 mr-1"
            >
              <PanelLeft className="h-4 w-4" strokeWidth={1.5} />
            </button>
          )}
          <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ backgroundColor: `${chatColor}10`, color: chatColor }}>
            {currentAssistant
              ? <DynamicIcon name={chatIcon} className="h-3.5 w-3.5" />
              : <MessageCircle className="h-3.5 w-3.5" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium">{chatName}</span>
            {isSegaConversation ? (
              <div className="relative inline-block ml-2" ref={modelPickerRef}>
                <button
                  onClick={() => setShowModelPicker(!showModelPicker)}
                  aria-expanded={showModelPicker}
                  aria-haspopup="listbox"
                  aria-label={`Modèle: ${currentModelName}. Cliquez pour changer`}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  <span className="truncate max-w-[180px]">{currentModelName}</span>
                  <ChevronDown className="h-3 w-3 shrink-0" />
                </button>
                {showModelPicker && (
                  <div className="absolute top-full left-0 mt-1 w-72 bg-popover border border-border rounded-lg shadow-premium-lg z-50" role="listbox" aria-label="Sélectionner un modèle">
                    <div className="p-2 border-b border-border">
                      <input type="text" value={modelSearch} onChange={(e) => setModelSearch(e.target.value)} placeholder="Rechercher..." aria-label="Rechercher un modèle" className="w-full px-2.5 py-1.5 text-sm bg-transparent border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary" autoFocus />
                    </div>
                    <div className="max-h-56 overflow-y-auto p-1">
                      {filteredModels.map((model) => (
                        <button key={model.id} role="option" aria-selected={model.id === selectedModel} onClick={() => handleModelChange(model.id)} className="flex items-center gap-2 w-full px-2.5 py-1.5 text-left rounded-md hover:bg-muted transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{model.name}</p>
                            <p className="text-xs text-muted-foreground/40 truncate">{model.id}</p>
                          </div>
                          {model.id === selectedModel && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : chatSubtitle ? (
              <span className="ml-2 text-xs text-muted-foreground/50">{chatSubtitle}</span>
            ) : null}
          </div>
          <Button
            variant="ghost" size="sm"
            onClick={() => currentConv?.type === 'assistant' && currentConv.assistantId ? createConvWithAssistant.mutate(currentConv.assistantId) : createSegaConversation.mutate(selectedModel)}
            disabled={createSegaConversation.isPending || createConvWithAssistant.isPending}
            className="hidden sm:flex gap-1.5 text-[12px] h-7 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Nouveau
          </Button>
        </div>

        {/* Messages or Welcome */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto scrollbar-thin">
          {!conversationId ? (
            <WelcomeScreen
              onNewFreeChat={handleNewFreeChat}
              onNewAssistantChat={handleNewAssistantChat}
              assistants={assistants || []}
              isCreating={createSegaConversation.isPending || createConvWithAssistant.isPending}
              message={message}
              onMessageChange={setMessage}
              onSend={() => {
                // Create a free chat then send immediately
                if (message.trim()) {
                  createSegaConversation.mutate(selectedModel);
                }
              }}
              isStreaming={isStreaming}
            />
          ) : conversation?.messages && conversation.messages.length > 0 ? (
            <div className="px-6 py-8 md:px-12 lg:px-20">
              <div className="space-y-6 max-w-[720px] mx-auto">
                {conversation.messages.map((msg, index) => (
                  <ChatMessage
                    key={msg.id}
                    role={msg.role as 'user' | 'assistant'}
                    content={msg.content}
                    assistantIcon={AssistantIconComponent}
                    assistantColor={chatColor}
                    isNew={index === (conversation.messages.length ?? 0) - 1}
                  />
                ))}
                {isStreaming && (
                  <StreamingMessage content={streamingMessage} isThinking={isThinking} assistantIcon={AssistantIconComponent} assistantColor={chatColor} />
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-6">
              <motion.div
                className="text-center space-y-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg mx-auto" style={{ backgroundColor: `${chatColor}10`, color: chatColor }}>
                  {currentAssistant
                    ? <DynamicIcon name={chatIcon} className="h-5 w-5" />
                    : <MessageCircle className="h-5 w-5" />
                  }
                </div>
                <p className="text-lg font-medium">{chatName}</p>
                <p className="text-sm text-muted-foreground">Tapez votre message pour commencer.</p>
              </motion.div>
              {isStreaming && (
                <div className="mt-8 max-w-[720px] w-full px-6">
                  <StreamingMessage content={streamingMessage} isThinking={isThinking} assistantIcon={AssistantIconComponent} assistantColor={chatColor} />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input — only when in a conversation */}
        {conversationId && (
          <div className="px-6 pb-5 pt-2 md:px-12 lg:px-20">
            <div className="max-w-[720px] mx-auto">
              <ChatInput value={message} onChange={setMessage} onSend={handleSendMessage} isStreaming={isStreaming} assistantName={chatName} />
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!conversationToDelete} onOpenChange={(open) => !open && setConversationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette conversation ?</AlertDialogTitle>
            <AlertDialogDescription>
              La conversation « {conversationToDelete?.title || 'Sans titre'} » et tous ses messages seront supprimés définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (conversationToDelete) {
                  deleteConversation.mutate(conversationToDelete);
                  setConversationToDelete(null);
                }
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Conversation List ───────────────────────────────────────────────

function ConversationList({ conversations, activeConversationId, onDelete }: {
  conversations: UnifiedConversation[];
  activeConversationId?: string;
  onDelete: (conv: UnifiedConversation) => void;
}) {
  const grouped = useMemo(() => {
    const g: Record<DateGroup, UnifiedConversation[]> = { today: [], yesterday: [], week: [], month: [], older: [] };
    conversations.forEach((c) => g[getDateGroup(c.updatedAt || c.createdAt)].push(c));
    return g;
  }, [conversations]);

  return (
    <div className="space-y-4">
      {groupOrder.map((group) => {
        const items = grouped[group];
        if (!items.length) return null;
        return (
          <div key={group}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/40 px-2 pb-1">
              {groupLabels[group]}
            </p>
            <div className="space-y-px">
              {items.map((conv) => (
                <div key={conv.id} className={cn(
                  'group flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer transition-colors duration-75',
                  conv.id === activeConversationId
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}>
                  <Link to={`/chat/${conv.id}`} className="flex items-center gap-2 flex-1 min-w-0">
                    {conv.type === 'assistant' ? (
                      <div className="h-5 w-5 shrink-0 rounded flex items-center justify-center" style={{ backgroundColor: `${conv.assistantColor || '#737373'}10`, color: conv.assistantColor || '#737373' }}>
                        <DynamicIcon name={conv.assistantIcon || 'Bot'} className="h-3 w-3" strokeWidth={1.5} />
                      </div>
                    ) : (
                      <div className="h-5 w-5 shrink-0 rounded flex items-center justify-center bg-violet-500/10 text-violet-500">
                        <MessageCircle className="h-3 w-3" strokeWidth={1.5} />
                      </div>
                    )}
                    <span className="truncate text-sm">{conv.title || 'Nouvelle conversation'}</span>
                  </Link>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(conv); }}
                    aria-label={`Supprimer ${conv.title || 'conversation'}`}
                    className="p-1 rounded-md opacity-0 group-hover:opacity-40 hover:!opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all duration-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Welcome Screen ──────────────────────────────────────────────────

const welcomeContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};
const welcomeItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 25, stiffness: 300 } },
};

function WelcomeScreen({ onNewFreeChat, onNewAssistantChat, assistants, isCreating, message, onMessageChange, onSend, isStreaming }: {
  onNewFreeChat: () => void;
  onNewAssistantChat: (id: string) => void;
  assistants: Array<{ id: string; name: string; description: string; icon: string; color: string; specialty: string }>;
  isCreating: boolean;
  message: string;
  onMessageChange: (v: string) => void;
  onSend: () => void;
  isStreaming: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      <motion.div
        className="max-w-2xl w-full space-y-10"
        variants={welcomeContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Hero */}
        <motion.div variants={welcomeItem} className="text-center space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            Que puis-je faire pour vous ?
          </h1>
          <p className="text-base text-muted-foreground">
            Posez une question ou choisissez un assistant spécialisé.
          </p>
        </motion.div>

        {/* Input bar — ChatGPT style, directly on welcome */}
        <motion.div variants={welcomeItem} className="max-w-xl mx-auto w-full">
          <ChatInput
            value={message}
            onChange={onMessageChange}
            onSend={onSend}
            isStreaming={isStreaming}
            assistantName="Data Ring"
          />
        </motion.div>

        {/* Assistant grid */}
        <motion.div variants={welcomeItem} className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/40 text-center">
            Ou démarrez avec un assistant
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <motion.button
              onClick={onNewFreeChat}
              disabled={isCreating}
              className="group flex items-center gap-3.5 p-4 rounded-xl border border-border hover:bg-muted/50 hover:border-muted-foreground/15 transition-all duration-150 text-left"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500 shrink-0">
                <MessageCircle className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">Chat libre</p>
                <p className="text-[12px] text-muted-foreground leading-snug">Choisissez votre modèle IA</p>
              </div>
            </motion.button>

            {assistants.slice(0, 5).map((a) => (
              <motion.button
                key={a.id}
                onClick={() => onNewAssistantChat(a.id)}
                disabled={isCreating}
                className="group flex items-center gap-3.5 p-4 rounded-xl border border-border hover:bg-muted/50 hover:border-muted-foreground/15 transition-all duration-150 text-left"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0"
                  style={{ backgroundColor: `${a.color}12`, color: a.color }}
                >
                  <DynamicIcon name={a.icon || 'Bot'} className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{a.name}</p>
                  <p className="text-[12px] text-muted-foreground truncate leading-snug">{a.specialty}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
