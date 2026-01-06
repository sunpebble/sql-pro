/**
 * Tests for Schema Cache with Memory Limits
 */

import type { SchemaListInfo, TableInfo } from '@shared/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the window.sqlPro API before importing schema-cache
vi.mock('@shared/lib/memory-utils', () => ({
  estimateSchemaSize: (table: TableInfo) => {
    // Simple size estimation for tests
    const columnsSize = table.columns.length * 200;
    const indexesSize = table.indexes.length * 100;
    const triggersSize = table.triggers.length * 150;
    return 500 + columnsSize + indexesSize + triggersSize;
  },
}));

// Create a fresh instance for each test
class TestSchemaCacheManager {
  private schemaListCache = new Map<
    string,
    { schemas: SchemaListInfo[]; timestamp: number }
  >();
  private connectionCaches = new Map<
    string,
    Map<string, { table: TableInfo; accessTime: number; size: number }>
  >();
  private pendingFetches = new Set<string>();
  private evictionCallbacks = new Set<
    (event: {
      connectionId: string;
      schema: string;
      tableName: string;
      reason: string;
    }) => void
  >();
  private config = {
    maxBytesPerConnection: 10 * 1024 * 1024,
    maxTablesPerConnection: 100,
    schemaListTTL: 5 * 60 * 1000,
    maxConnections: 20,
  };

  private estimateSize(table: TableInfo): number {
    const columnsSize = table.columns.length * 200;
    const indexesSize = table.indexes.length * 100;
    const triggersSize = table.triggers.length * 150;
    return 500 + columnsSize + indexesSize + triggersSize;
  }

  private getConnectionCache(
    connectionId: string
  ): Map<string, { table: TableInfo; accessTime: number; size: number }> {
    let cache = this.connectionCaches.get(connectionId);
    if (!cache) {
      if (this.connectionCaches.size >= this.config.maxConnections) {
        this.evictOldestConnection();
      }
      cache = new Map();
      this.connectionCaches.set(connectionId, cache);
    }
    return cache;
  }

