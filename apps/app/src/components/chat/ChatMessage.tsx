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
        <div className="message-user max-w-[85%] md:max-w-[70%]">
          <p className="text-[15px] whitespace-pre-wrap leading-relaxed">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('message-container group', isNew && 'message-animate')}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-1"
          style={{ backgroundColor: `${assistantColor}15`, color: assistantColor }}
        >
          <AssistantIcon className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className={cn('message-assistant', isStreaming && 'typing-cursor')}>
            <div className="markdown text-[15px]">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>

          {/* Actions - shown on hover */}
          {!isStreaming && content && (
            <div className="message-actions flex items-center gap-1 -ml-1">
              <button
                onClick={handleCopy}
                className="message-action-btn"
                title={copied ? 'Copie !' : 'Copier'}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
              <button className="message-action-btn" title="Regenerer">
                <RotateCcw className="h-4 w-4" />
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
      <div className="flex gap-3">
        {/* Avatar with pulse when thinking */}
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-1',
            isThinking && !content && 'animate-pulse'
          )}
          style={{ backgroundColor: `${assistantColor}15`, color: assistantColor }}
        >
          <AssistantIcon className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {content ? (
            <div className="message-assistant typing-cursor">
              <div className="markdown text-[15px]">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 py-2">
              <div className="flex gap-1">
                <span
                  className="streaming-dot h-2 w-2 rounded-full"
                  style={{ backgroundColor: assistantColor }}
                />
                <span
                  className="streaming-dot h-2 w-2 rounded-full"
                  style={{ backgroundColor: assistantColor }}
                />
                <span
                  className="streaming-dot h-2 w-2 rounded-full"
                  style={{ backgroundColor: assistantColor }}
                />
              </div>
              <span className="text-sm text-muted-foreground">Reflexion en cours...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
