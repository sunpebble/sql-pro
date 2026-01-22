// CommandDialog is kept local because it depends on the local dialog component
// which has app-specific dependencies (stores/hooks)
// Other Command components should be imported directly from @sqlpro/ui/command
import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './dialog';

function CommandDialog({
  title = 'Command Palette',
  description = 'Search for a command to run...',
  children,
  className,
  showCloseButton = false,
  ...props
}: Omit<React.ComponentProps<typeof Dialog>, 'children'> & {
  title?: string;
  description?: string;
  className?: string;
  showCloseButton?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn(
          'ring-primary/20 overflow-hidden rounded-none! p-0',
          className
        )}
        showCloseButton={showCloseButton}
        decorated
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}

export { CommandDialog };
