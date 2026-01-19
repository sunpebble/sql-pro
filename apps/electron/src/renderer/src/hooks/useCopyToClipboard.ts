import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export interface CopyOptions {
  /** Custom success message to display in toast */
  successMessage?: string;
  /** Custom error message to display in toast */
  errorMessage?: string;
  /** Duration in ms before copied state resets (default: 2000) */
  resetDelay?: number;
  /** Whether to show toast notifications (default: true) */
  showToast?: boolean;
}

export interface UseCopyToClipboardResult {
  /** Copy text to clipboard */
  copy: (text: string, options?: CopyOptions) => Promise<boolean>;
  /** Whether the copy was successful (resets after delay) */
  copied: boolean;
  /** Reset the copied state manually */
  reset: () => void;
}

/**
 * Hook for copying text to clipboard with toast notifications and copied state management.
 *
 * @example
 * ```tsx
 * const { copy, copied } = useCopyToClipboard();
 *
 * // Basic usage
 * await copy('Hello, World!');
 *
 * // With custom success message
 * await copy(text, { successMessage: 'URL copied!' });
 *
 * // Without toast notifications
 * await copy(text, { showToast: false });
 *
 * // Use copied state for UI feedback
 * <Button>{copied ? 'Copied!' : 'Copy'}</Button>
 * ```
 */
export function useCopyToClipboard(): UseCopyToClipboardResult {
  const { t } = useTranslation('common');
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setCopied(false);
  }, []);

  const copy = useCallback(
    async (text: string, options: CopyOptions = {}): Promise<boolean> => {
      const {
        successMessage = t('clipboard.copied'),
        errorMessage = t('clipboard.copyFailed'),
        resetDelay = 2000,
        showToast = true,
      } = options;

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);

        if (showToast) {
          toast.success(successMessage);
        }

        // Auto-reset copied state after delay
        timeoutRef.current = setTimeout(() => {
          setCopied(false);
          timeoutRef.current = null;
        }, resetDelay);

        return true;
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);

        if (showToast) {
          toast.error(errorMessage);
        }

        return false;
      }
    },
    [t]
  );

  return {
    copy,
    copied,
    reset,
  };
}
