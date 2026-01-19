import * as React from 'react';

import { cn } from './lib/utils';

/**
 * SanctumCard - Data Sanctum branded card
 *
 * An Art Deco inspired card with decorative corner frames and gold accents.
 * Features inner border that animates on hover for a ceremonial feel.
 */

interface SanctumCardProps extends React.ComponentProps<'div'> {
  /** Show decorative inner border frame */
  decorated?: boolean;
  /** Enable hover lift and glow effect */
  interactive?: boolean;
  /** Card padding size */
  size?: 'default' | 'sm' | 'lg';
}

function SanctumCard({
  className,
  decorated = true,
  interactive = true,
  size = 'default',
  children,
  ...props
}: SanctumCardProps) {
  return (
    <div
      data-slot="sanctum-card"
      data-decorated={decorated}
      data-interactive={interactive}
      className={cn(
        // Base structure
        'group/sanctum-card relative flex flex-col overflow-hidden',
        // Background gradient
        'bg-gradient-to-br from-[rgba(20,20,20,0.9)] to-[rgba(11,11,11,0.95)]',
        // Border
        'border border-[rgba(248,246,241,0.08)]',
        // Transitions
        'transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',

        // Size variants
        {
          'gap-6 p-10': size === 'lg',
          'gap-4 p-6': size === 'default',
          'gap-3 p-4': size === 'sm',
        },

        // Interactive hover effects
        interactive && [
          'hover:border-[rgba(212,175,55,0.3)]',
          'hover:-translate-y-2',
          'hover:shadow-[0_16px_64px_rgba(0,0,0,0.5)]',
        ],

        className
      )}
      {...props}
    >
      {/* Decorative inner frame - appears on hover */}
      {decorated && (
        <div
          className={cn(
            'pointer-events-none absolute inset-3',
            'border border-[rgba(248,246,241,0.08)]',
            'opacity-0 transition-all duration-300',
            // Animate inward on hover
            interactive &&
              'group-hover/sanctum-card:inset-4 group-hover/sanctum-card:border-[rgba(212,175,55,0.2)] group-hover/sanctum-card:opacity-100'
          )}
        />
      )}

      {children}
    </div>
  );
}

interface SanctumCardHeaderProps extends React.ComponentProps<'div'> {
  /** Show decorative gold line above title */
  decorated?: boolean;
}

function SanctumCardHeader({
  className,
  decorated = false,
  children,
  ...props
}: SanctumCardHeaderProps) {
  return (
    <div
      data-slot="sanctum-card-header"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    >
      {decorated && <div className="mb-2 h-px w-12 bg-[#C9A962]" />}
      {children}
    </div>
  );
}

function SanctumCardTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return (
    <h3
      data-slot="sanctum-card-title"
      className={cn(
        "font-['Cormorant_Garamond',serif] text-xl font-medium",
        'tracking-tight text-[#F8F6F1]',
        className
      )}
      {...props}
    />
  );
}

function SanctumCardDescription({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="sanctum-card-description"
      className={cn('text-sm text-[rgba(248,246,241,0.6)]', className)}
      {...props}
    />
  );
}

function SanctumCardContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sanctum-card-content"
      className={cn('flex-1', className)}
      {...props}
    />
  );
}

function SanctumCardFooter({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sanctum-card-footer"
      className={cn('flex items-center gap-4', className)}
      {...props}
    />
  );
}

export {
  SanctumCard,
  SanctumCardContent,
  SanctumCardDescription,
  SanctumCardFooter,
  SanctumCardHeader,
  SanctumCardTitle,
};
