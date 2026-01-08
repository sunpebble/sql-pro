import type { MemoryPressureLevel } from '@shared/types';
import type { Query, QueryKey } from '@tanstack/react-query';
import { estimateObjectSize, SIZE_THRESHOLDS } from '@shared/lib/memory-utils';
import { QueryCache, QueryClient } from '@tanstack/react-query';

// ============ Cache Configuration ============

/**
 * Query cache configuration with memory-optimized defaults
 */
export const QUERY_CACHE_CONFIG = {
  /** Default garbage collection time (10 minutes) */
  defaultGcTime: 10 * 60 * 1000,
  /** Reduced gc time for large queries (5 minutes) */
  largeQueryGcTime: 5 * 60 * 1000,
  /** Aggressive gc time under memory pressure (2 minutes) */
  pressureGcTime: 2 * 60 * 1000,

  /** Default stale time for most queries (5 minutes) */
  defaultStaleTime: 5 * 60 * 1000,
  /** Longer stale time for schema data (10 minutes) */
  schemaStaleTime: 10 * 60 * 1000,
  /** Shorter stale time for table data (2 minutes) */
  tableDataStaleTime: 2 * 60 * 1000,

  /** Size threshold for "large" queries (100KB) */
  largeQueryThreshold: SIZE_THRESHOLDS.MEDIUM,
  /** Maximum cache size in bytes (50MB) */
  maxCacheSize: 50 * 1024 * 1024,
  /** Maximum number of cached queries */
  maxCachedQueries: 100,
};

// ============ Query Type Detection ============

/**
 * Query types for cache configuration
 */
export type QueryType = 'tableData' | 'schema' | 'queryResult' | 'other';

/**
 * Determine query type from query key
 */
function getQueryType(queryKey: QueryKey): QueryType {
  if (!Array.isArray(queryKey) || queryKey.length === 0) {
    return 'other';
  }

  const firstKey = queryKey[0];
  if (typeof firstKey === 'string') {
    if (firstKey === 'tableData') return 'tableData';
    if (firstKey === 'schema' || firstKey === 'schemaList') return 'schema';
    if (firstKey === 'queryResult') return 'queryResult';
  }

  return 'other';
}

/**
 * Estimate the size of query data
 */
function estimateQueryDataSize(data: unknown): number {
  if (data === undefined || data === null) return 0;
  return estimateObjectSize(data);
}

/**
 * Check if query data is considered "large"
 */
function isLargeQuery(data: unknown): boolean {
  const size = estimateQueryDataSize(data);
  return size > QUERY_CACHE_CONFIG.largeQueryThreshold;
}

// ============ Memory Pressure Tracking ============

/**
 * Current memory pressure level (updated via subscription)
 */
let currentPressureLevel: MemoryPressureLevel = 'normal';

/**
 * Get the current memory pressure level
 */
export function getMemoryPressureLevel(): MemoryPressureLevel {
  return currentPressureLevel;
}

// ============ Cache Management Utilities ============

/**
 * Get appropriate gcTime based on query type and memory pressure
 */
function getGcTimeForQuery(_queryType: QueryType, isLarge: boolean): number {
  // Under memory pressure, use aggressive gc time
  if (currentPressureLevel === 'critical') {
    return QUERY_CACHE_CONFIG.pressureGcTime;
  }

  if (currentPressureLevel === 'warning') {
    return QUERY_CACHE_CONFIG.largeQueryGcTime;
  }

  // Large queries get shorter gc time
  if (isLarge) {
    return QUERY_CACHE_CONFIG.largeQueryGcTime;
  }

  return QUERY_CACHE_CONFIG.defaultGcTime;
}

/**
 * Get appropriate stale time based on query type.
 * Can be used when creating queries that need type-specific stale times.
 */
export function getStaleTimeForQuery(queryType: QueryType): number {
  switch (queryType) {
    case 'schema':
      return QUERY_CACHE_CONFIG.schemaStaleTime;
    case 'tableData':
      return QUERY_CACHE_CONFIG.tableDataStaleTime;
    case 'queryResult':
      return QUERY_CACHE_CONFIG.defaultStaleTime;
    default:
      return QUERY_CACHE_CONFIG.defaultStaleTime;
  }
}

