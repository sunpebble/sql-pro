'use client';

import type { ComponentProps } from 'react';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@sqlpro/ui/collapsible';
import { BrainIcon, ChevronDownIcon, Loader2 } from 'lucide-react';
import { createContext, memo, use, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ReasoningContextValue {
  isStreaming: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  duration: number;
}

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

const useReasoningContext = () => {
  const context = use(ReasoningContext);
  if (!context) {
    throw new Error('Reasoning components must be used within Reasoning');
  }
  return context;
};

export type ReasoningProps = ComponentProps<typeof Collapsible> & {
  isStreaming?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
};

const AUTO_CLOSE_DELAY = 1000;

export const Reasoning = memo(
  ({
    className,
    isStreaming = false,
    open,
    defaultOpen = false,
    onOpenChange,
    duration: durationProp,
    children,
    ...props
  }: ReasoningProps) => {
    const [isOpen, setIsOpen] = useControllableState({
      prop: open,
      defaultProp: defaultOpen,
      onChange: onOpenChange,
    });
    const [duration, setDuration] = useControllableState({
      prop: durationProp,
      defaultProp: 0,
    });

    const [hasAutoClosedRef, setHasAutoClosedRef] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);

    useEffect(() => {
      if (isStreaming) {
        if (startTime === null) {
          /* eslint-disable-next-line react/set-state-in-effect -- Timer state management */
          setStartTime(Date.now());
        }
      } else if (startTime !== null) {
         
        setDuration(Math.round((Date.now() - startTime) / 1000));
        /* eslint-disable-next-line react/set-state-in-effect -- Timer state management */
        setStartTime(null);
      }
    }, [isStreaming, startTime, setDuration]);

    useEffect(() => {
      if (isStreaming && !isOpen) {
         
        setIsOpen(true);
        return;
      }
      if (!isStreaming && isOpen && !defaultOpen && !hasAutoClosedRef) {
        const timer = setTimeout(() => {
          setIsOpen(false);
          setHasAutoClosedRef(true);
        }, AUTO_CLOSE_DELAY);
        return () => clearTimeout(timer);
      }
      return undefined;
    }, [isStreaming, isOpen, defaultOpen, setIsOpen, hasAutoClosedRef]);

    const handleOpenChange = (newOpen: boolean) => {
      setIsOpen(newOpen);
    };

    return (
      <ReasoningContext
        value={{
          isStreaming,
          isOpen: isOpen ?? false,
          setIsOpen,
          duration: duration ?? 0,
        }}
      >
        <Collapsible
          className={cn(
            'not-prose rounded-base border-border bg-muted my-2 border',
            isStreaming && 'border-primary/50',
            className
          )}
          onOpenChange={handleOpenChange}
          open={isOpen}
          {...props}
        >
          {children}
        </Collapsible>
      </ReasoningContext>
    );
  }
);

export type ReasoningTriggerProps = ComponentProps<
  typeof CollapsibleTrigger
> & {
  title?: string;
};

export const ReasoningTrigger = memo(
  ({
    className,
    title = 'Thinking',
    children,
    ...props
  }: ReasoningTriggerProps) => {
    const { isStreaming, isOpen, duration } = useReasoningContext();

    return (
      <CollapsibleTrigger
        className={cn(
          'hover:bg-primary/5 flex w-full items-center gap-2 px-3 py-2 transition-colors',
          className
        )}
        {...props}
      >
        {children ?? (
          <>
            <ChevronDownIcon
              className={cn(
                'text-primary h-3.5 w-3.5 transition-transform',
                isOpen ? 'rotate-0' : '-rotate-90'
              )}
            />
            <BrainIcon className="text-primary h-3.5 w-3.5" />
            <span className="text-primary font-medium">
              {isStreaming || duration === 0
                ? title
                : `Thought for ${duration}s`}
            </span>
            {isStreaming && (
              <Loader2 className="text-primary ml-1 h-3 w-3 animate-spin" />
            )}
          </>
        )}
      </CollapsibleTrigger>
    );
  }
);

export type ReasoningContentProps = ComponentProps<
  typeof CollapsibleContent
> & {
  children: string;
};

export const ReasoningContent = memo(
  ({ className, children, ...props }: ReasoningContentProps) => {
    const { isStreaming } = useReasoningContext();

    return (
      <CollapsibleContent
        className={cn(
          'border-border border-t px-3 py-2.5',
          'data-[state=closed]:animate-out data-[state=open]:animate-in',
          className
        )}
        {...props}
      >
        <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {children}
          {isStreaming && (
            <span className="bg-primary ml-0.5 inline-block h-3 w-0.5 animate-pulse" />
          )}
        </div>
      </CollapsibleContent>
    );
  }
);

Reasoning.displayName = 'Reasoning';
ReasoningTrigger.displayName = 'ReasoningTrigger';
ReasoningContent.displayName = 'ReasoningContent';
