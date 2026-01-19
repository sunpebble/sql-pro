import type { VariantProps } from 'class-variance-authority';
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva } from 'class-variance-authority';

import { cn } from './lib/utils';

/**
 * GoldButton - Data Sanctum branded button
 *
 * A ceremonial, Art Deco inspired button with gold accents and glow effects.
 * Use for primary CTAs and important actions that need visual prominence.
 */

const goldButtonVariants = cva(
  // Base styles - Art Deco geometric precision
  [
    'relative inline-flex items-center justify-center gap-3',
    'font-semibold uppercase tracking-[0.2em]',
    'rounded-none border-0 outline-none select-none',
    'transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
    'disabled:pointer-events-none disabled:opacity-50',
    "[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    // Focus visible - adapts to theme
    'focus-visible:ring-2 focus-visible:ring-[#C9A962] focus-visible:ring-offset-2',
    'focus-visible:ring-offset-[#060606] light:focus-visible:ring-offset-white',
  ],
  {
    variants: {
      variant: {
        // Primary gold - solid with glow
        default: [
          'bg-gradient-to-br from-[#C9A962] via-[#D4AF37] to-[#C9A962]',
          'text-[#020202]',
          'shadow-[0_4px_30px_rgba(212,175,55,0.3)]',
          'hover:from-[#D4AF37] hover:via-[#E8D59E] hover:to-[#D4AF37]',
          'hover:shadow-[0_12px_60px_rgba(212,175,55,0.5)]',
          'hover:-translate-y-1',
          'active:translate-y-0 active:shadow-[0_4px_20px_rgba(212,175,55,0.3)]',
        ],

        // Outline - bordered with gold accents
        outline: [
          'bg-transparent',
          'border',
          // Dark mode (default): ivory text, light border
          'text-[#F8F6F1] border-[rgba(248,246,241,0.25)]',
          // Light mode: gold text and border for visibility
          'light:text-[#9A7B2D] light:border-[#C9A962]',
          'hover:border-[#C9A962] hover:text-[#C9A962]',
          'hover:-translate-y-0.5',
        ],

        // Ghost - minimal, appears on hover
        ghost: [
          'bg-transparent',
          'text-[#C9A962]',
          // Light mode: darker gold for better contrast
          'light:text-[#9A7B2D]',
          'hover:bg-[rgba(212,175,55,0.08)]',
          'light:hover:bg-[rgba(212,175,55,0.15)]',
        ],

        // Pulse - animated glow for download/CTA
        pulse: [
          'bg-gradient-to-br from-[#C9A962] via-[#D4AF37] to-[#C9A962]',
          'text-[#020202]',
          'animate-[gold-pulse_3.5s_ease-in-out_infinite]',
          'hover:from-[#D4AF37] hover:via-[#E8D59E] hover:to-[#D4AF37]',
          'hover:-translate-y-1',
        ],
      },

      size: {
        default: 'h-12 px-10 text-[13px]',
        sm: 'h-9 px-6 text-xs',
        lg: 'h-14 px-12 text-sm',
        icon: 'size-12',
        'icon-sm': 'size-9',
      },

      // Decorative corner accents
      corners: {
        true: [
          // Top-left corner
          'before:absolute before:top-1.5 before:left-1.5',
          'before:size-3 before:border-t-2 before:border-l-2',
          'before:border-current before:opacity-0',
          'before:transition-opacity before:duration-200',
          'hover:before:opacity-60',
          // Bottom-right corner
          'after:absolute after:bottom-1.5 after:right-1.5',
          'after:size-3 after:border-b-2 after:border-r-2',
          'after:border-current after:opacity-0',
          'after:transition-opacity after:duration-200',
          'hover:after:opacity-60',
        ],
        false: [],
      },
    },

    defaultVariants: {
      variant: 'default',
      size: 'default',
      corners: false,
    },
  }
);

export interface GoldButtonProps
  extends ButtonPrimitive.Props, VariantProps<typeof goldButtonVariants> {}

function GoldButton({
  className,
  variant,
  size,
  corners,
  ...props
}: GoldButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="gold-button"
      className={cn(goldButtonVariants({ variant, size, corners, className }))}
      {...props}
    />
  );
}

export { GoldButton, goldButtonVariants };
