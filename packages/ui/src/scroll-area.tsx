import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area';
import * as React from 'react';

import { cn } from './lib/utils';

interface ScrollAreaProps extends ScrollAreaPrimitive.Root.Props {
  viewportRef?: React.RefObject<HTMLDivElement | null>;
  /** Scroll orientation: 'vertical', 'horizontal', or 'both' (default) */
  orientation?: 'vertical' | 'horizontal' | 'both';
  /** Tab index for keyboard focus - applied to viewport for proper focus handling */
  tabIndex?: number;
}

function ScrollArea({
  className,
  children,
  viewportRef,
  orientation = 'both',
  tabIndex,
  ...props
}: ScrollAreaProps) {
  // Compute overflow style based on orientation
  // We need to use inline style because base-ui ScrollArea sets overflow: scroll by default
  const overflowStyle = React.useMemo(() => {
    switch (orientation) {
      case 'horizontal':
        return { overflowX: 'auto' as const, overflowY: 'hidden' as const };
      case 'vertical':
        return { overflowX: 'hidden' as const, overflowY: 'auto' as const };
      default:
        return { overflow: 'auto' as const };
    }
  }, [orientation]);

  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        tabIndex={tabIndex}
        data-slot="scroll-area-viewport"
        className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
        style={overflowStyle}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      {/* Only render scrollbars for the specified orientation */}
      {(orientation === 'vertical' || orientation === 'both') && (
        <ScrollBar orientation="vertical" />
      )}
      {(orientation === 'horizontal' || orientation === 'both') && (
        <ScrollBar orientation="horizontal" />
      )}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({
  className,
  orientation = 'vertical',
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        'flex touch-none p-px transition-colors select-none data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2.5 data-vertical:border-l data-vertical:border-l-transparent data-[scrollable=false]:hidden',
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="bg-border relative flex-1 rounded-full"
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export { ScrollArea, ScrollBar };
export type { ScrollAreaProps };
