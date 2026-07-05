/**
 * Schema Cache Service
 *
 * Provides a memory-efficient schema caching layer that:
 * - Caches lightweight schema lists (table/view names only)
 * - Loads detailed table information on-demand
 * - Uses LRU eviction to manage memory per connection
 * - Each connection has its own memory-limited cache
 * - Frequently accessed tables are prioritized (LRU ordering)
 */

import type { EvictionEvent } from '@shared/lib/memory-budget-cache';
import type {
  GetSchemaListResponse,
  GetTableDetailsResponse,
  SchemaListInfo,
  TableInfo,
} from '@shared/types';
import { MemoryBudgetCache } from '@shared/lib/memory-budget-cache';
import { estimateSchemaSize } from '@shared/lib/memory-utils';

/**
 * Cache key for table details within a connection: schema:tableName
 */
type TableDetailsKey = string;

/**
 * Default cache configuration
 */
const SCHEMA_CACHE_CONFIG = {
  /** Maximum memory per connection for table details (10MB default) */
  maxBytesPerConnection: 10 * 1024 * 1024,
  /** Maximum number of table details to cache per connection */
  maxTablesPerConnection: 100,
  /** Time-to-live for schema list cache in ms (5 minutes) */
  schemaListTTL: 5 * 60 * 1000,
  /** Maximum number of connections to track */
  maxConnections: 20,
};

/**
 * Schema cache entry with timestamp
 */
interface SchemaCacheEntry {
  schemas: SchemaListInfo[];
  timestamp: number;
}

/**
 * Per-connection cache statistics
 */
export interface ConnectionCacheStats {
  connectionId: string;
  tableDetailsCount: number;
  tableDetailsBytes: number;
  maxBytes: number;
  maxTables: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
}

/**
 * Global cache statistics
 */
export interface GlobalCacheStats {
  schemaListCount: number;
  connectionCount: number;
  totalTableDetailsCount: number;
  totalTableDetailsBytes: number;
  pendingFetches: number;
  connectionStats: ConnectionCacheStats[];
}

/**
 * Eviction callback type
 */
type EvictionCallback = (event: {
  connectionId: string;
  schema: string;
  tableName: string;
  reason: string;
}) => void;

/**
 * Schema Cache Manager
 *
 * Manages caching of schema data with lazy loading support.
 * Each connection has its own memory-limited LRU cache for table details.
 * The schema list is fetched once and cached, while table details
 * are loaded on-demand when a table is selected.
 *
 * Features:
 * - Per-connection memory limits (10MB default)
 * - LRU eviction of least-recently-accessed table details
 * - Frequently accessed tables prioritized through access tracking
 * - Manual cache clear available per-connection or globally
 */
class SchemaCacheManager {
  /** Cache for lightweight schema lists (per connection) */
  private readonly schemaListCache = new Map<string, SchemaCacheEntry>();

  /** Per-connection LRU caches for table details */
  private readonly connectionCaches = new Map<
    string,
    MemoryBudgetCache<TableDetailsKey, TableInfo>
  >();

  /** Set of table details currently being fetched (to prevent duplicate requests) */
  private readonly pendingFetches = new Set<string>();

  /** Eviction callbacks */
  private readonly evictionCallbacks = new Set<EvictionCallback>();

  /** Configuration */
  private config = { ...SCHEMA_CACHE_CONFIG };

  /**
   * Get or create a per-connection cache
   */
  private getConnectionCache(
    connectionId: string
  ): MemoryBudgetCache<TableDetailsKey, TableInfo> {
    let cache = this.connectionCaches.get(connectionId);

    if (!cache) {
      // Evict oldest connection cache if we have too many
      if (this.connectionCaches.size >= this.config.maxConnections) {
        this.evictOldestConnection();
      }

      cache = new MemoryBudgetCache<TableDetailsKey, TableInfo>({
        maxItems: this.config.maxTablesPerConnection,
        maxBytes: this.config.maxBytesPerConnection,
        name: `SchemaCache:${connectionId}`,
        sizeEstimator: (table: TableInfo) => estimateSchemaSize(table),
      });

      // Track evictions for debugging and callbacks
      cache.on(
        'eviction',
        ({ key, reason }: EvictionEvent<string, TableInfo>) => {
          const [schema, tableName] = this.parseTableDetailsKey(key);
          this.notifyEviction(connectionId, schema, tableName, reason);
        }
      );

      this.connectionCaches.set(connectionId, cache);
    }

    return cache;
  }

