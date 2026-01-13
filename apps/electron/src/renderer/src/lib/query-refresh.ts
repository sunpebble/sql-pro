/**
 * Query refresh utilities
 * Shared functions for refreshing table data and schema queries
 */

import type { Query } from '@tanstack/react-query';
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
