/**
 * Query refresh utilities
 * Shared functions for refreshing table data and schema queries
 */

import type { Query } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import { toast } from 'sonner';
import { sqlPro } from './api';
import { queryClient } from './query-client';

/**
 * Creates a predicate function for matching table data queries
 * Matches both 'tableData' and 'infiniteTableData' query keys
 */
export function createTableDataPredicate(connectionId: string) {
  return (query: Query): boolean => {
    const queryKey = query.queryKey;
    return (
      Array.isArray(queryKey) &&
      (queryKey[0] === 'tableData' || queryKey[0] === 'infiniteTableData') &&
      queryKey[1] === connectionId
    );
  };
}

/**
 * Creates a predicate function for matching column distribution queries
 */
export function createColumnDistributionPredicate(
  connectionId: string,
  tableName?: string
) {
  return (query: Query): boolean => {
    const queryKey = query.queryKey;
    if (
      !Array.isArray(queryKey) ||
      queryKey[0] !== 'column-distribution' ||
      queryKey[1] !== connectionId
    ) {
      return false;
    }
    // If tableName is specified, only match that table
    if (tableName && queryKey[3] !== tableName) {
      return false;
    }
    return true;
  };
}

/**
 * Invalidates and refetches table data queries for a connection
 * Uses refetchType: 'active' to only refetch currently active queries
 * Also invalidates column distribution queries since they depend on table data
 */
export function invalidateTableData(
  connectionId: string,
  tableName?: string
): void {
  // Invalidate table data queries
  queryClient.invalidateQueries({
    predicate: createTableDataPredicate(connectionId),
    refetchType: 'active',
  });

  // Also invalidate column distribution queries for the same connection/table
  queryClient.invalidateQueries({
    predicate: createColumnDistributionPredicate(connectionId, tableName),
    refetchType: 'active',
  });
}

/**
 * Invalidates column distribution queries for a connection
 * @param connectionId - The connection ID
 * @param tableName - Optional table name to limit invalidation
 */
export function invalidateColumnDistribution(
  connectionId: string,
  tableName?: string
): void {
  queryClient.invalidateQueries({
    predicate: createColumnDistributionPredicate(connectionId, tableName),
    refetchType: 'active',
  });
}

/**
 * Invalidates schema-related queries for a connection
 */
export function invalidateSchemaQueries(connectionId: string): void {
  queryClient.invalidateQueries({
    predicate: (query) => {
      const queryKey = query.queryKey;
      return (
        Array.isArray(queryKey) &&
        queryKey[0] === 'schema' &&
        queryKey[1] === connectionId
      );
    },
    refetchType: 'active',
  });
}

/**
 * The i18next translate function from the 'common' namespace, used for the
 * refresh toast strings. Typed via i18next's TFunction so callers can pass the
 * `t` returned by useTranslation('common') directly.
 */
type TranslateFn = TFunction<'common'>;

/**
 * Tracks connection IDs with an in-flight schema refresh so all entry points
 * (tab bar context menu, command palette/shortcut, app menu) share one guard.
 */
const refreshingConnectionIds = new Set<string>();

/**
 * Canonical "Refresh schema" action shared by every entry point.
 *
 * Performs the full sequence so both the schema cache and the data grid stay in
 * sync regardless of where it was triggered:
 *   1. invalidateSchemaCache(connectionId) to force a fresh fetch
 *   2. await sqlPro.db.getSchema({ connectionId })
 *   3. setSchema(connectionId, ...) with the fresh schema
 *   4. invalidateTableData(connectionId) to refetch tableData / infiniteTableData
 *      and column-distribution queries
 *
 * Re-entrancy is guarded via a module-level Set so concurrent triggers are no-ops.
 * Uses the connection.refreshing / refreshed / refreshFailed toast keys.
 */
export async function refreshSchema(
  connectionId: string,
  t: TranslateFn
): Promise<void> {
  if (refreshingConnectionIds.has(connectionId)) return;
  refreshingConnectionIds.add(connectionId);

  // Import lazily to avoid a static cycle between the store and this util.
  const { useConnectionStore } = await import('@/stores/connection-store');
  const { setSchema, invalidateSchemaCache } = useConnectionStore.getState();

  const toastId = toast.loading(t('connection.refreshing', 'Refreshing...'));

  try {
    // Invalidate cache first to force fresh data
    invalidateSchemaCache(connectionId);

    const result = await sqlPro.db.getSchema({ connectionId });

    if (result.success) {
      setSchema(connectionId, {
        schemas: result.schemas || [],
        tables: result.tables || [],
        views: result.views || [],
      });

      // Refresh the data grid (tableData + infiniteTableData + column distribution)
      invalidateTableData(connectionId);

      toast.success(t('connection.refreshed', 'Refreshed'), { id: toastId });
    } else {
      toast.error(t('connection.refreshFailed', 'Failed to refresh'), {
        id: toastId,
      });
    }
  } catch {
    toast.error(t('connection.refreshFailed', 'Failed to refresh'), {
      id: toastId,
    });
  } finally {
    refreshingConnectionIds.delete(connectionId);
  }
}
