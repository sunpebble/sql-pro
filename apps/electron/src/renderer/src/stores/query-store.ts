import type {
  CacheStats,
  EvictionEvent,
} from '@shared/lib/memory-budget-cache';
import type { QueryHistoryEntry } from '@shared/types';
import type { QueryResult, QueryResultSet } from '@/types/database';
import { MemoryBudgetCache } from '@shared/lib/memory-budget-cache';
import {
  BYTE_SIZES,
  estimateRowArraySize,
  formatBytes,
} from '@shared/lib/memory-utils';
import { create } from 'zustand';
import { sqlPro } from '@/lib/api';

/**
 * Default memory budget for query results cache (30MB)
 * This can be configured via setResultsMemoryBudget()
 */
const DEFAULT_RESULTS_MEMORY_BUDGET_BYTES = 30 * 1024 * 1024; // 30MB

/**
 * Default maximum number of cached query results
 */
const DEFAULT_MAX_CACHED_RESULTS = 20;

/**
 * Default maximum rows to keep in memory per query result
 * Large result sets are truncated with ability to fetch more on demand
 */
const DEFAULT_MAX_ROWS_IN_MEMORY = 10000;

/**
 * Maximum history entries to keep in memory
 */
const MAX_HISTORY_LENGTH = 100;

/**
 * Maximum size per history entry (truncate query text if larger)
 */
const MAX_HISTORY_ENTRY_QUERY_SIZE = 10000; // 10KB max per query text

/**
 * Cached query result with metadata
 */
export interface CachedQueryResult {
  /** The query that produced this result */
  query: string;
  /** The truncated result (limited rows) */
  result: QueryResult;
  /** Total rows available (before truncation) */
  totalRows: number;
  /** Whether the result was truncated */
  isTruncated: boolean;
  /** Connection ID this result belongs to */
  connectionId: string;
  /** Timestamp when result was cached */
  cachedAt: number;
}

/**
 * Estimates the memory size of a QueryResult object in bytes.
 */
function estimateQueryResultSize(result: QueryResult): number {
  let size = BYTE_SIZES.OBJECT_OVERHEAD;

  // columns array
  size += BYTE_SIZES.ARRAY_OVERHEAD;
  for (const col of result.columns) {
    size += col.length * 2 + BYTE_SIZES.STRING_OVERHEAD + BYTE_SIZES.REFERENCE;
  }

  // rows array - use sampling for large arrays
  size += estimateRowArraySize(result.rows);

  // Numeric fields
  size += BYTE_SIZES.NUMBER * 3; // rowsAffected, lastInsertRowId, executedStatements

  // Handle multiple result sets
  if (result.resultSets && result.resultSets.length > 0) {
    size += BYTE_SIZES.ARRAY_OVERHEAD;
    for (const rs of result.resultSets) {
      size += estimateResultSetSize(rs);
    }
  }

  return size;
}

/**
 * Estimates the memory size of a QueryResultSet object in bytes.
 */
function estimateResultSetSize(resultSet: QueryResultSet): number {
  let size = BYTE_SIZES.OBJECT_OVERHEAD;

  // columns array
  size += BYTE_SIZES.ARRAY_OVERHEAD;
  for (const col of resultSet.columns) {
    size += col.length * 2 + BYTE_SIZES.STRING_OVERHEAD + BYTE_SIZES.REFERENCE;
  }

  // rows array
  size += estimateRowArraySize(resultSet.rows);

  return size;
}

/**
 * Estimates the memory size of a CachedQueryResult object in bytes.
 */
function estimateCachedResultSize(cached: CachedQueryResult): number {
  let size = BYTE_SIZES.OBJECT_OVERHEAD;

  // query string
  size += cached.query.length * 2 + BYTE_SIZES.STRING_OVERHEAD;

  // result
  size += estimateQueryResultSize(cached.result);

  // totalRows, isTruncated, cachedAt
  size += BYTE_SIZES.NUMBER * 2 + BYTE_SIZES.BOOLEAN;

  // connectionId string
  size += cached.connectionId.length * 2 + BYTE_SIZES.STRING_OVERHEAD;

  return size;
}

