import { useCallback, useState } from 'react';

/**
 * Dialog state and controls returned by useDialog hook
 */
export interface UseDialogReturn<T = undefined> {
  /** Whether the dialog is currently open */
  isOpen: boolean;
  /** Data passed to the dialog when opened */
  data: T | undefined;
  /** Open the dialog, optionally with data */
  open: (data?: T) => void;
  /** Close the dialog */
  close: () => void;
  /** Toggle the dialog open/closed state */
  toggle: () => void;
  /** Handler for onOpenChange prop (compatible with Radix UI dialogs) */
  onOpenChange: (open: boolean) => void;
}

/**
 * Options for useDialog hook
 */
export interface UseDialogOptions<T = undefined> {
  /** Initial open state */
  defaultOpen?: boolean;
  /** Initial data */
  defaultData?: T;
  /** Callback when dialog closes */
  onClose?: (data: T | undefined) => void;
}

/**
 * Hook for managing dialog state with optional data passing
 *
 * @example Basic usage
 * ```tsx
 * const dialog = useDialog();
 * // dialog.open()
 * // dialog.close()
 * // dialog.isOpen
 * ```
 *
 * @example With data
 * ```tsx
 * interface UserData {
 *   id: string;
 *   name: string;
 * }
 * const dialog = useDialog<UserData>();
 * // dialog.open({ id: '1', name: 'John' })
 * // dialog.data?.name
 * ```
 *
 * @example With onClose callback
 * ```tsx
 * const dialog = useDialog<UserData>({
 *   onClose: (data) => console.log('Dialog closed with data:', data)
 * });
 * ```
 */
export function useDialog<T = undefined>(
  options: UseDialogOptions<T> = {}
): UseDialogReturn<T> {
  const { defaultOpen = false, defaultData, onClose } = options;

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [data, setData] = useState<T | undefined>(defaultData);

  const open = useCallback((newData?: T) => {
    setData(newData);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.(data);
  }, [data, onClose]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (prev) {
        onClose?.(data);
      }
      return !prev;
    });
  }, [data, onClose]);

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose?.(data);
      }
      setIsOpen(open);
    },
    [data, onClose]
  );

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
    onOpenChange,
  };
}

/**
 * Confirm dialog state and controls
 */
export interface UseConfirmDialogReturn<
  T = undefined,
> extends UseDialogReturn<T> {
  /** Confirm the dialog action */
  confirm: () => void;
  /** Cancel the dialog action */
  cancel: () => void;
  /** Whether the dialog was confirmed (true) or cancelled (false/undefined) */
  result: boolean | undefined;
}

/**
 * Options for useConfirmDialog hook
 */
export interface UseConfirmDialogOptions<
  T = undefined,
> extends UseDialogOptions<T> {
  /** Callback when dialog is confirmed */
  onConfirm?: (data: T | undefined) => void;
  /** Callback when dialog is cancelled */
  onCancel?: (data: T | undefined) => void;
}

/**
 * Hook for managing confirmation dialog state
 *
 * @example
 * ```tsx
 * const confirmDialog = useConfirmDialog({
 *   onConfirm: () => deleteItem(),
 *   onCancel: () => console.log('Cancelled')
 * });
 *
 * // In JSX:
 * <ConfirmDialog
 *   open={confirmDialog.isOpen}
 *   onOpenChange={confirmDialog.onOpenChange}
 *   onConfirm={confirmDialog.confirm}
 *   onCancel={confirmDialog.cancel}
 *   title="Delete Item"
 *   description="Are you sure?"
 * />
 * ```
 */
export function useConfirmDialog<T = undefined>(
  options: UseConfirmDialogOptions<T> = {}
): UseConfirmDialogReturn<T> {
  const { onConfirm, onCancel, ...dialogOptions } = options;

  const [result, setResult] = useState<boolean | undefined>(undefined);

  const baseDialog = useDialog<T>({
    ...dialogOptions,
    onClose: (data) => {
      dialogOptions.onClose?.(data);
    },
  });

  const confirm = useCallback(() => {
    setResult(true);
    onConfirm?.(baseDialog.data);
    baseDialog.close();
  }, [baseDialog, onConfirm]);

  const cancel = useCallback(() => {
    setResult(false);
    onCancel?.(baseDialog.data);
    baseDialog.close();
  }, [baseDialog, onCancel]);

  const open = useCallback(
    (data?: T) => {
      setResult(undefined);
      baseDialog.open(data);
    },
    [baseDialog]
  );

  return {
    ...baseDialog,
    open,
    confirm,
    cancel,
    result,
  };
}
