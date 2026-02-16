import { useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Loader2, Paperclip } from 'lucide-react';
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

  // Auto-resize textarea
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
    <div className="px-4 pb-4 pt-2">
      <div className="max-w-3xl mx-auto">
        <div className="chat-input-container relative flex items-end gap-2 p-2">
          {/* Attachment button (placeholder for future) */}
          <button
            type="button"
            className="p-2 rounded-xl text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors shrink-0 self-end mb-0.5"
            disabled
            title="Attachements (bientot disponible)"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || `Message ${assistantName}...`}
            className="chat-input-textarea flex-1 py-2.5 px-1 min-h-[44px] max-h-[200px] text-[15px] placeholder:text-muted-foreground/50"
            disabled={isStreaming}
            rows={1}
          />

          {/* Send button */}
          <button
            onClick={onSend}
            disabled={!canSend}
            className={cn(
              'chat-send-btn shrink-0 self-end mb-0.5',
              'p-2.5 rounded-xl',
              canSend
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground/40 cursor-not-allowed'
            )}
          >
            {isStreaming ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Helper text */}
        <p className="text-[11px] text-center text-muted-foreground/50 mt-2">
          Appuyez sur Entree pour envoyer, Maj+Entree pour un retour a la ligne
        </p>
      </div>
    </div>
  );
}
