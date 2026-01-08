import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { Bot, Send, Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { assistantsApi, chatApi } from '@/lib/api';
import { useChatStore } from '@/stores/chatStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SkeletonMessage, ProgressiveStatus, CopyButton } from '@/components/chat';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[name] || Bot;
  return <Icon className={className} />;
}

export function AssistantDetail() {
  const { id, conversationId } = useParams<{ id: string; conversationId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    streamingMessage,
    isStreaming,
    isThinking,
    setIsStreaming,
    setIsThinking,
    appendToStreamingMessage,
    clearStreamingMessage,
  } = useChatStore();

  const { data: assistant } = useQuery({
    queryKey: ['assistants', id],
    queryFn: () => assistantsApi.get(id!),
    enabled: !!id,
  });

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: chatApi.listConversations,
  });

  const { data: conversation, refetch: refetchConversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => chatApi.getConversation(conversationId!),
    enabled: !!conversationId,
  });

  const assistantConversations = conversations?.filter((c) => c.assistantId === id);

  const createConversation = useMutation({
    mutationFn: () => chatApi.createConversation(id!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      navigate(`/assistants/${id}/chat/${data.id}`);
    },
  });

  const deleteConversation = useMutation({
    mutationFn: (convId: string) => chatApi.deleteConversation(convId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (conversationId) navigate(`/assistants/${id}`);
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

    queryClient.setQueryData(['conversation', conversationId], (old: any) => ({
      ...old,
      messages: [
        ...(old?.messages || []),
        { id: `temp-${Date.now()}`, role: 'user', content: userMessage, createdAt: new Date() },
      ],
    }));

    try {
      await chatApi.sendMessage(conversationId, userMessage, (chunk) => {
        appendToStreamingMessage(chunk);
      });
      await refetchConversation();
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      clearStreamingMessage();
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  if (!assistant) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar */}
      <div className="hidden w-56 flex-col rounded-lg border bg-card lg:flex">
        <div className="flex items-center justify-between border-b p-3">
          <span className="text-sm font-medium">Conversations</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => createConversation.mutate()}
            disabled={createConversation.isPending}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1 scrollbar-thin">
          <div className="p-2 space-y-1">
            {assistantConversations?.length === 0 ? (
              <p className="p-3 text-center text-xs text-muted-foreground">Aucune conversation</p>
            ) : (
              assistantConversations?.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    'group flex items-center gap-2 rounded-md p-2',
                    conv.id === conversationId ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  )}
                >
                  <Link to={`/assistants/${id}/chat/${conv.id}`} className="flex-1 truncate text-xs">
                    {conv.title || 'Nouvelle conversation'}
                  </Link>
                  <button
                    onClick={() => deleteConversation.mutate(conv.id)}
                    className={cn(
                      'opacity-0 group-hover:opacity-100',
                      conv.id === conversationId && 'opacity-100'
                    )}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat */}
      <div className="flex flex-1 flex-col rounded-lg border bg-card overflow-hidden">
        {/* Header Persistant - Sticky */}
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-card/95 backdrop-blur-sm p-3">
          <Button variant="ghost" size="icon" asChild className="lg:hidden h-8 w-8">
            <Link to="/assistants"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div
            className="flex h-8 w-8 items-center justify-center rounded-md"
            style={{ backgroundColor: `${assistant.color}15`, color: assistant.color }}
          >
            <DynamicIcon name={assistant.icon} className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{assistant.name}</p>
            <p className="text-xs text-muted-foreground">{assistant.specialty}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => createConversation.mutate()}
            disabled={createConversation.isPending}
            className="hidden sm:flex"
          >
            <Plus className="mr-1 h-3 w-3" />
            Nouveau
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 scrollbar-thin">
          {!conversationId ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${assistant.color}15`, color: assistant.color }}
              >
                <DynamicIcon name={assistant.icon} className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-medium mb-2">{assistant.name}</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">{assistant.description}</p>

              {assistant.suggestedPrompts?.length > 0 && (
                <div className="space-y-2 max-w-md w-full">
                  <p className="text-xs text-muted-foreground mb-2">Suggestions :</p>
                  {assistant.suggestedPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => createConversation.mutate()}
                      className="w-full text-left text-sm p-3 rounded-md border hover:bg-muted"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              <Button onClick={() => createConversation.mutate()} disabled={createConversation.isPending} className="mt-6">
                Demarrer une conversation
              </Button>
            </div>
          ) : (
            <div className="space-y-6 max-w-[800px] mx-auto" style={{ lineHeight: '1.6' }}>
              {conversation?.messages.map((msg) => (
                <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' && 'justify-end')}>
                  {msg.role === 'assistant' && (
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                      style={{ backgroundColor: `${assistant.color}15`, color: assistant.color }}
                    >
                      <DynamicIcon name={assistant.icon} className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-lg px-4 py-3 text-sm',
                      msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-white border shadow-sm'
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="group/message">
                        <div className="markdown">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                        {/* Bouton Copier discret en bas a droite */}
                        <div className="flex justify-end mt-3 pt-2 border-t border-border/50 opacity-0 group-hover/message:opacity-100 transition-opacity">
                          <CopyButton content={msg.content} />
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Progressive Status puis Streaming message */}
              {isStreaming && (
                <div className="flex gap-3 animate-fade-in">
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                      !streamingMessage && "animate-pulse"
                    )}
                    style={{ backgroundColor: `${assistant.color}15`, color: assistant.color }}
                  >
                    <DynamicIcon name={assistant.icon} className="h-3.5 w-3.5" />
                  </div>
                  <div className="max-w-[80%] rounded-lg bg-white border shadow-sm px-4 py-3 text-sm">
                    {streamingMessage ? (
                      <div className="markdown typing-cursor">
                        <ReactMarkdown>{streamingMessage}</ReactMarkdown>
                      </div>
                    ) : (
                      <ProgressiveStatus isActive={true} color={assistant.color} />
                    )}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        {conversationId && (
          <div className="border-t p-3">
            <div className="flex gap-2 max-w-[800px] mx-auto">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question..."
                className="min-h-[40px] max-h-[150px] resize-none"
                disabled={isStreaming}
                rows={1}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || isStreaming}
                size="icon"
                className="h-10 w-10 shrink-0"
              >
                {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
