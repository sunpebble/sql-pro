/**
 * Schema Cache Service
 *
 * Provides a memory-efficient schema caching layer that:
 * - Caches lightweight schema lists (table/view names only)
 * - Loads detailed table information on-demand
 * - Uses LRU eviction to manage memory
 * - Integrates with the memory budget system
 */

import type {
  GetSchemaListResponse,
  GetTableDetailsResponse,
  SchemaListInfo,
  TableInfo,
} from '@shared/types';
import { MemoryBudgetCache } from '@shared/lib/memory-budget-cache';

/**
 * Cache key for table details: connectionId:schema:tableName
 */
type TableDetailsCacheKey = string;

/**
 * Cache key for schema lists: connectionId
 */
type SchemaListCacheKey = string;

/**
 * Default cache configuration
 */
const SCHEMA_CACHE_CONFIG = {
  /** Maximum number of table details to cache per connection */
  maxTableDetails: 50,
  /** Maximum total size for table details cache (5MB) */
  maxTableDetailsBytes: 5 * 1024 * 1024,
  /** Time-to-live for schema list cache in ms (5 minutes) */
  schemaListTTL: 5 * 60 * 1000,
};

/**
 * Schema cache entry with timestamp
 */
interface SchemaCacheEntry {
  schemas: SchemaListInfo[];
  timestamp: number;
}

/**
 * Schema Cache Manager
 *
 * Manages caching of schema data with lazy loading support.
 * The schema list is fetched once and cached, while table details
 * are loaded on-demand when a table is selected.
 */
class SchemaCacheManager {
  /** Cache for lightweight schema lists (per connection) */
  private readonly schemaListCache = new Map<
    SchemaListCacheKey,
    SchemaCacheEntry
  >();

  /** LRU cache for table details (with memory budget) */
  private readonly tableDetailsCache: MemoryBudgetCache<
    TableDetailsCacheKey,
    TableInfo
  >;

  /** Set of table details currently being fetched (to prevent duplicate requests) */
  private readonly pendingFetches = new Set<TableDetailsCacheKey>();

  constructor() {
    this.tableDetailsCache = new MemoryBudgetCache<
      TableDetailsCacheKey,
      TableInfo
    >({
      maxItems: SCHEMA_CACHE_CONFIG.maxTableDetails,
      maxBytes: SCHEMA_CACHE_CONFIG.maxTableDetailsBytes,
      name: 'TableDetailsCache',
    });

    // Log evictions for debugging
    this.tableDetailsCache.on('eviction', ({ key, reason }) => {
      if (import.meta.env?.DEV) {
        // eslint-disable-next-line no-console
        console.debug(
          `[SchemaCache] Evicted table details for ${key}: ${reason}`
        );
      }
    });
  }

  /**
   * Get the cache key for table details
   */
  private getTableDetailsCacheKey(
    connectionId: string,
    schema: string,
    tableName: string
  ): TableDetailsCacheKey {
    return `${connectionId}:${schema}:${tableName}`;
  }

  /**
   * Check if schema list cache is valid (not expired)
   */
  private isSchemaListValid(entry: SchemaCacheEntry | undefined): boolean {
    if (!entry) return false;
    const age = Date.now() - entry.timestamp;
    return age < SCHEMA_CACHE_CONFIG.schemaListTTL;
  }

  /**
   * Get cached schema list for a connection.
   * Returns undefined if not cached or expired.
   */
  getCachedSchemaList(connectionId: string): SchemaListInfo[] | undefined {
    const entry = this.schemaListCache.get(connectionId);
    if (this.isSchemaListValid(entry)) {
      return entry?.schemas;
    }
    // Remove expired entry
    if (entry) {
      this.schemaListCache.delete(connectionId);
    }
    return undefined;
  }

  /**
   * Set schema list in cache
   */
  setSchemaList(connectionId: string, schemas: SchemaListInfo[]): void {
    this.schemaListCache.set(connectionId, {
      schemas,
      timestamp: Date.now(),
    });
  }

  /**
   * Get cached table details.
   * Returns undefined if not cached.
   */
  getCachedTableDetails(
    connectionId: string,
    schema: string,
    tableName: string
  ): TableInfo | undefined {
    const key = this.getTableDetailsCacheKey(connectionId, schema, tableName);
    return this.tableDetailsCache.get(key);
  }

