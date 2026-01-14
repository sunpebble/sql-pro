import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Options for useLoadingState hook
 */
export interface UseLoadingStateOptions {
  /**
   * Default timeout in milliseconds for auto-stopping loading states.
   * Set to 0 to disable auto-timeout.
   * @default 0
   */
  defaultTimeout?: number;
}

/**
 * Options for starting a loading state
 */
export interface StartLoadingOptions {
  /**
   * Timeout in milliseconds after which the loading state will automatically stop.
   * Overrides the default timeout for this specific loading state.
   * Set to 0 to disable timeout for this specific state.
   */
  timeout?: number;
}

/**
 * Internal state for tracking a single loading entry
 */
interface LoadingEntry {
  /** Whether this loading state is active */
  active: boolean;
  /** Timestamp when loading started */
  startedAt: number;
  /** Timeout ID for auto-stop (if applicable) */
  timeoutId?: ReturnType<typeof setTimeout>;
}

/**
 * Result returned by useLoadingState hook
 */
export interface UseLoadingStateResult {
  /**
   * Start a loading state for the given key.
   * If the key is already loading, this will reset its timeout.
   *
   * @param key - Unique identifier for this loading state
   * @param options - Optional configuration for this loading state
   *
   * @example
   * ```ts
   * loading.start('save');
   * loading.start('fetch', { timeout: 5000 });
   * ```
   */
  start: (key: string, options?: StartLoadingOptions) => void;

  /**
   * Stop a loading state for the given key.
   *
   * @param key - Unique identifier for the loading state to stop
   *
   * @example
   * ```ts
   * loading.stop('save');
   * ```
   */
  stop: (key: string) => void;

  /**
   * Stop all active loading states.
   *
   * @example
   * ```ts
   * loading.stopAll();
   * ```
   */
  stopAll: () => void;

  /**
   * Check if a specific loading state is active.
   *
   * @param key - Unique identifier for the loading state to check
   * @returns true if the loading state is active
   *
   * @example
   * ```ts
   * if (loading.isActive('save')) {
   *   // show spinner
   * }
   * ```
   */
  isActive: (key: string) => boolean;

  /**
   * Check if any loading state is currently active.
   *
   * @example
   * ```ts
   * if (loading.isAny) {
   *   // disable form
   * }
   * ```
   */
  isAny: boolean;

  /**
   * Get all currently active loading keys.
   *
   * @example
   * ```ts
   * const activeKeys = loading.activeKeys;
   * // ['save', 'fetch']
   * ```
   */
  activeKeys: string[];

  /**
   * Get the count of active loading states.
   *
   * @example
   * ```ts
   * const count = loading.activeCount;
   * // 2
   * ```
   */
  activeCount: number;

  /**
   * Toggle a loading state. If active, stops it. If inactive, starts it.
   *
   * @param key - Unique identifier for the loading state
   * @param options - Optional configuration (only used when starting)
   *
   * @example
   * ```ts
   * loading.toggle('refresh');
   * ```
   */
  toggle: (key: string, options?: StartLoadingOptions) => void;

