import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Options for debounce behavior
 */
export interface DebounceOptions {
  /**
   * If true, invoke the callback on the leading edge of the timeout.
   * @default false
   */
  leading?: boolean;
  /**
   * If true, invoke the callback on the trailing edge of the timeout.
   * @default true
   */
  trailing?: boolean;
  /**
   * The maximum time the callback can be delayed before it's invoked.
   * @default undefined (no max wait)
   */
  maxWait?: number;
}

/**
 * Interface for the debounced callback function with control methods
 */
export interface DebouncedCallback<T extends (...args: unknown[]) => unknown> {
  (...args: Parameters<T>): void;
  /**
   * Cancels any pending invocation
   */
  cancel: () => void;
  /**
   * Immediately invokes any pending callback
   */
  flush: () => void;
  /**
   * Returns true if there is a pending invocation
   */
  isPending: () => boolean;
}

/**
 * Hook that returns a debounced version of the provided value.
 * The debounced value will only update after the specified delay has passed
 * without any new value changes.
 *
 * @param value - The value to debounce
 * @param delay - The debounce delay in milliseconds
 * @param options - Optional configuration for leading/trailing behavior
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 *
 * useEffect(() => {
 *   // This effect runs only after searchTerm stops changing for 300ms
 *   performSearch(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce<T>(
  value: T,
  delay: number,
  options: Pick<DebounceOptions, 'leading' | 'trailing'> = {}
): T {
  const { leading = false, trailing = true } = options;
  const [debouncedValue, setDebouncedValue] = useState<T>(() =>
    leading ? value : value
  );
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const lastValueRef = useRef<T>(value);

  // Sync debounced value when value changes
  useEffect(() => {
    lastValueRef.current = value;

    // Handle leading edge on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (leading) {
        // Leading edge: update immediately on first render
        // This is intentional - we want to sync state on mount
        // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
        setDebouncedValue(value);
      }
      if (!trailing) {
        return;
      }
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for trailing edge
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(lastValueRef.current);
        timeoutRef.current = null;
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay, leading, trailing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedValue;
}

/**
 * Hook that returns a debounced version of the provided callback function.
 * The callback will only be invoked after the specified delay has passed
 * without any new calls.
 *
 * @param callback - The callback function to debounce
 * @param delay - The debounce delay in milliseconds
 * @param options - Optional configuration for leading/trailing/maxWait behavior
 * @returns A debounced callback with cancel, flush, and isPending methods
 *
 * @example
 * ```tsx
 * const debouncedSave = useDebouncedCallback(
 *   (data: FormData) => saveData(data),
 *   500,
 *   { leading: false, trailing: true }
 * );
 *
 * // Call the debounced function
 * debouncedSave(formData);
 *
 * // Cancel pending invocation
 * debouncedSave.cancel();
 *
 * // Immediately invoke pending callback
 * debouncedSave.flush();
 *
 * // Check if there's a pending invocation
 * if (debouncedSave.isPending()) {
 *   console.log('Save is pending...');
 * }
 * ```
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
  options: DebounceOptions = {}
): DebouncedCallback<T> {
  const { leading = false, trailing = true, maxWait } = options;

  // Use refs to always have access to the latest values
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWaitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);
  const lastCallTimeRef = useRef<number | null>(null);
  const lastInvokeTimeRef = useRef<number>(0);
  const pendingRef = useRef(false);

  // Update callback ref on each render
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  /**
   * Invoke the callback with the stored arguments
   */
  const invokeCallback = useCallback(() => {
    if (lastArgsRef.current !== null) {
      const args = lastArgsRef.current;
      lastArgsRef.current = null;
      lastInvokeTimeRef.current = Date.now();
      pendingRef.current = false;
      callbackRef.current(...args);
    }
  }, []);

  /**
   * Cancel any pending invocation
   */
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
      maxWaitTimeoutRef.current = null;
    }
    lastArgsRef.current = null;
    lastCallTimeRef.current = null;
    pendingRef.current = false;
  }, []);

  /**
   * Immediately invoke any pending callback
   */
  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
      maxWaitTimeoutRef.current = null;
    }
    if (pendingRef.current) {
      invokeCallback();
    }
  }, [invokeCallback]);

  /**
   * Check if there's a pending invocation
   */
  const isPending = useCallback(() => {
    return pendingRef.current;
  }, []);

  /**
   * The debounced function
   */
  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const isFirstCall = lastCallTimeRef.current === null;
      lastCallTimeRef.current = now;
      lastArgsRef.current = args;
      pendingRef.current = true;

      // Handle leading edge invocation
      if (leading && isFirstCall) {
        invokeCallback();
        // If trailing is false, we're done
        if (!trailing) {
          return;
        }
      }

      // Clear existing trailing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set up trailing edge timeout
      if (trailing) {
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null;
          // Only invoke if we haven't already invoked on leading edge
          // or if there have been subsequent calls
          if (!leading || lastArgsRef.current !== null) {
            invokeCallback();
          }
          lastCallTimeRef.current = null;
          // Clear maxWait timeout if it exists
          if (maxWaitTimeoutRef.current) {
            clearTimeout(maxWaitTimeoutRef.current);
            maxWaitTimeoutRef.current = null;
          }
        }, delay);
      }

      // Set up maxWait timeout if specified and not already set
      if (maxWait !== undefined && !maxWaitTimeoutRef.current) {
        const timeSinceLastInvoke = now - lastInvokeTimeRef.current;
        const remainingMaxWait = Math.max(0, maxWait - timeSinceLastInvoke);

        maxWaitTimeoutRef.current = setTimeout(() => {
          maxWaitTimeoutRef.current = null;
          // Clear the regular timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          invokeCallback();
          lastCallTimeRef.current = null;
        }, remainingMaxWait);
      }
    },
    [delay, leading, trailing, maxWait, invokeCallback]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxWaitTimeoutRef.current) {
        clearTimeout(maxWaitTimeoutRef.current);
      }
    };
  }, []);

  // Attach control methods to the debounced function
  const debouncedWithControls = useCallback(
    (...args: Parameters<T>) => debouncedCallback(...args),
    [debouncedCallback]
  ) as DebouncedCallback<T>;

  debouncedWithControls.cancel = cancel;
  debouncedWithControls.flush = flush;
  debouncedWithControls.isPending = isPending;

  return debouncedWithControls;
}