  /**
   * Set table details in cache
   */
  setTableDetails(
    connectionId: string,
    schema: string,
    tableName: string,
    table: TableInfo
  ): void {
    const key = this.getTableDetailsCacheKey(connectionId, schema, tableName);
    this.tableDetailsCache.set(key, table);
  }

  /**
   * Check if a table details fetch is already in progress
   */
  isFetchingTableDetails(
    connectionId: string,
    schema: string,
    tableName: string
  ): boolean {
    const key = this.getTableDetailsCacheKey(connectionId, schema, tableName);
    return this.pendingFetches.has(key);
  }

  /**
   * Mark a table details fetch as in progress
   */
  startFetchingTableDetails(
    connectionId: string,
    schema: string,
    tableName: string
  ): void {
    const key = this.getTableDetailsCacheKey(connectionId, schema, tableName);
    this.pendingFetches.add(key);
  }

  /**
   * Mark a table details fetch as complete
   */
  finishFetchingTableDetails(
    connectionId: string,
    schema: string,
    tableName: string
  ): void {
    const key = this.getTableDetailsCacheKey(connectionId, schema, tableName);
    this.pendingFetches.delete(key);
  }

  /**
   * Invalidate all cached data for a connection
   */
  invalidateConnection(connectionId: string): void {
    // Remove schema list
    this.schemaListCache.delete(connectionId);

    // Remove all table details for this connection
    const keysToDelete: TableDetailsCacheKey[] = [];
    this.tableDetailsCache.forEach((_value, key) => {
      if (key.startsWith(`${connectionId}:`)) {
        keysToDelete.push(key);
      }
    });
    for (const key of keysToDelete) {
      this.tableDetailsCache.delete(key);
    }
  }

  /**
   * Invalidate a specific table's cached details
   */
  invalidateTableDetails(
    connectionId: string,
    schema: string,
    tableName: string
  ): void {
    const key = this.getTableDetailsCacheKey(connectionId, schema, tableName);
    this.tableDetailsCache.delete(key);
  }

  /**
   * Clear all cached data
   */
  clearAll(): void {
    this.schemaListCache.clear();
    this.tableDetailsCache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    schemaListCount: number;
    tableDetailsCount: number;
    tableDetailsBytes: number;
    pendingFetches: number;
  } {
    const stats = this.tableDetailsCache.getStats();
    return {
      schemaListCount: this.schemaListCache.size,
      tableDetailsCount: stats.itemCount,
      tableDetailsBytes: stats.totalBytes,
      pendingFetches: this.pendingFetches.size,
    };
  }
}

/** Singleton instance of the schema cache */
export const schemaCache = new SchemaCacheManager();

/**
 * Fetch schema list with caching.
 * Returns cached data if available and not expired.
 */
export async function fetchSchemaList(
  connectionId: string
): Promise<GetSchemaListResponse> {
  // Check cache first
  const cached = schemaCache.getCachedSchemaList(connectionId);
  if (cached) {
    return { success: true, schemas: cached };
  }

  // Fetch from backend
  const result = await window.sqlPro.db.getSchemaList({ connectionId });

  if (result.success && result.schemas) {
    schemaCache.setSchemaList(connectionId, result.schemas);
  }

  return result;
}

/**
 * Fetch table details with caching.
 * Returns cached data if available.
 */
export async function fetchTableDetails(
  connectionId: string,
  tableName: string,
  schema: string = 'main'
): Promise<GetTableDetailsResponse> {
  // Check cache first
  const cached = schemaCache.getCachedTableDetails(
    connectionId,
    schema,
    tableName
  );
  if (cached) {
    return { success: true, table: cached };
  }

  // Check if already fetching (prevent duplicate requests)
  if (schemaCache.isFetchingTableDetails(connectionId, schema, tableName)) {
    // Wait a bit and check cache again
    await new Promise((resolve) => setTimeout(resolve, 100));
    const result = schemaCache.getCachedTableDetails(
      connectionId,
      schema,
      tableName
    );
    if (result) {
      return { success: true, table: result };
    }
    // If still not in cache, proceed with fetch
  }

  // Mark as fetching
  schemaCache.startFetchingTableDetails(connectionId, schema, tableName);

  try {
    // Fetch from backend
    const result = await window.sqlPro.db.getTableDetails({
      connectionId,
      tableName,
      schema,
    });

    if (result.success && result.table) {
      schemaCache.setTableDetails(
        connectionId,
        schema,
        tableName,
        result.table
      );
    }

    return result;
  } finally {
    schemaCache.finishFetchingTableDetails(connectionId, schema, tableName);
  }
}