// ============ QueryClient Instance ============

/**
 * Variable to hold enforceCacheLimits function - set after queryClient creation
 */
let enforceCacheLimitsImpl: (() => void) | null = null;

/**
 * Custom query cache with memory-aware callbacks
 */
const queryCache = new (class extends QueryCache {
  override add(query: Query<unknown, Error, unknown, QueryKey>): void {
    super.add(query);
    // Enforce limits after adding new query (if implementation is ready)
    enforceCacheLimitsImpl?.();
  }
})({
  onSuccess: (data, query) => {
    // Adjust gc time based on query size and type
    const queryType = getQueryType(query.queryKey);
    const isLarge = isLargeQuery(data);
    const gcTime = getGcTimeForQuery(queryType, isLarge);

    // Update query's gc time dynamically
    // Note: This is done through the query's default options
    query.setOptions({
      ...query.options,
      gcTime,
    });
  },
});

/**
 * Global QueryClient instance for TanStack Query / TanStack DB integration.
 * This client manages caching, background refetching, and query state.
 *
 * Memory optimizations:
 * - gcTime reduced from 30min to 10min (5min for large queries)
 * - Stale time configured based on query type
 * - Cache size limits enforced (50MB total, 100 queries max)
 * - Memory-pressure-aware cache invalidation
 */
