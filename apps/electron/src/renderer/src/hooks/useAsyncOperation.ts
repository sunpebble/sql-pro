import { useCallback, useRef, useState } from 'react';

/**
 * Options for useAsyncOperation hook
 */
export interface UseAsyncOperationOptions<T> {
  /** Number of retry attempts on failure (default: 0) */
  retries?: number;
  /** Delay between retries in milliseconds (default: 1000) */
  retryDelay?: number;
  /** Callback when operation succeeds */
  onSuccess?: (data: T) => void;
  /** Callback when operation fails after all retries */
  onError?: (error: Error) => void;
  /** Initial data value */
  initialData?: T;
}

/**
 * State returned by useAsyncOperation hook
 */
export interface UseAsyncOperationState<T> {
  /** The data returned from the async operation */
  data: T | null;
  /** Whether the operation is currently loading */
  loading: boolean;
  /** Error from the last failed operation */
  error: Error | null;
  /** Number of retry attempts made */
  retryCount: number;
}

/**
 * Result returned by useAsyncOperation hook
 */
export interface UseAsyncOperationResult<
  T,
  P extends unknown[],
> extends UseAsyncOperationState<T> {
  /** Execute the async operation with given parameters */
  execute: (...params: P) => Promise<T | null>;
  /** Cancel the current operation */
  cancel: () => void;
  /** Reset state to initial values */
  reset: () => void;
  /** Whether the operation was cancelled */
  isCancelled: boolean;
}

/**
 * Delay utility function
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Hook for managing async operations with loading, error, and retry support.
 *
 * @example
 * ```typescript
 * const { data, loading, error, execute, reset } = useAsyncOperation(
 *   async (userId: string) => await fetchUser(userId),
 *   { retries: 3, retryDelay: 1000 }
 * );
 *
 * // Execute the operation
 * await execute('user-123');
 *
 * // Reset state
 * reset();
 * ```
 *
 * @param asyncFn - The async function to execute
 * @param options - Configuration options
 * @returns Object containing state and control functions
 */
export function useAsyncOperation<T, P extends unknown[] = []>(
  asyncFn: (...params: P) => Promise<T>,
  options: UseAsyncOperationOptions<T> = {}
): UseAsyncOperationResult<T, P> {
  const {
    retries = 0,
    retryDelay = 1000,
    onSuccess,
    onError,
    initialData = null,
  } = options;

  const [state, setState] = useState<UseAsyncOperationState<T>>({
    data: initialData as T | null,
    loading: false,
    error: null,
    retryCount: 0,
  });

  const [isCancelled, setIsCancelled] = useState(false);

  // Use refs to track cancellation and current operation
  const cancelledRef = useRef(false);
  const operationIdRef = useRef(0);

  /**
   * Execute the async operation with automatic retry support
   */
  const execute = useCallback(
    async (...params: P): Promise<T | null> => {
      // Increment operation ID to track this specific execution
      const currentOperationId = ++operationIdRef.current;
      cancelledRef.current = false;
      setIsCancelled(false);

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        retryCount: 0,
      }));

      let lastError: Error | null = null;
      let attempt = 0;

      while (attempt <= retries) {
        // Check if cancelled before each attempt
        if (
          cancelledRef.current ||
          operationIdRef.current !== currentOperationId
        ) {
          return null;
        }

        try {
          const result = await asyncFn(...params);

          // Check if cancelled or superseded after async operation
          if (
            cancelledRef.current ||
            operationIdRef.current !== currentOperationId
          ) {
            return null;
          }

          setState({
            data: result,
            loading: false,
            error: null,
            retryCount: attempt,
          });

          onSuccess?.(result);
          return result;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));

          // Check if cancelled before retry
          if (
            cancelledRef.current ||
            operationIdRef.current !== currentOperationId
          ) {
            return null;
          }

          // Update retry count
          if (attempt < retries) {
            setState((prev) => ({
              ...prev,
              retryCount: attempt + 1,
            }));

            // Wait before retrying
            await delay(retryDelay);
          }

          attempt++;
        }
      }

      // All retries exhausted
      if (
        !cancelledRef.current &&
        operationIdRef.current === currentOperationId
      ) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: lastError,
          retryCount: retries,
        }));

        if (lastError) {
          onError?.(lastError);
        }
      }

      return null;
    },
    [asyncFn, retries, retryDelay, onSuccess, onError]
  );

  /**
   * Cancel the current operation
   */
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setIsCancelled(true);
    setState((prev) => ({
      ...prev,
      loading: false,
    }));
  }, []);

  /**
   * Reset state to initial values
   */
  const reset = useCallback(() => {
    cancelledRef.current = true;
    operationIdRef.current++;
    setIsCancelled(false);
    setState({
      data: initialData as T | null,
      loading: false,
      error: null,
      retryCount: 0,
    });
  }, [initialData]);

  return {
    ...state,
    execute,
    cancel,
    reset,
    isCancelled,
  };
}

export default useAsyncOperation;
