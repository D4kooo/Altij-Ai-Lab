import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart3, Users, MessageSquare, Coins, X, Eye, Edit2, Check } from 'lucide-react';
import { supervisionApi } from '@/lib/api';
import type { SupervisionUser } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function formatCost(n: number): string {
  return `$${n.toFixed(4)}`;
}

export function Supervision() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<SupervisionUser | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<{ type: 'assistant' | 'sega'; id: string; title: string } | null>(null);
  const [editingLimit, setEditingLimit] = useState<string | null>(null);
  const [limitValue, setLimitValue] = useState('');

  const { data: stats } = useQuery({
    queryKey: ['supervision-stats'],
    queryFn: supervisionApi.getStats,
  });

  const { data: users } = useQuery({
    queryKey: ['supervision-users'],
    queryFn: supervisionApi.getUsers,
  });

  const { data: conversations } = useQuery({
    queryKey: ['supervision-conversations', selectedUser?.id],
    queryFn: () => supervisionApi.getUserConversations(selectedUser!.id),
    enabled: !!selectedUser,
  });

  const { data: messages } = useQuery({
    queryKey: ['supervision-messages', selectedConversation?.type, selectedConversation?.id],
    queryFn: () => supervisionApi.getConversationMessages(selectedConversation!.type, selectedConversation!.id),
    enabled: !!selectedConversation,
  });

  const setCreditLimit = useMutation({
    mutationFn: ({ userId, limit }: { userId: string; limit: number | null }) =>
      supervisionApi.setCreditLimit(userId, limit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervision-users'] });
      setEditingLimit(null);
    },
  });

  const handleSaveLimit = (userId: string) => {
    const value = limitValue.trim();
    const limit = value === '' ? null : parseFloat(value);
    if (value !== '' && (isNaN(limit!) || limit! < 0)) return;
    setCreditLimit.mutate({ userId, limit });
  };

  const allConversations = conversations
    ? [...conversations.assistant, ...conversations.sega].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    : [];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Supervision</h1>
        <p className="text-sm text-muted-foreground">Suivi de la consommation API et des conversations</p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Coins} label="Coût ce mois" value={formatCost(stats.totalCost)} />
          <StatCard icon={BarChart3} label="Tokens ce mois" value={formatTokens(stats.totalTokens)} />
          <StatCard icon={Users} label="Users actifs" value={String(stats.activeUsers)} />
          <StatCard icon={MessageSquare} label="Conversations" value={String(stats.activeConversations)} />
        </div>
      )}

      {/* Users table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Utilisateur</th>
              <th className="text-right px-4 py-3 font-medium">Tokens</th>
              <th className="text-right px-4 py-3 font-medium">Coût</th>
              <th className="text-right px-4 py-3 font-medium">Convs</th>
              <th className="text-right px-4 py-3 font-medium">Limite</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((user) => (
              <tr key={user.id} className="border-t hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </td>
                <td className="text-right px-4 py-3 tabular-nums">{formatTokens(user.totalTokens)}</td>
                <td className="text-right px-4 py-3 tabular-nums">{formatCost(user.totalCost)}</td>
                <td className="text-right px-4 py-3 tabular-nums">{user.conversationCount}</td>
                <td className="text-right px-4 py-3">
                  {editingLimit === user.id ? (
                    <div className="flex items-center gap-1 justify-end">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={limitValue}
                        onChange={(e) => setLimitValue(e.target.value)}
                        placeholder="Illimité"
                        className="w-20 px-2 py-1 text-xs border rounded text-right"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveLimit(user.id);
                          if (e.key === 'Escape') setEditingLimit(null);
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleSaveLimit(user.id)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingLimit(user.id);
                        setLimitValue(user.creditLimit !== null ? String(user.creditLimit) : '');
                      }}
                      className="inline-flex items-center gap-1 text-xs hover:text-primary transition-colors"
                    >
                      {user.creditLimit !== null ? `$${user.creditLimit}` : '∞'}
                      <Edit2 className="h-3 w-3 opacity-50" />
                    </button>
                  )}
                </td>
                <td className="text-right px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => {
                      setSelectedUser(user);
                      setSelectedConversation(null);
                    }}
                  >
                    <Eye className="h-3 w-3" />
                    Voir
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Conversations dialog */}
      {selectedUser && (
        <Dialog
          title={`Conversations — ${selectedUser.firstName} ${selectedUser.lastName}`}
          onClose={() => { setSelectedUser(null); setSelectedConversation(null); }}
        >
          {selectedConversation ? (
            <div className="space-y-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="text-xs text-primary hover:underline"
              >
                ← Retour aux conversations
              </button>
              <h3 className="font-medium text-sm">{selectedConversation.title}</h3>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  {messages?.map((msg) => (
                    <div key={msg.id} className={`text-sm ${msg.role === 'user' ? 'text-right' : ''}`}>
                      <span className={`inline-block max-w-[85%] px-3 py-2 rounded-lg text-left ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}>
                        <p className="text-[10px] font-medium mb-1 opacity-70">
                          {msg.role === 'user' ? 'Utilisateur' : 'Assistant'}
                        </p>
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-1 pr-4">
                {allConversations.length === 0 && (
                  <p className="text-sm text-muted-foreground py-8 text-center">Aucune conversation</p>
                )}
                {allConversations.map((conv) => (
                  <button
                    key={`${conv.type}-${conv.id}`}
                    onClick={() => setSelectedConversation({ type: conv.type, id: conv.id, title: conv.title })}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{conv.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {conv.type === 'assistant' ? `Assistant: ${conv.assistantName}` : `Sega: ${conv.model}`}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                        {new Date(conv.updatedAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </Dialog>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof BarChart3; label: string; value: string }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background border rounded-xl shadow-xl w-full max-w-2xl mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
