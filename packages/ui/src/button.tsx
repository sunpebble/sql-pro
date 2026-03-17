import type { VariantProps } from 'class-variance-authority';
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva } from 'class-variance-authority';

import { cn } from './lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-all gap-2 duration-150 ease-out [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-95",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        noShadow: 'bg-primary text-primary-foreground',
        neutral: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        reverse: 'bg-primary text-primary-foreground',
        outline:
          'border border-border bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-destructive text-white hover:bg-destructive/90',
        link: 'text-primary underline-offset-4 hover:underline',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border',
        accent: 'bg-accent text-accent-foreground hover:bg-accent/90',
        'ghost-primary':
          'text-muted-foreground hover:text-primary hover:bg-primary/10',
      },
      size: {
        default: 'h-10 px-4 py-2',
        xs: 'h-7 px-2 gap-1',
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
  style,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  // Calculate font size based on size variant
  const getFontSize = () => {
    switch (size) {
      case 'xs':
        return 'calc(var(--font-ui-size, 14px) * 0.85)';
      default:
        return 'var(--font-ui-size, 14px)';
    }
  };

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      style={{ fontSize: getFontSize(), ...style }}
      {...props}
    />
  );
}

/* eslint-disable react-refresh/only-export-components -- Intentional: exports variant utility */
export { Button, buttonVariants };
