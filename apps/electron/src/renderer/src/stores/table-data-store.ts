import type {
  CacheStats,
  EvictionEvent,
} from '@shared/lib/memory-budget-cache';
import type {
  ColumnSchema,
  FilterState,
  PaginationState,
  SortState,
} from '@/types/database';
import { MemoryBudgetCache } from '@shared/lib/memory-budget-cache';
import {
  BYTE_SIZES,
  estimateRowArraySize,
  formatBytes,
} from '@shared/lib/memory-utils';
import { create } from 'zustand';

/**
 * Default memory budget for table data cache (50MB)
 * This can be configured via setMemoryBudget()
 */
const DEFAULT_MEMORY_BUDGET_BYTES = 50 * 1024 * 1024; // 50MB

/**
 * Default maximum number of connections to cache table data for
 */
const DEFAULT_MAX_CONNECTIONS = 10;

export interface TableDataForConnection {
  tableName: string | null;
  columns: ColumnSchema[];
  rows: Record<string, unknown>[];
  pagination: PaginationState;
  sort: SortState | null;
  filters: FilterState[];
  isLoading: boolean;
  error: string | null;
  reloadVersion: number;
}

/**
 * Estimates the memory size of a TableDataForConnection object in bytes.
 * Uses optimized estimation for the common table data structure.
 */
function estimateTableDataSize(data: TableDataForConnection): number {
  let size = BYTE_SIZES.OBJECT_OVERHEAD;

  // tableName
  if (data.tableName) {
    size += data.tableName.length * 2 + BYTE_SIZES.STRING_OVERHEAD;
  } else {
    size += BYTE_SIZES.NULL_UNDEFINED;
  }

  // columns array - each column has name, type, and boolean fields
  size += BYTE_SIZES.ARRAY_OVERHEAD;
  for (const col of data.columns) {
    size += BYTE_SIZES.OBJECT_OVERHEAD;
    size += (col.name?.length || 0) * 2 + BYTE_SIZES.STRING_OVERHEAD;
    size += (col.type?.length || 0) * 2 + BYTE_SIZES.STRING_OVERHEAD;
    size += BYTE_SIZES.BOOLEAN * 2; // nullable, isPrimaryKey
    if (col.defaultValue !== null) {
      size += (col.defaultValue?.length || 0) * 2 + BYTE_SIZES.STRING_OVERHEAD;
    }
    size += BYTE_SIZES.REFERENCE;
  }

  // rows array - use sampling for large arrays
  size += estimateRowArraySize(data.rows);

  // pagination object
  size += BYTE_SIZES.OBJECT_OVERHEAD + BYTE_SIZES.NUMBER * 4;

  // sort (nullable)
  if (data.sort) {
    size += BYTE_SIZES.OBJECT_OVERHEAD;
    size += (data.sort.column?.length || 0) * 2 + BYTE_SIZES.STRING_OVERHEAD;
    size += BYTE_SIZES.STRING_OVERHEAD; // direction enum value
  } else {
    size += BYTE_SIZES.NULL_UNDEFINED;
  }

  // filters array
  size += BYTE_SIZES.ARRAY_OVERHEAD;
  for (const filter of data.filters) {
    size += BYTE_SIZES.OBJECT_OVERHEAD;
    size += (filter.column?.length || 0) * 2 + BYTE_SIZES.STRING_OVERHEAD;
    size += BYTE_SIZES.STRING_OVERHEAD; // operator
    // Value can vary in size
    const valueStr = String(filter.value || '');
    size += valueStr.length * 2 + BYTE_SIZES.STRING_OVERHEAD;
    size += BYTE_SIZES.REFERENCE;
  }

  // boolean and number fields
  size += BYTE_SIZES.BOOLEAN; // isLoading
  size += BYTE_SIZES.NUMBER; // reloadVersion

  // error (nullable string)
  if (data.error) {
    size += data.error.length * 2 + BYTE_SIZES.STRING_OVERHEAD;
  } else {
    size += BYTE_SIZES.NULL_UNDEFINED;
  }

  return size;
}

/**
 * Configuration options for the table data cache
 */
export interface TableDataCacheConfig {
  /** Maximum memory budget in bytes (default: 50MB) */
  maxBytes: number;
  /** Maximum number of connections to cache (default: 10) */
  maxConnections: number;
}

interface TableDataState {
  // Currently active connection ID
  activeConnectionId: string | null;

