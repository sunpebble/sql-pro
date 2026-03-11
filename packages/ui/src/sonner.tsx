'use client';

import { XIcon } from 'lucide-react';
import { Toaster as Sonner, toast } from 'sonner';

import { cn } from './lib/utils';

type ToasterProps = React.ComponentProps<typeof Sonner>;

function Toaster({ className, toastOptions, ...props }: ToasterProps) {
  return (
    <Sonner
      className={cn('toaster group', className)}
      toastOptions={{
        classNames: {
          toast: cn(
            'group toast',
            'bg-background text-foreground',
            'group-[.toaster]:rounded-lg group-[.toaster]:p-4',
            toastOptions?.classNames?.toast
          ),
          title: cn(
            'group-[.toast]:font-medium group-[.toast]:text-foreground',
            toastOptions?.classNames?.title
          ),
          description: cn(
            'group-[.toast]:text-muted-foreground group-[.toast]:[font-size:var(--font-ui-size,14px)]',
            toastOptions?.classNames?.description
          ),
          actionButton: cn(
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
            'group-[.toast]:hover:bg-primary/90',
            'group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:[font-size:var(--font-ui-size,14px)] group-[.toast]:font-medium',
            toastOptions?.classNames?.actionButton
          ),
          cancelButton: cn(
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
            'group-[.toast]:hover:bg-muted/80',
            'group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:[font-size:var(--font-ui-size,14px)] group-[.toast]:font-medium',
            toastOptions?.classNames?.cancelButton
          ),
          closeButton: cn(
            'group-[.toast]:bg-background group-[.toast]:text-muted-foreground',
            'group-[.toast]:hover:bg-muted group-[.toast]:hover:text-foreground',
            'group-[.toast]:rounded-full group-[.toast]:p-1',
            toastOptions?.classNames?.closeButton
          ),
          success: cn(
            'group-[.toaster]:border-success/20 group-[.toaster]:bg-success/5',
            'group-[.toaster]:text-success [&_[data-icon]]:text-success',
            toastOptions?.classNames?.success
          ),
          error: cn(
            'group-[.toaster]:border-destructive/20 group-[.toaster]:bg-destructive/5',
            'group-[.toaster]:text-destructive [&_[data-icon]]:text-destructive',
            toastOptions?.classNames?.error
          ),
          warning: cn(
            'group-[.toaster]:border-warning/20 group-[.toaster]:bg-warning/5',
            'group-[.toaster]:text-warning [&_[data-icon]]:text-warning',
            toastOptions?.classNames?.warning
          ),
          info: cn(
            'group-[.toaster]:border-info/20 group-[.toaster]:bg-info/5',
            'group-[.toaster]:text-info [&_[data-icon]]:text-info',
            toastOptions?.classNames?.info
          ),
          loading: cn(
            'group-[.toaster]:text-muted-foreground',
            toastOptions?.classNames?.loading
          ),
        },
        ...toastOptions,
      }}
      icons={{
        close: <XIcon className="size-4" />,
      }}
      {...props}
    />
  );
}

export { Toaster };
/* eslint-disable react-refresh/only-export-components -- Intentional: re-exports toast function from sonner library */
export { toast };
export type { ToasterProps };
