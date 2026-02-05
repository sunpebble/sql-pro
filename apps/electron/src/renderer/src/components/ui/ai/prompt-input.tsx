'use client';

import type { ComponentProps } from 'react';
import { Button } from '@sqlpro/ui/button';
import { Loader2, SendIcon, SquareIcon } from 'lucide-react';
import { memo } from 'react';
import { cn } from '@/lib/utils';

export type PromptInputProps = ComponentProps<'form'>;

export const PromptInput = memo(
  ({ className, onSubmit, children, ...props }: PromptInputProps) => (
    <form
      className={cn(
        'bg-background/80 ring-border/50 focus-within:ring-primary/40 rounded-base flex items-end gap-2 px-3 py-2 ring-1 transition-all focus-within:ring-2',
        className
      )}
      onSubmit={onSubmit}
      {...props}
    >
      {children}
    </form>
  )
);

export type PromptInputTextareaProps = ComponentProps<'textarea'>;

export const PromptInputTextarea = memo(
  ({ className, ...props }: PromptInputTextareaProps) => (
    <textarea
      className={cn(
        'placeholder:text-muted-foreground max-h-[120px] min-h-[32px] flex-1 resize-none bg-transparent outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      rows={1}
      {...props}
    />
  )
);

export type PromptInputToolbarProps = ComponentProps<'div'>;

export const PromptInputToolbar = memo(
  ({ className, children, ...props }: PromptInputToolbarProps) => (
    <div
      className={cn('flex shrink-0 items-center gap-1', className)}
      {...props}
    >
      {children}
    </div>
  )
);

export type PromptInputToolsProps = ComponentProps<'div'>;

export const PromptInputTools = memo(
  ({ className, children, ...props }: PromptInputToolsProps) => (
    <div className={cn('flex items-center gap-1', className)} {...props}>
      {children}
    </div>
  )
);

export type PromptInputButtonProps = ComponentProps<typeof Button>;

export const PromptInputButton = memo(
  ({ className, children, ...props }: PromptInputButtonProps) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('h-8 w-8', className)}
      {...props}
    >
      {children}
    </Button>
  )
);

export type PromptInputSubmitProps = ComponentProps<typeof Button> & {
  status?: 'submitted' | 'streaming' | 'ready' | 'error';
};

export const PromptInputSubmit = memo(
  ({
    className,
    status,
    disabled,
    onClick,
    ...props
  }: PromptInputSubmitProps) => {
    const isLoading = status === 'streaming' || status === 'submitted';

    if (isLoading && onClick) {
      return (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('text-primary hover:bg-primary/10 h-8 w-8', className)}
          onClick={onClick}
          {...props}
        >
          <SquareIcon className="h-3.5 w-3.5" />
        </Button>
      );
    }

    return (
      <button
        type="submit"
        disabled={disabled || isLoading}
        className={cn(
          'bg-primary text-primary-foreground hover:bg-primary/90 rounded-base flex h-8 w-8 items-center justify-center transition-all disabled:cursor-not-allowed disabled:opacity-40',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <SendIcon className="h-3.5 w-3.5" />
        )}
      </button>
    );
  }
);

PromptInput.displayName = 'PromptInput';
PromptInputTextarea.displayName = 'PromptInputTextarea';
PromptInputToolbar.displayName = 'PromptInputToolbar';
PromptInputTools.displayName = 'PromptInputTools';
PromptInputButton.displayName = 'PromptInputButton';
PromptInputSubmit.displayName = 'PromptInputSubmit';
