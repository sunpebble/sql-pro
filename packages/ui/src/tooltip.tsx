'use client';

import type { HTMLAttributes, ReactElement } from 'react';
import { mergeProps } from '@base-ui/react/merge-props';
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';
import { cloneElement, isValidElement } from 'react';

import { cn } from './lib/utils';

function TooltipProvider({
  delay = 300,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delay={delay}
      {...props}
    />
  );
}

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  );
}

function TooltipTrigger({
  render,
  children,
  ...props
}: TooltipPrimitive.Trigger.Props) {
  // If render is provided, use it directly
  if (render) {
    return (
      <TooltipPrimitive.Trigger
        data-slot="tooltip-trigger"
        render={render}
        {...props}
      />
    );
  }

  // If children is a valid React element, use render function to properly merge props
  // This ensures onClick and other event handlers on the child are preserved
  if (isValidElement(children)) {
    const childElement = children as ReactElement<HTMLAttributes<HTMLElement>>;
    return (
      <TooltipPrimitive.Trigger
        data-slot="tooltip-trigger"
        render={(triggerProps) =>
          // eslint-disable-next-line react/no-clone-element -- Required for tooltip trigger composition with existing elements
          cloneElement(
            childElement,
            mergeProps(triggerProps, childElement.props)
          )
        }
        {...props}
      />
    );
  }

  // Fallback: pass children directly (may cause nested button issues)
  return (
    <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props}>
      {children}
    </TooltipPrimitive.Trigger>
  );
}

function TooltipContent({
  className,
  side = 'top',
  sideOffset = 4,
  align = 'center',
  alignOffset = 0,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    'align' | 'alignOffset' | 'side' | 'sideOffset'
  >) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit max-w-xs origin-(--transform-origin) rounded-lg px-3 py-1.5 [font-size:calc(var(--font-ui-size,14px)*0.75)] font-bold',
            'bg-foreground text-background',
            className
          )}
          {...props}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
