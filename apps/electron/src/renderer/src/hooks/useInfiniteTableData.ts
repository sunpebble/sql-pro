import type { ColumnInfo } from '@shared/types';
import type {
  PendingChange,
  TableDataQueryParams,
  TableRow,
} from '@/lib/collections';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sqlPro } from '@/lib/api';
import {
  addPendingChange,
  clearPendingChanges,
  getAllPendingChanges,
  pendingChangesCollection,
} from '@/lib/collections';

export interface UseInfiniteTableDataOptions {
  connectionId: string | null;
  schema?: string;
  table: string | null;
  pageSize?: number;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  filters?: TableDataQueryParams['filters'];
  enabled?: boolean;
  primaryKeyColumn?: string;
}

export interface UseInfiniteTableDataResult {
  // Data
  rows: TableRow[];
  columns: ColumnInfo[];
  totalRows: number;

  // Loading states
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  error: Error | null;

  // Actions
  fetchNextPage: () => void;
  refetch: () => void;

  // Mutations (optimistic)
  updateRow: (rowId: string | number, updates: Record<string, unknown>) => void;
  insertRow: (values: Record<string, unknown>) => string | number;
  deleteRow: (rowId: string | number) => void;

  // Change management
  hasChanges: boolean;
  pendingChanges: PendingChange[];
  clearChanges: () => void;
}

/**
 * Hook for fetching table data with infinite scroll pagination.
 * Uses TanStack Query's useInfiniteQuery for efficient data loading.
 */
