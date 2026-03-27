import { useRef, useEffect, KeyboardEvent } from 'react';
import { SendIcon, Loader2Icon } from 'lucide-react';
import { motion } from 'motion/react';
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
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const canSend = value.trim() && !isStreaming;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      <div className="relative rounded-xl border border-border outline-none" style={{ outline: 'none' }}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || `Message ${assistantName}...`}
          disabled={isStreaming}
          rows={3}
          style={{ outline: 'none', boxShadow: 'none' }}
          className="w-full resize-none bg-transparent px-4 pt-4 pb-12 text-[15px] placeholder:text-muted-foreground/30 focus:outline-none focus:ring-0 focus:border-none disabled:opacity-50 min-h-[120px] max-h-[200px] !outline-none !ring-0"
        />
        <div className="absolute bottom-3 right-3">
          <button
            onClick={onSend}
            disabled={!canSend}
            aria-label={isStreaming ? 'Envoi en cours' : 'Envoyer'}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
              canSend
                ? 'bg-foreground text-background hover:bg-foreground/90'
                : 'text-muted-foreground/20'
            )}
          >
            {isStreaming ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <SendIcon className="h-4 w-4" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>
      <p className="text-[11px] text-center text-muted-foreground/20 mt-2 select-none">
        Entrée pour envoyer · Maj+Entrée pour un retour à la ligne
      </p>
    </motion.div>
  );
}
