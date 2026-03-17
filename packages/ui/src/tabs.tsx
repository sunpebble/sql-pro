'use client';

import type { VariantProps } from 'class-variance-authority';
import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import { cva } from 'class-variance-authority';

import { cn } from './lib/utils';

function Tabs({
  className,
  orientation = 'horizontal',
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        'group/tabs flex data-[orientation=horizontal]:flex-col',
        className
      )}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  'rounded-md p-1 group-data-horizontal/tabs:h-10 data-[variant=line]:rounded-none data-[variant=line]:p-0 data-[variant=line]:gap-0 group/tabs-list text-muted-foreground inline-flex w-fit items-center justify-center gap-1 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col',
  {
    variants: {
      variant: {
        default: 'bg-muted border border-border',
        line: 'bg-transparent border-b border-border',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function TabsList({
  className,
  variant = 'default',
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, style, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        'focus-visible:ring-main text-foreground/60 hover:text-foreground relative inline-flex h-[calc(100%-4px)] flex-1 items-center justify-center gap-1.5 rounded-sm border border-transparent px-3 py-1 font-bold whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2',
        'group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start',
        'disabled:pointer-events-none disabled:opacity-50',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Default variant active state
        'group-data-[variant=default]/tabs-list:data-active:bg-background group-data-[variant=default]/tabs-list:data-active:border-border data-active:text-foreground',
        // Line variant
        'group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:border-0 group-data-[variant=line]/tabs-list:border-b group-data-[variant=line]/tabs-list:border-transparent',
        'group-data-[variant=line]/tabs-list:data-active:border-main group-data-[variant=line]/tabs-list:data-active:bg-transparent',
        className
      )}
      style={{ fontSize: 'var(--font-ui-size, 14px)', ...style }}
      {...props}
    />
  );
}

function TabsContent({
  className,
  style,
  ...props
}: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn(
        'mt-2 flex-1 font-medium outline-none',
        'data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-1 duration-150',
        className
      )}
      style={{ fontSize: 'var(--font-ui-size, 14px)', ...style }}
      {...props}
    />
  );
}

/* eslint-disable react-refresh/only-export-components -- Intentional: exports tabsListVariants for external styling */
export { Tabs, TabsContent, TabsList, tabsListVariants, TabsTrigger };
