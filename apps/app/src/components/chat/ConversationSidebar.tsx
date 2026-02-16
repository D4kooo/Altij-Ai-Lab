import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, MessageSquare, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  title: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId?: string;
  assistantId: string;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  isCreating?: boolean;
}

type DateGroup = 'today' | 'yesterday' | 'week' | 'month' | 'older';

function getDateGroup(date: Date | string): DateGroup {
  const d = new Date(date);
  const now = new Date();
  const diffTime = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

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

export function ConversationSidebar({
  conversations,
  activeConversationId,
  assistantId,
  onNewConversation,
  onDeleteConversation,
  isCreating = false,
}: ConversationSidebarProps) {
  // Group conversations by date
  const groupedConversations = useMemo(() => {
    const groups: Record<DateGroup, Conversation[]> = {
      today: [],
      yesterday: [],
      week: [],
      month: [],
      older: [],
    };

    conversations.forEach((conv) => {
      const group = getDateGroup(conv.updatedAt || conv.createdAt);
      groups[group].push(conv);
    });

    // Sort within each group (most recent first)
    Object.keys(groups).forEach((key) => {
      groups[key as DateGroup].sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
      );
    });

    return groups;
  }, [conversations]);

  const hasConversations = conversations.length > 0;

  return (
    <div className="flex h-full flex-col bg-muted/30 rounded-xl border">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-background/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Conversations</span>
          {hasConversations && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {conversations.length}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
          onClick={onNewConversation}
          disabled={isCreating}
          title="Nouvelle conversation"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Search (placeholder for future) */}
      <div className="p-2 border-b">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/80 text-muted-foreground/50">
          <Search className="h-4 w-4" />
          <span className="text-xs">Rechercher...</span>
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {!hasConversations ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">Aucune conversation</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                Cliquez sur + pour commencer
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupOrder.map((group) => {
                const items = groupedConversations[group];
                if (items.length === 0) return null;

                return (
                  <div key={group}>
                    <div className="date-group-header">{groupLabels[group]}</div>
                    <div className="space-y-0.5">
                      {items.map((conv) => (
                        <ConversationItem
                          key={conv.id}
                          conversation={conv}
                          isActive={conv.id === activeConversationId}
                          assistantId={assistantId}
                          onDelete={() => onDeleteConversation(conv.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  assistantId: string;
  onDelete: () => void;
}

function ConversationItem({ conversation, isActive, assistantId, onDelete }: ConversationItemProps) {
  return (
    <div
      className={cn(
        'conversation-item group flex items-center gap-2 rounded-lg px-3 py-2',
        isActive && 'active'
      )}
    >
      <MessageSquare className="h-4 w-4 shrink-0 opacity-50" />
      <Link
        to={`/assistants/${assistantId}/chat/${conversation.id}`}
        className="flex-1 truncate text-sm"
      >
        {conversation.title || 'Nouvelle conversation'}
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete();
        }}
        className={cn(
          'delete-btn p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors',
          isActive && 'opacity-100'
        )}
        title="Supprimer"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
