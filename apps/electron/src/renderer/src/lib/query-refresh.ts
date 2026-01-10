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
 * Invalidates and refetches table data queries for a connection
 * Uses refetchType: 'active' to only refetch currently active queries
 */
export function invalidateTableData(connectionId: string): void {
  queryClient.invalidateQueries({
    predicate: createTableDataPredicate(connectionId),
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
