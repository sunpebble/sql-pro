'use client';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { DecoFrame } from '@sqlpro/ui';
import { Button } from '@sqlpro/ui/button';

import { XIcon } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { getFontFamilyCSS } from '@/hooks/useApplyFont';
import { cn } from '@/lib/utils';
import { useUIFont } from '@/stores';

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  nativeButton = true,
  ...props
}: DialogPrimitive.Trigger.Props) {
  return (
    <DialogPrimitive.Trigger
      data-slot="dialog-trigger"
      nativeButton={nativeButton}
      {...props}
    />
  );
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs',
        className
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  decorated = false,
  style,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean;
  /** Enable Data Sanctum decorative corners */
  decorated?: boolean;
}) {
  const uiFont = useUIFont();
  const { t } = useTranslation('common');

  const content = (
    <DialogPrimitive.Popup
      data-slot="dialog-content"
      className={cn(
        'bg-background data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 ring-foreground/10 fixed top-1/2 left-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-6 rounded-xl p-6 text-sm ring-1 duration-100 outline-none sm:max-w-md',
        // Data Sanctum decorated style
        decorated && 'ring-gold/30 dark:ring-gold/20 rounded-none',
        className
      )}
      style={{
        fontFamily: getFontFamilyCSS(uiFont.family),
        fontSize: `${uiFont.size}px`,
        ...style,
      }}
      {...props}
    >
      {decorated && (
        <DecoFrame
          size="lg"
          variant="gold"
          className="pointer-events-none absolute inset-0 rounded-none opacity-40"
        />
      )}
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close
          data-slot="dialog-close"
          render={
            <Button
              variant="ghost"
              className="absolute top-4 right-4"
              size="icon-sm"
            />
          }
        >
          <XIcon />
          <span className="sr-only">{t('common.close')}</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Popup>
  );

  return (
    <DialogPortal>
      <DialogOverlay />
      {content}
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  showCloseButton?: boolean;
}) {
  const { t } = useTranslation('common');
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          {t('common.close')}
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('leading-none font-medium', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        'text-muted-foreground *:[a]:hover:text-foreground text-sm *:[a]:underline *:[a]:underline-offset-3',
        className
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
