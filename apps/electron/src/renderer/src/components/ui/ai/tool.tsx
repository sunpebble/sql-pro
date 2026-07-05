'use client';

import type { ComponentProps } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@quarry/ui/collapsible';
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleDotIcon,
  Loader2Icon,
  WrenchIcon,
  XCircleIcon,
} from 'lucide-react';
import { memo } from 'react';
import { cn } from '@/lib/utils';

export type ToolState =
  | 'input-streaming'
  | 'input-available'
  | 'output-streaming'
  | 'output-available'
  | 'output-error';

export type ToolProps = ComponentProps<typeof Collapsible>;

export const Tool = memo(({ className, children, ...props }: ToolProps) => (
  <Collapsible
    className={cn('bg-muted/50 my-2 rounded-md border', className)}
    {...props}
  >
    {children}
  </Collapsible>
));

export type ToolHeaderProps = Omit<
  ComponentProps<typeof CollapsibleTrigger>,
  'type'
> & {
  state: ToolState;
  toolType: string;
};

const stateConfig: Record<
  ToolState,
  { icon: typeof Loader2Icon; className: string; text: string }
> = {
  'input-streaming': {
    icon: Loader2Icon,
    className: 'text-muted-foreground animate-spin',
    text: 'Preparing...',
  },
  'input-available': {
    icon: CircleDotIcon,
    className: 'text-blue-500',
    text: 'Ready',
  },
  'output-streaming': {
    icon: Loader2Icon,
    className: 'text-blue-500 animate-spin',
    text: 'Running...',
  },
  'output-available': {
    icon: CheckCircle2Icon,
    className: 'text-green-500',
    text: 'Completed',
  },
  'output-error': {
    icon: XCircleIcon,
    className: 'text-red-500',
    text: 'Error',
  },
};

const TOOL_NAME_PREFIX_RE = /^tool[_-]?/i;
const UNDERSCORE_RE = /_/g;

export const ToolHeader = memo(
  ({ className, state, toolType, ...props }: ToolHeaderProps) => {
    const config = stateConfig[state] || stateConfig['input-streaming'];
    const Icon = config.icon;
    const toolName = toolType
      .replace(TOOL_NAME_PREFIX_RE, '')
      .replace(UNDERSCORE_RE, ' ');

    return (
      <CollapsibleTrigger
        className={cn(
          'text-muted-foreground hover:text-foreground flex w-full items-center gap-1.5 px-2 py-1.5 transition-colors',
          className
        )}
        {...props}
      >
        <ChevronDownIcon className="h-3 w-3 transition-transform data-[state=closed]:-rotate-90" />
        <WrenchIcon className="h-3 w-3" />
        <span className="font-medium capitalize">{toolName}</span>
        <span
          className={cn('ml-auto flex items-center gap-1', config.className)}
        >
          <Icon className="h-3 w-3" />
          <span>{config.text}</span>
        </span>
      </CollapsibleTrigger>
    );
  }
);

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>;

export const ToolContent = memo(
  ({ className, children, ...props }: ToolContentProps) => (
    <CollapsibleContent
      className={cn('border-t px-3 py-2', className)}
      {...props}
    >
      {children}
    </CollapsibleContent>
  )
);

export type ToolInputProps = ComponentProps<'div'> & {
  input: unknown;
};

export const ToolInput = memo(
  ({ className, input, ...props }: ToolInputProps) => {
    if (input === undefined || input === null) return null;
    const isEmpty =
      typeof input === 'object' && Object.keys(input as object).length === 0;
    if (isEmpty) return null;

    return (
      <div className={cn('mb-2', className)} {...props}>
        <span className="text-muted-foreground font-medium">Input:</span>
        <pre className="bg-muted mt-1 overflow-x-auto rounded p-2 font-mono">
          {JSON.stringify(input, null, 2)}
        </pre>
      </div>
    );
  }
);

export type ToolOutputProps = ComponentProps<'div'> & {
  output?: React.ReactNode;
  errorText?: string;
};

export const ToolOutput = memo(
  ({ className, output, errorText, ...props }: ToolOutputProps) => {
    if (errorText) {
      return (
        <div className={cn('text-red-500', className)} {...props}>
          <span className="font-medium">Error:</span> {errorText}
        </div>
      );
    }

    if (output === undefined || output === null) return null;

    return (
      <div className={className} {...props}>
        <span className="text-muted-foreground font-medium">Output:</span>
        <div className="mt-1">{output}</div>
      </div>
    );
  }
);

Tool.displayName = 'Tool';
ToolHeader.displayName = 'ToolHeader';
ToolContent.displayName = 'ToolContent';
ToolInput.displayName = 'ToolInput';
ToolOutput.displayName = 'ToolOutput';