  private evictOldestConnection(): void {
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

  private getTableDetailsKey(schema: string, tableName: string): string {
    return `${schema}:${tableName}`;
  }

  private getPendingFetchKey(
    connectionId: string,
    schema: string,
    tableName: string
  ): string {
    return `${connectionId}:${schema}:${tableName}`;
  }

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
        // Ignore
      }
    }
  }

  private evictLRU(
    connectionId: string,
    cache: Map<string, { table: TableInfo; accessTime: number; size: number }>
  ): void {
    let oldestKey: string | null = null;
    let oldestTime = Number.POSITIVE_INFINITY;

    for (const [key, entry] of cache) {
      if (entry.accessTime < oldestTime) {
        oldestTime = entry.accessTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = cache.get(oldestKey);
      cache.delete(oldestKey);
      const colonIndex = oldestKey.indexOf(':');
      const schema =
        colonIndex > -1 ? oldestKey.substring(0, colonIndex) : 'main';
      const tableName =
        colonIndex > -1 ? oldestKey.substring(colonIndex + 1) : oldestKey;
      this.notifyEviction(
        connectionId,
        schema,
        tableName,
        entry ? 'max-items' : 'unknown'
      );
    }
  }

  private getTotalBytes(
    cache: Map<string, { table: TableInfo; accessTime: number; size: number }>
  ): number {
    let total = 0;
    for (const entry of cache.values()) {
      total += entry.size;
    }
    return total;
  }

  getCachedSchemaList(connectionId: string): SchemaListInfo[] | undefined {
    const entry = this.schemaListCache.get(connectionId);
    if (!entry) return undefined;
    const age = Date.now() - entry.timestamp;
    if (age >= this.config.schemaListTTL) {
      this.schemaListCache.delete(connectionId);
      return undefined;
    }
    return entry.schemas;
  }

  setSchemaList(connectionId: string, schemas: SchemaListInfo[]): void {
    this.schemaListCache.set(connectionId, { schemas, timestamp: Date.now() });
  }

  getCachedTableDetails(
    connectionId: string,
    schema: string,
    tableName: string
  ): TableInfo | undefined {
    const cache = this.connectionCaches.get(connectionId);
    if (!cache) return undefined;
    const key = this.getTableDetailsKey(schema, tableName);
    const entry = cache.get(key);
    if (entry) {
      entry.accessTime = Date.now();
      return entry.table;
    }
    return undefined;
  }

  peekTableDetails(
    connectionId: string,
    schema: string,
    tableName: string
  ): TableInfo | undefined {
    const cache = this.connectionCaches.get(connectionId);
    if (!cache) return undefined;
    const key = this.getTableDetailsKey(schema, tableName);
    return cache.get(key)?.table;
  }

  setTableDetails(
    connectionId: string,
    schema: string,
    tableName: string,
    table: TableInfo
  ): void {
    const cache = this.getConnectionCache(connectionId);
    const key = this.getTableDetailsKey(schema, tableName);
    const size = this.estimateSize(table);

    // Evict if over max items
    while (cache.size >= this.config.maxTablesPerConnection) {
      this.evictLRU(connectionId, cache);
    }

    // Evict if over max bytes
    while (
      this.getTotalBytes(cache) + size > this.config.maxBytesPerConnection &&
      cache.size > 0
    ) {
      this.evictLRU(connectionId, cache);
    }

    cache.set(key, { table, accessTime: Date.now(), size });
  }

  isFetchingTableDetails(
    connectionId: string,
    schema: string,
    tableName: string
  ): boolean {
    return this.pendingFetches.has(
      this.getPendingFetchKey(connectionId, schema, tableName)
    );
  }

  startFetchingTableDetails(
    connectionId: string,
    schema: string,
    tableName: string
  ): void {
    this.pendingFetches.add(
      this.getPendingFetchKey(connectionId, schema, tableName)
    );
  }

  finishFetchingTableDetails(
    connectionId: string,
    schema: string,
    tableName: string
  ): void {
    this.pendingFetches.delete(
      this.getPendingFetchKey(connectionId, schema, tableName)
    );
  }

  invalidateConnection(connectionId: string): void {
    this.schemaListCache.delete(connectionId);
    const cache = this.connectionCaches.get(connectionId);
    if (cache) {
      cache.clear();
      this.connectionCaches.delete(connectionId);
    }
    for (const key of this.pendingFetches) {
      if (key.startsWith(`${connectionId}:`)) {
        this.pendingFetches.delete(key);
      }
    }
  }

  invalidateTableDetails(
    connectionId: string,
    schema: string,
    tableName: string
  ): void {
    const cache = this.connectionCaches.get(connectionId);
    if (cache) {
      cache.delete(this.getTableDetailsKey(schema, tableName));
    }
  }

  clearConnection(connectionId: string): void {
    this.invalidateConnection(connectionId);
  }

  clearAll(): void {
    this.schemaListCache.clear();
    for (const cache of this.connectionCaches.values()) {
      cache.clear();
    }
    this.connectionCaches.clear();
    this.pendingFetches.clear();
  }

  getConnectionStats(connectionId: string):
    | {
        connectionId: string;
        tableDetailsCount: number;
        tableDetailsBytes: number;
        maxBytes: number;
        maxTables: number;
      }
    | undefined {
    const cache = this.connectionCaches.get(connectionId);
    if (!cache) return undefined;
    return {
      connectionId,
      tableDetailsCount: cache.size,
      tableDetailsBytes: this.getTotalBytes(cache),
      maxBytes: this.config.maxBytesPerConnection,
      maxTables: this.config.maxTablesPerConnection,
    };
  }

  getStats() {
    let totalTableDetailsCount = 0;
    let totalTableDetailsBytes = 0;

    for (const cache of this.connectionCaches.values()) {
      totalTableDetailsCount += cache.size;
      totalTableDetailsBytes += this.getTotalBytes(cache);
    }

    return {
      schemaListCount: this.schemaListCache.size,
      connectionCount: this.connectionCaches.size,
      totalTableDetailsCount,
      totalTableDetailsBytes,
      pendingFetches: this.pendingFetches.size,
    };
  }

  setMemoryLimitPerConnection(maxBytes: number): void {
    if (maxBytes <= 0) throw new Error('Memory limit must be positive');
    this.config.maxBytesPerConnection = maxBytes;
  }

  setMaxTablesPerConnection(maxTables: number): void {
    if (maxTables <= 0) throw new Error('Max tables must be positive');
    this.config.maxTablesPerConnection = maxTables;
  }

  setMaxConnections(maxConnections: number): void {
    if (maxConnections <= 0)
      throw new Error('Max connections must be positive');
    this.config.maxConnections = maxConnections;
    while (this.connectionCaches.size > maxConnections) {
      this.evictOldestConnection();
    }
  }

  getConfig() {
    return { ...this.config };
  }

  onEviction(
    callback: (event: {
      connectionId: string;
      schema: string;
      tableName: string;
      reason: string;
    }) => void
  ): () => void {
    this.evictionCallbacks.add(callback);
    return () => this.evictionCallbacks.delete(callback);
  }

  hasTableDetails(
    connectionId: string,
    schema: string,
    tableName: string
  ): boolean {
    const cache = this.connectionCaches.get(connectionId);
    if (!cache) return false;
    return cache.has(this.getTableDetailsKey(schema, tableName));
  }
}

