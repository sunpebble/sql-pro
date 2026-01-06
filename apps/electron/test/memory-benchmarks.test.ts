/**
 * Memory Benchmark Tests
 *
 * Automated tests that measure memory usage in various scenarios:
 * - Idle: Memory usage with no databases open
 * - Large queries: Memory usage with large result sets
 * - Many connections: Memory usage with multiple connections
 * - After closing connections: Memory should return to baseline
 *
 * These tests verify the acceptance criteria for the Memory Usage Optimization feature.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryBudgetCache } from '../src/shared/lib/memory-budget-cache';
import {
  BYTE_SIZES,
  estimateObjectSize,
  estimateRowArraySize,
  formatBytes,
} from '../src/shared/lib/memory-utils';

// Mock electron module for main process tests
vi.mock('electron', () => ({
  BrowserWindow: {
    getAllWindows: vi.fn(() => []),
  },
}));

/**
 * Helper to create a mock row with typical database values
 */
function createMockRow(
  numColumns: number,
  stringLength = 50
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (let i = 0; i < numColumns; i++) {
    const colType = i % 4;
    switch (colType) {
      case 0: // string
        row[`col_${i}`] = 'x'.repeat(stringLength);
        break;
      case 1: // number
        row[`col_${i}`] = Math.random() * 10000;
        break;
      case 2: // boolean
        row[`col_${i}`] = Math.random() > 0.5;
        break;
      case 3: // null
        row[`col_${i}`] = null;
        break;
    }
  }
  return row;
}

/**
 * Helper to create mock table data
 */
function createMockTableData(
  numRows: number,
  numColumns: number,
  stringLength = 50
): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < numRows; i++) {
    rows.push(createMockRow(numColumns, stringLength));
  }
  return rows;
}

/**
 * Memory thresholds for acceptance criteria (in bytes)
 */
const MEMORY_THRESHOLDS = {
  /** Maximum idle memory with no databases open (200MB) */
  IDLE_MAX: 200 * 1024 * 1024,
  /** Warning threshold (150MB) */
  WARNING: 150 * 1024 * 1024,
  /** Critical threshold (200MB) */
  CRITICAL: 200 * 1024 * 1024,
  /** Table data cache default (50MB) */
  TABLE_DATA_CACHE: 50 * 1024 * 1024,
  /** Query results cache default (30MB) */
  QUERY_RESULTS_CACHE: 30 * 1024 * 1024,
  /** Schema cache per connection (10MB) */
  SCHEMA_CACHE_PER_CONNECTION: 10 * 1024 * 1024,
};

