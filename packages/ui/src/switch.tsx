'use client';

import { Switch as SwitchPrimitive } from '@base-ui/react/switch';

import { cn } from './lib/utils';

function Switch({
  className,
  size = 'default',
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: 'sm' | 'default';
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        'data-checked:bg-main data-unchecked:bg-muted peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all duration-150 outline-none',
        'focus-visible:ring-main focus-visible:ring-2 focus-visible:ring-offset-2',
        'aria-invalid:border-destructive',
        'data-disabled:cursor-not-allowed data-disabled:opacity-50',
        'after:absolute after:-inset-x-3 after:-inset-y-2',
        'data-[size=default]:h-6 data-[size=default]:w-10 data-[size=sm]:h-5 data-[size=sm]:w-8',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="bg-background pointer-events-none block rounded-full ring-0 transition-transform group-data-[size=default]/switch:size-5 group-data-[size=sm]/switch:size-4 group-data-[size=default]/switch:data-checked:translate-x-4 group-data-[size=sm]/switch:data-checked:translate-x-3 group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