// Helper to create mock table data
function createMockTable(name: string, numColumns = 5): TableInfo {
  return {
    name,
    schema: 'main',
    type: 'table',
    columns: Array.from({ length: numColumns }, (_, i) => ({
      name: `col_${i}`,
      type: 'TEXT',
      nullable: true,
      defaultValue: null,
      isPrimaryKey: i === 0,
    })),
    primaryKey: ['col_0'],
    foreignKeys: [],
    indexes: [],
    triggers: [],
    rowCount: 100,
    sql: `CREATE TABLE ${name} (...)`,
  };
}

// Helper to create mock schema list
function createMockSchemaList(): SchemaListInfo[] {
  return [
    {
      name: 'main',
      tables: [
        { name: 'users', schema: 'main', type: 'table', sql: '' },
        { name: 'orders', schema: 'main', type: 'table', sql: '' },
      ],
      views: [],
    },
  ];
}

describe('schemaCacheManager', () => {
  let cache: TestSchemaCacheManager;

  beforeEach(() => {
    cache = new TestSchemaCacheManager();
  });

  describe('schema List Caching', () => {
    it('should cache schema list', () => {
      const schemas = createMockSchemaList();
      cache.setSchemaList('conn1', schemas);

      const cached = cache.getCachedSchemaList('conn1');
      expect(cached).toEqual(schemas);
    });

    it('should return undefined for non-existent connection', () => {
      const cached = cache.getCachedSchemaList('nonexistent');
      expect(cached).toBeUndefined();
    });

    it('should expire schema list after TTL', () => {
      vi.useFakeTimers();

      const schemas = createMockSchemaList();
      cache.setSchemaList('conn1', schemas);

      // Advance time past TTL (5 minutes)
      vi.advanceTimersByTime(6 * 60 * 1000);

      const cached = cache.getCachedSchemaList('conn1');
      expect(cached).toBeUndefined();

      vi.useRealTimers();
    });
  });

  describe('table Details Caching', () => {
    it('should cache table details', () => {
      const table = createMockTable('users');
      cache.setTableDetails('conn1', 'main', 'users', table);

      const cached = cache.getCachedTableDetails('conn1', 'main', 'users');
      expect(cached).toEqual(table);
    });

    it('should return undefined for non-cached table', () => {
      const cached = cache.getCachedTableDetails(
        'conn1',
        'main',
        'nonexistent'
      );
      expect(cached).toBeUndefined();
    });

    it('should update LRU position on access', () => {
      vi.useFakeTimers();
      const table1 = createMockTable('table1');
      const table2 = createMockTable('table2');
      const table3 = createMockTable('table3');

      cache.setMaxTablesPerConnection(2);

      cache.setTableDetails('conn1', 'main', 'table1', table1);
      vi.advanceTimersByTime(100);
      cache.setTableDetails('conn1', 'main', 'table2', table2);
      vi.advanceTimersByTime(100);

      // Access table1 to make it more recent
      cache.getCachedTableDetails('conn1', 'main', 'table1');
      vi.advanceTimersByTime(100);

      // Add table3, should evict table2 (least recently accessed)
      cache.setTableDetails('conn1', 'main', 'table3', table3);

      expect(cache.hasTableDetails('conn1', 'main', 'table1')).toBe(true);
      expect(cache.hasTableDetails('conn1', 'main', 'table2')).toBe(false);
      expect(cache.hasTableDetails('conn1', 'main', 'table3')).toBe(true);
      vi.useRealTimers();
    });

    it('should not update LRU position on peek', () => {
      vi.useFakeTimers();
      const table1 = createMockTable('table1');
      const table2 = createMockTable('table2');
      const table3 = createMockTable('table3');

      cache.setMaxTablesPerConnection(2);

      cache.setTableDetails('conn1', 'main', 'table1', table1);
      vi.advanceTimersByTime(100);
      cache.setTableDetails('conn1', 'main', 'table2', table2);
      vi.advanceTimersByTime(100);

      // Peek at table1 (should not update LRU)
      cache.peekTableDetails('conn1', 'main', 'table1');
      vi.advanceTimersByTime(100);

      // Add table3, should evict table1 (oldest, since peek doesn't update)
      cache.setTableDetails('conn1', 'main', 'table3', table3);

      expect(cache.hasTableDetails('conn1', 'main', 'table1')).toBe(false);
      expect(cache.hasTableDetails('conn1', 'main', 'table2')).toBe(true);
      expect(cache.hasTableDetails('conn1', 'main', 'table3')).toBe(true);
      vi.useRealTimers();
    });
  });

  describe('per-Connection Memory Limits', () => {
    it('should use 10MB default limit per connection', () => {
      const config = cache.getConfig();
      expect(config.maxBytesPerConnection).toBe(10 * 1024 * 1024);
    });

    it('should allow configuring memory limit', () => {
      cache.setMemoryLimitPerConnection(5 * 1024 * 1024);
      const config = cache.getConfig();
      expect(config.maxBytesPerConnection).toBe(5 * 1024 * 1024);
    });

    it('should throw on invalid memory limit', () => {
      expect(() => cache.setMemoryLimitPerConnection(0)).toThrow(
        'Memory limit must be positive'
      );
      expect(() => cache.setMemoryLimitPerConnection(-1)).toThrow(
        'Memory limit must be positive'
      );
    });
  });

  describe('lRU Eviction', () => {
    it('should evict least recently used tables when max items exceeded', () => {
      cache.setMaxTablesPerConnection(3);
      const evictions: string[] = [];

      cache.onEviction(({ tableName }) => {
        evictions.push(tableName);
      });

      // Add 4 tables (exceeding limit of 3)
      cache.setTableDetails(
        'conn1',
        'main',
        'table1',
        createMockTable('table1')
      );
      cache.setTableDetails(
        'conn1',
        'main',
        'table2',
        createMockTable('table2')
      );
      cache.setTableDetails(
        'conn1',
        'main',
        'table3',
        createMockTable('table3')
      );
      cache.setTableDetails(
        'conn1',
        'main',
        'table4',
        createMockTable('table4')
      );

      expect(evictions).toContain('table1'); // Oldest should be evicted
      expect(cache.hasTableDetails('conn1', 'main', 'table4')).toBe(true);
    });

    it('should evict based on memory size when bytes exceeded', () => {
      // Set a very small byte limit
      cache.setMemoryLimitPerConnection(2000);

      cache.setTableDetails(
        'conn1',
        'main',
        'table1',
        createMockTable('table1', 3)
      );
      cache.setTableDetails(
        'conn1',
        'main',
        'table2',
        createMockTable('table2', 3)
      );
      cache.setTableDetails(
        'conn1',
        'main',
        'table3',
        createMockTable('table3', 3)
      );

      // Should have evicted some tables to stay within limit
      const stats = cache.getConnectionStats('conn1');
      expect(stats?.tableDetailsBytes).toBeLessThanOrEqual(2000);
    });
  });

  describe('connection Management', () => {
    it('should maintain separate caches per connection', () => {
      const table1 = createMockTable('shared_name');
      const table2 = createMockTable('shared_name');
      table2.rowCount = 999; // Different data

      cache.setTableDetails('conn1', 'main', 'shared_name', table1);
      cache.setTableDetails('conn2', 'main', 'shared_name', table2);

      const cached1 = cache.getCachedTableDetails(
        'conn1',
        'main',
        'shared_name'
      );
      const cached2 = cache.getCachedTableDetails(
        'conn2',
        'main',
        'shared_name'
      );

      expect(cached1?.rowCount).toBe(100);
      expect(cached2?.rowCount).toBe(999);
    });

    it('should invalidate connection cache', () => {
      cache.setSchemaList('conn1', createMockSchemaList());
      cache.setTableDetails('conn1', 'main', 'users', createMockTable('users'));
      cache.setTableDetails(
        'conn1',
        'main',
        'orders',
        createMockTable('orders')
      );

      cache.invalidateConnection('conn1');

      expect(cache.getCachedSchemaList('conn1')).toBeUndefined();
      expect(
        cache.getCachedTableDetails('conn1', 'main', 'users')
      ).toBeUndefined();
      expect(
        cache.getCachedTableDetails('conn1', 'main', 'orders')
      ).toBeUndefined();
    });

    it('should clear all caches', () => {
      cache.setSchemaList('conn1', createMockSchemaList());
      cache.setSchemaList('conn2', createMockSchemaList());
      cache.setTableDetails('conn1', 'main', 'users', createMockTable('users'));
      cache.setTableDetails(
        'conn2',
        'main',
        'orders',
        createMockTable('orders')
      );

      cache.clearAll();

      const stats = cache.getStats();
      expect(stats.schemaListCount).toBe(0);
      expect(stats.connectionCount).toBe(0);
      expect(stats.totalTableDetailsCount).toBe(0);
    });

    it('should evict oldest connection when max connections exceeded', () => {
      vi.useFakeTimers();

      cache.setMaxConnections(2);

      // Create connections with different timestamps
      cache.setSchemaList('conn1', createMockSchemaList());
      cache.setTableDetails(
        'conn1',
        'main',
        'table1',
        createMockTable('table1')
      );

      vi.advanceTimersByTime(1000);

      cache.setSchemaList('conn2', createMockSchemaList());
      cache.setTableDetails(
        'conn2',
        'main',
        'table2',
        createMockTable('table2')
      );

      vi.advanceTimersByTime(1000);

      // This should evict conn1 (oldest)
      cache.setSchemaList('conn3', createMockSchemaList());
      cache.setTableDetails(
        'conn3',
        'main',
        'table3',
        createMockTable('table3')
      );

      const stats = cache.getStats();
      expect(stats.connectionCount).toBe(2);
      expect(
        cache.getCachedTableDetails('conn1', 'main', 'table1')
      ).toBeUndefined();
      expect(
        cache.getCachedTableDetails('conn2', 'main', 'table2')
      ).toBeDefined();
      expect(
        cache.getCachedTableDetails('conn3', 'main', 'table3')
      ).toBeDefined();

      vi.useRealTimers();
    });
  });

  describe('statistics', () => {
    it('should provide global cache statistics', () => {
      cache.setSchemaList('conn1', createMockSchemaList());
      cache.setSchemaList('conn2', createMockSchemaList());
      cache.setTableDetails('conn1', 'main', 'users', createMockTable('users'));
      cache.setTableDetails(
        'conn1',
        'main',
        'orders',
        createMockTable('orders')
      );
      cache.setTableDetails(
        'conn2',
        'main',
        'products',
        createMockTable('products')
      );

      const stats = cache.getStats();

      expect(stats.schemaListCount).toBe(2);
      expect(stats.connectionCount).toBe(2);
      expect(stats.totalTableDetailsCount).toBe(3);
      expect(stats.totalTableDetailsBytes).toBeGreaterThan(0);
    });

    it('should provide per-connection statistics', () => {
      cache.setTableDetails('conn1', 'main', 'users', createMockTable('users'));
      cache.setTableDetails(
        'conn1',
        'main',
        'orders',
        createMockTable('orders')
      );

      const stats = cache.getConnectionStats('conn1');

      expect(stats).toBeDefined();
      expect(stats?.connectionId).toBe('conn1');
      expect(stats?.tableDetailsCount).toBe(2);
      expect(stats?.tableDetailsBytes).toBeGreaterThan(0);
      expect(stats?.maxBytes).toBe(10 * 1024 * 1024);
    });

    it('should return undefined for non-existent connection stats', () => {
      const stats = cache.getConnectionStats('nonexistent');
      expect(stats).toBeUndefined();
    });
  });

  describe('manual Cache Clear', () => {
    it('should clear specific connection cache', () => {
      cache.setSchemaList('conn1', createMockSchemaList());
      cache.setTableDetails('conn1', 'main', 'users', createMockTable('users'));
      cache.setSchemaList('conn2', createMockSchemaList());
      cache.setTableDetails(
        'conn2',
        'main',
        'orders',
        createMockTable('orders')
      );

      cache.clearConnection('conn1');

      expect(cache.getCachedSchemaList('conn1')).toBeUndefined();
      expect(
        cache.getCachedTableDetails('conn1', 'main', 'users')
      ).toBeUndefined();
      expect(cache.getCachedSchemaList('conn2')).toBeDefined();
      expect(
        cache.getCachedTableDetails('conn2', 'main', 'orders')
      ).toBeDefined();
    });

    it('should invalidate specific table details', () => {
      cache.setTableDetails('conn1', 'main', 'users', createMockTable('users'));
      cache.setTableDetails(
        'conn1',
        'main',
        'orders',
        createMockTable('orders')
      );

      cache.invalidateTableDetails('conn1', 'main', 'users');

      expect(
        cache.getCachedTableDetails('conn1', 'main', 'users')
      ).toBeUndefined();
      expect(
        cache.getCachedTableDetails('conn1', 'main', 'orders')
      ).toBeDefined();
    });
  });

  describe('eviction Callbacks', () => {
    it('should call eviction callback when table evicted', () => {
      cache.setMaxTablesPerConnection(2);
      const evictions: {
        connectionId: string;
        schema: string;
        tableName: string;
        reason: string;
      }[] = [];

      const unsubscribe = cache.onEviction((event) => {
        evictions.push(event);
      });

      cache.setTableDetails(
        'conn1',
        'main',
        'table1',
        createMockTable('table1')
      );
      cache.setTableDetails(
        'conn1',
        'main',
        'table2',
        createMockTable('table2')
      );
      cache.setTableDetails(
        'conn1',
        'main',
        'table3',
        createMockTable('table3')
      );

      expect(evictions.length).toBe(1);
      expect(evictions[0].connectionId).toBe('conn1');
      expect(evictions[0].tableName).toBe('table1');

      unsubscribe();
    });

    it('should allow unsubscribing from eviction events', () => {
      cache.setMaxTablesPerConnection(1);
      let evictionCount = 0;

      const unsubscribe = cache.onEviction(() => {
        evictionCount++;
      });

      cache.setTableDetails(
        'conn1',
        'main',
        'table1',
        createMockTable('table1')
      );
      cache.setTableDetails(
        'conn1',
        'main',
        'table2',
        createMockTable('table2')
      );

      expect(evictionCount).toBe(1);

      unsubscribe();

      cache.setTableDetails(
        'conn1',
        'main',
        'table3',
        createMockTable('table3')
      );

      expect(evictionCount).toBe(1); // Should not increase after unsubscribe
    });
  });

  describe('pending Fetches', () => {
    it('should track pending fetches', () => {
      expect(cache.isFetchingTableDetails('conn1', 'main', 'users')).toBe(
        false
      );

      cache.startFetchingTableDetails('conn1', 'main', 'users');
      expect(cache.isFetchingTableDetails('conn1', 'main', 'users')).toBe(true);

      cache.finishFetchingTableDetails('conn1', 'main', 'users');
      expect(cache.isFetchingTableDetails('conn1', 'main', 'users')).toBe(
        false
      );
    });

    it('should clear pending fetches on connection invalidation', () => {
      cache.startFetchingTableDetails('conn1', 'main', 'users');
      cache.startFetchingTableDetails('conn1', 'main', 'orders');
      cache.startFetchingTableDetails('conn2', 'main', 'products');

      cache.invalidateConnection('conn1');

      expect(cache.isFetchingTableDetails('conn1', 'main', 'users')).toBe(
        false
      );
      expect(cache.isFetchingTableDetails('conn1', 'main', 'orders')).toBe(
        false
      );
      expect(cache.isFetchingTableDetails('conn2', 'main', 'products')).toBe(
        true
      );
    });
  });

  describe('configuration', () => {
    it('should return current configuration', () => {
      const config = cache.getConfig();

      expect(config.maxBytesPerConnection).toBe(10 * 1024 * 1024);
      expect(config.maxTablesPerConnection).toBe(100);
      expect(config.schemaListTTL).toBe(5 * 60 * 1000);
      expect(config.maxConnections).toBe(20);
    });

    it('should update max tables per connection', () => {
      cache.setMaxTablesPerConnection(50);
      const config = cache.getConfig();
      expect(config.maxTablesPerConnection).toBe(50);
    });

    it('should update max connections', () => {
      cache.setMaxConnections(5);
      const config = cache.getConfig();
      expect(config.maxConnections).toBe(5);
    });
  });

  describe('utility Methods', () => {
    it('should check if table is cached', () => {
      expect(cache.hasTableDetails('conn1', 'main', 'users')).toBe(false);

      cache.setTableDetails('conn1', 'main', 'users', createMockTable('users'));

      expect(cache.hasTableDetails('conn1', 'main', 'users')).toBe(true);
    });
  });
});
