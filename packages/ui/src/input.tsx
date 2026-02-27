import { Input as InputPrimitive } from '@base-ui/react/input';
import * as React from 'react';

import { cn } from './lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'bg-background border-border placeholder:text-muted-foreground h-10 w-full min-w-0 rounded-md border px-3 py-2 [font-size:var(--font-ui-size,14px)] font-medium shadow-sm transition-all duration-150 outline-none',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        'file:text-foreground file:inline-flex file:h-8 file:border-0 file:bg-transparent file:font-medium [&::file-selector-button]:[font-size:var(--font-ui-size,14px)]',
        className
      )}
      {...props}
    />
  );
}

export { Input };