/**
 * Estimates the memory size of a QueryHistoryEntry object in bytes.
 */
function estimateHistoryEntrySize(entry: QueryHistoryEntry): number {
  let size = BYTE_SIZES.OBJECT_OVERHEAD;

  // id
  size += (entry.id?.length || 0) * 2 + BYTE_SIZES.STRING_OVERHEAD;

  // dbPath
  size += (entry.dbPath?.length || 0) * 2 + BYTE_SIZES.STRING_OVERHEAD;

  // queryText or query
  const queryText = entry.queryText || entry.query || '';
  size += queryText.length * 2 + BYTE_SIZES.STRING_OVERHEAD;

  // executedAt or timestamp
  const timestamp = entry.executedAt || entry.timestamp || '';
  size += timestamp.length * 2 + BYTE_SIZES.STRING_OVERHEAD;

  // durationMs, success
  size += BYTE_SIZES.NUMBER + BYTE_SIZES.BOOLEAN;

  // error (optional)
  if (entry.error) {
    size += entry.error.length * 2 + BYTE_SIZES.STRING_OVERHEAD;
  }

  // description (optional)
  if (entry.description) {
    size += entry.description.length * 2 + BYTE_SIZES.STRING_OVERHEAD;
  }

  return size;
}

/**
 * Truncates a query result to the specified max rows.
 * Returns the truncated result and metadata about truncation.
 */
function truncateQueryResult(
  result: QueryResult,
  maxRows: number
): { truncatedResult: QueryResult; totalRows: number; isTruncated: boolean } {
  const totalRows = result.rows.length;
  const isTruncated = totalRows > maxRows;

  if (!isTruncated) {
    return { truncatedResult: result, totalRows, isTruncated: false };
  }

  const truncatedResult: QueryResult = {
    ...result,
    rows: result.rows.slice(0, maxRows),
    // Preserve resultSets but truncate each one
    resultSets: result.resultSets?.map((rs) => ({
      ...rs,
      rows: rs.rows.slice(0, maxRows),
    })),
  };

  return { truncatedResult, totalRows, isTruncated: true };
}

/**
 * Truncates query text to a maximum size for history entries.
 */
function truncateQueryText(query: string, maxSize: number): string {
  if (query.length <= maxSize) {
    return query;
  }
  return `${query.substring(0, maxSize - 3)}...`;
}

/**
 * Configuration options for query store caching
 */
export interface QueryStoreCacheConfig {
  /** Maximum memory budget for results in bytes (default: 30MB) */
  maxResultsBytes: number;
  /** Maximum number of cached results (default: 20) */
  maxCachedResults: number;
  /** Maximum rows to keep per result (default: 10000) */
  maxRowsInMemory: number;
}

interface QueryState {
  // Current query session
  currentQuery: string;
  results: QueryResult | null;
  error: string | null;
  isExecuting: boolean;
  executionTime: number | null;

  // Query history (persisted per database)
  history: QueryHistoryEntry[];
  isLoadingHistory: boolean;
  currentDbPath: string | null;

  // Truncation metadata for current results
  resultsTruncated: boolean;
  totalResultRows: number;

  // Actions
  setCurrentQuery: (query: string) => void;
  setResults: (results: QueryResult | null, connectionId?: string) => void;
  setError: (error: string | null) => void;
  setIsExecuting: (isExecuting: boolean) => void;
  setExecutionTime: (time: number | null) => void;
  loadHistory: (dbPath: string) => Promise<void>;
  addToHistory: (
    dbPath: string,
    query: string,
    success: boolean,
    durationMs: number,
    errorMessage?: string
  ) => Promise<void>;
  deleteHistoryItem: (dbPath: string, entryId: string) => Promise<void>;
  clearHistory: (dbPath: string) => Promise<void>;
  reset: () => void;

  // Cached results management
  getCachedResult: (queryKey: string) => CachedQueryResult | null;
  clearResultsCache: () => void;
  removeConnectionResults: (connectionId: string) => void;

