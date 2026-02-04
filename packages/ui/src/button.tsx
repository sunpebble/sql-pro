import type { VariantProps } from 'class-variance-authority';
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva } from 'class-variance-authority';

import { cn } from './lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[5px] text-sm font-medium ring-offset-white transition-all gap-2 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        // Neobrutalism default: solid color with border and offset shadow
        default:
          'bg-primary text-primary-foreground border-2 border-border shadow-[4px_4px_0px_0px_var(--border)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none',
        // No shadow variant
        noShadow: 'bg-primary text-primary-foreground border-2 border-border',
        // Neutral/secondary with shadow
        neutral:
          'bg-secondary text-secondary-foreground border-2 border-border shadow-[4px_4px_0px_0px_var(--border)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none',
        // Reverse shadow effect (shadow appears on hover)
        reverse:
          'bg-primary text-primary-foreground border-2 border-border hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[4px_4px_0px_0px_var(--border)]',
        // Outline/ghost style
        outline:
          'bg-background text-foreground border-2 border-border shadow-[4px_4px_0px_0px_var(--border)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none',
        // Ghost - minimal, no border
        ghost: 'text-foreground hover:bg-muted border-2 border-transparent',
        // Destructive
        destructive:
          'bg-destructive text-white border-2 border-border shadow-[4px_4px_0px_0px_var(--border)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none',
        // Link style
        link: 'text-primary underline-offset-4 hover:underline border-0',
        // Secondary
        secondary:
          'bg-secondary text-secondary-foreground border-2 border-border hover:bg-muted',
        // Accent
        accent:
          'bg-accent text-accent-foreground border-2 border-border shadow-[4px_4px_0px_0px_var(--border)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none',
        // Ghost Primary - for toolbar actions
        'ghost-primary':
          'text-muted-foreground hover:text-primary hover:bg-primary/10 border-2 border-transparent',
      },
      size: {
        default: 'h-10 px-4 py-2',
        xs: 'h-7 px-2 text-xs gap-1',
        sm: 'h-9 px-3 gap-1.5',
        lg: 'h-11 px-8 gap-2',
        icon: 'size-10',
        'icon-xs': 'size-7',
        'icon-sm': 'size-9',
        'icon-lg': 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

/* eslint-disable react-refresh/only-export-components -- Intentional: exports variant utility */
export { Button, buttonVariants };
