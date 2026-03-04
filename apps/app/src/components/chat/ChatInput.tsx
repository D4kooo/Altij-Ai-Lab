import { useRef, useEffect, KeyboardEvent } from 'react';
import { ArrowUp, Loader2, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isStreaming: boolean;
  placeholder?: string;
  assistantName?: string;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  isStreaming,
  placeholder,
  assistantName = 'Assistant',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;
    }
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const canSend = value.trim() && !isStreaming;

  return (
    <div className="chat-input-wrapper">
      <div className="max-w-3xl mx-auto">
        <div className="chat-input-container">
          {/* Attachment */}
          <button
            type="button"
            className="chat-attach-btn"
            disabled
            title="Pièces jointes (bientôt disponible)"
          >
            <Paperclip className="h-[18px] w-[18px]" />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || `Message ${assistantName}...`}
            className="chat-input-textarea"
            disabled={isStreaming}
            rows={1}
          />

          {/* Send */}
          <button
            onClick={onSend}
            disabled={!canSend}
            className={cn(
              'chat-send-btn',
              canSend && 'chat-send-btn--active'
            )}
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
            )}
          </button>
        </div>

        <p className="text-[11px] text-center text-muted-foreground/40 mt-2.5 select-none">
          Entrée pour envoyer · Maj+Entrée pour un retour à la ligne
        </p>
      </div>
    </div>
  );
}