  // Memory management
  getResultsCacheStats: () => CacheStats;
  getHistorySize: () => number;
  setResultsMemoryBudget: (maxBytes: number) => void;
  setMaxCachedResults: (maxResults: number) => void;
  setMaxRowsInMemory: (maxRows: number) => void;
  getCacheConfig: () => QueryStoreCacheConfig;
  onResultEviction: (
    callback: (event: EvictionEvent<string, CachedQueryResult>) => void
  ) => () => void;
}

const initialState = {
  currentQuery: '',
  results: null as QueryResult | null,
  error: null as string | null,
  isExecuting: false,
  executionTime: null as number | null,
  history: [] as QueryHistoryEntry[],
  isLoadingHistory: false,
  currentDbPath: null as string | null,
  resultsTruncated: false,
  totalResultRows: 0,
};

// Generate a unique ID for history entries
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Generate a cache key for a query result
 */
const generateQueryCacheKey = (query: string, connectionId: string): string => {
  return `${connectionId}:${query}`;
};

/**
 * Memory-budgeted LRU cache for query results.
 * Automatically evicts old query results when memory limit is reached.
 */
const queryResultsCache = new MemoryBudgetCache<string, CachedQueryResult>({
  maxItems: DEFAULT_MAX_CACHED_RESULTS,
  maxBytes: DEFAULT_RESULTS_MEMORY_BUDGET_BYTES,
  sizeEstimator: estimateCachedResultSize,
  name: 'QueryResultsCache',
});

/**
 * Current max rows setting (can be changed dynamically)
 */
let currentMaxRowsInMemory = DEFAULT_MAX_ROWS_IN_MEMORY;

