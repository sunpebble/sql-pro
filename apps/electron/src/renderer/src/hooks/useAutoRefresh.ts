/**
 * Auto-refresh hook for table data
 *
 * Provides automatic polling-based refresh for table data.
 * - For PostgreSQL/Supabase: Uses LISTEN/NOTIFY when available, falls back to polling
 * - For MySQL/SQLite: Uses polling
 */

import { useEffect, useRef } from 'react';
import { invalidateTableData } from '@/lib/query-refresh';

export interface UseAutoRefreshOptions {
  /**
   * Whether auto-refresh is enabled
   * @default true
   */
  enabled?: boolean;

  /**
   * Polling interval in milliseconds
   * @default 10000 (10 seconds)
   */
  intervalMs?: number;

  /**
   * Table name to refresh (optional - if not set, refreshes all tables)
   */
  tableName?: string;

  /**
   * Whether to only refresh when the window is visible
   * @default true
   */
  pauseWhenHidden?: boolean;
}

export interface UseAutoRefreshResult {
  /**
   * Whether auto-refresh is currently active
   */
  isActive: boolean;

  /**
   * Manually trigger a refresh
   */
  refresh: () => void;
}

/**
 * Hook for automatic table data refresh via polling
 *
 * @example
 * ```tsx
 * // Auto-refresh every 10 seconds
 * useAutoRefresh(connectionId, { intervalMs: 10000 });
 *
 * // Auto-refresh specific table every 5 seconds
 * useAutoRefresh(connectionId, {
 *   tableName: 'users',
 *   intervalMs: 5000
 * });
 * ```
 */
export function useAutoRefresh(
  connectionId: string | null,
  options: UseAutoRefreshOptions = {}
): UseAutoRefreshResult {
  const {
    enabled = true,
    intervalMs = 10000,
    pauseWhenHidden = true,
  } = options;

  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined
  );
  const isActiveRef = useRef(false);

  // Manual refresh function
  const refresh = () => {
    if (connectionId) {
      invalidateTableData(connectionId);
    }
  };

  useEffect(() => {
    if (!connectionId || !enabled) {
      isActiveRef.current = false;
      return;
    }

    const startPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        // Skip if page is hidden and pauseWhenHidden is true
        if (pauseWhenHidden && document.hidden) {
          return;
        }

        invalidateTableData(connectionId);
      }, intervalMs);

      isActiveRef.current = true;
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      isActiveRef.current = false;
    };

    // Handle visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else if (enabled) {
        startPolling();
      }
    };

    // Start polling
    startPolling();

    // Listen for visibility changes if pauseWhenHidden is enabled
    if (pauseWhenHidden) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      stopPolling();
      if (pauseWhenHidden) {
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange
        );
      }
    };
  }, [connectionId, enabled, intervalMs, pauseWhenHidden]);

  return {
    isActive: isActiveRef.current,
    refresh,
  };
}
