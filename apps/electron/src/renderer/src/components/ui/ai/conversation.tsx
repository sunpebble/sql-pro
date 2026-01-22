'use client';

import type { ComponentProps } from 'react';
import { memo } from 'react';
import { useStickToBottomContext } from 'use-stick-to-bottom';
import { cn } from '@/lib/utils';

export type ConversationProps = ComponentProps<'div'>;

export const Conversation = memo(
  ({ className, children, ...props }: ConversationProps) => (
    <div
      className={cn('relative flex h-full flex-col overflow-hidden', className)}
      {...props}
    >
      {children}
    </div>
  )
);

export type ConversationContentProps = ComponentProps<'div'>;

export const ConversationContent = memo(
  ({ className, children, ...props }: ConversationContentProps) => (
    <div className={cn('flex-1 overflow-y-auto', className)} {...props}>
      {children}
    </div>
  )
);

export type ConversationScrollButtonProps = ComponentProps<'button'>;

export const ConversationScrollButton = memo(
  ({ className, ...props }: ConversationScrollButtonProps) => {
    let isAtBottom = true;
    let scrollToBottom = () => {};

    try {
      const context = useStickToBottomContext();
      isAtBottom = context.isAtBottom;
      scrollToBottom = context.scrollToBottom;
    } catch {
      return null;
    }

    if (isAtBottom) return null;

    return (
      <button
        type="button"
        className={cn(
          'bg-background border-border absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border px-3 py-1.5 text-xs shadow-md transition-all hover:shadow-lg',
          className
        )}
        onClick={() => scrollToBottom()}
        {...props}
      >
        ↓ Scroll to bottom
      </button>
    );
  }
);

Conversation.displayName = 'Conversation';
ConversationContent.displayName = 'ConversationContent';
ConversationScrollButton.displayName = 'ConversationScrollButton';
