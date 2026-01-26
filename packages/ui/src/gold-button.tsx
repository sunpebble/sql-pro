import type { VariantProps } from 'class-variance-authority';
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva } from 'class-variance-authority';

import { cn } from './lib/utils';

/**
 * BrandButton - Primary branded button component
 *
 * A distinctive button with primary color accents and glow effects.
 * Use for primary CTAs and important actions that need visual prominence.
 */

const brandButtonVariants = cva(
  // Base styles - modern, clean design
  [
    'relative inline-flex items-center justify-center gap-2',
    'font-semibold text-sm',
    'rounded-lg border-0 outline-none select-none',
    'transition-all duration-200 ease-out',
    'disabled:pointer-events-none disabled:opacity-50',
    "[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    // Focus visible - adapts to theme
    'focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
    'focus-visible:ring-offset-background',
  ],
  {
    variants: {
      variant: {
        // Primary - solid flat design
        default: [
          'bg-primary',
          'text-primary-foreground',
          'hover:bg-primary/90',
        ],

        // Outline - bordered with primary accents
        outline: [
          'bg-transparent',
          'border',
          // Dark mode (default): foreground text, subtle border
          'text-foreground border-border',
          // Light mode: primary text and border for visibility
          'light:text-primary-dark light:border-primary',
          'hover:border-primary hover:text-primary',
        ],

        // Ghost - minimal, appears on hover
        ghost: [
          'bg-transparent',
          'text-primary',
          // Light mode: darker primary for better contrast
          'light:text-primary-dark',
          'hover:bg-primary/10',
          'light:hover:bg-primary/15',
        ],

        // Pulse - flat design (same as default)
        pulse: [
          'bg-primary',
          'text-primary-foreground',
          'hover:bg-primary/90',
        ],
      },

      size: {
        default: 'h-10 px-6',
        sm: 'h-8 px-4 text-xs',
        lg: 'h-12 px-8',
        icon: 'size-10',
        'icon-sm': 'size-8',
      },

      // Decorative corner accents (kept for backward compatibility, more subtle)
      corners: {
        true: [
          // Top-left corner
          'before:absolute before:top-1 before:left-1',
          'before:size-2 before:border-t before:border-l',
          'before:border-current before:opacity-0',
          'before:transition-opacity before:duration-200',
          'hover:before:opacity-40',
          // Bottom-right corner
          'after:absolute after:bottom-1 after:right-1',
          'after:size-2 after:border-b after:border-r',
          'after:border-current after:opacity-0',
          'after:transition-opacity after:duration-200',
          'hover:after:opacity-40',
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

export interface BrandButtonProps
  extends ButtonPrimitive.Props, VariantProps<typeof brandButtonVariants> {}

function BrandButton({
  className,
  variant,
  size,
  corners,
  ...props
}: BrandButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="brand-button"
      className={cn(brandButtonVariants({ variant, size, corners, className }))}
      {...props}
    />
  );
}

// Legacy exports for backward compatibility
export type GoldButtonProps = BrandButtonProps;
 
export const GoldButton = BrandButton;
// eslint-disable-next-line react-refresh/only-export-components
export const goldButtonVariants = brandButtonVariants;

// eslint-disable-next-line react-refresh/only-export-components
export { BrandButton, brandButtonVariants };
