'use client';

import type { ComponentProps } from 'react';
import { memo } from 'react';
import { cn } from '@/lib/utils';

export type LoaderProps = ComponentProps<'div'> & {
  size?: number;
  variant?: 'dots' | 'pulse';
};

export const Loader = memo(
  ({ className, size = 16, variant = 'dots', ...props }: LoaderProps) => {
    if (variant === 'pulse') {
      return (
        <div
          className={cn('flex items-center gap-1', className)}
          style={{ height: size }}
          {...props}
        >
          <span
            className="bg-primary/60 animate-pulse rounded-full"
            style={{ width: size / 4, height: size / 4 }}
          />
        </div>
      );
    }

    return (
      <div
        className={cn('flex items-center gap-1', className)}
        style={{ height: size }}
        {...props}
      >
        <span
          className="bg-primary animate-bounce rounded-full"
          style={{
            width: size / 4,
            height: size / 4,
            animationDelay: '0ms',
          }}
        />
        <span
          className="bg-primary animate-bounce rounded-full"
          style={{
            width: size / 4,
            height: size / 4,
            animationDelay: '150ms',
          }}
        />
        <span
          className="bg-primary animate-bounce rounded-full"
          style={{
            width: size / 4,
            height: size / 4,
            animationDelay: '300ms',
          }}
        />
      </div>
    );
  }
);

Loader.displayName = 'Loader';
