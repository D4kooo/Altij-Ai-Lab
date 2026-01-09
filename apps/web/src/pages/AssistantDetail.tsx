import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bot, Plus, ArrowLeft, Sparkles } from 'lucide-react';
import { assistantsApi, chatApi } from '@/lib/api';
import { useChatStore } from '@/stores/chatStore';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChatInput,
  ChatMessage,
  StreamingMessage,
  ConversationSidebar,
} from '@/components/chat';
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

  const assistantConversations = conversations?.filter((c) => c.assistantId === id) || [];

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

  // Get the dynamic icon component for the assistant
  const AssistantIconComponent = assistant
    ? (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[assistant.icon] || Bot
    : Bot;

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
      <div className="hidden w-64 lg:block">
        <ConversationSidebar
          conversations={assistantConversations}
          activeConversationId={conversationId}
          assistantId={id!}
          onNewConversation={() => createConversation.mutate()}
          onDeleteConversation={(convId) => deleteConversation.mutate(convId)}
          isCreating={createConversation.isPending}
        />
      </div>

      {/* Chat */}
      <div className="flex flex-1 flex-col rounded-xl border bg-card overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-card/95 backdrop-blur-sm px-4 py-3">
          <Button variant="ghost" size="icon" asChild className="lg:hidden h-8 w-8">
            <Link to="/assistants">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: `${assistant.color}15`, color: assistant.color }}
          >
            <DynamicIcon name={assistant.icon} className="h-4.5 w-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{assistant.name}</p>
            <p className="text-xs text-muted-foreground">{assistant.specialty}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => createConversation.mutate()}
            disabled={createConversation.isPending}
            className="hidden sm:flex gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Nouveau
          </Button>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 chat-scroll-area">
          {!conversationId ? (
            /* Welcome Screen */
            <WelcomeScreen
              assistant={assistant}
              onStartConversation={() => createConversation.mutate()}
              isCreating={createConversation.isPending}
            />
          ) : (
            /* Messages */
            <div className="p-4 md:p-6">
              <div className="space-y-6 max-w-3xl mx-auto">
                {conversation?.messages.map((msg, index) => (
                  <ChatMessage
                    key={msg.id}
                    role={msg.role as 'user' | 'assistant'}
                    content={msg.content}
                    assistantIcon={AssistantIconComponent}
                    assistantColor={assistant.color}
                    isNew={index === conversation.messages.length - 1}
                  />
                ))}

                {/* Streaming Message */}
                {isStreaming && (
                  <StreamingMessage
                    content={streamingMessage}
                    isThinking={isThinking}
                    assistantIcon={AssistantIconComponent}
                    assistantColor={assistant.color}
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
            assistantName={assistant.name}
          />
        )}
      </div>
    </div>
  );
}

/* Welcome Screen Component */
interface WelcomeScreenProps {
  assistant: {
    name: string;
    description: string;
    icon: string;
    color: string;
    suggestedPrompts?: string[];
  };
  onStartConversation: () => void;
  isCreating: boolean;
}

function WelcomeScreen({ assistant, onStartConversation, isCreating }: WelcomeScreenProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center space-y-6">
        {/* Icon */}
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
          style={{
            backgroundColor: assistant.color,
            color: 'white',
          }}
        >
          <DynamicIcon name={assistant.icon} className="h-8 w-8" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">{assistant.name}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">{assistant.description}</p>
        </div>

        {/* Suggested Prompts */}
        {assistant.suggestedPrompts && assistant.suggestedPrompts.length > 0 && (
          <div className="pt-4">
            <p className="text-xs text-muted-foreground mb-4 flex items-center justify-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Suggestions pour commencer
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl mx-auto">
              {assistant.suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={onStartConversation}
                  disabled={isCreating}
                  className="suggestion-card text-left"
                >
                  <p className="text-sm text-foreground/80 line-clamp-2">{prompt}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Start Button */}
        <div className="pt-4">
          <Button
            onClick={onStartConversation}
            disabled={isCreating}
            size="lg"
            className="gap-2 px-6"
          >
            <Plus className="h-4 w-4" />
            Demarrer une conversation
          </Button>
        </div>
      </div>
    </div>
  );
}
