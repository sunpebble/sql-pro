import type {
  MemoryPressureChangeEvent,
  MemoryPressureLevel,
  MemoryStats,
  MemoryStatsUpdateEvent,
} from '@shared/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sqlPro } from '@/lib/api';

/**
 * Renderer-specific memory metrics
 */
export interface RendererMetrics {
  /** Estimated count of DOM nodes in the document */
  domNodeCount: number;
  /** Estimated count of React components (based on fiber nodes) */
  componentCount: number;
  /** Event listener count estimate */
  eventListenerCount: number;
  /** JavaScript heap size from performance.memory (Chrome only) */
  jsHeapSize?: number;
  /** Used JavaScript heap size from performance.memory (Chrome only) */
  usedJsHeapSize?: number;
  /** Timestamp of the metrics */
  timestamp: number;
}

/**
 * Combined memory state including both main process and renderer metrics
 */
export interface MemoryState {
  /** Memory stats from the main process */
  mainProcessStats: MemoryStats | null;
  /** Current memory pressure level */
  pressureLevel: MemoryPressureLevel;
  /** Renderer-specific memory metrics */
  rendererMetrics: RendererMetrics;
  /** Whether the hook is currently subscribed to memory updates */
  isSubscribed: boolean;
  /** Whether an operation is in progress */
  isLoading: boolean;
  /** Error message if any operation failed */
  error: string | null;
}

/**
 * Options for the useMemoryMonitor hook
 */
export interface UseMemoryMonitorOptions {
  /** Whether to automatically subscribe to memory updates on mount (default: false) */
  autoSubscribe?: boolean;
  /** Interval in milliseconds for updates when subscribed (optional) */
  intervalMs?: number;
  /** Interval in milliseconds for collecting renderer metrics (default: 5000) */
  rendererMetricsIntervalMs?: number;
  /** Callback when memory pressure changes */
  onPressureChange?: (event: MemoryPressureChangeEvent) => void;
  /** Callback when memory stats are updated */
  onStatsUpdate?: (event: MemoryStatsUpdateEvent) => void;
}

/**
 * Return type of the useMemoryMonitor hook
 */
export interface UseMemoryMonitorResult extends MemoryState {
  /** Subscribe to memory updates from the main process */
  subscribe: () => Promise<void>;
  /** Unsubscribe from memory updates */
  unsubscribe: () => Promise<void>;
  /** Fetch current memory stats once (without subscribing) */
  fetchStats: () => Promise<void>;
  /** Request garbage collection from the main process */
  triggerGC: (force?: boolean) => Promise<boolean>;
  /** Manually refresh renderer metrics */
  refreshRendererMetrics: () => void;
}

/**
 * Get the count of DOM nodes in the document
 */
function getDomNodeCount(): number {
  try {
    return document.getElementsByTagName('*').length;
  } catch {
    return 0;
  }
}

/**
 * Estimate React component count by counting fiber nodes
 * This is an approximation based on elements with React's internal properties
 */
function getReactComponentCount(): number {
  try {
    // Try to find React fiber nodes by looking for elements with React's internal key
    const allElements = document.querySelectorAll('*');
    let count = 0;

    for (const element of allElements) {
      // Check for React fiber node indicators
      const keys = Object.keys(element);
      for (const key of keys) {
        if (
          key.startsWith('__reactFiber$') ||
          key.startsWith('__reactInternalInstance$')
        ) {
          count++;
          break;
        }
      }
    }

    return count;
  } catch {
    return 0;
  }
}

/**
 * Estimate event listener count
 * Note: This is a rough approximation since there's no reliable way to count all listeners
 */
