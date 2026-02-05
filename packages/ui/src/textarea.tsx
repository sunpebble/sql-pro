import * as React from 'react';

import { cn } from './lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'bg-background border-border placeholder:text-muted-foreground flex field-sizing-content min-h-20 w-full rounded-[5px] border-2 px-3 py-2 [font-size:var(--font-ui-size,14px)] font-medium transition-all outline-none',
        'focus-visible:ring-main focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