export function useInfiniteTableData(
  options: UseInfiniteTableDataOptions
): UseInfiniteTableDataResult {
  const { t } = useTranslation('common');
  const {
    connectionId,
    schema = 'main',
    table,
    pageSize = 100,
    sortColumn,
    sortDirection,
    filters,
    enabled = true,
    primaryKeyColumn,
  } = options;

  // Track pending changes with local state for reactivity
  const [pendingChangesVersion, setPendingChangesVersion] = useState(0);

  // Subscribe to pending changes collection updates
  useEffect(() => {
    const subscription = pendingChangesCollection.subscribeChanges(() => {
      setPendingChangesVersion((v) => v + 1);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch table data using TanStack Query's infinite query
  const infiniteQuery = useInfiniteQuery({
    queryKey: [
      'infiniteTableData',
      connectionId,
      schema,
      table,
      pageSize,
      sortColumn,
      sortDirection,
      filters,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      if (!connectionId || !table) {
        throw new Error(t('tableData.connectionAndTableRequired'));
      }

      const response = await sqlPro.db.getTableData({
        connectionId,
        schema,
        table,
        page: pageParam,
        pageSize,
        sortColumn,
        sortDirection,
        filters,
      });

      if (!response.success) {
        throw new Error(response.error || t('tableData.failedToFetch'));
      }

      // Transform rows to include __rowId for identification
      const columns: ColumnInfo[] = response.columns || [];
      const pkColumns = columns
        .filter((c) => c.isPrimaryKey)
        .map((c) => c.name);

      const rows = (response.rows || []).map(
        (row: Record<string, unknown>, index: number) => {
          let rowId: string | number;
          if (pkColumns.length > 1) {
            rowId = pkColumns
              .map((col: string) => String(row[col] ?? ''))
              .join('_');
          } else if (pkColumns.length === 1) {
            rowId = row[pkColumns[0]] as string | number;
          } else {
            rowId =
              (row.rowid as string | number) ??
              `__index_${(pageParam - 1) * pageSize + index}`;
          }

          return {
            ...row,
            __rowId: rowId,
          } as TableRow;
        }
      );

      return {
        columns,
        rows,
        totalRows: response.totalRows || 0,
        page: pageParam,
        hasMore: pageParam * pageSize < (response.totalRows || 0),
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: Boolean(connectionId && table && enabled),
  });

  // Flatten all pages into a single rows array
  const allRows = useMemo(() => {
    if (!infiniteQuery.data?.pages) return [];
    return infiniteQuery.data.pages.flatMap((page) => page.rows);
  }, [infiniteQuery.data?.pages]);

  // Get columns from first page
  const columns = useMemo(() => {
    return infiniteQuery.data?.pages[0]?.columns || [];
  }, [infiniteQuery.data?.pages]);

  // Get total rows from first page
  const totalRows = useMemo(() => {
    return infiniteQuery.data?.pages[0]?.totalRows || 0;
  }, [infiniteQuery.data?.pages]);

  // Get pending changes for this table
  const pendingChanges = useMemo(() => {
    void pendingChangesVersion;
    if (!table) return [];
    return getAllPendingChanges().filter(
      (c) => c.table === table && c.schema === schema
    );
  }, [table, schema, pendingChangesVersion]);

  // Merge fetched data with pending changes for display
  const displayRows = useMemo(() => {
    if (!table || pendingChanges.length === 0) {
      return allRows;
    }

    const rowMap = new Map(allRows.map((r) => [r.__rowId, { ...r }]));

    for (const change of pendingChanges) {
      if (change.type === 'insert' && change.newValues) {
        const newRow: TableRow = {
          ...change.newValues,
          __rowId: change.rowId,
          __isNew: true,
        };
        rowMap.set(change.rowId, newRow);
      } else if (change.type === 'update' && change.newValues) {
        const existing = rowMap.get(change.rowId);
        if (existing) {
          rowMap.set(change.rowId, {
            ...existing,
            ...change.newValues,
            __isModified: true,
          });
        }
      } else if (change.type === 'delete') {
        const existing = rowMap.get(change.rowId);
        if (existing) {
          rowMap.set(change.rowId, {
            ...existing,
            __isDeleted: true,
          });
        }
      }
    }

    const result = Array.from(rowMap.values());
    result.sort((a, b) => {
      if (a.__isNew && !b.__isNew) return -1;
      if (!a.__isNew && b.__isNew) return 1;
      return 0;
    });

    return result;
  }, [allRows, pendingChanges, table]);

  // Mutation handlers
  const updateRow = useCallback(
    (rowId: string | number, updates: Record<string, unknown>) => {
      if (!table) return;

      const existingRow = allRows.find((r) => r.__rowId === rowId);
      addPendingChange({
        table,
        schema,
        rowId,
        type: 'update',
        oldValues: existingRow ? { ...existingRow } : null,
        newValues: updates,
        primaryKeyColumn,
      });
    },
    [table, schema, allRows, primaryKeyColumn]
  );

  const insertRow = useCallback(
    (values: Record<string, unknown>): string | number => {
      if (!table) return -1;

      const tempId = -Date.now();
      addPendingChange({
        table,
        schema,
        rowId: tempId,
        type: 'insert',
        oldValues: null,
        newValues: values,
      });
      return tempId;
    },
    [table, schema]
  );

  const deleteRow = useCallback(
    (rowId: string | number) => {
      if (!table) return;

      const existingRow = allRows.find((r) => r.__rowId === rowId);
      addPendingChange({
        table,
        schema,
        rowId,
        type: 'delete',
        oldValues: existingRow ? { ...existingRow } : null,
        newValues: null,
        primaryKeyColumn,
      });
    },
    [table, schema, allRows, primaryKeyColumn]
  );

  const clearChanges = useCallback(() => {
    if (table) {
      clearPendingChanges(table, schema);
    }
  }, [table, schema]);

  const fetchNextPage = useCallback(() => {
    if (infiniteQuery.hasNextPage && !infiniteQuery.isFetchingNextPage) {
      infiniteQuery.fetchNextPage();
    }
  }, [infiniteQuery]);

  const refetch = useCallback(() => {
    infiniteQuery.refetch({ cancelRefetch: true });
  }, [infiniteQuery]);

  return {
    rows: displayRows,
    columns,
    totalRows,
    isLoading: infiniteQuery.isLoading,
    isFetching: infiniteQuery.isFetching,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    hasNextPage: infiniteQuery.hasNextPage ?? false,
    error: infiniteQuery.error,
    fetchNextPage,
    refetch,
    updateRow,
    insertRow,
    deleteRow,
    hasChanges: pendingChanges.length > 0,
    pendingChanges,
    clearChanges,
  };
}
