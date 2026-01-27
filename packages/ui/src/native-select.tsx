'use client';

import { ChevronDownIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from './lib/utils';

interface NativeSelectProps extends Omit<
  React.ComponentProps<'select'>,
  'size'
> {
  /**
   * Size variant of the select
   */
  selectSize?: 'sm' | 'default';
}

function NativeSelect({
  className,
  selectSize = 'default',
  children,
  ...props
}: NativeSelectProps) {
  return (
    <div data-slot="native-select-wrapper" className="relative">
      <select
        data-slot="native-select"
        data-size={selectSize}
        className={cn(
          // Base styles
          'border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50',
          'flex w-full cursor-pointer appearance-none rounded-md border pr-8 text-sm transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-[3px]',
          // Dark mode
          'dark:bg-input/30 dark:hover:bg-input/50',
          // Size variants
          'data-[size=default]:h-9 data-[size=default]:px-3 data-[size=default]:py-2',
          'data-[size=sm]:h-8 data-[size=sm]:px-2 data-[size=sm]:py-1.5 data-[size=sm]:text-xs',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon
        data-slot="native-select-icon"
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2"
      />
    </div>
  );
}

interface NativeSelectOptionProps extends React.ComponentProps<'option'> {}

function NativeSelectOption({ className, ...props }: NativeSelectOptionProps) {
  return (
    <option
      data-slot="native-select-option"
      className={cn('bg-background text-foreground', className)}
      {...props}
    />
  );
}

interface NativeSelectGroupProps extends React.ComponentProps<'optgroup'> {}

function NativeSelectGroup({ className, ...props }: NativeSelectGroupProps) {
  return (
    <optgroup
      data-slot="native-select-group"
      className={cn('bg-background text-foreground font-medium', className)}
      {...props}
    />
  );
}

export { NativeSelect, NativeSelectGroup, NativeSelectOption };
export type {
  NativeSelectGroupProps,
  NativeSelectOptionProps,
  NativeSelectProps,
};
