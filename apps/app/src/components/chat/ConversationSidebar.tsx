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
  linkBuilder?: (conversationId: string) => string;
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
  linkBuilder,
}: ConversationSidebarProps) {
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
    <div className="conv-sidebar">
      {/* Header */}
      <div className="conv-sidebar-header">
        <span className="text-[13px] font-medium text-foreground/80">Conversations</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary"
          onClick={onNewConversation}
          disabled={isCreating}
          title="Nouvelle conversation"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Search */}
      <div className="px-2.5 pb-2">
        <div className="conv-search">
          <Search className="h-3.5 w-3.5 text-muted-foreground/40" />
          <span className="text-[12px] text-muted-foreground/40">Rechercher...</span>
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="px-2 pb-2">
          {!hasConversations ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <MessageSquare className="h-6 w-6 text-muted-foreground/20 mb-2" />
              <p className="text-[12px] text-muted-foreground/50">Aucune conversation</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groupOrder.map((group) => {
                const items = groupedConversations[group];
                if (items.length === 0) return null;

                return (
                  <div key={group}>
                    <div className="date-group-header">{groupLabels[group]}</div>
                    <div className="space-y-px">
                      {items.map((conv) => (
                        <ConversationItem
                          key={conv.id}
                          conversation={conv}
                          isActive={conv.id === activeConversationId}
                          assistantId={assistantId}
                          onDelete={() => onDeleteConversation(conv.id)}
                          linkBuilder={linkBuilder}
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
  linkBuilder?: (conversationId: string) => string;
}

function ConversationItem({ conversation, isActive, assistantId, onDelete, linkBuilder }: ConversationItemProps) {
  const href = linkBuilder ? linkBuilder(conversation.id) : `/assistants/${assistantId}/chat/${conversation.id}`;
  return (
    <div
      className={cn(
        'conversation-item group',
        isActive && 'active'
      )}
    >
      <Link
        to={href}
        className="flex-1 truncate text-[13px]"
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
          'delete-btn p-1 rounded-md hover:bg-destructive/10 hover:text-destructive transition-all duration-150',
          isActive && 'opacity-60'
        )}
        title="Supprimer"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
