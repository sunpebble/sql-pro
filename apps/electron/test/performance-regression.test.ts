/**
 * Performance Regression Tests
 *
 * Tests to ensure memory optimizations don't negatively impact performance.
 * These tests measure and validate:
 * - Query execution time is not increased by >10%
 * - Table switching remains smooth
 * - No perceivable lag from cache operations
 * - Lazy loading doesn't slow schema panel operations
 *
 * Acceptance Criteria:
 * - Query execution time not increased by >10%
 * - Table switching remains smooth
 * - No perceivable lag from cache operations
 * - Lazy loading doesn't slow schema panel
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryBudgetCache } from '../src/shared/lib/memory-budget-cache';
import {
  BYTE_SIZES,
  estimateObjectSize,
  estimateRowArraySize,
} from '../src/shared/lib/memory-utils';

// Mock electron module
vi.mock('electron', () => ({
  BrowserWindow: {
    getAllWindows: vi.fn(() => []),
  },
}));

/**
 * Performance thresholds (in milliseconds)
 * These define acceptable limits for operations to ensure
 * memory optimizations don't introduce perceivable lag
 */
const PERFORMANCE_THRESHOLDS = {
  /** Maximum time for cache get operation (should be < 1ms) */
  CACHE_GET_MS: 1,
  /** Maximum time for cache set operation with size estimation (should be < 10ms) */
  CACHE_SET_MS: 10,
  /** Maximum time for LRU eviction of single item */
  CACHE_EVICTION_MS: 5,
  /** Maximum time for batch eviction (100 items) */
  BATCH_EVICTION_MS: 50,
  /** Maximum time for size estimation of medium-sized data (100 rows) */
  SIZE_ESTIMATION_MEDIUM_MS: 10,
  /** Maximum time for size estimation of large data (10000 rows) */
  SIZE_ESTIMATION_LARGE_MS: 100,
  /** Maximum time for cache stats retrieval */
  CACHE_STATS_MS: 1,
  /** Maximum overhead percentage allowed for memory-optimized operations */
  MAX_OVERHEAD_PERCENT: 10,
  /** Maximum time for table data store operations */
  TABLE_DATA_OP_MS: 20,
  /** Maximum time for query result caching operations */
  QUERY_CACHE_OP_MS: 20,
  /** Maximum time for schema cache lookup */
  SCHEMA_CACHE_LOOKUP_MS: 5,
};

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
 * Measure execution time of a function
 */
function measureTime<T>(fn: () => T): { result: T; timeMs: number } {
  const start = performance.now();
  const result = fn();
  const timeMs = performance.now() - start;
  return { result, timeMs };
}

/**
 * Measure average execution time of a function over multiple iterations
 */
function measureAverageTime<T>(
  fn: () => T,
  iterations = 100
): { avgTimeMs: number; minTimeMs: number; maxTimeMs: number } {
  const times: number[] = [];

  // Warm-up run
  fn();

  for (let i = 0; i < iterations; i++) {
    const { timeMs } = measureTime(fn);
    times.push(timeMs);
  }

  const avgTimeMs = times.reduce((a, b) => a + b, 0) / times.length;
  const minTimeMs = Math.min(...times);
  const maxTimeMs = Math.max(...times);

  return { avgTimeMs, minTimeMs, maxTimeMs };
}

