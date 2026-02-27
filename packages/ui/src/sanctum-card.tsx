import * as React from 'react';

import { cn } from './lib/utils';

/**
 * BrandCard - Themed card component with decorative effects
 *
 * A card component with decorative inner border frame and subtle accents.
 * Features inner border that animates on hover for a refined feel.
 */

interface BrandCardProps extends React.ComponentProps<'div'> {
  /** Show decorative inner border frame */
  decorated?: boolean;
  /** Enable hover lift and glow effect */
  interactive?: boolean;
  /** Card padding size */
  size?: 'default' | 'sm' | 'lg';
}

function BrandCard({
  className,
  decorated = true,
  interactive = true,
  size = 'default',
  children,
  ...props
}: BrandCardProps) {
  return (
    <div
      data-slot="brand-card"
      data-decorated={decorated}
      data-interactive={interactive}
      className={cn(
        // Base structure
        'group/brand-card relative flex flex-col overflow-hidden',
        // Background
        'bg-card',
        // Border
        'border-border/10 border',
        // Transitions
        'transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',

        // Size variants
        {
          'gap-6 p-10': size === 'lg',
          'gap-4 p-6': size === 'default',
          'gap-3 p-4': size === 'sm',
        },

        // Interactive hover effects
        interactive && ['hover:border-primary/30', 'hover:shadow-lg'],

        className
      )}
      {...props}
    >
      {/* Decorative inner frame - appears on hover */}
      {decorated && (
        <div
          className={cn(
            'pointer-events-none absolute inset-3',
            'border-border/10 border',
            'opacity-0 transition-all duration-300',
            // Animate inward on hover
            interactive &&
              'group-hover/brand-card:border-primary/20 group-hover/brand-card:inset-4 group-hover/brand-card:opacity-100'
          )}
        />
      )}

      {children}
    </div>
  );
}

interface BrandCardHeaderProps extends React.ComponentProps<'div'> {
  /** Show decorative accent line above title */
  decorated?: boolean;
}

function BrandCardHeader({
  className,
  decorated = false,
  children,
  ...props
}: BrandCardHeaderProps) {
  return (
    <div
      data-slot="brand-card-header"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    >
      {decorated && <div className="bg-primary mb-2 h-px w-12" />}
      {children}
    </div>
  );
}

function BrandCardTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return (
    <h3
      data-slot="brand-card-title"
      className={cn(
        'font-sans [font-size:calc(var(--font-ui-size,14px)*1.4)] font-medium',
        'text-card-foreground tracking-tight',
        className
      )}
      {...props}
    />
  );
}

function BrandCardDescription({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="brand-card-description"
      className={cn(
        'text-muted-foreground [font-size:var(--font-ui-size,14px)]',
        className
      )}
      {...props}
    />
  );
}

function BrandCardContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="brand-card-content"
      className={cn('flex-1', className)}
      {...props}
    />
  );
}

function BrandCardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="brand-card-footer"
      className={cn('flex items-center gap-4', className)}
      {...props}
    />
  );
}

export {
  BrandCard,
  BrandCardContent,
  BrandCardDescription,
  BrandCardFooter,
  BrandCardHeader,
  BrandCardTitle,
};