export const useQueryStore = create<QueryState>((set, get) => ({
  ...initialState,

  setCurrentQuery: (currentQuery) => set({ currentQuery }),

  setResults: (results, connectionId = 'default') => {
    if (results === null) {
      set({
        results: null,
        error: null,
        resultsTruncated: false,
        totalResultRows: 0,
      });
      return;
    }

    // Truncate results if they exceed the max rows limit
    const { truncatedResult, totalRows, isTruncated } = truncateQueryResult(
      results,
      currentMaxRowsInMemory
    );

    // Cache the result for future access
    const currentQuery = get().currentQuery;
    if (currentQuery) {
      const cacheKey = generateQueryCacheKey(currentQuery, connectionId);
      const cachedResult: CachedQueryResult = {
        query: currentQuery,
        result: truncatedResult,
        totalRows,
        isTruncated,
        connectionId,
        cachedAt: Date.now(),
      };
      queryResultsCache.set(cacheKey, cachedResult);
    }

    set({
      results: truncatedResult,
      error: null,
      resultsTruncated: isTruncated,
      totalResultRows: totalRows,
    });
  },

  setError: (error) =>
    set({ error, results: null, resultsTruncated: false, totalResultRows: 0 }),

  setIsExecuting: (isExecuting) => set({ isExecuting }),

  setExecutionTime: (executionTime) => set({ executionTime }),

  loadHistory: async (dbPath: string) => {
    set({ isLoadingHistory: true, currentDbPath: dbPath });
    try {
      const response = await sqlPro.history.get({ dbPath });
      if (response.success && response.history) {
        // Apply size limits to loaded history entries
        const limitedHistory = (response.history as QueryHistoryEntry[])
          .slice(0, MAX_HISTORY_LENGTH)
          .map((entry) => ({
            ...entry,
            queryText: entry.queryText
              ? truncateQueryText(entry.queryText, MAX_HISTORY_ENTRY_QUERY_SIZE)
              : entry.queryText,
            query: entry.query
              ? truncateQueryText(entry.query, MAX_HISTORY_ENTRY_QUERY_SIZE)
              : entry.query,
          }));
        set({ history: limitedHistory, isLoadingHistory: false });
      } else {
        set({ history: [], isLoadingHistory: false });
      }
    } catch (error) {
      console.warn('[QueryStore] Failed to load history:', error);
      set({ history: [], isLoadingHistory: false });
    }
  },

  addToHistory: async (dbPath, query, success, durationMs, errorMessage) => {
    // Truncate query text if it's too long
    const truncatedQuery = truncateQueryText(
      query,
      MAX_HISTORY_ENTRY_QUERY_SIZE
    );

    const entry: QueryHistoryEntry = {
      id: generateId(),
      dbPath,
      queryText: truncatedQuery,
      executedAt: new Date().toISOString(),
      durationMs,
      success,
      error: errorMessage,
    };

    // Optimistically update the UI
    set((state) => ({
      history: [entry, ...state.history.slice(0, MAX_HISTORY_LENGTH - 1)],
    }));

    // Persist to storage in background (fire-and-forget)
    // Note: Save the full query to storage, but keep truncated in memory
    const fullEntry: QueryHistoryEntry = {
      ...entry,
      queryText:
        query.length > MAX_HISTORY_ENTRY_QUERY_SIZE ? query : truncatedQuery,
    };
    sqlPro.history.save({ entry: fullEntry }).catch((error: unknown) => {
      // Non-critical: history is already in memory, log for debugging
      console.warn('[QueryStore] Failed to persist history entry:', error);
    });
  },

  deleteHistoryItem: async (dbPath: string, entryId: string) => {
    // Optimistically update the UI
    set((state) => ({
      history: state.history.filter((entry) => entry.id !== entryId),
    }));

    // Persist deletion to storage
    try {
      await sqlPro.history.delete({ dbPath, entryId });
    } catch (error) {
      console.warn('[QueryStore] Failed to delete history item:', error);
      // If deletion fails, reload history to restore state
      const response = await sqlPro.history.get({ dbPath });
      if (response.success && response.history) {
        set({ history: response.history as QueryHistoryEntry[] });
      }
    }
  },

  clearHistory: async (dbPath: string) => {
    // Optimistically clear the UI
    set({ history: [] });

    // Persist to storage
    try {
      await sqlPro.history.clear({ dbPath });
    } catch (error) {
      console.warn('[QueryStore] Failed to clear history:', error);
      // If clearing fails, reload history to restore state
      const response = await sqlPro.history.get({ dbPath });
      if (response.success && response.history) {
        set({ history: response.history as QueryHistoryEntry[] });
      }
    }
  },

  reset: () => {
    queryResultsCache.clear();
    set(initialState);
  },

  // Cached results management
  getCachedResult: (queryKey: string) => {
    return queryResultsCache.get(queryKey) || null;
  },

  clearResultsCache: () => {
    queryResultsCache.clear();
    set({ results: null, resultsTruncated: false, totalResultRows: 0 });
  },

  removeConnectionResults: (connectionId: string) => {
    // Remove all cached results for a specific connection
    const keysToRemove: string[] = [];
    queryResultsCache.forEach((_, key) => {
      if (key.startsWith(`${connectionId}:`)) {
        keysToRemove.push(key);
      }
    });
    for (const key of keysToRemove) {
      queryResultsCache.delete(key);
    }
  },

  // Memory management
  getResultsCacheStats: () => {
    return queryResultsCache.getStats();
  },

  getHistorySize: () => {
    const state = get();
    let totalSize = BYTE_SIZES.ARRAY_OVERHEAD;
    for (const entry of state.history) {
      totalSize += estimateHistoryEntrySize(entry);
    }
    return totalSize;
  },

  setResultsMemoryBudget: (maxBytes: number) => {
    queryResultsCache.setMaxBytes(maxBytes);
  },

  setMaxCachedResults: (maxResults: number) => {
    queryResultsCache.setMaxItems(maxResults);
  },

  setMaxRowsInMemory: (maxRows: number) => {
    currentMaxRowsInMemory = maxRows;
  },

  getCacheConfig: () => {
    const stats = queryResultsCache.getStats();
    return {
      maxResultsBytes: stats.maxBytes,
      maxCachedResults: stats.maxItems,
      maxRowsInMemory: currentMaxRowsInMemory,
    };
  },

  onResultEviction: (callback) => {
    queryResultsCache.on('eviction', callback);
    return () => {
      queryResultsCache.off('eviction', callback);
    };
  },
}));

// Export cache and utilities for testing and advanced usage
export {
  estimateCachedResultSize,
  estimateHistoryEntrySize,
  estimateQueryResultSize,
  formatBytes,
  queryResultsCache,
  truncateQueryResult,
  truncateQueryText,
};
