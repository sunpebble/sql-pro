'use client';

import type { ComponentProps } from 'react';
import { memo } from 'react';
import { cn } from '@/lib/utils';

export type MessageProps = ComponentProps<'div'> & {
  from: 'user' | 'assistant' | 'system';
};

export const Message = memo(
  ({ className, from, children, ...props }: MessageProps) => (
    <div
      className={cn(
        'group flex gap-2',
        from === 'user' ? 'justify-end' : 'justify-start',
        className
      )}
      data-role={from}
      {...props}
    >
      {children}
    </div>
  )
);

export type MessageAvatarProps = ComponentProps<'div'> & {
  src?: string;
  name?: string;
};

export const MessageAvatar = memo(
  ({ className, src, name, children, ...props }: MessageAvatarProps) => (
    <div
      className={cn(
        'flex h-6 w-6 shrink-0 items-center justify-center rounded-base',
        'bg-muted',
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className="h-full w-full rounded-base object-cover"
        />
      ) : (
        children
      )}
    </div>
  )
);

export type MessageContentProps = ComponentProps<'div'>;

export const MessageContent = memo(
  ({ className, children, ...props }: MessageContentProps) => (
    <div
      className={cn(
        'relative max-w-[85%] rounded-base px-3 py-2',
        'group-data-[role=user]:bg-primary group-data-[role=user]:text-primary-foreground group-data-[role=user]:rounded-br-sm',
        'group-data-[role=assistant]:bg-muted/70 group-data-[role=assistant]:rounded-tl-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

Message.displayName = 'Message';
MessageAvatar.displayName = 'MessageAvatar';
MessageContent.displayName = 'MessageContent';
