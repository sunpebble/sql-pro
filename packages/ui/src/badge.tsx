import type { VariantProps } from 'class-variance-authority';
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva } from 'class-variance-authority';

import { cn } from './lib/utils';

const badgeVariants = cva(
  'h-6 gap-1 rounded-[3px] border-2 border-border px-2 py-0.5 text-xs font-bold transition-all has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-3! inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2 overflow-hidden group/badge',
  {
    variants: {
      variant: {
        default:
          'bg-main text-main-foreground shadow-[2px_2px_0px_0px_var(--border)]',
        secondary:
          'bg-secondary text-secondary-foreground shadow-[2px_2px_0px_0px_var(--border)]',
        destructive:
          'bg-destructive text-white shadow-[2px_2px_0px_0px_var(--border)]',
        outline:
          'bg-background text-foreground shadow-[2px_2px_0px_0px_var(--border)]',
        ghost: 'border-transparent bg-muted text-muted-foreground',
        link: 'text-main underline-offset-4 hover:underline border-transparent',
        // Semantic status variants
        success: 'bg-success text-white shadow-[2px_2px_0px_0px_var(--border)]',
        warning: 'bg-warning text-white shadow-[2px_2px_0px_0px_var(--border)]',
        info: 'bg-info text-white shadow-[2px_2px_0px_0px_var(--border)]',
        // Type category variants
        numeric: 'bg-type-numeric-bg text-type-numeric border-type-numeric',
        date: 'bg-type-date-bg text-type-date border-type-date',
        boolean: 'bg-type-boolean-bg text-type-boolean border-type-boolean',
        text: 'bg-type-text-bg text-type-text border-type-text',
        unknown: 'bg-type-unknown-bg text-type-unknown border-type-unknown',
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
