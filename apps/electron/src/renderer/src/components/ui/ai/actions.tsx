'use client';

import type { ComponentProps } from 'react';
import { Button } from '@quarry/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@quarry/ui/tooltip';
import { memo } from 'react';
import { cn } from '@/lib/utils';

export type ActionsProps = ComponentProps<'div'>;

export const Actions = memo(
  ({ className, children, ...props }: ActionsProps) => (
    <div
      className={cn(
        'flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

export type ActionProps = ComponentProps<typeof Button> & {
  tooltip?: string;
};

export const Action = memo(
  ({ className, tooltip, children, ...props }: ActionProps) => {
    const button = (
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-6 w-6', className)}
        {...props}
      >
        {children}
      </Button>
    );

    if (tooltip) {
      return (
        <Tooltip>
          <TooltipTrigger>{button}</TooltipTrigger>
          <TooltipContent side="top">{tooltip}</TooltipContent>
        </Tooltip>
      );
    }

    return button;
  }
);

Actions.displayName = 'Actions';
Action.displayName = 'Action';