  /**
   * Get the duration in milliseconds since a loading state started.
   * Returns 0 if the loading state is not active.
   *
   * @param key - Unique identifier for the loading state
   * @returns Duration in milliseconds, or 0 if not active
   *
   * @example
   * ```ts
   * const duration = loading.getDuration('save');
   * // 1500 (ms)
   * ```
   */
  getDuration: (key: string) => number;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * A lightweight hook for managing multiple independent loading states.
 *
 * Unlike useAsyncOperation which is designed for managing async function execution
 * with retries and error handling, useLoadingState is a simpler utility focused
 * purely on tracking multiple named loading states.
 *
 * Features:
 * - Manage multiple named loading states independently
 * - Optional auto-timeout to prevent stuck loading states
 * - Check individual or aggregate loading status
 * - Track loading duration
 *
 * @param options - Configuration options
 * @returns Loading state management utilities
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const loading = useLoadingState({ defaultTimeout: 30000 });
 *
 *   const handleSave = async () => {
 *     loading.start('save');
 *     try {
 *       await saveData();
 *     } finally {
 *       loading.stop('save');
 *     }
 *   };
 *
 *   const handleRefresh = async () => {
 *     loading.start('refresh', { timeout: 5000 });
 *     try {
 *       await refreshData();
 *     } finally {
 *       loading.stop('refresh');
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleSave} disabled={loading.isAny}>
 *         {loading.isActive('save') ? 'Saving...' : 'Save'}
 *       </button>
 *       <button onClick={handleRefresh} disabled={loading.isAny}>
 *         {loading.isActive('refresh') ? 'Refreshing...' : 'Refresh'}
 *       </button>
 *       {loading.isAny && <p>Operations in progress: {loading.activeCount}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useLoadingState(
  options: UseLoadingStateOptions = {}
): UseLoadingStateResult {
  const { defaultTimeout = 0 } = options;

  // State to track all loading entries
  const [loadingMap, setLoadingMap] = useState<Map<string, LoadingEntry>>(
    () => new Map()
  );

  // Ref to track timeout IDs for cleanup
  const timeoutRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeoutId) => clearTimeout(timeoutId));
      timeoutRefs.current.clear();
    };
  }, []);

  /**
   * Clear timeout for a specific key
   */
  const clearKeyTimeout = useCallback((key: string) => {
    const existingTimeout = timeoutRefs.current.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      timeoutRefs.current.delete(key);
    }
  }, []);

  /**
   * Start a loading state
   */
  const start = useCallback(
    (key: string, startOptions?: StartLoadingOptions) => {
      // Clear any existing timeout for this key
      clearKeyTimeout(key);

      const timeout = startOptions?.timeout ?? defaultTimeout;

      // Set up auto-timeout if configured
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          setLoadingMap((prev) => {
            const next = new Map(prev);
            next.delete(key);
            return next;
          });
          timeoutRefs.current.delete(key);
        }, timeout);
        timeoutRefs.current.set(key, timeoutId);
      }

      setLoadingMap((prev) => {
        const next = new Map(prev);
        next.set(key, {
          active: true,
          startedAt: Date.now(),
          timeoutId,
        });
        return next;
      });
    },
    [defaultTimeout, clearKeyTimeout]
  );

  /**
   * Stop a loading state
   */
  const stop = useCallback(
    (key: string) => {
      clearKeyTimeout(key);
      setLoadingMap((prev) => {
        if (!prev.has(key)) return prev;
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
    },
    [clearKeyTimeout]
  );

  /**
   * Stop all loading states
   */
  const stopAll = useCallback(() => {
    timeoutRefs.current.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutRefs.current.clear();
    setLoadingMap(new Map());
  }, []);

  /**
   * Check if a specific key is loading
   */
  const isActive = useCallback(
    (key: string): boolean => {
      return loadingMap.has(key) && loadingMap.get(key)!.active;
    },
    [loadingMap]
  );

  /**
   * Toggle a loading state
   */
  const toggle = useCallback(
    (key: string, toggleOptions?: StartLoadingOptions) => {
      if (loadingMap.has(key) && loadingMap.get(key)!.active) {
        stop(key);
      } else {
        start(key, toggleOptions);
      }
    },
    [loadingMap, start, stop]
  );

  /**
   * Get duration since loading started
   */
  const getDuration = useCallback(
    (key: string): number => {
      const entry = loadingMap.get(key);
      if (!entry || !entry.active) return 0;
      return Date.now() - entry.startedAt;
    },
    [loadingMap]
  );

  /**
   * Derived state: all active keys
   */
  const activeKeys = useMemo(() => {
    return Array.from(loadingMap.entries())
      .filter(([, entry]) => entry.active)
      .map(([key]) => key);
  }, [loadingMap]);

  /**
   * Derived state: whether any loading is active
   */
  const isAny = useMemo(() => {
    return activeKeys.length > 0;
  }, [activeKeys]);

  /**
   * Derived state: count of active loading states
   */
  const activeCount = useMemo(() => {
    return activeKeys.length;
  }, [activeKeys]);

  return {
    start,
    stop,
    stopAll,
    isActive,
    isAny,
    activeKeys,
    activeCount,
    toggle,
    getDuration,
  };
}

export default useLoadingState;