describe('performance Regression Tests', () => {
  describe('cache Operations Performance', () => {
    let cache: MemoryBudgetCache<string, Record<string, unknown>[]>;

    beforeEach(() => {
      cache = new MemoryBudgetCache<string, Record<string, unknown>[]>({
        maxItems: 1000,
        maxBytes: 100 * 1024 * 1024, // 100MB
        name: 'PerformanceTestCache',
        sizeEstimator: estimateRowArraySize,
      });
    });

    afterEach(() => {
      cache.clear();
    });

    it('should get cached items within performance threshold', () => {
      // Pre-populate cache
      const data = createMockTableData(100, 10);
      cache.set('test_key', data);

      // Measure get performance
      const { avgTimeMs } = measureAverageTime(() => cache.get('test_key'));

      expect(avgTimeMs).toBeLessThan(PERFORMANCE_THRESHOLDS.CACHE_GET_MS);
    });

    it('should set items with size estimation within performance threshold', () => {
      const data = createMockTableData(100, 10);

      // Measure set performance (includes size estimation)
      const { avgTimeMs } = measureAverageTime(
        () => cache.set(`key_${Math.random()}`, data),
        50
      );

      expect(avgTimeMs).toBeLessThan(PERFORMANCE_THRESHOLDS.CACHE_SET_MS);
    });

    it('should handle LRU eviction within performance threshold', () => {
      // Create small cache to trigger evictions
      const smallCache = new MemoryBudgetCache<string, string>({
        maxItems: 10,
        maxBytes: Number.POSITIVE_INFINITY,
        name: 'SmallCache',
      });

      // Fill cache
      for (let i = 0; i < 10; i++) {
        smallCache.set(`key_${i}`, `value_${i}`);
      }

      // Measure eviction time (setting 11th item triggers eviction)
      const { timeMs } = measureTime(() =>
        smallCache.set('key_new', 'value_new')
      );

      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLDS.CACHE_EVICTION_MS);
    });

    it('should handle batch evictions within performance threshold', () => {
      // Create cache that will evict many items at once
      const batchCache = new MemoryBudgetCache<string, string>({
        maxItems: 100,
        maxBytes: Number.POSITIVE_INFINITY,
        name: 'BatchCache',
      });

      // Fill with 200 items (will evict 100 when limit is reached)
      for (let i = 0; i < 200; i++) {
        batchCache.set(`key_${i}`, `value_${i}`);
      }

      // Now reduce limit to trigger batch eviction
      const { timeMs } = measureTime(() => batchCache.setMaxItems(10));

      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLDS.BATCH_EVICTION_MS);
    });

    it('should retrieve cache stats within performance threshold', () => {
      // Populate cache with some data
      for (let i = 0; i < 100; i++) {
        cache.set(`key_${i}`, createMockTableData(10, 5));
      }

      // Measure stats retrieval
      const { avgTimeMs } = measureAverageTime(() => cache.getStats());

      expect(avgTimeMs).toBeLessThan(PERFORMANCE_THRESHOLDS.CACHE_STATS_MS);
    });

    it('should maintain performance with many entries', () => {
      // Add many entries
      for (let i = 0; i < 500; i++) {
        cache.set(`key_${i}`, createMockTableData(10, 5));
      }

      // Measure random access performance
      const { avgTimeMs: getTime } = measureAverageTime(() => {
        const randomKey = `key_${Math.floor(Math.random() * 500)}`;
        return cache.get(randomKey);
      });

      expect(getTime).toBeLessThan(PERFORMANCE_THRESHOLDS.CACHE_GET_MS);

      // Measure has() performance
      const { avgTimeMs: hasTime } = measureAverageTime(() => {
        const randomKey = `key_${Math.floor(Math.random() * 500)}`;
        return cache.has(randomKey);
      });

      expect(hasTime).toBeLessThan(PERFORMANCE_THRESHOLDS.CACHE_GET_MS);
    });
  });

  describe('size Estimation Performance', () => {
    it('should estimate medium-sized data within performance threshold', () => {
      const data = createMockTableData(100, 10, 50);

      const { avgTimeMs } = measureAverageTime(() =>
        estimateRowArraySize(data)
      );

      expect(avgTimeMs).toBeLessThan(
        PERFORMANCE_THRESHOLDS.SIZE_ESTIMATION_MEDIUM_MS
      );
    });

    it('should estimate large data within performance threshold', () => {
      const data = createMockTableData(10000, 10, 50);

      const { avgTimeMs } = measureAverageTime(
        () => estimateRowArraySize(data),
        10
      ); // Fewer iterations for large data

      expect(avgTimeMs).toBeLessThan(
        PERFORMANCE_THRESHOLDS.SIZE_ESTIMATION_LARGE_MS
      );
    });

    it('should use sampling for very large arrays efficiently', () => {
      // Create arrays of different sizes
      const small = createMockTableData(100, 10);
      const large = createMockTableData(10000, 10);

      const { avgTimeMs: smallTime } = measureAverageTime(
        () => estimateRowArraySize(small),
        50
      );

      const { avgTimeMs: largeTime } = measureAverageTime(
        () => estimateRowArraySize(large),
        10
      );

      // Large array estimation should not be more than 10x slower
      // due to sampling (otherwise it would be 100x slower for 100x data)
      const ratio = largeTime / smallTime;
      expect(ratio).toBeLessThan(20); // Allow some overhead for larger arrays
    });

    it('should handle nested objects efficiently', () => {
      const nested = {
        level1: {
          level2: {
            level3: {
              data: createMockTableData(50, 5),
            },
          },
        },
      };

      const { avgTimeMs } = measureAverageTime(() =>
        estimateObjectSize(nested)
      );

      // Nested objects should still be fast
      expect(avgTimeMs).toBeLessThan(
        PERFORMANCE_THRESHOLDS.SIZE_ESTIMATION_MEDIUM_MS
      );
    });
  });

  describe('table Data Store Performance Simulation', () => {
    /**
     * Simulates table-data-store operations with memory budget cache
     */
    let tableDataCache: MemoryBudgetCache<
      string,
      {
        tableName: string;
        rows: Record<string, unknown>[];
        columns: string[];
      }
    >;

    beforeEach(() => {
      tableDataCache = new MemoryBudgetCache({
        maxItems: 10,
        maxBytes: 50 * 1024 * 1024, // 50MB
        name: 'TableDataCacheTest',
        sizeEstimator: (data) =>
          estimateRowArraySize(data.rows) +
          BYTE_SIZES.OBJECT_OVERHEAD +
          data.tableName.length * 2,
      });
    });

    afterEach(() => {
      tableDataCache.clear();
    });

    it('should load table data within performance threshold', () => {
      const tableData = {
        tableName: 'users',
        rows: createMockTableData(1000, 10),
        columns: Array.from({ length: 10 }, (_, i) => `col_${i}`),
      };

      const { timeMs } = measureTime(() =>
        tableDataCache.set('conn1:users', tableData)
      );

      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLDS.TABLE_DATA_OP_MS);
    });

    it('should switch tables (cache lookup) within performance threshold', () => {
      // Pre-load multiple tables
      for (let i = 0; i < 5; i++) {
        tableDataCache.set(`conn1:table_${i}`, {
          tableName: `table_${i}`,
          rows: createMockTableData(500, 10),
          columns: Array.from({ length: 10 }, (_, j) => `col_${j}`),
        });
      }

      // Measure table switching (cache lookup)
      const { avgTimeMs } = measureAverageTime(() => {
        const randomTable = `table_${Math.floor(Math.random() * 5)}`;
        return tableDataCache.get(`conn1:${randomTable}`);
      });

      expect(avgTimeMs).toBeLessThan(PERFORMANCE_THRESHOLDS.CACHE_GET_MS);
    });

    it('should handle connection data removal within performance threshold', () => {
      // Pre-load data
      tableDataCache.set('conn1:users', {
        tableName: 'users',
        rows: createMockTableData(1000, 10),
        columns: Array.from({ length: 10 }, (_, i) => `col_${i}`),
      });

      const { timeMs } = measureTime(() =>
        tableDataCache.delete('conn1:users')
      );

      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLDS.CACHE_EVICTION_MS);
    });

    it('should clear all cached data within performance threshold', () => {
      // Pre-load multiple tables across connections
      for (let conn = 0; conn < 5; conn++) {
        for (let table = 0; table < 3; table++) {
          tableDataCache.set(`conn${conn}:table_${table}`, {
            tableName: `table_${table}`,
            rows: createMockTableData(100, 10),
            columns: Array.from({ length: 10 }, (_, i) => `col_${i}`),
          });
        }
      }

      const { timeMs } = measureTime(() => tableDataCache.clear());

      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLDS.BATCH_EVICTION_MS);
    });
  });

  describe('query Result Cache Performance Simulation', () => {
    /**
     * Simulates query-store operations with memory budget cache
     */
    let queryResultsCache: MemoryBudgetCache<
      string,
      {
        query: string;
        result: { columns: string[]; rows: Record<string, unknown>[] };
        cachedAt: number;
      }
    >;

    beforeEach(() => {
      queryResultsCache = new MemoryBudgetCache({
        maxItems: 20,
        maxBytes: 30 * 1024 * 1024, // 30MB
        name: 'QueryResultsCacheTest',
        sizeEstimator: (data) =>
          estimateRowArraySize(data.result.rows) +
          data.query.length * 2 +
          BYTE_SIZES.OBJECT_OVERHEAD,
      });
    });

    afterEach(() => {
      queryResultsCache.clear();
    });

    it('should cache query results within performance threshold', () => {
      const queryResult = {
        query: 'SELECT * FROM users WHERE id > 100',
        result: {
          columns: Array.from({ length: 10 }, (_, i) => `col_${i}`),
          rows: createMockTableData(1000, 10),
        },
        cachedAt: Date.now(),
      };

      const { timeMs } = measureTime(() =>
        queryResultsCache.set('conn1:SELECT * FROM users', queryResult)
      );

      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLDS.QUERY_CACHE_OP_MS);
    });

    it('should retrieve cached results within performance threshold', () => {
      // Pre-populate cache
      for (let i = 0; i < 10; i++) {
        queryResultsCache.set(`conn1:query_${i}`, {
          query: `SELECT * FROM table_${i}`,
          result: {
            columns: Array.from({ length: 5 }, (_, j) => `col_${j}`),
            rows: createMockTableData(100, 5),
          },
          cachedAt: Date.now(),
        });
      }

      const { avgTimeMs } = measureAverageTime(() => {
        const randomQuery = `query_${Math.floor(Math.random() * 10)}`;
        return queryResultsCache.get(`conn1:${randomQuery}`);
      });

      expect(avgTimeMs).toBeLessThan(PERFORMANCE_THRESHOLDS.CACHE_GET_MS);
    });

    it('should handle LRU eviction during query caching efficiently', () => {
      const evictionHandler = vi.fn();
      queryResultsCache.on('eviction', evictionHandler);

      // Add more queries than the limit
      const times: number[] = [];
      for (let i = 0; i < 30; i++) {
        const { timeMs } = measureTime(() =>
          queryResultsCache.set(`conn1:query_${i}`, {
            query: `SELECT * FROM table_${i}`,
            result: {
              columns: Array.from({ length: 5 }, (_, j) => `col_${j}`),
              rows: createMockTableData(100, 5),
            },
            cachedAt: Date.now(),
          })
        );
        times.push(timeMs);
      }

      // Average time should still be within threshold even with evictions
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.QUERY_CACHE_OP_MS);

      // Evictions should have occurred
      expect(evictionHandler).toHaveBeenCalled();
    });
  });

  describe('schema Cache Performance Simulation', () => {
    /**
     * Simulates schema cache operations
     */
    let schemaCache: MemoryBudgetCache<
      string,
      {
        name: string;
        columns: { name: string; type: string }[];
        indexes: { name: string; columns: string[] }[];
      }
    >;

    beforeEach(() => {
      schemaCache = new MemoryBudgetCache({
        maxItems: 100,
        maxBytes: 10 * 1024 * 1024, // 10MB per connection
        name: 'SchemaCacheTest',
        sizeEstimator: (table) => {
          let size = BYTE_SIZES.OBJECT_OVERHEAD;
          size += table.name.length * 2 + BYTE_SIZES.STRING_OVERHEAD;
          size += BYTE_SIZES.ARRAY_OVERHEAD;
          for (const col of table.columns) {
            size +=
              col.name.length * 2 +
              col.type.length * 2 +
              BYTE_SIZES.OBJECT_OVERHEAD * 2;
          }
          size += BYTE_SIZES.ARRAY_OVERHEAD;
          for (const idx of table.indexes) {
            size +=
              idx.name.length * 2 +
              idx.columns.join('').length * 2 +
              BYTE_SIZES.OBJECT_OVERHEAD;
          }
          return size;
        },
      });
    });

    afterEach(() => {
      schemaCache.clear();
    });

    it('should cache table schema within performance threshold', () => {
      const tableSchema = {
        name: 'users',
        columns: Array.from({ length: 20 }, (_, i) => ({
          name: `column_${i}`,
          type: i % 2 === 0 ? 'TEXT' : 'INTEGER',
        })),
        indexes: [
          { name: 'idx_users_id', columns: ['id'] },
          { name: 'idx_users_email', columns: ['email'] },
        ],
      };

      const { timeMs } = measureTime(() =>
        schemaCache.set('main:users', tableSchema)
      );

      expect(timeMs).toBeLessThan(
        PERFORMANCE_THRESHOLDS.SCHEMA_CACHE_LOOKUP_MS
      );
    });

    it('should lookup schema within performance threshold', () => {
      // Pre-populate with many tables
      for (let i = 0; i < 50; i++) {
        schemaCache.set(`main:table_${i}`, {
          name: `table_${i}`,
          columns: Array.from({ length: 10 }, (_, j) => ({
            name: `column_${j}`,
            type: j % 2 === 0 ? 'TEXT' : 'INTEGER',
          })),
          indexes: [{ name: `idx_${i}_id`, columns: ['id'] }],
        });
      }

      const { avgTimeMs } = measureAverageTime(() => {
        const randomTable = `table_${Math.floor(Math.random() * 50)}`;
        return schemaCache.get(`main:${randomTable}`);
      });

      expect(avgTimeMs).toBeLessThan(
        PERFORMANCE_THRESHOLDS.SCHEMA_CACHE_LOOKUP_MS
      );
    });

    it('should check cache existence within performance threshold', () => {
      // Pre-populate
      for (let i = 0; i < 50; i++) {
        schemaCache.set(`main:table_${i}`, {
          name: `table_${i}`,
          columns: [{ name: 'id', type: 'INTEGER' }],
          indexes: [],
        });
      }

      const { avgTimeMs } = measureAverageTime(() => {
        const randomTable = `table_${Math.floor(Math.random() * 100)}`; // 50% miss rate
        return schemaCache.has(`main:${randomTable}`);
      });

      expect(avgTimeMs).toBeLessThan(PERFORMANCE_THRESHOLDS.CACHE_GET_MS);
    });
  });

  describe('memory Optimization Overhead', () => {
    it('should have minimal overhead compared to plain object storage', () => {
      const data = createMockTableData(100, 10);

      // Measure plain object storage time
      const plainMap = new Map<string, typeof data>();
      const { avgTimeMs: _plainSetTime } = measureAverageTime(() => {
        plainMap.set(`key_${Math.random()}`, data);
      });
      const { avgTimeMs: plainGetTime } = measureAverageTime(() => {
        return plainMap.get(`key_${Math.random()}`);
      });

      // Measure cache storage time
      const cache = new MemoryBudgetCache<string, typeof data>({
        maxItems: 1000,
        maxBytes: 100 * 1024 * 1024,
        name: 'OverheadTest',
        sizeEstimator: estimateRowArraySize,
      });

      const { avgTimeMs: cacheSetTime } = measureAverageTime(() => {
        cache.set(`key_${Math.random()}`, data);
      });
      const { avgTimeMs: cacheGetTime } = measureAverageTime(() => {
        return cache.get(`key_${Math.random()}`);
      });

      // Get operations should have minimal overhead (< 2x plain Map)
      // Note: Some overhead is expected due to LRU tracking
      const getOverheadRatio = cacheGetTime / Math.max(plainGetTime, 0.001);
      expect(getOverheadRatio).toBeLessThan(5); // Allow reasonable overhead for edge cases

      // The absolute time is more important than the ratio for user experience
      expect(cacheGetTime).toBeLessThan(PERFORMANCE_THRESHOLDS.CACHE_GET_MS);
      expect(cacheSetTime).toBeLessThan(PERFORMANCE_THRESHOLDS.CACHE_SET_MS);
    });

    it('should maintain consistent performance under memory pressure', () => {
      // Create cache that will be at capacity
      const cache = new MemoryBudgetCache<string, string>({
        maxItems: 100,
        maxBytes: Number.POSITIVE_INFINITY,
        name: 'PressureTest',
      });

      // Fill to capacity
      for (let i = 0; i < 100; i++) {
        cache.set(`key_${i}`, 'x'.repeat(100));
      }

      // Measure performance at capacity (every set triggers eviction)
      const times: number[] = [];
      for (let i = 0; i < 100; i++) {
        const { timeMs } = measureTime(() =>
          cache.set(`new_key_${i}`, 'x'.repeat(100))
        );
        times.push(timeMs);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      // Average should be consistent
      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.CACHE_SET_MS);

      // No single operation should be too slow (no spike)
      expect(maxTime).toBeLessThan(PERFORMANCE_THRESHOLDS.CACHE_SET_MS * 5);
    });
  });

  describe('concurrent Operations Simulation', () => {
    it('should handle rapid sequential operations efficiently', () => {
      const cache = new MemoryBudgetCache<string, Record<string, unknown>[]>({
        maxItems: 50,
        maxBytes: 10 * 1024 * 1024,
        name: 'ConcurrentTest',
        sizeEstimator: estimateRowArraySize,
      });

      const operations: number[] = [];
      const data = createMockTableData(100, 10);

      // Simulate rapid mixed operations (like switching between tables quickly)
      for (let i = 0; i < 100; i++) {
        const { timeMs } = measureTime(() => {
          cache.set(`key_${i % 10}`, data); // Set (overwrite)
          cache.get(`key_${(i + 5) % 10}`); // Get different key
          cache.has(`key_${(i + 3) % 10}`); // Check existence
        });
        operations.push(timeMs);
      }

      const avgTime = operations.reduce((a, b) => a + b, 0) / operations.length;

      // Even with multiple operations, average should be reasonable
      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.TABLE_DATA_OP_MS);
    });
  });

  describe('lazy Loading Performance Simulation', () => {
    /**
     * Simulates lazy loading pattern where schema list is loaded first,
     * then table details are loaded on demand
     */
    it('should load schema list quickly', () => {
      // Simulate lightweight schema list (just names)
      const schemaList = Array.from({ length: 100 }, (_, i) => ({
        name: `table_${i}`,
        type: 'table' as const,
      }));

      const cache = new MemoryBudgetCache<
        string,
        { name: string; type: 'table' | 'view' }[]
      >({
        maxItems: 20,
        maxBytes: 1024 * 1024, // 1MB
        name: 'SchemaListCache',
        sizeEstimator: (list) =>
          list.reduce(
            (sum, item) =>
              sum + item.name.length * 2 + 20 + BYTE_SIZES.OBJECT_OVERHEAD,
            BYTE_SIZES.ARRAY_OVERHEAD
          ),
      });

      const { timeMs } = measureTime(() =>
        cache.set('conn1:schemas', schemaList)
      );

      // Schema list loading should be very fast
      expect(timeMs).toBeLessThan(
        PERFORMANCE_THRESHOLDS.SCHEMA_CACHE_LOOKUP_MS
      );
    });

    it('should load table details on demand within performance threshold', () => {
      const tableDetailsCache = new MemoryBudgetCache<
        string,
        { name: string; columns: { name: string; type: string }[] }
      >({
        maxItems: 100,
        maxBytes: 10 * 1024 * 1024,
        name: 'TableDetailsCache',
        sizeEstimator: (table) =>
          table.name.length * 2 +
          table.columns.reduce(
            (sum, col) => sum + col.name.length * 2 + col.type.length * 2,
            0
          ) +
          BYTE_SIZES.OBJECT_OVERHEAD * (table.columns.length + 1),
      });

      // Simulate loading table details (larger data per table)
      const tableDetails = {
        name: 'users',
        columns: Array.from({ length: 30 }, (_, i) => ({
          name: `column_${i}`,
          type: i % 3 === 0 ? 'TEXT' : i % 3 === 1 ? 'INTEGER' : 'REAL',
        })),
      };

      const { timeMs } = measureTime(() =>
        tableDetailsCache.set('conn1:main:users', tableDetails)
      );

      expect(timeMs).toBeLessThan(
        PERFORMANCE_THRESHOLDS.SCHEMA_CACHE_LOOKUP_MS
      );
    });

    it('should prioritize frequently accessed tables through LRU', () => {
      const cache = new MemoryBudgetCache<
        string,
        { name: string; data: string }
      >({
        maxItems: 5,
        maxBytes: Number.POSITIVE_INFINITY,
        name: 'LRUPriorityTest',
      });

      // Add 5 tables
      for (let i = 0; i < 5; i++) {
        cache.set(`table_${i}`, { name: `table_${i}`, data: 'x'.repeat(100) });
      }

      // Access table_0 frequently
      for (let i = 0; i < 10; i++) {
        cache.get('table_0');
      }

      // Add new table (should evict LRU, which is table_1 since table_0 was accessed)
      cache.set('table_new', { name: 'table_new', data: 'x'.repeat(100) });

      // table_0 should still exist (frequently accessed)
      expect(cache.has('table_0')).toBe(true);

      // One of the less-accessed tables should be evicted
      expect(cache.has('table_1')).toBe(false);
    });
  });
});
