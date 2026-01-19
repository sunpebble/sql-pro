import * as React from 'react';

import { cn } from './lib/utils';

/**
 * GradientText - Animated gold shimmer text
 *
 * Creates a shimmering gold gradient text effect for headlines and CTAs.
 * Use for important titles that need visual prominence.
 */

type GradientTextElement = 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'p';

interface GradientTextProps {
  /** Text element to render */
  as?: GradientTextElement;
  /** Gradient animation */
  animate?: boolean;
  /** Animation speed */
  speed?: 'slow' | 'default' | 'fast';
  /** Gradient variant */
  variant?: 'gold' | 'ivory' | 'warm';
  /** Additional class names */
  className?: string;
  /** Content */
  children?: React.ReactNode;
}

function GradientText({
  as: Component = 'span',
  className,
  animate = true,
  speed = 'default',
  variant = 'gold',
  children,
}: GradientTextProps) {
  const gradientMap = {
    gold: 'from-[#D4AF37] via-[#E8D59E] via-[#C9A962] via-[#E8D59E] to-[#D4AF37]',
    ivory: 'from-[#F8F6F1] via-[rgba(248,246,241,0.7)] to-[#F8F6F1]',
    warm: 'from-[#D4AF37] via-[#F8F6F1] to-[#C9A962]',
  };

  const speedMap = {
    slow: 'animate-[shimmer_6s_ease-in-out_infinite]',
    default: 'animate-[shimmer_4s_ease-in-out_infinite]',
    fast: 'animate-[shimmer_2s_ease-in-out_infinite]',
  };

  return (
    <Component
      data-slot="gradient-text"
      className={cn(
        'bg-gradient-to-r bg-[length:200%_auto]',
        'bg-clip-text text-transparent',
        gradientMap[variant],
        animate && speedMap[speed],
        className
      )}
    >
      {children}
    </Component>
  );
}

/**
 * SectionNumber - Decorative section indicator
 *
 * Monospace styled number badge for section headers.
 */

interface SectionNumberProps extends React.ComponentProps<'span'> {
  /** The section number or text */
  children: React.ReactNode;
}

function SectionNumber({ className, children, ...props }: SectionNumberProps) {
  return (
    <span
      data-slot="section-number"
      className={cn(
        'inline-block px-4 py-2',
        'font-mono text-xs tracking-[0.4em] uppercase',
        'text-[#C9A962]',
        'border border-[rgba(212,175,55,0.2)]',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * SanctumHeading - Branded heading with decorative line
 *
 * Display heading in Cormorant Garamond with optional decorative elements.
 */

interface SanctumHeadingProps extends React.ComponentProps<'div'> {
  /** Heading level */
  level?: 1 | 2 | 3;
  /** Show decorative line above */
  decorated?: boolean;
  /** Center align content */
  centered?: boolean;
  /** Heading content */
  children: React.ReactNode;
}

function SanctumHeading({
  level = 2,
  decorated = false,
  centered = false,
  className,
  children,
  ...props
}: SanctumHeadingProps) {
  const Tag = `h${level}` as const;

  const sizeClasses = {
    1: 'text-5xl md:text-7xl font-normal',
    2: 'text-3xl md:text-5xl font-medium',
    3: 'text-xl md:text-2xl font-medium',
  };

  return (
    <div
      data-slot="sanctum-heading"
      className={cn(centered && 'text-center', className)}
      {...props}
    >
      {decorated && (
        <div
          className={cn('mb-6 h-px w-12 bg-[#C9A962]', centered && 'mx-auto')}
        />
      )}
      <Tag
        className={cn(
          "font-['Cormorant_Garamond',serif]",
          'tracking-tight text-[#F8F6F1]',
          sizeClasses[level]
        )}
      >
        {children}
      </Tag>
    </div>
  );
}

/**
 * MonoText - Technical/code styled text
 *
 * IBM Plex Mono styled text for technical content.
 */

function MonoText({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="mono-text"
      className={cn(
        'font-mono text-sm tracking-tight',
        'text-[rgba(248,246,241,0.6)]',
        className
      )}
      {...props}
    />
  );
}

export { GradientText, MonoText, SanctumHeading, SectionNumber };
