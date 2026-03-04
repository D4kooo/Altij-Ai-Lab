import { ComponentType } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, Copy, Check, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

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
      <div className={cn('flex justify-end', isNew && 'message-animate')}>
        <div className="message-user max-w-[80%] md:max-w-[65%]">
          <p className="text-[14.5px] whitespace-pre-wrap leading-[1.65]">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('message-container group', isNew && 'message-animate')}>
      <div className="flex gap-3.5">
        {/* Avatar */}
        <div
          className="message-avatar shrink-0 mt-0.5"
          style={{ backgroundColor: `${assistantColor}12`, color: assistantColor }}
        >
          <AssistantIcon className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className={cn('message-assistant', isStreaming && 'typing-cursor')}>
            <div className="markdown text-[14.5px]">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>

          {/* Actions */}
          {!isStreaming && content && (
            <div className="message-actions flex items-center gap-0.5">
              <button
                onClick={handleCopy}
                className="message-action-btn"
                title={copied ? 'Copié !' : 'Copier'}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
              <button className="message-action-btn" title="Régénérer">
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
    <div className="message-container message-fade">
      <div className="flex gap-3.5">
        {/* Avatar */}
        <div
          className={cn(
            'message-avatar shrink-0 mt-0.5',
            isThinking && !content && 'animate-pulse'
          )}
          style={{ backgroundColor: `${assistantColor}12`, color: assistantColor }}
        >
          <AssistantIcon className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {content ? (
            <div className="message-assistant typing-cursor">
              <div className="markdown text-[14.5px]">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="thinking-indicator">
              <div className="thinking-dots">
                <span style={{ backgroundColor: assistantColor }} />
                <span style={{ backgroundColor: assistantColor }} />
                <span style={{ backgroundColor: assistantColor }} />
              </div>
              <span className="text-[13px] text-muted-foreground/60">Réflexion en cours...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
