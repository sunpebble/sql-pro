import * as React from 'react';

import { cn } from './lib/utils';

/**
 * GradientText - Animated shimmer text
 *
 * Creates a shimmering gradient text effect for headlines and CTAs.
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
  variant?: 'primary' | 'foreground' | 'accent';
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
  variant = 'primary',
  children,
}: GradientTextProps) {
  const gradientMap = {
    primary: 'from-primary via-primary/70 to-primary',
    foreground: 'from-foreground via-foreground/70 to-foreground',
    accent: 'from-primary via-foreground to-primary',
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
        'font-mono [font-size:calc(var(--font-ui-size,14px)*0.75)] tracking-[0.4em] uppercase',
        'text-primary',
        'border-primary/20 border',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * BrandHeading - Branded heading with decorative line
 *
 * Display heading with optional decorative elements.
 */

interface BrandHeadingProps extends React.ComponentProps<'div'> {
  /** Heading level */
  level?: 1 | 2 | 3;
  /** Show decorative line above */
  decorated?: boolean;
  /** Center align content */
  centered?: boolean;
  /** Heading content */
  children: React.ReactNode;
}

function BrandHeading({
  level = 2,
  decorated = false,
  centered = false,
  className,
  children,
  ...props
}: BrandHeadingProps) {
  const Tag = `h${level}` as const;

  const sizeClasses = {
    1: 'text-5xl md:text-7xl font-normal',
    2: 'text-3xl md:text-5xl font-medium',
    3: 'text-xl md:text-2xl font-medium',
  };

  return (
    <div
      data-slot="brand-heading"
      className={cn(centered && 'text-center', className)}
      {...props}
    >
      {decorated && (
        <div
          className={cn('bg-primary mb-6 h-px w-12', centered && 'mx-auto')}
        />
      )}
      <Tag
        className={cn(
          'font-sans',
          'text-foreground tracking-tight',
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
 * Monospace styled text for technical content.
 */

function MonoText({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="mono-text"
      className={cn(
        'font-mono [font-size:var(--font-ui-size,14px)] tracking-tight',
        'text-muted-foreground',
        className
      )}
      {...props}
    />
  );
}

export { BrandHeading, GradientText, MonoText, SectionNumber };
