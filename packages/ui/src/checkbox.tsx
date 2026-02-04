import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';

import { CheckIcon } from 'lucide-react';
import { cn } from './lib/utils';

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'border-border bg-background data-checked:bg-main data-checked:text-main-foreground data-checked:border-border peer relative flex size-5 shrink-0 items-center justify-center rounded-[3px] border-2 transition-all outline-none',
        'focus-visible:ring-main focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive',
        'group-has-disabled/field:opacity-50',
        'after:absolute after:-inset-x-3 after:-inset-y-2',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-transform duration-100 data-checked:scale-100 data-unchecked:scale-0 [&>svg]:size-3.5"
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
