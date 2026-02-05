// QuickQueryInput Component
// Natural language input for AI query generation in command palette

import type { KeyboardEvent } from 'react';
import { Button } from '@sqlpro/ui/button';
import { Input } from '@sqlpro/ui/input';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useQuickQuery } from '@/hooks/useQuickQuery';
import { cn } from '@/lib/utils';

interface QuickQueryInputProps {
  className?: string;
  onClose?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function QuickQueryInput({
  className,
  onClose,
  placeholder = 'Describe what you want to query...',
  autoFocus = true,
}: QuickQueryInputProps) {
  const [input, setInput] = useState('');
  const { isGenerating, error, generateSQL } = useQuickQuery();

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isGenerating) return;

    const result = await generateSQL(input.trim());
    if (result) {
      setInput('');
      onClose?.();
    }
  }, [input, isGenerating, generateSQL, onClose]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === 'Escape') {
        onClose?.();
      }
    },
    [handleSubmit, onClose]
  );

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Sparkles className="text-primary absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setInput(e.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="pr-4 pl-10"
            autoFocus={autoFocus}
            disabled={isGenerating}
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!input.trim() || isGenerating}
          size="sm"
          className="bg-primary hover:bg-primary/90"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {error && (
        <p
          className="text-destructive px-1"
          style={{ fontSize: 'var(--font-ui-size, 14px)' }}
        >
          {error}
        </p>
      )}

      <div
        className="text-muted-foreground flex items-center gap-2 px-1"
        style={{ fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)' }}
      >
        <span>Examples:</span>
        <button
          type="button"
          className="hover:text-foreground transition-colors"
          onClick={() => setInput('Show all users created this week')}
        >
          "Show all users created this week"
        </button>
        <span>-</span>
        <button
          type="button"
          className="hover:text-foreground transition-colors"
          onClick={() => setInput('Count orders by status')}
        >
          "Count orders by status"
        </button>
      </div>
    </div>
  );
}