export const queryClient = new QueryClient({
  queryCache,
  defaultOptions: {
    queries: {
      // Disable automatic refetching - we control when to refetch via IPC
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      // Keep data fresh for 5 minutes (type-specific times applied dynamically)
      staleTime: QUERY_CACHE_CONFIG.defaultStaleTime,
      // Cache data for 10 minutes (reduced from 30 for memory efficiency)
      gcTime: QUERY_CACHE_CONFIG.defaultGcTime,
      // Retry failed queries up to 2 times
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

// ============ Helper Functions (defined after queryClient) ============

/**
 * Invalidate queries that exceed size threshold
 */
function invalidateLargeQueries(): void {
  const cache = queryClient.getQueryCache();
  const queries = cache.getAll();

  for (const query of queries) {
    const data = query.state.data;
    if (data !== undefined && isLargeQuery(data)) {
      queryClient.removeQueries({ queryKey: query.queryKey });
    }
  }
}

/**
 * Clear queries older than specified age
 */
function clearOldQueries(maxAge: number): void {
  const cache = queryClient.getQueryCache();
  const queries = cache.getAll();
  const now = Date.now();

  for (const query of queries) {
    const lastUpdated = query.state.dataUpdatedAt;
    if (lastUpdated && now - lastUpdated > maxAge) {
      queryClient.removeQueries({ queryKey: query.queryKey });
    }
  }
}

/**
 * Enforce cache size limits by removing least recently updated queries
 */
function enforceCacheLimits(): void {
  const cache = queryClient.getQueryCache();
  let queries = cache.getAll();

  // Check query count limit
  if (queries.length > QUERY_CACHE_CONFIG.maxCachedQueries) {
    // Sort by last update time (oldest first)
    queries = [...queries].sort(
      (a, b) => a.state.dataUpdatedAt - b.state.dataUpdatedAt
    );

    // Remove oldest queries until under limit
    const toRemove = queries.length - QUERY_CACHE_CONFIG.maxCachedQueries;
    for (let i = 0; i < toRemove; i++) {
      queryClient.removeQueries({ queryKey: queries[i].queryKey });
    }
  }

  // Check size limit
  let totalSize = 0;
  queries = cache.getAll();
  const queriesWithSize = queries.map((q) => ({
    query: q,
    size: estimateQueryDataSize(q.state.data),
    updatedAt: q.state.dataUpdatedAt,
  }));

  for (const q of queriesWithSize) {
    totalSize += q.size;
  }

  if (totalSize > QUERY_CACHE_CONFIG.maxCacheSize) {
    // Sort by last update time (oldest first)
    queriesWithSize.sort((a, b) => a.updatedAt - b.updatedAt);

    // Remove queries until under size limit
    for (const q of queriesWithSize) {
      if (totalSize <= QUERY_CACHE_CONFIG.maxCacheSize) break;
      queryClient.removeQueries({ queryKey: q.query.queryKey });
      totalSize -= q.size;
    }
  }
}

// Initialize the enforceCacheLimits implementation
enforceCacheLimitsImpl = enforceCacheLimits;

/**
 * Update the current memory pressure level.
 * Called by memory monitoring subscription.
 */
export function setMemoryPressureLevel(level: MemoryPressureLevel): void {
  const previousLevel = currentPressureLevel;
  currentPressureLevel = level;

  // Trigger aggressive cache cleanup when entering warning/critical
  if (
    previousLevel === 'normal' &&
    (level === 'warning' || level === 'critical')
  ) {
    invalidateLargeQueries();
  }

  if (level === 'critical') {
    // More aggressive cleanup for critical pressure
    clearOldQueries(QUERY_CACHE_CONFIG.pressureGcTime);
  }
}

/**
 * Get current cache statistics
 */
export interface QueryCacheStats {
  totalQueries: number;
  totalSizeBytes: number;
  largeQueryCount: number;
  queryTypeCounts: Record<QueryType, number>;
  oldestQueryAge: number;
  newestQueryAge: number;
}

export function getQueryCacheStats(): QueryCacheStats {
  const cache = queryClient.getQueryCache();
  const queries = cache.getAll();
  const now = Date.now();

  const stats: QueryCacheStats = {
    totalQueries: queries.length,
    totalSizeBytes: 0,
    largeQueryCount: 0,
    queryTypeCounts: {
      tableData: 0,
      schema: 0,
      queryResult: 0,
      other: 0,
    },
    oldestQueryAge: 0,
    newestQueryAge: Number.POSITIVE_INFINITY,
  };

  for (const query of queries) {
    const data = query.state.data;
    const size = estimateQueryDataSize(data);
    stats.totalSizeBytes += size;

    if (size > QUERY_CACHE_CONFIG.largeQueryThreshold) {
      stats.largeQueryCount++;
    }

    const queryType = getQueryType(query.queryKey);
    stats.queryTypeCounts[queryType]++;

    const age = now - query.state.dataUpdatedAt;
    if (age > stats.oldestQueryAge) {
      stats.oldestQueryAge = age;
    }
    if (age < stats.newestQueryAge) {
      stats.newestQueryAge = age;
    }
  }

  if (stats.newestQueryAge === Number.POSITIVE_INFINITY) {
    stats.newestQueryAge = 0;
  }

  return stats;
}

/**
 * Manually trigger cache cleanup based on current memory pressure
 */
export function triggerCacheCleanup(): void {
  if (currentPressureLevel === 'critical') {
    // Aggressive cleanup: remove all large queries and old queries
    invalidateLargeQueries();
    clearOldQueries(QUERY_CACHE_CONFIG.pressureGcTime);
  } else if (currentPressureLevel === 'warning') {
    // Moderate cleanup: remove large queries older than reduced gc time
    clearOldQueries(QUERY_CACHE_CONFIG.largeQueryGcTime);
  }

  // Always enforce limits
  enforceCacheLimits();
}

/**
 * Clear all cached queries
 */
export function clearQueryCache(): void {
  queryClient.clear();
}

/**
 * Clear queries for a specific connection
 */
export function clearConnectionQueries(connectionId: string): void {
  queryClient.removeQueries({
    predicate: (query) => {
      const key = query.queryKey;
      if (Array.isArray(key) && key.length > 1) {
        return key[1] === connectionId;
      }
      return false;
    },
  });
}

/**
 * Update cache configuration
 */
export function updateCacheConfig(
  config: Partial<typeof QUERY_CACHE_CONFIG>
): void {
  Object.assign(QUERY_CACHE_CONFIG, config);
}