  /**
   * Evict the oldest (least recently used) connection cache
   */
  private evictOldestConnection(): void {
    // Find connection with oldest access
    let oldestConnectionId: string | null = null;
    let oldestTime = Number.POSITIVE_INFINITY;

    for (const [connId] of this.connectionCaches) {
      const schemaEntry = this.schemaListCache.get(connId);
      const timestamp = schemaEntry?.timestamp ?? 0;
      if (timestamp < oldestTime) {
        oldestTime = timestamp;
        oldestConnectionId = connId;
      }
    }

    if (oldestConnectionId) {
      this.invalidateConnection(oldestConnectionId);
    }
  }

  /**
   * Create a table details cache key
   */
  private getTableDetailsKey(
    schema: string,
    tableName: string
  ): TableDetailsKey {
    return `${schema}:${tableName}`;
  }

  /**
   * Parse a table details cache key
   */
  private parseTableDetailsKey(key: TableDetailsKey): [string, string] {
    const colonIndex = key.indexOf(':');
    if (colonIndex === -1) {
      return ['main', key];
    }
    return [key.substring(0, colonIndex), key.substring(colonIndex + 1)];
  }

  /**
   * Get the full cache key for pending fetches
   */
  private getPendingFetchKey(
    connectionId: string,
    schema: string,
    tableName: string
  ): string {
    return `${connectionId}:${schema}:${tableName}`;
  }

  /**
   * Notify eviction callbacks
   */
  private notifyEviction(
    connectionId: string,
    schema: string,
    tableName: string,
    reason: string
  ): void {
    for (const callback of this.evictionCallbacks) {
      try {
        callback({ connectionId, schema, tableName, reason });
      } catch {
        // Ignore callback errors
      }
    }
  }

