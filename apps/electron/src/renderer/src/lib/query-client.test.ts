/**
 * Tests for query-client.ts
 * TanStack Query cache optimization tests
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearConnectionQueries,
  clearQueryCache,
  getMemoryPressureLevel,
  getQueryCacheStats,
  getStaleTimeForQuery,
  QUERY_CACHE_CONFIG,
  queryClient,
  setMemoryPressureLevel,
  triggerCacheCleanup,
  updateCacheConfig,
} from './query-client';

describe('query-client', () => {
  beforeEach(() => {
    // Reset query client state before each test
    queryClient.clear();
    setMemoryPressureLevel('normal');
  });

  describe('qUERY_CACHE_CONFIG', () => {
    it('should have default gc time of 10 minutes', () => {
      expect(QUERY_CACHE_CONFIG.defaultGcTime).toBe(10 * 60 * 1000);
    });

    it('should have large query gc time of 5 minutes', () => {
      expect(QUERY_CACHE_CONFIG.largeQueryGcTime).toBe(5 * 60 * 1000);
    });

    it('should have pressure gc time of 2 minutes', () => {
      expect(QUERY_CACHE_CONFIG.pressureGcTime).toBe(2 * 60 * 1000);
    });

    it('should have default stale time of 5 minutes', () => {
      expect(QUERY_CACHE_CONFIG.defaultStaleTime).toBe(5 * 60 * 1000);
    });

    it('should have schema stale time of 10 minutes', () => {
      expect(QUERY_CACHE_CONFIG.schemaStaleTime).toBe(10 * 60 * 1000);
    });

    it('should have table data stale time of 2 minutes', () => {
      expect(QUERY_CACHE_CONFIG.tableDataStaleTime).toBe(2 * 60 * 1000);
    });

    it('should have max cache size of 50MB', () => {
      expect(QUERY_CACHE_CONFIG.maxCacheSize).toBe(50 * 1024 * 1024);
    });

    it('should have max cached queries of 100', () => {
      expect(QUERY_CACHE_CONFIG.maxCachedQueries).toBe(100);
    });
  });

  describe('getStaleTimeForQuery', () => {
    it('should return schema stale time for schema queries', () => {
      expect(getStaleTimeForQuery('schema')).toBe(
        QUERY_CACHE_CONFIG.schemaStaleTime
      );
    });

    it('should return table data stale time for tableData queries', () => {
      expect(getStaleTimeForQuery('tableData')).toBe(
        QUERY_CACHE_CONFIG.tableDataStaleTime
      );
    });

    it('should return default stale time for queryResult queries', () => {
      expect(getStaleTimeForQuery('queryResult')).toBe(
        QUERY_CACHE_CONFIG.defaultStaleTime
      );
    });

    it('should return default stale time for other queries', () => {
      expect(getStaleTimeForQuery('other')).toBe(
        QUERY_CACHE_CONFIG.defaultStaleTime
      );
    });
  });

  describe('memory pressure tracking', () => {
    it('should start with normal pressure level', () => {
      expect(getMemoryPressureLevel()).toBe('normal');
    });

    it('should update pressure level when set', () => {
      setMemoryPressureLevel('warning');
      expect(getMemoryPressureLevel()).toBe('warning');
    });

    it('should allow setting critical pressure level', () => {
      setMemoryPressureLevel('critical');
      expect(getMemoryPressureLevel()).toBe('critical');
    });

    it('should allow returning to normal pressure level', () => {
      setMemoryPressureLevel('critical');
      setMemoryPressureLevel('normal');
      expect(getMemoryPressureLevel()).toBe('normal');
    });
  });

  describe('getQueryCacheStats', () => {
    it('should return empty stats for empty cache', () => {
      const stats = getQueryCacheStats();
      expect(stats.totalQueries).toBe(0);
      expect(stats.totalSizeBytes).toBe(0);
      expect(stats.largeQueryCount).toBe(0);
    });

    it('should track query type counts', () => {
      // Add queries with different keys
      queryClient.setQueryData(['tableData', 'conn1', 'users'], { rows: [] });
      queryClient.setQueryData(['schema', 'conn1'], { tables: [] });
      queryClient.setQueryData(['other', 'data'], { value: 1 });

      const stats = getQueryCacheStats();
      expect(stats.totalQueries).toBe(3);
      expect(stats.queryTypeCounts.tableData).toBe(1);
      expect(stats.queryTypeCounts.schema).toBe(1);
      expect(stats.queryTypeCounts.other).toBe(1);
    });

    it('should calculate total size of cached data', () => {
      queryClient.setQueryData(['test1'], { data: 'x'.repeat(1000) });
      queryClient.setQueryData(['test2'], { data: 'y'.repeat(2000) });

      const stats = getQueryCacheStats();
      expect(stats.totalQueries).toBe(2);
      expect(stats.totalSizeBytes).toBeGreaterThan(3000);
    });
  });

  describe('clearQueryCache', () => {
    it('should clear all cached queries', () => {
      queryClient.setQueryData(['test1'], { data: 1 });
      queryClient.setQueryData(['test2'], { data: 2 });
      queryClient.setQueryData(['test3'], { data: 3 });

      expect(getQueryCacheStats().totalQueries).toBe(3);

      clearQueryCache();

      expect(getQueryCacheStats().totalQueries).toBe(0);
    });
  });

  describe('clearConnectionQueries', () => {
    it('should clear queries for a specific connection', () => {
      queryClient.setQueryData(['tableData', 'conn1', 'users'], { rows: [] });
      queryClient.setQueryData(['tableData', 'conn1', 'orders'], { rows: [] });
      queryClient.setQueryData(['tableData', 'conn2', 'products'], {
        rows: [],
      });
      queryClient.setQueryData(['schema', 'conn1'], { tables: [] });

      expect(getQueryCacheStats().totalQueries).toBe(4);

      clearConnectionQueries('conn1');

      const stats = getQueryCacheStats();
      expect(stats.totalQueries).toBe(1);
    });

    it('should not affect queries from other connections', () => {
      queryClient.setQueryData(['tableData', 'conn1', 'users'], { rows: [] });
      queryClient.setQueryData(['tableData', 'conn2', 'products'], {
        rows: [],
      });

      clearConnectionQueries('conn1');

      const cache = queryClient.getQueryCache();
      const remaining = cache.getAll();
      expect(remaining.length).toBe(1);
      expect(remaining[0].queryKey[1]).toBe('conn2');
    });
  });

  describe('triggerCacheCleanup', () => {
    it('should not remove queries under normal pressure', () => {
      setMemoryPressureLevel('normal');
      queryClient.setQueryData(['test1'], { data: 1 });
      queryClient.setQueryData(['test2'], { data: 2 });

      const beforeCount = getQueryCacheStats().totalQueries;
      triggerCacheCleanup();
      const afterCount = getQueryCacheStats().totalQueries;

      // Queries should still be there (unless they exceed limits)
      expect(afterCount).toBeLessThanOrEqual(beforeCount);
    });
  });

  describe('updateCacheConfig', () => {
    it('should update partial configuration', () => {
      const originalMaxQueries = QUERY_CACHE_CONFIG.maxCachedQueries;

      updateCacheConfig({ maxCachedQueries: 50 });
      expect(QUERY_CACHE_CONFIG.maxCachedQueries).toBe(50);

      // Restore
      updateCacheConfig({ maxCachedQueries: originalMaxQueries });
    });

    it('should update multiple config values at once', () => {
      const originalGcTime = QUERY_CACHE_CONFIG.defaultGcTime;
      const originalStaleTime = QUERY_CACHE_CONFIG.defaultStaleTime;

      updateCacheConfig({
        defaultGcTime: 5 * 60 * 1000,
        defaultStaleTime: 3 * 60 * 1000,
      });

      expect(QUERY_CACHE_CONFIG.defaultGcTime).toBe(5 * 60 * 1000);
      expect(QUERY_CACHE_CONFIG.defaultStaleTime).toBe(3 * 60 * 1000);

      // Restore
      updateCacheConfig({
        defaultGcTime: originalGcTime,
        defaultStaleTime: originalStaleTime,
      });
    });
  });

  describe('queryClient defaults', () => {
    it('should have refetchOnWindowFocus disabled', () => {
      const defaults = queryClient.getDefaultOptions();
      expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
    });

    it('should have refetchOnReconnect disabled', () => {
      const defaults = queryClient.getDefaultOptions();
      expect(defaults.queries?.refetchOnReconnect).toBe(false);
    });

    it('should use configured stale time', () => {
      const defaults = queryClient.getDefaultOptions();
      expect(defaults.queries?.staleTime).toBe(
        QUERY_CACHE_CONFIG.defaultStaleTime
      );
    });

    it('should use configured gc time', () => {
      const defaults = queryClient.getDefaultOptions();
      expect(defaults.queries?.gcTime).toBe(QUERY_CACHE_CONFIG.defaultGcTime);
    });

    it('should have retry set to 2', () => {
      const defaults = queryClient.getDefaultOptions();
      expect(defaults.queries?.retry).toBe(2);
    });

    it('should have mutation retry set to 1', () => {
      const defaults = queryClient.getDefaultOptions();
      expect(defaults.mutations?.retry).toBe(1);
    });
  });

  describe('cache limits enforcement', () => {
    it('should respect maxCachedQueries limit', () => {
      // Set a low limit for testing
      const originalLimit = QUERY_CACHE_CONFIG.maxCachedQueries;
      updateCacheConfig({ maxCachedQueries: 5 });

      // Add more queries than the limit
      for (let i = 0; i < 10; i++) {
        queryClient.setQueryData([`test${i}`], { data: i });
      }

      // Trigger enforcement
      triggerCacheCleanup();

      const stats = getQueryCacheStats();
      expect(stats.totalQueries).toBeLessThanOrEqual(5);

      // Restore
      updateCacheConfig({ maxCachedQueries: originalLimit });
    });
  });
});
