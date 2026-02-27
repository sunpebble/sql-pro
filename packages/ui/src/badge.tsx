import type { VariantProps } from 'class-variance-authority';
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva } from 'class-variance-authority';

import { cn } from './lib/utils';

const badgeVariants = cva(
  'h-6 gap-1 rounded-full border border-border px-2 py-0.5 font-bold transition-all has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3! inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 overflow-hidden group/badge [font-size:calc(var(--font-ui-size,14px)*0.75)] shadow-sm duration-150',
  {
    variants: {
      variant: {
        default: 'bg-main text-main-foreground border-transparent',
        secondary: 'bg-secondary text-secondary-foreground border-transparent',
        destructive: 'bg-destructive text-white border-transparent',
        outline: 'bg-background text-foreground',
        ghost: 'border-transparent bg-muted text-muted-foreground shadow-none',
        link: 'text-main underline-offset-4 hover:underline border-transparent shadow-none',
        // Semantic status variants
        success: 'bg-success text-white border-transparent',
        warning: 'bg-warning text-white border-transparent',
        info: 'bg-info text-white border-transparent',
        // Type category variants
        numeric:
          'bg-type-numeric-bg text-type-numeric border-type-numeric shadow-none',
        date: 'bg-type-date-bg text-type-date border-type-date shadow-none',
        boolean:
          'bg-type-boolean-bg text-type-boolean border-type-boolean shadow-none',
        text: 'bg-type-text-bg text-type-text border-type-text shadow-none',
        unknown:
          'bg-type-unknown-bg text-type-unknown border-type-unknown shadow-none',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({
  className,
  variant = 'default',
  render,
  ...props
}: useRender.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      {
        className: cn(badgeVariants({ className, variant })),
      },
      props
    ),
    render,
    state: {
      slot: 'badge',
      variant,
    },
  });
}

/* eslint-disable react-refresh/only-export-components -- Intentional: exports variant utility */
export { Badge, badgeVariants };
