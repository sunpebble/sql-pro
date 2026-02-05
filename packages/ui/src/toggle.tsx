import type { VariantProps } from 'class-variance-authority';
import { Toggle as TogglePrimitive } from '@base-ui/react/toggle';
import { cva } from 'class-variance-authority';

import { cn } from './lib/utils';

const toggleVariants = cva(
  "hover:text-foreground aria-pressed:bg-main aria-pressed:text-main-foreground gap-1 rounded-[5px] font-bold transition-all [&_svg:not([class*='size-'])]:size-4 group/toggle hover:bg-muted inline-flex items-center justify-center whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [font-size:var(--font-ui-size,14px)]",
  {
    variants: {
      variant: {
        default: 'bg-transparent border-2 border-transparent',
        outline: 'border-border hover:bg-muted border-2 bg-transparent',
      },
      size: {
        default: 'h-10 min-w-10 px-3',
        sm: 'h-9 min-w-9 px-2',
        lg: 'h-11 min-w-11 px-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Toggle({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

/* eslint-disable react-refresh/only-export-components -- Intentional: exports toggleVariants for external styling */
export { Toggle, toggleVariants };
