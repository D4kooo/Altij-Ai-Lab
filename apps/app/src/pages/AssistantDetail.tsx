import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  MessageCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { assistantsApi, chatApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { DynamicIcon } from '@/components/DynamicIcon';
import { formatRelativeTime } from '@/lib/utils';

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 28, stiffness: 300 } },
};

export function AssistantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: assistant, isLoading } = useQuery({
    queryKey: ['assistants', id],
    queryFn: () => assistantsApi.get(id!),
    enabled: !!id,
  });

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: chatApi.listConversations,
  });

  const assistantConversations = conversations?.filter((c) => c.assistantId === id) || [];

  const createConversation = useMutation({
    mutationFn: () => chatApi.createConversation(id!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      navigate(`/chat/${data.id}`);
    },
  });

  if (isLoading || !assistant) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground/10 border-t-foreground/50" />
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-2xl mx-auto space-y-8"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* Back */}
      <motion.div variants={fadeUp}>
        <Link to="/assistants" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
          Assistants
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: `${assistant.color}10`,
            color: assistant.color,
          }}
        >
          <DynamicIcon name={assistant.icon || 'Bot'} className="h-6 w-6" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">{assistant.name}</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {assistant.specialty} · {assistant.type === 'openrouter' ? assistant.model : 'Webhook'}
          </p>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            {assistant.description}
          </p>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div variants={fadeUp}>
        <Button
          onClick={() => createConversation.mutate()}
          disabled={createConversation.isPending}
          className="gap-2"
          size="sm"
        >
          <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
          Démarrer une conversation
        </Button>
      </motion.div>

      {/* Suggested prompts */}
      {assistant.suggestedPrompts && assistant.suggestedPrompts.length > 0 && (
        <motion.div variants={fadeUp} className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/40 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Suggestions
          </p>
          <div className="space-y-1">
            {assistant.suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => createConversation.mutate()}
                disabled={createConversation.isPending}
                className="block w-full text-left rounded-lg px-3 py-2.5 -mx-3 text-[13px] text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors leading-relaxed"
              >
                {prompt}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent conversations — flat list */}
      {assistantConversations.length > 0 && (
        <motion.div variants={fadeUp} className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/40">
            Conversations récentes
          </p>
          <div className="space-y-px">
            {assistantConversations.slice(0, 5).map((conv) => (
              <Link
                key={conv.id}
                to={`/chat/${conv.id}`}
                className="group flex items-center gap-3 rounded-lg px-3 py-2 -mx-3 hover:bg-muted/50 transition-colors"
              >
                <MessageCircle className="h-4 w-4 text-muted-foreground/30 shrink-0" strokeWidth={1.5} />
                <span className="text-[13px] truncate flex-1">
                  {conv.title || 'Nouvelle conversation'}
                </span>
                <span className="text-[11px] text-muted-foreground/40 shrink-0">
                  {formatRelativeTime(conv.updatedAt || conv.createdAt)}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/30 transition-colors shrink-0" strokeWidth={1.5} />
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
