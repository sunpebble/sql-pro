/**
 * React hook for PostgreSQL LISTEN/NOTIFY subscriptions
 *
 * Provides an easy way to subscribe to PostgreSQL notification channels
 * and optionally auto-refresh table data when notifications are received.
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface PgNotifyEvent {
  subscriptionId: string;
  connectionId: string;
  channel: string;
  payload: string;
  table?: string;
  timestamp: number;
}

export interface UsePgNotifyOptions {
  /**
   * Whether to enable the subscription
   * @default true
   */
  enabled?: boolean;

  /**
   * Callback when a notification is received
   */
  onNotification?: (event: PgNotifyEvent) => void;

  /**
   * Table name to auto-refresh when notifications are received
   * If set, will invalidate queries for this table
   */
  autoRefreshTable?: string;

  /**
   * Debounce time in ms for auto-refresh (to batch rapid notifications)
   * @default 500
   */
  autoRefreshDebounceMs?: number;
}

export interface UsePgNotifyResult {
  /**
   * Whether the subscription is active
   */
  isSubscribed: boolean;

  /**
   * Current subscription ID (if subscribed)
   */
  subscriptionId: string | null;

  /**
   * Any error that occurred during subscription
   */
  error: string | null;

  /**
   * Manually trigger a refresh
   */
  refresh: () => void;

  /**
   * Number of notifications received
   */
  notificationCount: number;

  /**
   * Last notification received
   */
  lastNotification: PgNotifyEvent | null;
}

/**
 * Subscribe to PostgreSQL LISTEN/NOTIFY for real-time updates
 *
 * @example
 * ```tsx
 * const { isSubscribed, lastNotification } = usePgNotify(
 *   connectionId,
 *   'table_changes',
 *   {
 *     autoRefreshTable: 'users',
 *     onNotification: (event) => {
 *       toast.info(`Change detected: ${event.payload}`);
 *     }
 *   }
 * );
 * ```
 */
export function usePgNotify(
  connectionId: string | null,
  channel: string,
  options: UsePgNotifyOptions = {}
): UsePgNotifyResult {
  const {
    enabled = true,
    onNotification,
    autoRefreshTable,
    autoRefreshDebounceMs = 500,
  } = options;

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [lastNotification, setLastNotification] =
    useState<PgNotifyEvent | null>(null);

  const queryClient = useQueryClient();
  const onNotificationRef = useRef(onNotification);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Update callback ref
  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  // Debounced refresh function
  const scheduleRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(() => {
      // Invalidate all table data queries to trigger refetch
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          // Match infiniteTableData or tableData queries
          if (Array.isArray(key)) {
            const [type, connId, , tableName] = key;
            if (
              (type === 'infiniteTableData' || type === 'tableData') &&
              connId === connectionId &&
              (!autoRefreshTable || tableName === autoRefreshTable)
            ) {
              return true;
            }
          }
          return false;
        },
      });
    }, autoRefreshDebounceMs);
  }, [connectionId, autoRefreshTable, autoRefreshDebounceMs, queryClient]);

  // Manual refresh
  const refresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    scheduleRefresh();
  }, [scheduleRefresh]);

  // Subscribe effect
  useEffect(() => {
    if (!connectionId || !channel || !enabled) {
      return;
    }

    let currentSubscriptionId: string | null = null;
    let cleanup: (() => void) | null = null;

    const subscribe = async () => {
      try {
        const result = await window.sqlPro.pgNotify.subscribe({
          connectionId,
          channel,
          table: autoRefreshTable,
        });

        if (result.success) {
          currentSubscriptionId = result.subscriptionId;
          setSubscriptionId(result.subscriptionId);
          setIsSubscribed(true);
          setError(null);

          // Listen for events
          cleanup = window.sqlPro.pgNotify.onEvent((event) => {
            if (event.subscriptionId === currentSubscriptionId) {
              setNotificationCount((c) => c + 1);
              setLastNotification(event);

              // Call user callback
              onNotificationRef.current?.(event);

              // Auto-refresh if configured
              if (autoRefreshTable) {
                scheduleRefresh();
              }
            }
          });
        } else {
          setError(result.error);
          setIsSubscribed(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Subscription failed');
        setIsSubscribed(false);
      }
    };

    subscribe();

    return () => {
      // Cleanup event listener
      cleanup?.();

      // Clear any pending refresh
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      // Unsubscribe
      if (currentSubscriptionId) {
        window.sqlPro.pgNotify
          .unsubscribe({ subscriptionId: currentSubscriptionId })
          .catch(console.error);
      }

      setIsSubscribed(false);
      setSubscriptionId(null);
    };
  }, [connectionId, channel, enabled, autoRefreshTable, scheduleRefresh]);

  return {
    isSubscribed,
    subscriptionId,
    error,
    refresh,
    notificationCount,
    lastNotification,
  };
}
