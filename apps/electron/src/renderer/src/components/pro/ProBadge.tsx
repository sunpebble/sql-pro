import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { Crown } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

const proBadgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-2 py-0.5 font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-gradient-to-r from-amber-500 to-yellow-500 text-white',
        outline:
          'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400',
        subtle:
          'border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400',
        pulse:
          'border-transparent bg-gradient-to-r from-amber-500 to-yellow-500 text-white animate-pulse',
        glow: 'border-transparent bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg shadow-amber-500/30',
      },
      size: {
        default: 'px-2 py-0.5',
        sm: 'px-1.5 py-0.5',
        lg: 'px-3 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ProBadgeProps
  extends React.ComponentProps<'span'>, VariantProps<typeof proBadgeVariants> {
  /**
   * Whether to show the crown icon
   * @default true
   */
  showIcon?: boolean;
  /**
   * Custom label for the badge
   * @default "Pro"
   */
  label?: string;
}

// Font size mapping for each size variant
const sizeStyles: Record<'default' | 'sm' | 'lg', React.CSSProperties> = {
  default: { fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)' },
  sm: { fontSize: 'calc(var(--font-ui-size, 14px) * 0.7)' },
  lg: { fontSize: 'var(--font-ui-size, 14px)' },
};

/**
 * Badge component to indicate Pro features in the UI.
 * Shows a gold-colored badge with a crown icon.
 */
function ProBadge({
  className,
  variant,
  size,
  showIcon = true,
  label = 'Pro',
  style,
  ...props
}: ProBadgeProps) {
  const sizeStyle = sizeStyles[size ?? 'default'];
  return (
    <span
      data-slot="pro-badge"
      className={cn(proBadgeVariants({ variant, size }), className)}
      style={{ ...sizeStyle, ...style }}
      {...props}
    >
      {showIcon && <Crown className="h-3 w-3" aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- proBadgeVariants is intentionally exported
export { ProBadge, proBadgeVariants };