  /**
   * Check if schema list cache is valid (not expired)
   */
  private isSchemaListValid(entry: SchemaCacheEntry | undefined): boolean {
    if (!entry) return false;
    const age = Date.now() - entry.timestamp;
    return age < this.config.schemaListTTL;
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
   * Accessing a table updates its LRU position (prioritizes frequently accessed tables).
   */
  getCachedTableDetails(
    connectionId: string,
    schema: string,
    tableName: string
  ): TableInfo | undefined {
    const cache = this.connectionCaches.get(connectionId);
    if (!cache) return undefined;

    const key = this.getTableDetailsKey(schema, tableName);
    return cache.get(key);
  }

  /**
   * Peek at cached table details without updating LRU position.
   * Useful for checking if a table is cached without affecting eviction priority.
   */
  peekTableDetails(
    connectionId: string,
    schema: string,
    tableName: string
  ): TableInfo | undefined {
    const cache = this.connectionCaches.get(connectionId);
    if (!cache) return undefined;

    const key = this.getTableDetailsKey(schema, tableName);
    return cache.peek(key);
  }

  /**
   * Set table details in cache.
   * May trigger eviction of least-recently-accessed tables if limit exceeded.
   */
  setTableDetails(
    connectionId: string,
    schema: string,
    tableName: string,
    table: TableInfo
  ): void {
    const cache = this.getConnectionCache(connectionId);
    const key = this.getTableDetailsKey(schema, tableName);
    cache.set(key, table);
  }

  /**
   * Check if a table details fetch is already in progress
   */
  isFetchingTableDetails(
    connectionId: string,
    schema: string,
    tableName: string
  ): boolean {
    const key = this.getPendingFetchKey(connectionId, schema, tableName);
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
    const key = this.getPendingFetchKey(connectionId, schema, tableName);
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
    const key = this.getPendingFetchKey(connectionId, schema, tableName);
    this.pendingFetches.delete(key);
  }

  /**
   * Invalidate all cached data for a connection.
   * Clears both schema list and all table details.
   */
  invalidateConnection(connectionId: string): void {
    // Remove schema list
    this.schemaListCache.delete(connectionId);

    // Remove connection cache
    const cache = this.connectionCaches.get(connectionId);
    if (cache) {
      cache.clear();
      this.connectionCaches.delete(connectionId);
    }

    // Remove pending fetches for this connection
    for (const key of this.pendingFetches) {
      if (key.startsWith(`${connectionId}:`)) {
        this.pendingFetches.delete(key);
      }
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
    const cache = this.connectionCaches.get(connectionId);
    if (cache) {
      const key = this.getTableDetailsKey(schema, tableName);
      cache.delete(key);
    }
  }

  /**
   * Clear all cached data for a specific connection
   */
  clearConnection(connectionId: string): void {
    this.invalidateConnection(connectionId);
  }

  /**
   * Clear all cached data globally
   */
  clearAll(): void {
    this.schemaListCache.clear();
    for (const cache of this.connectionCaches.values()) {
      cache.clear();
    }
    this.connectionCaches.clear();
    this.pendingFetches.clear();
  }

  /**
   * Get cache statistics for a specific connection
   */
  getConnectionStats(connectionId: string): ConnectionCacheStats | undefined {
    const cache = this.connectionCaches.get(connectionId);
    if (!cache) return undefined;

    const stats = cache.getStats();
    return {
      connectionId,
      tableDetailsCount: stats.itemCount,
      tableDetailsBytes: stats.totalBytes,
      maxBytes: stats.maxBytes,
      maxTables: stats.maxItems,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hitRate,
      evictions: stats.evictions,
    };
  }

  /**
   * Get global cache statistics
   */
  getStats(): GlobalCacheStats {
    const connectionStats: ConnectionCacheStats[] = [];
    let totalTableDetailsCount = 0;
    let totalTableDetailsBytes = 0;

    for (const [connectionId, cache] of this.connectionCaches) {
      const stats = cache.getStats();
      connectionStats.push({
        connectionId,
        tableDetailsCount: stats.itemCount,
        tableDetailsBytes: stats.totalBytes,
        maxBytes: stats.maxBytes,
        maxTables: stats.maxItems,
        hits: stats.hits,
        misses: stats.misses,
        hitRate: stats.hitRate,
        evictions: stats.evictions,
      });
      totalTableDetailsCount += stats.itemCount;
      totalTableDetailsBytes += stats.totalBytes;
    }

    return {
      schemaListCount: this.schemaListCache.size,
      connectionCount: this.connectionCaches.size,
      totalTableDetailsCount,
      totalTableDetailsBytes,
      pendingFetches: this.pendingFetches.size,
      connectionStats,
    };
  }

  /**
   * Set the memory limit per connection
   */
  setMemoryLimitPerConnection(maxBytes: number): void {
    if (maxBytes <= 0) {
      throw new Error('Memory limit must be positive');
    }
    this.config.maxBytesPerConnection = maxBytes;

    // Update existing caches
    for (const cache of this.connectionCaches.values()) {
      cache.setMaxBytes(maxBytes);
    }
  }

  /**
   * Set the maximum number of tables per connection
   */
  setMaxTablesPerConnection(maxTables: number): void {
    if (maxTables <= 0) {
      throw new Error('Max tables must be positive');
    }
    this.config.maxTablesPerConnection = maxTables;

    // Update existing caches
    for (const cache of this.connectionCaches.values()) {
      cache.setMaxItems(maxTables);
    }
  }

  /**
   * Set the maximum number of connections to track
   */
  setMaxConnections(maxConnections: number): void {
    if (maxConnections <= 0) {
      throw new Error('Max connections must be positive');
    }
    this.config.maxConnections = maxConnections;

    // Evict excess connections if needed
    while (this.connectionCaches.size > maxConnections) {
      this.evictOldestConnection();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): typeof SCHEMA_CACHE_CONFIG {
    return { ...this.config };
  }

  /**
   * Register a callback for eviction events
   * Returns an unsubscribe function
   */
  onEviction(callback: EvictionCallback): () => void {
    this.evictionCallbacks.add(callback);
    return () => {
      this.evictionCallbacks.delete(callback);
    };
  }

  /**
   * Get all cached table names for a connection
   */
  getCachedTableNames(connectionId: string): string[] {
    const cache = this.connectionCaches.get(connectionId);
    if (!cache) return [];

    return cache.keys().map((key) => {
      const [, tableName] = this.parseTableDetailsKey(key);
      return tableName;
    });
  }

  /**
   * Check if a table is cached
   */
  hasTableDetails(
    connectionId: string,
    schema: string,
    tableName: string
  ): boolean {
    const cache = this.connectionCaches.get(connectionId);
    if (!cache) return false;

    const key = this.getTableDetailsKey(schema, tableName);
    return cache.has(key);
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
  const result = await window.quarry.db.getSchemaList({ connectionId });

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
    const result = await window.quarry.db.getTableDetails({
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
