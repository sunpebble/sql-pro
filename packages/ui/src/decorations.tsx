import * as React from 'react';

import { cn } from './lib/utils';

/**
 * DecoFrame - Decorative corner frame wrapper
 *
 * Adds Art Deco style corner accents to any content.
 * Use for highlighting important sections or creating visual hierarchy.
 */

interface DecoFrameProps extends React.ComponentProps<'div'> {
  /** Corner accent size */
  size?: 'sm' | 'default' | 'lg';
  /** Corner accent color */
  variant?: 'gold' | 'ivory' | 'subtle';
  /** Show all four corners or just top-left and bottom-right */
  fullCorners?: boolean;
  /** Animate corners on hover */
  animated?: boolean;
}

function DecoFrame({
  className,
  size = 'default',
  variant = 'gold',
  fullCorners = false,
  animated = true,
  children,
  ...props
}: DecoFrameProps) {
  const sizeMap = {
    sm: 'before:size-2 after:size-2',
    default: 'before:size-3 after:size-3',
    lg: 'before:size-4 after:size-4',
  };

  const colorMap = {
    gold: 'before:border-border after:border-border',
    ivory:
      'before:border-[rgba(248,246,241,0.25)] after:border-[rgba(248,246,241,0.25)]',
    subtle:
      'before:border-[rgba(248,246,241,0.08)] after:border-[rgba(248,246,241,0.08)]',
  };

  return (
    <div
      data-slot="deco-frame"
      className={cn(
        'group/deco-frame relative',
        // Top-left corner
        'before:absolute before:top-0 before:left-0',
        'before:border-t before:border-l',
        'before:pointer-events-none',
        // Bottom-right corner
        'after:absolute after:right-0 after:bottom-0',
        'after:border-r after:border-b',
        'after:pointer-events-none',
        // Size
        sizeMap[size],
        // Color
        colorMap[variant],
        // Animation
        animated && [
          'before:opacity-50 after:opacity-50',
          'before:transition-all after:transition-all',
          'before:duration-300 after:duration-300',
          'hover:before:opacity-100 hover:after:opacity-100',
          size === 'sm' && 'hover:before:size-3 hover:after:size-3',
          size === 'default' && 'hover:before:size-4 hover:after:size-4',
          size === 'lg' && 'hover:before:size-5 hover:after:size-5',
        ],
        className
      )}
      {...props}
    >
      {/* Additional corners for fullCorners mode */}
      {fullCorners && (
        <>
          <span
            className={cn(
              'pointer-events-none absolute top-0 right-0',
              'border-t border-r',
              size === 'sm' && 'size-2',
              size === 'default' && 'size-3',
              size === 'lg' && 'size-4',
              variant === 'gold' && 'border-border',
              variant === 'ivory' && 'border-[rgba(248,246,241,0.25)]',
              variant === 'subtle' && 'border-[rgba(248,246,241,0.08)]',
              animated &&
                'opacity-50 transition-opacity duration-300 group-hover/deco-frame:opacity-100'
            )}
          />
          <span
            className={cn(
              'pointer-events-none absolute bottom-0 left-0',
              'border-b border-l',
              size === 'sm' && 'size-2',
              size === 'default' && 'size-3',
              size === 'lg' && 'size-4',
              variant === 'gold' && 'border-border',
              variant === 'ivory' && 'border-[rgba(248,246,241,0.25)]',
              variant === 'subtle' && 'border-[rgba(248,246,241,0.08)]',
              animated &&
                'opacity-50 transition-opacity duration-300 group-hover/deco-frame:opacity-100'
            )}
          />
        </>
      )}
      {children}
    </div>
  );
}

/**
 * GoldDivider - Art Deco style divider
 *
 * A horizontal divider with optional center diamond decoration.
 * Use to separate content sections with ceremonial elegance.
 */

interface GoldDividerProps extends React.ComponentProps<'div'> {
  /** Show center diamond decoration */
  diamond?: boolean;
  /** Divider thickness */
  weight?: 'thin' | 'default';
  /** Line style */
  variant?: 'solid' | 'gradient' | 'dashed';
}

function GoldDivider({
  className,
  diamond = true,
  weight = 'default',
  variant = 'gradient',
  ...props
}: GoldDividerProps) {
  const lineClasses = cn('flex-1', weight === 'thin' ? 'h-px' : 'h-[1px]', {
    'bg-zinc-400 dark:bg-zinc-600': variant === 'solid',
    'bg-gradient-to-r from-transparent via-zinc-300/25 dark:via-zinc-600/25 to-transparent':
      variant === 'gradient',
    'border-t border-dashed border-zinc-300/15 dark:border-zinc-600/15':
      variant === 'dashed',
  });

  return (
    <div
      data-slot="gold-divider"
      className={cn('flex items-center justify-center gap-5 py-8', className)}
      {...props}
    >
      <div className={cn(lineClasses, 'max-w-[200px]')} />

      {diamond && (
        <div
          className={cn('size-2 rotate-45', 'bg-zinc-400 dark:bg-zinc-600')}
        />
      )}

      <div className={cn(lineClasses, 'max-w-[200px]')} />
    </div>
  );
}

/**
 * DecoLine - Simple decorative line
 *
 * A subtle gold line for visual hierarchy.
 */

interface DecoLineProps extends React.ComponentProps<'div'> {
  /** Line orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Line length (uses Tailwind width/height classes) */
  length?: string;
}

function DecoLine({
  className,
  orientation = 'horizontal',
  length,
  ...props
}: DecoLineProps) {
  return (
    <div
      data-slot="deco-line"
      className={cn(
        'bg-zinc-400 dark:bg-zinc-600',
        orientation === 'horizontal' ? 'h-px' : 'w-px',
        length,
        className
      )}
      {...props}
    />
  );
}

export { DecoFrame, DecoLine, GoldDivider };