  // Actions
  setActiveConnectionId: (connectionId: string | null) => void;
  setTableData: (
    connectionId: string,
    tableName: string,
    columns: ColumnSchema[],
    rows: Record<string, unknown>[],
    totalRows: number
  ) => void;
  setPagination: (
    connectionId: string,
    pagination: Partial<PaginationState>
  ) => void;
  setSort: (connectionId: string, sort: SortState | null) => void;
  setFilters: (connectionId: string, filters: FilterState[]) => void;
  addFilter: (connectionId: string, filter: FilterState) => void;
  removeFilter: (connectionId: string, index: number) => void;
  setIsLoading: (connectionId: string, isLoading: boolean) => void;
  setError: (connectionId: string, error: string | null) => void;
  resetConnection: (connectionId: string) => void;
  removeConnectionData: (connectionId: string) => void;
  triggerReload: (connectionId: string) => void;
  reset: () => void;

  // Computed getters
  getDataForConnection: (connectionId: string) => TableDataForConnection | null;
  getCurrentData: () => TableDataForConnection | null;

  // Memory management
  getCacheStats: () => CacheStats;
  setMemoryBudget: (maxBytes: number) => void;
  setMaxConnections: (maxConnections: number) => void;
  getCacheConfig: () => TableDataCacheConfig;
  clearCache: () => void;
  onEviction: (
    callback: (event: EvictionEvent<string, TableDataForConnection>) => void
  ) => () => void;

  // Legacy compatibility - for components that don't pass connectionId
  tableName: string | null;
  columns: ColumnSchema[];
  rows: Record<string, unknown>[];
  pagination: PaginationState;
  sort: SortState | null;
  filters: FilterState[];
  isLoading: boolean;
  error: string | null;
  reloadVersion: number;
}

const initialPagination: PaginationState = {
  page: 1,
  pageSize: 100,
  totalRows: 0,
  totalPages: 0,
};

const createDefaultDataState = (): TableDataForConnection => ({
  tableName: null,
  columns: [],
  rows: [],
  pagination: initialPagination,
  sort: null,
  filters: [],
  isLoading: false,
  error: null,
  reloadVersion: 0,
});

/**
 * Memory-budgeted LRU cache for table data per connection.
 * Automatically evicts old table data when memory limit is reached.
 */
const tableDataCache = new MemoryBudgetCache<string, TableDataForConnection>({
  maxItems: DEFAULT_MAX_CONNECTIONS,
  maxBytes: DEFAULT_MEMORY_BUDGET_BYTES,
  sizeEstimator: estimateTableDataSize,
  name: 'TableDataCache',
});

/**
 * Get data from cache or return default state
 */
const getOrCreateConnectionData = (
  connectionId: string
): TableDataForConnection => {
  const cached = tableDataCache.get(connectionId);
  if (cached) {
    return cached;
  }
  return createDefaultDataState();
};

/**
 * Store connection data in cache
 */
const setConnectionData = (
  connectionId: string,
  data: TableDataForConnection
): void => {
  tableDataCache.set(connectionId, data);
};

