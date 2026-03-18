import { ComponentType, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';
import { Bot, Copy, Check, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Shared spring config ────────────────────────────────────────────

const messageSpring = { type: 'spring' as const, damping: 25, stiffness: 300 };

// ─── ChatMessage ─────────────────────────────────────────────────────

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  assistantIcon?: ComponentType<{ className?: string }>;
  assistantColor?: string;
  isStreaming?: boolean;
  isNew?: boolean;
}

export function ChatMessage({
  role,
  content,
  assistantIcon: AssistantIcon = Bot,
  assistantColor = '#6366f1',
  isStreaming = false,
  isNew = false,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (role === 'user') {
    return (
      <motion.div
        className="flex justify-end"
        initial={isNew ? { opacity: 0, y: 10, scale: 0.98 } : false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={messageSpring}
      >
        <div className="message-user max-w-[80%] md:max-w-[65%]">
          <p className="text-[14.5px] whitespace-pre-wrap leading-[1.65]">{content}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="message-container group"
      initial={isNew ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...messageSpring, delay: 0.05 }}
    >
      <div className="flex gap-3.5">
        {/* Avatar */}
        <motion.div
          className="message-avatar shrink-0 mt-0.5"
          style={{ backgroundColor: `${assistantColor}12`, color: assistantColor }}
          initial={isNew ? { scale: 0.5, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...messageSpring, delay: 0.1 }}
        >
          <AssistantIcon className="h-4 w-4" />
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className={cn('message-assistant', isStreaming && 'typing-cursor')}>
            <div className="markdown text-[14.5px]">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>

          {/* Actions */}
          {!isStreaming && content && (
            <motion.div
              className="flex items-center gap-0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.2 }}
            >
              <button
                onClick={handleCopy}
                className="message-action-btn"
                title={copied ? 'Copié !' : 'Copier'}
              >
                {copied ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 400 }}
                  >
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  </motion.span>
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
              <button className="message-action-btn" title="Régénérer">
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── StreamingMessage ────────────────────────────────────────────────

interface StreamingMessageProps {
  content: string;
  isThinking: boolean;
  assistantIcon?: ComponentType<{ className?: string }>;
  assistantColor?: string;
  thinkingSteps?: string[];
}

export function StreamingMessage({
  content,
  isThinking,
  assistantIcon: AssistantIcon = Bot,
  assistantColor = '#6366f1',
}: StreamingMessageProps) {
  return (
    <motion.div
      className="message-container"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={messageSpring}
    >
      <div className="flex gap-3.5">
        {/* Avatar */}
        <motion.div
          className="message-avatar shrink-0 mt-0.5"
          style={{ backgroundColor: `${assistantColor}12`, color: assistantColor }}
          animate={isThinking && !content ? {
            scale: [1, 1.1, 1],
            transition: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }
          } : { scale: 1 }}
        >
          <AssistantIcon className="h-4 w-4" />
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {content ? (
            <div className="message-assistant typing-cursor">
              <div className="markdown text-[14.5px]">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <motion.div
              className="flex items-center gap-3 py-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-[5px] w-[5px] rounded-full"
                    style={{ backgroundColor: assistantColor }}
                    animate={{
                      scale: [0.8, 1.2, 0.8],
                      opacity: [0.3, 0.8, 0.3],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.2,
                      delay: i * 0.15,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
              <span className="text-[13px] text-muted-foreground/50">Réflexion...</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