function getEventListenerCount(): number {
  try {
    // Use getEventListeners if available (Chrome DevTools)
    const getEventListeners = (
      window as unknown as {
        getEventListeners?: (target: EventTarget) => Record<string, unknown[]>;
      }
    ).getEventListeners;

    if (typeof getEventListeners === 'function') {
      const listeners = getEventListeners(document);
      return Object.values(listeners).reduce((sum, arr) => sum + arr.length, 0);
    }

    // Fallback: return 0 if not in Chrome DevTools
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Get JavaScript heap metrics from performance.memory (Chrome only)
 */
function getJsHeapMetrics(): { jsHeapSize?: number; usedJsHeapSize?: number } {
  try {
    const performance = window.performance as Performance & {
      memory?: {
        jsHeapSizeLimit: number;
        totalJSHeapSize: number;
        usedJSHeapSize: number;
      };
    };

    if (performance.memory) {
      return {
        jsHeapSize: performance.memory.totalJSHeapSize,
        usedJsHeapSize: performance.memory.usedJSHeapSize,
      };
    }
  } catch {
    // performance.memory not available
  }
  return {};
}

/**
 * Collect all renderer-specific metrics
 */
function collectRendererMetrics(): RendererMetrics {
  const heapMetrics = getJsHeapMetrics();

  return {
    domNodeCount: getDomNodeCount(),
    componentCount: getReactComponentCount(),
    eventListenerCount: getEventListenerCount(),
    ...heapMetrics,
    timestamp: Date.now(),
  };
}

/**
 * React hook for monitoring memory usage across main and renderer processes.
 *
 * Provides real-time memory statistics from the main process via IPC,
 * as well as renderer-specific metrics like DOM node count and React component estimates.
 *
 * @example
 * ```tsx
 * function MemoryDebugPanel() {
 *   const {
 *     mainProcessStats,
 *     pressureLevel,
 *     rendererMetrics,
 *     isSubscribed,
 *     subscribe,
 *     unsubscribe,
 *     triggerGC,
 *   } = useMemoryMonitor({
 *     autoSubscribe: true,
 *     onPressureChange: (event) => {
 *       if (event.currentLevel === 'critical') {
 *         console.warn('Memory pressure is critical!');
 *       }
 *     },
 *   });
 *
 *   return (
 *     <div>
 *       <p>Pressure: {pressureLevel}</p>
 *       <p>Heap Used: {mainProcessStats?.metrics.usedHeapMB.toFixed(2)} MB</p>
 *       <p>DOM Nodes: {rendererMetrics.domNodeCount}</p>
 *       <button onClick={() => triggerGC(true)}>Trigger GC</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useMemoryMonitor(
  options: UseMemoryMonitorOptions = {}
): UseMemoryMonitorResult {
  const { t } = useTranslation('common');
  const {
    autoSubscribe = false,
    intervalMs,
    rendererMetricsIntervalMs = 5000,
    onPressureChange,
    onStatsUpdate,
  } = options;

  // State
  const [mainProcessStats, setMainProcessStats] = useState<MemoryStats | null>(
    null
  );
  const [pressureLevel, setPressureLevel] =
    useState<MemoryPressureLevel>('normal');
  const [rendererMetrics, setRendererMetrics] = useState<RendererMetrics>(
    collectRendererMetrics
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for cleanup and tracking
  const subscriptionIdRef = useRef<string | null>(null);
  const cleanupStatsRef = useRef<(() => void) | null>(null);
  const cleanupPressureRef = useRef<(() => void) | null>(null);
  const rendererMetricsIntervalRef = useRef<ReturnType<
    typeof setInterval
  > | null>(null);
  const onPressureChangeRef = useRef(onPressureChange);
  const onStatsUpdateRef = useRef(onStatsUpdate);

  // Keep callback refs up to date
  useEffect(() => {
    onPressureChangeRef.current = onPressureChange;
    onStatsUpdateRef.current = onStatsUpdate;
  }, [onPressureChange, onStatsUpdate]);

  /**
   * Refresh renderer-specific metrics
   */
  const refreshRendererMetrics = useCallback(() => {
    setRendererMetrics(collectRendererMetrics());
  }, []);

  /**
   * Fetch current memory stats once without subscribing
   */
  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await sqlPro.memory.getStats();

      if (response.success && response.stats) {
        setMainProcessStats(response.stats);
        if (response.pressureLevel) {
          setPressureLevel(response.pressureLevel);
        }
      } else {
        setError(response.error || t('memory.failedToFetchStats'));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('memory.failedToFetchStats')
      );
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  /**
   * Subscribe to memory updates from the main process
   */
  const subscribe = useCallback(async () => {
    if (isSubscribed || subscriptionIdRef.current) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await sqlPro.memory.subscribe({ intervalMs });

      if (response.success && response.subscriptionId) {
        subscriptionIdRef.current = response.subscriptionId;
        setIsSubscribed(true);

        // Set up event listeners for stats updates
        cleanupStatsRef.current = sqlPro.memory.onStatsUpdate(
          (event: MemoryStatsUpdateEvent) => {
            // eslint-disable-next-line react/set-state-in-effect -- Async event handler for IPC updates
            setMainProcessStats(event.stats);
            // eslint-disable-next-line react/set-state-in-effect -- Async event handler for IPC updates
            setPressureLevel(event.pressureLevel);
            onStatsUpdateRef.current?.(event);
          }
        );

        // Set up event listeners for pressure changes
        cleanupPressureRef.current = sqlPro.memory.onPressureChange(
          (event: MemoryPressureChangeEvent) => {
            // eslint-disable-next-line react/set-state-in-effect -- Async event handler for IPC updates
            setPressureLevel(event.currentLevel);
            onPressureChangeRef.current?.(event);
          }
        );

        // Start renderer metrics collection
        rendererMetricsIntervalRef.current = setInterval(
          refreshRendererMetrics,
          rendererMetricsIntervalMs
        );
        refreshRendererMetrics();
      } else {
        setError(response.error || t('memory.failedToSubscribe'));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('memory.failedToSubscribe')
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    isSubscribed,
    intervalMs,
    rendererMetricsIntervalMs,
    refreshRendererMetrics,
    t,
  ]);

  /**
   * Unsubscribe from memory updates
   */
  const unsubscribe = useCallback(async () => {
    if (!subscriptionIdRef.current) {
      return;
    }

    setIsLoading(true);

    try {
      await sqlPro.memory.unsubscribe({
        subscriptionId: subscriptionIdRef.current,
      });
    } catch {
      // Ignore unsubscribe errors - the subscription may already be cleaned up
    }

    // Clean up event listeners
    cleanupStatsRef.current?.();
    cleanupStatsRef.current = null;
    cleanupPressureRef.current?.();
    cleanupPressureRef.current = null;

    // Stop renderer metrics collection
    if (rendererMetricsIntervalRef.current) {
      clearInterval(rendererMetricsIntervalRef.current);
      rendererMetricsIntervalRef.current = null;
    }

    subscriptionIdRef.current = null;
    setIsSubscribed(false);
    setIsLoading(false);
  }, []);

  /**
   * Trigger garbage collection in the main process
   */
  const triggerGC = useCallback(async (force = false): Promise<boolean> => {
    try {
      const response = await sqlPro.memory.triggerGC({ force });

      if (response.success && response.gcTriggered) {
        // Update stats after GC if available
        if (response.statsAfterGC) {
          setMainProcessStats(response.statsAfterGC);
        }
        return true;
      }

      if (response.error) {
        setError(response.error);
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger GC');
      return false;
    }
  }, []);

  // Auto-subscribe on mount if enabled
  useEffect(() => {
    if (autoSubscribe) {
      subscribe();
    }

    // Cleanup on unmount
    return () => {
      if (subscriptionIdRef.current) {
        // Fire and forget the unsubscribe
        sqlPro.memory
          .unsubscribe({ subscriptionId: subscriptionIdRef.current })
          .catch(() => {});
      }

      cleanupStatsRef.current?.();
      cleanupPressureRef.current?.();

      if (rendererMetricsIntervalRef.current) {
        clearInterval(rendererMetricsIntervalRef.current);
      }
    };
  }, [autoSubscribe, subscribe]);

  return {
    // State
    mainProcessStats,
    pressureLevel,
    rendererMetrics,
    isSubscribed,
    isLoading,
    error,
    // Actions
    subscribe,
    unsubscribe,
    fetchStats,
    triggerGC,
    refreshRendererMetrics,
  };
}
