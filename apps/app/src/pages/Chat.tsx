import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Plus, ChevronDown, Check } from 'lucide-react';
import { segaApi } from '@/lib/api';
import { useChatStore } from '@/stores/chatStore';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChatInput,
  ChatMessage,
  StreamingMessage,
  ConversationSidebar,
} from '@/components/chat';

export function Chat() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-sonnet-4');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const modelPickerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    streamingMessage,
    isStreaming,
    isThinking,
    setIsStreaming,
    setIsThinking,
    appendToStreamingMessage,
    clearStreamingMessage,
  } = useChatStore();

  const { data: models } = useQuery({
    queryKey: ['sega-models'],
    queryFn: segaApi.listModels,
    staleTime: 1000 * 60 * 30, // 30 min cache
  });

  const { data: conversations } = useQuery({
    queryKey: ['sega-conversations'],
    queryFn: segaApi.listConversations,
  });

  const { data: conversation, refetch: refetchConversation } = useQuery({
    queryKey: ['sega-conversation', conversationId],
    queryFn: () => segaApi.getConversation(conversationId!),
    enabled: !!conversationId,
  });

  // Sync selected model with conversation
  useEffect(() => {
    if (conversation?.model) {
      setSelectedModel(conversation.model);
    }
  }, [conversation?.model]);

  // Close model picker on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modelPickerRef.current && !modelPickerRef.current.contains(e.target as Node)) {
        setShowModelPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const createConversation = useMutation({
    mutationFn: () => segaApi.createConversation(selectedModel),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sega-conversations'] });
      navigate(`/chat/${data.id}`);
    },
  });

  const deleteConversation = useMutation({
    mutationFn: (convId: string) => segaApi.deleteConversation(convId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sega-conversations'] });
      if (conversationId) navigate('/chat');
    },
  });

  const updateModel = useMutation({
    mutationFn: (model: string) => segaApi.updateConversation(conversationId!, model),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sega-conversation', conversationId] });
    },
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages, streamingMessage, isThinking, scrollToBottom]);

  const handleSendMessage = async () => {
    if (!message.trim() || isStreaming || !conversationId) return;

    const userMessage = message.trim();
    setMessage('');
    clearStreamingMessage();
    setIsStreaming(true);
    setIsThinking(true);

    queryClient.setQueryData(['sega-conversation', conversationId], (old: any) => ({
      ...old,
      messages: [
        ...(old?.messages || []),
        { id: `temp-${Date.now()}`, role: 'user', content: userMessage, createdAt: new Date().toISOString() },
      ],
    }));

    try {
      await segaApi.sendMessage(conversationId, userMessage, (chunk) => {
        appendToStreamingMessage(chunk);
      });
      await refetchConversation();
      queryClient.invalidateQueries({ queryKey: ['sega-conversations'] });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      clearStreamingMessage();
      setIsStreaming(false);
    }
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    setShowModelPicker(false);
    setModelSearch('');
    if (conversationId) {
      updateModel.mutate(modelId);
    }
  };

  const filteredModels = models?.filter((m) =>
    m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
    m.id.toLowerCase().includes(modelSearch.toLowerCase())
  ) || [];

  const currentModelName = models?.find((m) => m.id === selectedModel)?.name || selectedModel.split('/').pop() || 'Choisir un modèle';

  const SegaIcon = MessageCircle;

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <div className="hidden w-[260px] lg:block shrink-0">
        <ConversationSidebar
          conversations={conversations || []}
          activeConversationId={conversationId}
          assistantId="sega"
          onNewConversation={() => createConversation.mutate()}
          onDeleteConversation={(convId) => deleteConversation.mutate(convId)}
          isCreating={createConversation.isPending}
          linkBuilder={(convId) => `/chat/${convId}`}
        />
      </div>

      {/* Chat */}
      <div className="chat-main">
        {/* Header */}
        <div className="chat-header">
          <div
            className="chat-header-avatar"
            style={{ backgroundColor: '#8b5cf610', color: '#8b5cf6' }}
          >
            <SegaIcon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-semibold truncate">Sega</p>
            {/* Model selector */}
            <div className="relative" ref={modelPickerRef}>
              <button
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="flex items-center gap-1 text-[11.5px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                <span className="truncate max-w-[200px]">{currentModelName}</span>
                <ChevronDown className="h-3 w-3 shrink-0" />
              </button>
              {showModelPicker && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-popover border border-border rounded-lg shadow-lg z-50">
                  <div className="p-2 border-b border-border">
                    <input
                      type="text"
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                      placeholder="Rechercher un modèle..."
                      className="w-full px-3 py-1.5 text-sm bg-transparent border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-1">
                    {filteredModels.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => handleModelChange(model.id)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm rounded-md hover:bg-muted transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium truncate">{model.name}</p>
                          <p className="text-[11px] text-muted-foreground/50 truncate">{model.id}</p>
                        </div>
                        {model.id === selectedModel && (
                          <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => createConversation.mutate()}
            disabled={createConversation.isPending}
            className="hidden sm:flex gap-1.5 text-xs h-8 rounded-lg hover:bg-muted"
          >
            <Plus className="h-3.5 w-3.5" />
            Nouveau
          </Button>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 chat-scroll-area">
          {!conversationId ? (
            <WelcomeScreen
              onStartConversation={() => createConversation.mutate()}
              isCreating={createConversation.isPending}
            />
          ) : (
            <div className="chat-messages-container">
              <div className="space-y-5 max-w-3xl mx-auto">
                {conversation?.messages.map((msg, index) => (
                  <ChatMessage
                    key={msg.id}
                    role={msg.role as 'user' | 'assistant'}
                    content={msg.content}
                    assistantIcon={SegaIcon}
                    assistantColor="#8b5cf6"
                    isNew={index === (conversation.messages.length ?? 0) - 1}
                  />
                ))}

                {isStreaming && (
                  <StreamingMessage
                    content={streamingMessage}
                    isThinking={isThinking}
                    assistantIcon={SegaIcon}
                    assistantColor="#8b5cf6"
                  />
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        {conversationId && (
          <ChatInput
            value={message}
            onChange={setMessage}
            onSend={handleSendMessage}
            isStreaming={isStreaming}
            assistantName="Sega"
          />
        )}
      </div>
    </div>
  );
}

/* Welcome Screen */
interface WelcomeScreenProps {
  onStartConversation: () => void;
  isCreating: boolean;
}

function WelcomeScreen({ onStartConversation, isCreating }: WelcomeScreenProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full text-center space-y-8">
        <div
          className="welcome-icon mx-auto"
          style={{ backgroundColor: '#8b5cf610', color: '#8b5cf6' }}
        >
          <MessageCircle className="h-7 w-7" />
        </div>

        <div className="space-y-2.5">
          <h2 className="text-xl font-semibold tracking-tight">Sega</h2>
          <p className="text-[14px] text-muted-foreground/70 max-w-md mx-auto leading-relaxed">
            Chat IA libre. Choisissez votre modèle et discutez sans configuration.
          </p>
        </div>

        <div className="pt-2">
          <Button
            onClick={onStartConversation}
            disabled={isCreating}
            size="lg"
            className="gap-2 px-8 h-11 rounded-xl text-[13px] font-medium"
          >
            <Plus className="h-4 w-4" />
            Démarrer une conversation
          </Button>
        </div>
      </div>
    </div>
  );
}
