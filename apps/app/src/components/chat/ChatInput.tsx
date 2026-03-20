import { useRef, useEffect, KeyboardEvent } from 'react';
import { ArrowUpIcon, Loader2Icon, PlusIcon, PaperclipIcon } from 'lucide-react';
import { motion } from 'motion/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group';

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
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
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
      <Field>
        <InputGroup className="bg-background rounded-2xl border p-1.5 outline-none [&:has([data-slot=input-group-control]:focus-visible)]:ring-[3px] [&:has([data-slot=input-group-control]:focus-visible)]:ring-muted-foreground/15">
          <InputGroupAddon className="border-none pl-2 self-end pb-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <InputGroupButton
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground rounded-full size-10"
                  aria-label="Options"
                >
                  <PlusIcon className="size-6" />
                </InputGroupButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                sideOffset={12}
                className="w-56"
              >
                <DropdownMenuItem disabled>
                  <PaperclipIcon />
                  <span>Joindre un fichier</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </InputGroupAddon>

          <InputGroupTextarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || `Message ${assistantName}...`}
            disabled={isStreaming}
            rows={1}
            className="placeholder:text-muted-foreground/70 border-none px-2 py-3 text-base shadow-none !ring-0 !outline-none min-h-[44px] max-h-[160px]"
          />

          <InputGroupAddon align="inline-end" className="border-none pr-1 self-end pb-1">
            <InputGroupButton
              variant="default"
              onClick={onSend}
              disabled={!canSend}
              aria-label={isStreaming ? 'Envoi en cours' : 'Envoyer le message'}
              className="rounded-full size-11 bg-foreground text-background hover:bg-foreground/90 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isStreaming ? (
                <Loader2Icon className="size-5 animate-spin" />
              ) : (
                <ArrowUpIcon className="size-5" strokeWidth={2.5} />
              )}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </Field>

      <p className="text-xs text-center text-muted-foreground/25 mt-2 select-none">
        Entrée pour envoyer · Maj+Entrée pour un retour à la ligne
      </p>
    </motion.div>
  );
}