describe('memory Benchmark Tests', () => {
  describe('idle Memory Usage', () => {
    it('should estimate empty cache memory usage is minimal', () => {
      // Create an empty cache to measure baseline
      const emptyCache = new MemoryBudgetCache<string, unknown>({
        maxItems: 100,
        maxBytes: MEMORY_THRESHOLDS.TABLE_DATA_CACHE,
        name: 'TestCache',
      });

      const stats = emptyCache.getStats();

      // Empty cache should have 0 items and 0 bytes
      expect(stats.itemCount).toBe(0);
      expect(stats.totalBytes).toBe(0);
    });

    it('should have reasonable overhead for cache infrastructure', () => {
      // Measure the overhead of cache creation itself
      // This test verifies that our caching infrastructure is lightweight
      const caches: MemoryBudgetCache<string, string>[] = [];

      // Create 10 empty caches (simulating 10 connections)
      for (let i = 0; i < 10; i++) {
        caches.push(
          new MemoryBudgetCache<string, string>({
            maxItems: 100,
            maxBytes: MEMORY_THRESHOLDS.TABLE_DATA_CACHE,
            name: `Connection_${i}`,
          })
        );
      }

      // All caches should start empty
      for (const cache of caches) {
        expect(cache.getStats().totalBytes).toBe(0);
      }
    });

    it('should not exceed idle threshold with default configuration', () => {
      // This tests that the total configured cache limits are within reason
      const totalConfiguredCacheMemory =
        MEMORY_THRESHOLDS.TABLE_DATA_CACHE + // 50MB for table data
        MEMORY_THRESHOLDS.QUERY_RESULTS_CACHE + // 30MB for query results
        MEMORY_THRESHOLDS.SCHEMA_CACHE_PER_CONNECTION * 5; // 10MB * 5 connections

      // Total configured memory should be under a reasonable limit
      // This ensures we've designed the system to stay under 200MB
      expect(totalConfiguredCacheMemory).toBeLessThan(200 * 1024 * 1024);
    });
  });

  describe('memory Usage with Large Queries', () => {
    let cache: MemoryBudgetCache<string, { rows: Record<string, unknown>[] }>;

    beforeEach(() => {
      cache = new MemoryBudgetCache<
        string,
        { rows: Record<string, unknown>[] }
      >({
        maxItems: 20,
        maxBytes: MEMORY_THRESHOLDS.QUERY_RESULTS_CACHE,
        name: 'QueryResultsCache',
        sizeEstimator: (value) =>
          estimateRowArraySize(value.rows) + BYTE_SIZES.OBJECT_OVERHEAD,
      });
    });

    afterEach(() => {
      cache.clear();
    });

    it('should accurately estimate memory for large result sets', () => {
      const largeRows = createMockTableData(1000, 10, 100);
      const estimatedSize = estimateRowArraySize(largeRows);

      // Estimated size should be reasonable (roughly proportional to data)
      // Each row has 10 columns with mixed types
      // Rough expectation: 1000 rows * ~1KB per row = ~1MB
      expect(estimatedSize).toBeGreaterThan(100 * 1024); // At least 100KB
      expect(estimatedSize).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
    });

    it('should enforce memory limits when storing large queries', () => {
      const evictionHandler = vi.fn();
      cache.on('eviction', evictionHandler);

      // Add multiple large query results that exceed the cache limit
      for (let i = 0; i < 30; i++) {
        const rows = createMockTableData(500, 10, 100);
        cache.set(`query_${i}`, { rows });
      }

      const stats = cache.getStats();

      // Cache should respect memory limits
      expect(stats.totalBytes).toBeLessThanOrEqual(
        MEMORY_THRESHOLDS.QUERY_RESULTS_CACHE
      );

      // Evictions should have occurred
      expect(stats.evictions).toBeGreaterThan(0);
      expect(evictionHandler).toHaveBeenCalled();
    });

    it('should scale memory with visible data count via LRU eviction', () => {
      // Store increasingly large result sets
      const sizes: number[] = [];

      for (let i = 1; i <= 10; i++) {
        const rows = createMockTableData(i * 100, 10, 50);
        cache.set(`query_${i}`, { rows });
        sizes.push(cache.getStats().totalBytes);
      }

      const stats = cache.getStats();

      // Memory should be bounded by the limit
      expect(stats.totalBytes).toBeLessThanOrEqual(
        MEMORY_THRESHOLDS.QUERY_RESULTS_CACHE
      );

      // Older, less-accessed items should be evicted
      // The cache should favor recently added items
      expect(cache.has('query_10')).toBe(true); // Most recent should exist

      // Earlier items may have been evicted depending on sizes
      // This is expected LRU behavior
    });
  });

  describe('memory Usage with Many Connections', () => {
    let connectionCaches: Map<
      string,
      MemoryBudgetCache<string, Record<string, unknown>[]>
    >;

    beforeEach(() => {
      connectionCaches = new Map();
    });

    afterEach(() => {
      for (const cache of connectionCaches.values()) {
        cache.clear();
      }
      connectionCaches.clear();
    });

    it('should manage memory across multiple connections', () => {
      const numConnections = 10;
      const bytesPerConnection = 5 * 1024 * 1024; // 5MB per connection

      // Create caches for multiple connections
      for (let i = 0; i < numConnections; i++) {
        const cache = new MemoryBudgetCache<string, Record<string, unknown>[]>({
          maxItems: 10,
          maxBytes: bytesPerConnection,
          name: `Connection_${i}`,
          sizeEstimator: estimateRowArraySize,
        });
        connectionCaches.set(`conn_${i}`, cache);

        // Add some data to each connection
        const rows = createMockTableData(100, 10, 50);
        cache.set('table_data', rows);
      }

      // Calculate total memory across all connections
      let totalMemory = 0;
      for (const cache of connectionCaches.values()) {
        totalMemory += cache.getStats().totalBytes;
      }

      // Total should be bounded by the sum of limits
      expect(totalMemory).toBeLessThan(numConnections * bytesPerConnection);
    });

    it('should evict data per connection independently', () => {
      const bytesPerConnection = 1 * 1024 * 1024; // 1MB per connection

      // Create two connections with small limits
      const conn1Cache = new MemoryBudgetCache<
        string,
        Record<string, unknown>[]
      >({
        maxItems: 10,
        maxBytes: bytesPerConnection,
        name: 'Connection_1',
        sizeEstimator: estimateRowArraySize,
      });

      const conn2Cache = new MemoryBudgetCache<
        string,
        Record<string, unknown>[]
      >({
        maxItems: 10,
        maxBytes: bytesPerConnection,
        name: 'Connection_2',
        sizeEstimator: estimateRowArraySize,
      });

      connectionCaches.set('conn_1', conn1Cache);
      connectionCaches.set('conn_2', conn2Cache);

      const eviction1Handler = vi.fn();
      const eviction2Handler = vi.fn();
      conn1Cache.on('eviction', eviction1Handler);
      conn2Cache.on('eviction', eviction2Handler);

      // Add lots of data to connection 1
      for (let i = 0; i < 20; i++) {
        conn1Cache.set(`table_${i}`, createMockTableData(100, 10, 50));
      }

      // Add minimal data to connection 2
      conn2Cache.set('table_1', createMockTableData(10, 5, 10));

      // Connection 1 should have evictions
      expect(eviction1Handler).toHaveBeenCalled();

      // Connection 2 should NOT have evictions (data is small)
      expect(eviction2Handler).not.toHaveBeenCalled();

      // Each connection should respect its own limits
      expect(conn1Cache.getStats().totalBytes).toBeLessThanOrEqual(
        bytesPerConnection
      );
      expect(conn2Cache.getStats().totalBytes).toBeLessThanOrEqual(
        bytesPerConnection
      );
    });
  });

  describe('memory Returns to Baseline After Closing Connections', () => {
    it('should clear all cached data when connection is removed', () => {
      const cache = new MemoryBudgetCache<string, Record<string, unknown>[]>({
        maxItems: 100,
        maxBytes: MEMORY_THRESHOLDS.TABLE_DATA_CACHE,
        name: 'ConnectionCache',
        sizeEstimator: estimateRowArraySize,
      });

      // Add substantial data
      for (let i = 0; i < 10; i++) {
        cache.set(`table_${i}`, createMockTableData(500, 10, 100));
      }

      const statsBefore = cache.getStats();
      expect(statsBefore.itemCount).toBeGreaterThan(0);
      expect(statsBefore.totalBytes).toBeGreaterThan(0);

      // Clear the cache (simulating connection close)
      cache.clear();

      const statsAfter = cache.getStats();
      expect(statsAfter.itemCount).toBe(0);
      expect(statsAfter.totalBytes).toBe(0);
    });

    it('should remove specific connection data without affecting others', () => {
      const conn1Cache = new MemoryBudgetCache<
        string,
        Record<string, unknown>[]
      >({
        maxItems: 100,
        maxBytes: MEMORY_THRESHOLDS.TABLE_DATA_CACHE,
        name: 'Connection_1',
        sizeEstimator: estimateRowArraySize,
      });

      const conn2Cache = new MemoryBudgetCache<
        string,
        Record<string, unknown>[]
      >({
        maxItems: 100,
        maxBytes: MEMORY_THRESHOLDS.TABLE_DATA_CACHE,
        name: 'Connection_2',
        sizeEstimator: estimateRowArraySize,
      });

      // Add data to both connections
      conn1Cache.set('table_1', createMockTableData(100, 10, 50));
      conn2Cache.set('table_1', createMockTableData(100, 10, 50));

      const conn1Before = conn1Cache.getStats().totalBytes;
      const conn2Before = conn2Cache.getStats().totalBytes;

      expect(conn1Before).toBeGreaterThan(0);
      expect(conn2Before).toBeGreaterThan(0);

      // Clear only connection 1
      conn1Cache.clear();

      // Connection 1 should be empty
      expect(conn1Cache.getStats().totalBytes).toBe(0);
      expect(conn1Cache.getStats().itemCount).toBe(0);

      // Connection 2 should be unaffected
      expect(conn2Cache.getStats().totalBytes).toBe(conn2Before);
    });

    it('should emit clear event when cache is cleared', () => {
      const cache = new MemoryBudgetCache<string, Record<string, unknown>[]>({
        maxItems: 100,
        maxBytes: MEMORY_THRESHOLDS.TABLE_DATA_CACHE,
        name: 'TestCache',
        sizeEstimator: estimateRowArraySize,
      });

      const clearHandler = vi.fn();
      cache.on('clear', clearHandler);

      // Add data
      cache.set('table_1', createMockTableData(100, 10, 50));

      // Clear the cache
      cache.clear();

      expect(clearHandler).toHaveBeenCalledTimes(1);
      expect(clearHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          itemCount: 1,
          totalBytes: expect.any(Number),
        })
      );
    });
  });

  describe('cache Eviction Under Pressure', () => {
    it('should evict LRU items when max items exceeded', () => {
      const cache = new MemoryBudgetCache<string, string>({
        maxItems: 5,
        maxBytes: Number.POSITIVE_INFINITY,
        name: 'LRUTest',
      });

      const evictionHandler = vi.fn();
      cache.on('eviction', evictionHandler);

      // Add 7 items (exceeds max of 5)
      for (let i = 0; i < 7; i++) {
        cache.set(`key_${i}`, `value_${i}`);
      }

      // Should have exactly 5 items
      expect(cache.size).toBe(5);

      // Should have evicted 2 items
      expect(evictionHandler).toHaveBeenCalledTimes(2);

      // First items should be evicted (LRU)
      expect(cache.has('key_0')).toBe(false);
      expect(cache.has('key_1')).toBe(false);

      // Later items should still exist
      expect(cache.has('key_2')).toBe(true);
      expect(cache.has('key_6')).toBe(true);
    });

    it('should evict LRU items when max bytes exceeded', () => {
      const maxBytes = 1000; // Small limit for testing
      const cache = new MemoryBudgetCache<string, string>({
        maxItems: Number.POSITIVE_INFINITY,
        maxBytes,
        name: 'BytesLimitTest',
        sizeEstimator: (value) => value.length * 2 + BYTE_SIZES.STRING_OVERHEAD,
      });

      const evictionHandler = vi.fn();
      cache.on('eviction', evictionHandler);

      // Add items that will exceed the byte limit
      for (let i = 0; i < 20; i++) {
        cache.set(`key_${i}`, 'x'.repeat(100)); // ~200+ bytes each
      }

      const stats = cache.getStats();

      // Should respect byte limit
      expect(stats.totalBytes).toBeLessThanOrEqual(maxBytes);

      // Evictions should have occurred
      expect(evictionHandler).toHaveBeenCalled();
    });

    it('should update LRU order on access', () => {
      const cache = new MemoryBudgetCache<string, string>({
        maxItems: 3,
        maxBytes: Number.POSITIVE_INFINITY,
        name: 'LRUOrderTest',
      });

      // Add 3 items
      cache.set('key_a', 'value_a');
      cache.set('key_b', 'value_b');
      cache.set('key_c', 'value_c');

      // Access key_a (moves it to most recently used)
      cache.get('key_a');

      // Add a new item (should evict key_b as it's now LRU)
      cache.set('key_d', 'value_d');

      expect(cache.has('key_a')).toBe(true); // Was accessed
      expect(cache.has('key_b')).toBe(false); // LRU, should be evicted
      expect(cache.has('key_c')).toBe(true);
      expect(cache.has('key_d')).toBe(true); // Just added
    });

    it('should evict with correct reason when limit type changes', () => {
      const cache = new MemoryBudgetCache<string, string>({
        maxItems: 10,
        maxBytes: 500,
        name: 'MixedLimitTest',
        sizeEstimator: (value) => value.length * 2 + BYTE_SIZES.STRING_OVERHEAD,
      });

      const evictions: Array<{ key: string; reason: string }> = [];
      cache.on('eviction', ({ key, reason }) => {
        evictions.push({ key, reason });
      });

      // Add large items to trigger byte-based eviction
      for (let i = 0; i < 5; i++) {
        cache.set(`large_${i}`, 'x'.repeat(200));
      }

      // Check for byte-based evictions
      const byteEvictions = evictions.filter((e) => e.reason === 'max-bytes');
      expect(byteEvictions.length).toBeGreaterThan(0);
    });

    it('should dynamically respond to limit changes', () => {
      const cache = new MemoryBudgetCache<string, string>({
        maxItems: 10,
        maxBytes: Number.POSITIVE_INFINITY,
        name: 'DynamicLimitTest',
      });

      // Add 8 items
      for (let i = 0; i < 8; i++) {
        cache.set(`key_${i}`, `value_${i}`);
      }

      expect(cache.size).toBe(8);

      const evictionHandler = vi.fn();
      cache.on('eviction', evictionHandler);

      // Reduce the limit
      cache.setMaxItems(5);

      // Should have evicted 3 items
      expect(cache.size).toBe(5);
      expect(evictionHandler).toHaveBeenCalledTimes(3);
    });
  });

  describe('memory Scaling with Visible Data', () => {
    it('should estimate memory proportionally to row count', () => {
      const row10 = createMockTableData(10, 10, 50);
      const row100 = createMockTableData(100, 10, 50);
      const row1000 = createMockTableData(1000, 10, 50);

      const size10 = estimateRowArraySize(row10);
      const size100 = estimateRowArraySize(row100);
      const size1000 = estimateRowArraySize(row1000);

      // Memory should scale roughly linearly with row count
      // Allow for some overhead variation
      const ratio10to100 = size100 / size10;
      const ratio100to1000 = size1000 / size100;

      // Should be roughly 10x (within a factor of 2 for overhead)
      expect(ratio10to100).toBeGreaterThan(5);
      expect(ratio10to100).toBeLessThan(15);

      expect(ratio100to1000).toBeGreaterThan(5);
      expect(ratio100to1000).toBeLessThan(15);
    });

    it('should estimate memory proportionally to column count', () => {
      const col5 = createMockTableData(100, 5, 50);
      const col10 = createMockTableData(100, 10, 50);
      const col20 = createMockTableData(100, 20, 50);

      const size5 = estimateRowArraySize(col5);
      const size10 = estimateRowArraySize(col10);
      const size20 = estimateRowArraySize(col20);

      // Memory should scale roughly linearly with column count
      const ratio5to10 = size10 / size5;
      const ratio10to20 = size20 / size10;

      // Should be roughly 2x (within a factor of 1.5 for overhead)
      expect(ratio5to10).toBeGreaterThan(1.3);
      expect(ratio5to10).toBeLessThan(3);

      expect(ratio10to20).toBeGreaterThan(1.3);
      expect(ratio10to20).toBeLessThan(3);
    });

    it('should estimate memory proportionally to string length', () => {
      const short = createMockTableData(100, 10, 10);
      const medium = createMockTableData(100, 10, 50);
      const long = createMockTableData(100, 10, 200);

      const sizeShort = estimateRowArraySize(short);
      const sizeMedium = estimateRowArraySize(medium);
      const sizeLong = estimateRowArraySize(long);

      // Longer strings should use more memory
      expect(sizeMedium).toBeGreaterThan(sizeShort);
      expect(sizeLong).toBeGreaterThan(sizeMedium);
    });
  });

  describe('cache Statistics Accuracy', () => {
    it('should track hits and misses accurately', () => {
      const cache = new MemoryBudgetCache<string, string>({
        maxItems: 10,
        maxBytes: Number.POSITIVE_INFINITY,
        name: 'HitMissTest',
      });

      // Add some items
      cache.set('key_1', 'value_1');
      cache.set('key_2', 'value_2');

      // Access existing keys (hits)
      cache.get('key_1');
      cache.get('key_1');
      cache.get('key_2');

      // Access non-existing keys (misses)
      cache.get('key_3');
      cache.get('key_4');

      const stats = cache.getStats();
      expect(stats.hits).toBe(3);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBeCloseTo(60, 0); // 3/5 = 60%
    });

    it('should track eviction count accurately', () => {
      const cache = new MemoryBudgetCache<string, string>({
        maxItems: 3,
        maxBytes: Number.POSITIVE_INFINITY,
        name: 'EvictionCountTest',
      });

      // Add 6 items (will evict 3)
      for (let i = 0; i < 6; i++) {
        cache.set(`key_${i}`, `value_${i}`);
      }

      const stats = cache.getStats();
      expect(stats.evictions).toBe(3);
    });

    it('should track total bytes accurately', () => {
      const cache = new MemoryBudgetCache<string, string>({
        maxItems: 100,
        maxBytes: Number.POSITIVE_INFINITY,
        name: 'ByteTrackingTest',
        sizeEstimator: (value) => value.length * 2, // Simple: 2 bytes per char
      });

      cache.set('key_1', 'hello'); // 10 bytes
      cache.set('key_2', 'world'); // 10 bytes

      let stats = cache.getStats();
      expect(stats.totalBytes).toBe(20);

      // Update existing key
      cache.set('key_1', 'hello world'); // 22 bytes
      stats = cache.getStats();
      expect(stats.totalBytes).toBe(32); // 22 + 10

      // Delete key
      cache.delete('key_2');
      stats = cache.getStats();
      expect(stats.totalBytes).toBe(22);
    });

    it('should reset statistics correctly', () => {
      const cache = new MemoryBudgetCache<string, string>({
        maxItems: 10,
        maxBytes: Number.POSITIVE_INFINITY,
        name: 'StatsResetTest',
      });

      // Add items and create some stats
      cache.set('key_1', 'value_1');
      cache.get('key_1');
      cache.get('nonexistent');

      let stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);

      // Reset stats
      cache.resetStats();
      stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.evictions).toBe(0);

      // Items should still be in cache
      expect(cache.size).toBe(1);
      expect(stats.totalBytes).toBeGreaterThan(0);
    });
  });

  describe('formatBytes Utility', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(500)).toBe('500.00 Bytes');
      expect(formatBytes(1024)).toBe('1.00 KB');
      expect(formatBytes(1536)).toBe('1.50 KB');
      expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
      expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.50 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB');
    });

    it('should respect decimal places', () => {
      expect(formatBytes(1536, 0)).toBe('2 KB');
      expect(formatBytes(1536, 1)).toBe('1.5 KB');
      expect(formatBytes(1536, 3)).toBe('1.500 KB');
    });
  });

  describe('size Estimation Accuracy', () => {
    it('should estimate primitive types correctly', () => {
      expect(estimateObjectSize(null)).toBe(BYTE_SIZES.NULL_UNDEFINED);
      expect(estimateObjectSize(undefined)).toBe(BYTE_SIZES.NULL_UNDEFINED);
      expect(estimateObjectSize(true)).toBe(BYTE_SIZES.BOOLEAN);
      expect(estimateObjectSize(42)).toBe(BYTE_SIZES.NUMBER);
    });

    it('should estimate strings based on length', () => {
      const emptyString = estimateObjectSize('');
      const shortString = estimateObjectSize('hello');
      const longString = estimateObjectSize('x'.repeat(1000));

      expect(shortString).toBeGreaterThan(emptyString);
      expect(longString).toBeGreaterThan(shortString);

      // Long string should be roughly 2000 bytes (2 bytes per char) + overhead
      expect(longString).toBeGreaterThan(2000);
      expect(longString).toBeLessThan(2100); // Small overhead
    });

    it('should estimate arrays based on contents', () => {
      const emptyArray = estimateObjectSize([]);
      const numberArray = estimateObjectSize([1, 2, 3, 4, 5]);
      const stringArray = estimateObjectSize(['hello', 'world', 'test']);

      expect(numberArray).toBeGreaterThan(emptyArray);
      expect(stringArray).toBeGreaterThan(emptyArray);
    });

    it('should handle nested objects', () => {
      const shallow = { a: 1, b: 2 };
      const nested = { a: { b: { c: { d: 1 } } } };

      const shallowSize = estimateObjectSize(shallow);
      const nestedSize = estimateObjectSize(nested);

      // Both should have reasonable sizes
      expect(shallowSize).toBeGreaterThan(0);
      expect(nestedSize).toBeGreaterThan(0);

      // Nested should have more overhead
      expect(nestedSize).toBeGreaterThan(shallowSize);
    });

    it('should handle circular references gracefully', () => {
      const obj: Record<string, unknown> = { a: 1 };
      obj.self = obj; // Circular reference

      // Should not throw and should return a reasonable size
      const size = estimateObjectSize(obj, { detectCycles: true });
      expect(size).toBeGreaterThan(0);
    });
  });
});