export const useTableDataStore = create<TableDataState>((set, get) => ({
  activeConnectionId: null,

  // Legacy compatibility getters
  get tableName() {
    const state = get();
    if (!state.activeConnectionId) return null;
    const data = tableDataCache.peek(state.activeConnectionId);
    return data?.tableName || null;
  },
  get columns() {
    const state = get();
    if (!state.activeConnectionId) return [];
    const data = tableDataCache.peek(state.activeConnectionId);
    return data?.columns || [];
  },
  get rows() {
    const state = get();
    if (!state.activeConnectionId) return [];
    const data = tableDataCache.peek(state.activeConnectionId);
    return data?.rows || [];
  },
  get pagination() {
    const state = get();
    if (!state.activeConnectionId) return initialPagination;
    const data = tableDataCache.peek(state.activeConnectionId);
    return data?.pagination || initialPagination;
  },
  get sort() {
    const state = get();
    if (!state.activeConnectionId) return null;
    const data = tableDataCache.peek(state.activeConnectionId);
    return data?.sort || null;
  },
  get filters() {
    const state = get();
    if (!state.activeConnectionId) return [];
    const data = tableDataCache.peek(state.activeConnectionId);
    return data?.filters || [];
  },
  get isLoading() {
    const state = get();
    if (!state.activeConnectionId) return false;
    const data = tableDataCache.peek(state.activeConnectionId);
    return data?.isLoading || false;
  },
  get error() {
    const state = get();
    if (!state.activeConnectionId) return null;
    const data = tableDataCache.peek(state.activeConnectionId);
    return data?.error || null;
  },
  get reloadVersion() {
    const state = get();
    if (!state.activeConnectionId) return 0;
    const data = tableDataCache.peek(state.activeConnectionId);
    return data?.reloadVersion || 0;
  },

  setActiveConnectionId: (connectionId) => {
    set({ activeConnectionId: connectionId });
  },

  setTableData: (connectionId, tableName, columns, rows, totalRows) => {
    const connData = getOrCreateConnectionData(connectionId);
    const updatedData: TableDataForConnection = {
      ...connData,
      tableName,
      columns,
      rows,
      pagination: {
        ...connData.pagination,
        totalRows,
        totalPages: Math.ceil(totalRows / connData.pagination.pageSize),
      },
      error: null,
    };
    setConnectionData(connectionId, updatedData);
    // Trigger re-render
    set({});
  },

  setPagination: (connectionId, pagination) => {
    const connData = getOrCreateConnectionData(connectionId);
    const updatedData: TableDataForConnection = {
      ...connData,
      pagination: { ...connData.pagination, ...pagination },
    };
    setConnectionData(connectionId, updatedData);
    set({});
  },

  setSort: (connectionId, sort) => {
    const connData = getOrCreateConnectionData(connectionId);
    const updatedData: TableDataForConnection = {
      ...connData,
      sort,
    };
    setConnectionData(connectionId, updatedData);
    set({});
  },

  setFilters: (connectionId, filters) => {
    const connData = getOrCreateConnectionData(connectionId);
    const updatedData: TableDataForConnection = {
      ...connData,
      filters,
    };
    setConnectionData(connectionId, updatedData);
    set({});
  },

  addFilter: (connectionId, filter) => {
    const connData = getOrCreateConnectionData(connectionId);
    const updatedData: TableDataForConnection = {
      ...connData,
      filters: [...connData.filters, filter],
    };
    setConnectionData(connectionId, updatedData);
    set({});
  },

  removeFilter: (connectionId, index) => {
    const connData = getOrCreateConnectionData(connectionId);
    const updatedData: TableDataForConnection = {
      ...connData,
      filters: connData.filters.filter((_, i) => i !== index),
    };
    setConnectionData(connectionId, updatedData);
    set({});
  },

  setIsLoading: (connectionId, isLoading) => {
    const connData = getOrCreateConnectionData(connectionId);
    const updatedData: TableDataForConnection = {
      ...connData,
      isLoading,
    };
    setConnectionData(connectionId, updatedData);
    set({});
  },

  setError: (connectionId, error) => {
    const connData = getOrCreateConnectionData(connectionId);
    const updatedData: TableDataForConnection = {
      ...connData,
      error,
    };
    setConnectionData(connectionId, updatedData);
    set({});
  },

  resetConnection: (connectionId) => {
    setConnectionData(connectionId, createDefaultDataState());
    set({});
  },

  removeConnectionData: (connectionId) => {
    tableDataCache.delete(connectionId);
    set((state) => ({
      activeConnectionId:
        state.activeConnectionId === connectionId
          ? null
          : state.activeConnectionId,
    }));
  },

  triggerReload: (connectionId) => {
    const connData = getOrCreateConnectionData(connectionId);
    const updatedData: TableDataForConnection = {
      ...connData,
      reloadVersion: connData.reloadVersion + 1,
    };
    setConnectionData(connectionId, updatedData);
    set({});
  },

  reset: () => {
    tableDataCache.clear();
    set({
      activeConnectionId: null,
    });
  },

  getDataForConnection: (connectionId) => {
    return tableDataCache.get(connectionId) || null;
  },

  getCurrentData: () => {
    const state = get();
    if (!state.activeConnectionId) return null;
    return tableDataCache.get(state.activeConnectionId) || null;
  },

  // Memory management methods
  getCacheStats: () => {
    return tableDataCache.getStats();
  },

  setMemoryBudget: (maxBytes: number) => {
    tableDataCache.setMaxBytes(maxBytes);
  },

  setMaxConnections: (maxConnections: number) => {
    tableDataCache.setMaxItems(maxConnections);
  },

  getCacheConfig: () => {
    const stats = tableDataCache.getStats();
    return {
      maxBytes: stats.maxBytes,
      maxConnections: stats.maxItems,
    };
  },

  clearCache: () => {
    tableDataCache.clear();
    set({});
  },

  onEviction: (callback) => {
    tableDataCache.on('eviction', callback);
    return () => {
      tableDataCache.off('eviction', callback);
    };
  },
}));

// Export cache for testing and advanced usage
export { estimateTableDataSize, formatBytes, tableDataCache };
