import type { QueryResult } from '@/types/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  estimateCachedResultSize,
  estimateHistoryEntrySize,
  estimateQueryResultSize,
  queryResultsCache,
  truncateQueryResult,
  truncateQueryText,
  useQueryStore,
} from './query-store';

// Mock the API module before importing the store
vi.mock('@/lib/api', () => ({
  quarry: {
    history: {
      get: vi.fn().mockResolvedValue({ success: true, history: [] }),
      save: vi.fn().mockResolvedValue({ success: true }),
      delete: vi.fn().mockResolvedValue({ success: true }),
      clear: vi.fn().mockResolvedValue({ success: true }),
    },
  },
}));

// Helper function to create a mock QueryResult
function createMockQueryResult(
  overrides: Partial<QueryResult> = {}
): QueryResult {
  return {
    columns: ['id', 'name'],
    rows: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ],
    rowsAffected: 0,
    ...overrides,
  };
}

// Helper function to create a large result with many rows
function createLargeQueryResult(rowCount: number): QueryResult {
  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < rowCount; i++) {
    rows.push({ id: i, name: `User ${i}`, email: `user${i}@example.com` });
  }
  return {
    columns: ['id', 'name', 'email'],
    rows,
    rowsAffected: 0,
  };
}

describe('query-store', () => {
  beforeEach(() => {
    // Clear the results cache before each test
    queryResultsCache.clear();

    // Reset store to initial state before each test
    useQueryStore.setState({
      currentQuery: '',
      results: null,
      error: null,
      isExecuting: false,
      executionTime: null,
      history: [],
      isLoadingHistory: false,
      currentDbPath: null,
      resultsTruncated: false,
      totalResultRows: 0,
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have empty currentQuery', () => {
      const { currentQuery } = useQueryStore.getState();
      expect(currentQuery).toBe('');
    });

    it('should have null results', () => {
      const { results } = useQueryStore.getState();
      expect(results).toBeNull();
    });

    it('should have null error', () => {
      const { error } = useQueryStore.getState();
      expect(error).toBeNull();
    });

    it('should have isExecuting as false', () => {
      const { isExecuting } = useQueryStore.getState();
      expect(isExecuting).toBe(false);
    });

    it('should have null executionTime', () => {
      const { executionTime } = useQueryStore.getState();
      expect(executionTime).toBeNull();
    });

    it('should have empty history array', () => {
      const { history } = useQueryStore.getState();
      expect(history).toEqual([]);
    });

    it('should have resultsTruncated as false', () => {
      const { resultsTruncated } = useQueryStore.getState();
      expect(resultsTruncated).toBe(false);
    });

    it('should have totalResultRows as 0', () => {
      const { totalResultRows } = useQueryStore.getState();
      expect(totalResultRows).toBe(0);
    });
  });

  describe('setCurrentQuery', () => {
    it('should set currentQuery', () => {
      const { setCurrentQuery } = useQueryStore.getState();

      setCurrentQuery('SELECT * FROM users');

      const { currentQuery } = useQueryStore.getState();
      expect(currentQuery).toBe('SELECT * FROM users');
    });

    it('should update currentQuery', () => {
      const { setCurrentQuery } = useQueryStore.getState();

      setCurrentQuery('SELECT * FROM users');
      setCurrentQuery('SELECT * FROM orders');

      const { currentQuery } = useQueryStore.getState();
      expect(currentQuery).toBe('SELECT * FROM orders');
    });

    it('should clear currentQuery when set to empty string', () => {
      const { setCurrentQuery } = useQueryStore.getState();

      setCurrentQuery('SELECT * FROM users');
      setCurrentQuery('');

      const { currentQuery } = useQueryStore.getState();
      expect(currentQuery).toBe('');
    });

    it('should handle multiline queries', () => {
      const { setCurrentQuery } = useQueryStore.getState();

      const multilineQuery = `SELECT
        id,
        name
      FROM users
      WHERE id > 10`;
      setCurrentQuery(multilineQuery);

      const { currentQuery } = useQueryStore.getState();
      expect(currentQuery).toBe(multilineQuery);
    });
  });

  describe('setResults', () => {
    it('should set results', () => {
      const mockResult = createMockQueryResult();
      const { setResults } = useQueryStore.getState();

      setResults(mockResult);

      const { results } = useQueryStore.getState();
      expect(results).toEqual(mockResult);
    });

    it('should clear error when results are set', () => {
      const { setError, setResults } = useQueryStore.getState();

      // Set an error first
      setError('Query failed');
      expect(useQueryStore.getState().error).toBe('Query failed');

      // Setting results should clear the error
      setResults(createMockQueryResult());
      expect(useQueryStore.getState().error).toBeNull();
    });

    it('should clear results when set to null', () => {
      const { setResults } = useQueryStore.getState();

      setResults(createMockQueryResult());
      setResults(null);

      const { results } = useQueryStore.getState();
      expect(results).toBeNull();
    });

    it('should also clear error when results set to null', () => {
      const { setError, setResults } = useQueryStore.getState();

      setError('Some error');
      setResults(null);

      expect(useQueryStore.getState().error).toBeNull();
    });

    it('should cache results with connectionId', () => {
      const { setCurrentQuery, setResults } = useQueryStore.getState();

      setCurrentQuery('SELECT * FROM users');
      setResults(createMockQueryResult(), 'conn-123');

      // Verify result is cached
      const cached = queryResultsCache.get('conn-123:SELECT * FROM users');
      expect(cached).not.toBeNull();
      expect(cached?.query).toBe('SELECT * FROM users');
      expect(cached?.connectionId).toBe('conn-123');
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const { setError } = useQueryStore.getState();

      setError('Query syntax error');

      const { error } = useQueryStore.getState();
      expect(error).toBe('Query syntax error');
    });

    it('should clear results when error is set', () => {
      const { setResults, setError } = useQueryStore.getState();

      // Set results first
      setResults(createMockQueryResult());
      expect(useQueryStore.getState().results).not.toBeNull();

      // Setting error should clear results
      setError('Query failed');
      expect(useQueryStore.getState().results).toBeNull();
    });

    it('should clear error when set to null', () => {
      const { setError } = useQueryStore.getState();

      setError('Some error');
      setError(null);

      const { error } = useQueryStore.getState();
      expect(error).toBeNull();
    });

    it('should also clear results when error set to null', () => {
      const { setResults, setError } = useQueryStore.getState();

      setResults(createMockQueryResult());
      setError(null);

      expect(useQueryStore.getState().results).toBeNull();
    });

    it('should update error message', () => {
      const { setError } = useQueryStore.getState();

      setError('First error');
      expect(useQueryStore.getState().error).toBe('First error');

      setError('Second error');
      expect(useQueryStore.getState().error).toBe('Second error');
    });

    it('should reset truncation state when error is set', () => {
      const { setResults, setError, setCurrentQuery } =
        useQueryStore.getState();

      // First set a large result that gets truncated
      setCurrentQuery('SELECT * FROM big_table');
      const largeResult = createLargeQueryResult(15000);
      setResults(largeResult);
      expect(useQueryStore.getState().resultsTruncated).toBe(true);

      // Setting error should reset truncation state
      setError('Error occurred');
      expect(useQueryStore.getState().resultsTruncated).toBe(false);
      expect(useQueryStore.getState().totalResultRows).toBe(0);
    });
  });

  describe('setIsExecuting', () => {
    it('should set isExecuting to true', () => {
      const { setIsExecuting } = useQueryStore.getState();

      setIsExecuting(true);

      const { isExecuting } = useQueryStore.getState();
      expect(isExecuting).toBe(true);
    });

    it('should set isExecuting to false', () => {
      const { setIsExecuting } = useQueryStore.getState();

      setIsExecuting(true);
      setIsExecuting(false);

      const { isExecuting } = useQueryStore.getState();
      expect(isExecuting).toBe(false);
    });
  });

  describe('setExecutionTime', () => {
    it('should set executionTime', () => {
      const { setExecutionTime } = useQueryStore.getState();

      setExecutionTime(125);

      const { executionTime } = useQueryStore.getState();
      expect(executionTime).toBe(125);
    });

    it('should clear executionTime when set to null', () => {
      const { setExecutionTime } = useQueryStore.getState();

      setExecutionTime(100);
      setExecutionTime(null);

      const { executionTime } = useQueryStore.getState();
      expect(executionTime).toBeNull();
    });

    it('should handle zero execution time', () => {
      const { setExecutionTime } = useQueryStore.getState();

      setExecutionTime(0);

      const { executionTime } = useQueryStore.getState();
      expect(executionTime).toBe(0);
    });

    it('should handle large execution times', () => {
      const { setExecutionTime } = useQueryStore.getState();

      setExecutionTime(999999);

      const { executionTime } = useQueryStore.getState();
      expect(executionTime).toBe(999999);
    });
  });

  describe('addToHistory', () => {
    const testDbPath = '/test/db.sqlite';

    it('should add entry to history', async () => {
      const { addToHistory } = useQueryStore.getState();

      await addToHistory(testDbPath, 'SELECT * FROM users', true, 100);

      const { history } = useQueryStore.getState();
      expect(history).toHaveLength(1);
      expect(history[0].queryText).toBe('SELECT * FROM users');
      expect(history[0].success).toBe(true);
      expect(history[0].durationMs).toBe(100);
      expect(history[0].executedAt).toBeDefined();
    });

    it('should add failed query to history', async () => {
      const { addToHistory } = useQueryStore.getState();

      await addToHistory(
        testDbPath,
        'INVALID QUERY',
        false,
        50,
        'Syntax error'
      );

      const { history } = useQueryStore.getState();
      expect(history[0].success).toBe(false);
      expect(history[0].error).toBe('Syntax error');
    });

    it('should prepend new entries to history', async () => {
      const { addToHistory } = useQueryStore.getState();

      await addToHistory(testDbPath, 'Query 1', true, 10);
      await addToHistory(testDbPath, 'Query 2', true, 20);
      await addToHistory(testDbPath, 'Query 3', true, 30);

      const { history } = useQueryStore.getState();
      expect(history[0].queryText).toBe('Query 3');
      expect(history[1].queryText).toBe('Query 2');
      expect(history[2].queryText).toBe('Query 1');
    });

    it('should limit history to MAX_HISTORY_LENGTH (100)', async () => {
      const { addToHistory } = useQueryStore.getState();

      // Add 105 entries
      for (let i = 0; i < 105; i++) {
        await addToHistory(testDbPath, `Query ${i}`, true, 10);
      }

      const { history } = useQueryStore.getState();
      expect(history).toHaveLength(100);
      // Most recent should be first
      expect(history[0].queryText).toBe('Query 104');
      // Oldest kept should be Query 5 (0-4 were pushed out)
      expect(history[99].queryText).toBe('Query 5');
    });

    it('should maintain exactly 100 entries when at limit', async () => {
      const { addToHistory } = useQueryStore.getState();

      // Add exactly 100 entries
      for (let i = 0; i < 100; i++) {
        await addToHistory(testDbPath, `Query ${i}`, true, 10);
      }
      expect(useQueryStore.getState().history).toHaveLength(100);

      // Add one more
      await addToHistory(testDbPath, 'New Query', true, 10);

      const { history } = useQueryStore.getState();
      expect(history).toHaveLength(100);
      expect(history[0].queryText).toBe('New Query');
    });

    it('should include durationMs in history entry', async () => {
      const { addToHistory } = useQueryStore.getState();

      await addToHistory(testDbPath, 'SELECT * FROM users', true, 150);

      const { history } = useQueryStore.getState();
      expect(history[0].durationMs).toBe(150);
    });

    it('should handle zero durationMs', async () => {
      const { addToHistory } = useQueryStore.getState();

      await addToHistory(testDbPath, 'DELETE FROM empty_table', true, 0);

      const { history } = useQueryStore.getState();
      expect(history[0].durationMs).toBe(0);
    });

    it('should truncate very long query text in history', async () => {
      const { addToHistory } = useQueryStore.getState();

      // Create a very long query (>10KB)
      const longQuery = `SELECT ${'a, '.repeat(5000)}b FROM table`;
      await addToHistory(testDbPath, longQuery, true, 10);

      const { history } = useQueryStore.getState();
      // Should be truncated to 10000 characters
      expect(history[0].queryText!.length).toBeLessThanOrEqual(10000);
      expect(history[0].queryText).toContain('...');
    });
  });

  describe('clearHistory', () => {
    const testDbPath = '/test/db.sqlite';

    it('should clear all history entries', async () => {
      const { addToHistory, clearHistory } = useQueryStore.getState();

      await addToHistory(testDbPath, 'Query 1', true, 10);
      await addToHistory(testDbPath, 'Query 2', true, 20);
      await addToHistory(testDbPath, 'Query 3', true, 30);

      expect(useQueryStore.getState().history).toHaveLength(3);

      await clearHistory(testDbPath);

      expect(useQueryStore.getState().history).toHaveLength(0);
    });

    it('should be safe to call on empty history', async () => {
      const { clearHistory } = useQueryStore.getState();

      await expect(clearHistory(testDbPath)).resolves.not.toThrow();
      expect(useQueryStore.getState().history).toHaveLength(0);
    });
  });

  describe('reset', () => {
    const testDbPath = '/test/db.sqlite';

    it('should reset all state to initial values', async () => {
      const {
        setCurrentQuery,
        setError,
        setIsExecuting,
        setExecutionTime,
        addToHistory,
        reset,
      } = useQueryStore.getState();

      // Set all state values
      setCurrentQuery('SELECT * FROM users');
      setError('Some error');
      setIsExecuting(true);
      setExecutionTime(100);
      await addToHistory(testDbPath, 'Query 1', true, 10);

      // Verify state is set
      let state = useQueryStore.getState();
      expect(state.currentQuery).not.toBe('');
      expect(state.error).not.toBeNull();
      expect(state.isExecuting).toBe(true);
      expect(state.executionTime).not.toBeNull();
      expect(state.history).toHaveLength(1);

      // Reset
      reset();

      // Verify all state is reset
      state = useQueryStore.getState();
      expect(state.currentQuery).toBe('');
      expect(state.results).toBeNull();
      expect(state.error).toBeNull();
      expect(state.isExecuting).toBe(false);
      expect(state.executionTime).toBeNull();
      expect(state.history).toEqual([]);
    });

    it('should be callable multiple times without error', () => {
      const { reset } = useQueryStore.getState();

      expect(() => {
        reset();
        reset();
        reset();
      }).not.toThrow();
    });

    it('should reset error state', () => {
      const { setError, reset } = useQueryStore.getState();

      setError('Some error');
      expect(useQueryStore.getState().error).toBe('Some error');

      reset();
      expect(useQueryStore.getState().error).toBeNull();
    });

    it('should clear the results cache', () => {
      const { setCurrentQuery, setResults, reset } = useQueryStore.getState();

      setCurrentQuery('SELECT * FROM users');
      setResults(createMockQueryResult(), 'conn-1');

      expect(queryResultsCache.size).toBe(1);

      reset();

      expect(queryResultsCache.size).toBe(0);
    });
  });

  describe('store API', () => {
    it('should expose getState method', () => {
      expect(typeof useQueryStore.getState).toBe('function');
    });

    it('should expose setState method', () => {
      expect(typeof useQueryStore.setState).toBe('function');
    });

    it('should expose subscribe method', () => {
      expect(typeof useQueryStore.subscribe).toBe('function');
    });

    it('should allow subscribing to state changes', () => {
      const listener = vi.fn();
      const unsubscribe = useQueryStore.subscribe(listener);

      const { setCurrentQuery } = useQueryStore.getState();
      setCurrentQuery('SELECT * FROM users');

      expect(listener).toHaveBeenCalled();

      unsubscribe();
    });

    it('should stop receiving updates after unsubscribe', () => {
      const listener = vi.fn();
      const unsubscribe = useQueryStore.subscribe(listener);

      unsubscribe();
      listener.mockClear();

      const { setCurrentQuery } = useQueryStore.getState();
      setCurrentQuery('SELECT * FROM users');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('typical query execution flow', () => {
    const testDbPath = '/test/db.sqlite';

    it('should handle successful query execution flow', async () => {
      const {
        setCurrentQuery,
        setIsExecuting,
        setResults,
        setExecutionTime,
        addToHistory,
      } = useQueryStore.getState();

      // User enters query
      setCurrentQuery('SELECT * FROM users');
      expect(useQueryStore.getState().currentQuery).toBe('SELECT * FROM users');

      // Query starts executing
      setIsExecuting(true);
      expect(useQueryStore.getState().isExecuting).toBe(true);

      // Query completes successfully
      const result = createMockQueryResult({ rowsAffected: 5 });
      setResults(result);
      setExecutionTime(50);
      setIsExecuting(false);
      await addToHistory(testDbPath, 'SELECT * FROM users', true, 50);

      // Verify final state
      const state = useQueryStore.getState();
      expect(state.isExecuting).toBe(false);
      expect(state.results?.rowsAffected).toBe(5);
      expect(state.executionTime).toBe(50);
      expect(state.error).toBeNull();
      expect(state.history).toHaveLength(1);
    });

    it('should handle failed query execution flow', async () => {
      const { setCurrentQuery, setIsExecuting, setError, addToHistory } =
        useQueryStore.getState();

      // User enters invalid query
      setCurrentQuery('INVALID QUERY');

      // Query starts executing
      setIsExecuting(true);

      // Query fails
      setError('Syntax error near INVALID');
      setIsExecuting(false);
      await addToHistory(
        testDbPath,
        'INVALID QUERY',
        false,
        10,
        'Syntax error near INVALID'
      );

      // Verify final state
      const state = useQueryStore.getState();
      expect(state.isExecuting).toBe(false);
      expect(state.error).toBe('Syntax error near INVALID');
      expect(state.results).toBeNull();
      expect(state.history[0].success).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle very long query strings', () => {
      const { setCurrentQuery } = useQueryStore.getState();

      const longQuery = `SELECT ${'a, '.repeat(10000)}b FROM table`;
      setCurrentQuery(longQuery);

      expect(useQueryStore.getState().currentQuery).toBe(longQuery);
    });

    it('should handle special characters in queries', () => {
      const { setCurrentQuery } = useQueryStore.getState();

      const specialQuery = "SELECT * FROM users WHERE name = 'O''Brien'";
      setCurrentQuery(specialQuery);

      expect(useQueryStore.getState().currentQuery).toBe(specialQuery);
    });

    it('should handle unicode in queries', () => {
      const { setCurrentQuery } = useQueryStore.getState();

      const unicodeQuery = "SELECT * FROM users WHERE name = '日本語'";
      setCurrentQuery(unicodeQuery);

      expect(useQueryStore.getState().currentQuery).toBe(unicodeQuery);
    });

    it('should handle empty results', () => {
      const { setResults } = useQueryStore.getState();

      const emptyResult = createMockQueryResult({
        columns: [],
        rows: [],
        rowsAffected: 0,
      });
      setResults(emptyResult);

      const { results } = useQueryStore.getState();
      expect(results?.rowsAffected).toBe(0);
      expect(results?.rows).toEqual([]);
    });
  });

  // ========== NEW TESTS FOR MEMORY MANAGEMENT ==========

  describe('result truncation', () => {
    it('should not truncate small results', () => {
      const { setCurrentQuery, setResults } = useQueryStore.getState();

      setCurrentQuery('SELECT * FROM small_table');
      const smallResult = createMockQueryResult();
      setResults(smallResult);

      const state = useQueryStore.getState();
      expect(state.resultsTruncated).toBe(false);
      expect(state.totalResultRows).toBe(2);
      expect(state.results?.rows).toHaveLength(2);
    });

    it('should truncate results exceeding max rows', () => {
      const { setCurrentQuery, setResults, setMaxRowsInMemory } =
        useQueryStore.getState();

      // Set a low limit for testing
      setMaxRowsInMemory(100);

      setCurrentQuery('SELECT * FROM big_table');
      const largeResult = createLargeQueryResult(500);
      setResults(largeResult);

      const state = useQueryStore.getState();
      expect(state.resultsTruncated).toBe(true);
      expect(state.totalResultRows).toBe(500);
      expect(state.results?.rows).toHaveLength(100);
    });

    it('should preserve columns when truncating', () => {
      const { setCurrentQuery, setResults, setMaxRowsInMemory } =
        useQueryStore.getState();

      setMaxRowsInMemory(50);

      setCurrentQuery('SELECT * FROM table');
      const result = createLargeQueryResult(200);
      setResults(result);

      const { results } = useQueryStore.getState();
      expect(results?.columns).toEqual(['id', 'name', 'email']);
    });

    it('should handle resultSets in multi-statement queries', () => {
      const { setCurrentQuery, setResults, setMaxRowsInMemory } =
        useQueryStore.getState();

      setMaxRowsInMemory(5);

      setCurrentQuery('SELECT * FROM t1; SELECT * FROM t2');
      const result: QueryResult = {
        columns: ['a'],
        rows: [
          { a: 1 },
          { a: 2 },
          { a: 3 },
          { a: 4 },
          { a: 5 },
          { a: 6 },
          { a: 7 },
        ],
        rowsAffected: 0,
        resultSets: [
          {
            columns: ['x'],
            rows: [{ x: 1 }, { x: 2 }, { x: 3 }, { x: 4 }, { x: 5 }, { x: 6 }],
          },
        ],
      };
      setResults(result);

      const { results } = useQueryStore.getState();
      expect(results?.rows).toHaveLength(5);
      expect(results?.resultSets?.[0].rows).toHaveLength(5);
    });
  });

  describe('results cache', () => {
    it('should cache query results', () => {
      const { setCurrentQuery, setResults } = useQueryStore.getState();

      setCurrentQuery('SELECT * FROM users');
      setResults(createMockQueryResult(), 'conn-1');

      const cached = queryResultsCache.get('conn-1:SELECT * FROM users');
      expect(cached).not.toBeNull();
      expect(cached?.query).toBe('SELECT * FROM users');
    });

    it('should retrieve cached results', () => {
      const { setCurrentQuery, setResults, getCachedResult } =
        useQueryStore.getState();

      setCurrentQuery('SELECT * FROM users');
      setResults(createMockQueryResult(), 'conn-1');

      const cached = getCachedResult('conn-1:SELECT * FROM users');
      expect(cached).not.toBeNull();
      expect(cached?.result.rows).toHaveLength(2);
    });

    it('should clear results cache', () => {
      const { setCurrentQuery, setResults, clearResultsCache } =
        useQueryStore.getState();

      setCurrentQuery('SELECT 1');
      setResults(createMockQueryResult(), 'conn-1');
      setCurrentQuery('SELECT 2');
      setResults(createMockQueryResult(), 'conn-2');

      expect(queryResultsCache.size).toBe(2);

      clearResultsCache();

      expect(queryResultsCache.size).toBe(0);
    });

    it('should remove connection-specific results', () => {
      const { setCurrentQuery, setResults, removeConnectionResults } =
        useQueryStore.getState();

      setCurrentQuery('SELECT 1');
      setResults(createMockQueryResult(), 'conn-1');
      setCurrentQuery('SELECT 2');
      setResults(createMockQueryResult(), 'conn-1');
      setCurrentQuery('SELECT 3');
      setResults(createMockQueryResult(), 'conn-2');

      expect(queryResultsCache.size).toBe(3);

      removeConnectionResults('conn-1');

      expect(queryResultsCache.size).toBe(1);
      expect(queryResultsCache.get('conn-2:SELECT 3')).not.toBeNull();
    });
  });

  describe('cache statistics', () => {
    it('should return cache stats', () => {
      const { getResultsCacheStats } = useQueryStore.getState();

      const stats = getResultsCacheStats();
      expect(stats).toHaveProperty('itemCount');
      expect(stats).toHaveProperty('totalBytes');
      expect(stats).toHaveProperty('maxItems');
      expect(stats).toHaveProperty('maxBytes');
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('evictions');
      expect(stats.name).toBe('QueryResultsCache');
    });

    it('should track cache size', () => {
      const { setCurrentQuery, setResults, getResultsCacheStats } =
        useQueryStore.getState();

      expect(getResultsCacheStats().itemCount).toBe(0);

      setCurrentQuery('SELECT 1');
      setResults(createMockQueryResult(), 'conn-1');
      expect(getResultsCacheStats().itemCount).toBe(1);

      setCurrentQuery('SELECT 2');
      setResults(createMockQueryResult(), 'conn-1');
      expect(getResultsCacheStats().itemCount).toBe(2);
    });

    it('should calculate history size', () => {
      const { addToHistory, getHistorySize } = useQueryStore.getState();

      const initialSize = getHistorySize();
      expect(initialSize).toBeGreaterThan(0); // Array overhead

      addToHistory('/db.sqlite', 'SELECT * FROM users', true, 10);

      const afterSize = getHistorySize();
      expect(afterSize).toBeGreaterThan(initialSize);
    });
  });

  describe('cache configuration', () => {
    it('should get cache config', () => {
      const { getCacheConfig } = useQueryStore.getState();

      const config = getCacheConfig();
      expect(config).toHaveProperty('maxResultsBytes');
      expect(config).toHaveProperty('maxCachedResults');
      expect(config).toHaveProperty('maxRowsInMemory');
    });

    it('should set max rows in memory', () => {
      const { setMaxRowsInMemory, getCacheConfig } = useQueryStore.getState();

      setMaxRowsInMemory(5000);

      expect(getCacheConfig().maxRowsInMemory).toBe(5000);
    });

    it('should set results memory budget', () => {
      const { setResultsMemoryBudget, getCacheConfig } =
        useQueryStore.getState();

      setResultsMemoryBudget(50 * 1024 * 1024); // 50MB

      expect(getCacheConfig().maxResultsBytes).toBe(50 * 1024 * 1024);
    });

    it('should set max cached results', () => {
      const { setMaxCachedResults, getCacheConfig } = useQueryStore.getState();

      setMaxCachedResults(50);

      expect(getCacheConfig().maxCachedResults).toBe(50);
    });
  });

  describe('eviction events', () => {
    it('should subscribe to eviction events', () => {
      const {
        setCurrentQuery,
        setResults,
        setMaxCachedResults,
        onResultEviction,
      } = useQueryStore.getState();

      const evictionHandler = vi.fn();
      const unsubscribe = onResultEviction(evictionHandler);

      // Set max to 2 items
      setMaxCachedResults(2);

      // Add 3 items to trigger eviction
      setCurrentQuery('SELECT 1');
      setResults(createMockQueryResult(), 'conn-1');
      setCurrentQuery('SELECT 2');
      setResults(createMockQueryResult(), 'conn-1');
      setCurrentQuery('SELECT 3');
      setResults(createMockQueryResult(), 'conn-1');

      expect(evictionHandler).toHaveBeenCalled();

      unsubscribe();
    });

    it('should unsubscribe from eviction events', () => {
      const { onResultEviction } = useQueryStore.getState();

      const handler = vi.fn();
      const unsubscribe = onResultEviction(handler);
      unsubscribe();

      // This should not throw
      expect(() => unsubscribe()).not.toThrow();
    });
  });

  describe('lRU eviction behavior', () => {
    it('should evict least recently used results when max items exceeded', () => {
      const { setCurrentQuery, setResults, setMaxCachedResults } =
        useQueryStore.getState();

      setMaxCachedResults(3);

      // Add 4 queries (should evict first one)
      for (let i = 1; i <= 4; i++) {
        setCurrentQuery(`SELECT ${i}`);
        setResults(createMockQueryResult(), 'conn-1');
      }

      expect(queryResultsCache.size).toBe(3);
      // First query should be evicted
      expect(queryResultsCache.get('conn-1:SELECT 1')).toBeUndefined();
      // Last 3 should still be there
      expect(queryResultsCache.get('conn-1:SELECT 2')).not.toBeUndefined();
      expect(queryResultsCache.get('conn-1:SELECT 3')).not.toBeUndefined();
      expect(queryResultsCache.get('conn-1:SELECT 4')).not.toBeUndefined();
    });
  });
});

// ========== UTILITY FUNCTION TESTS ==========

describe('truncateQueryResult', () => {
  it('should not truncate when under limit', () => {
    const result: QueryResult = {
      columns: ['id'],
      rows: [{ id: 1 }, { id: 2 }],
      rowsAffected: 0,
    };

    const { truncatedResult, totalRows, isTruncated } = truncateQueryResult(
      result,
      10
    );

    expect(isTruncated).toBe(false);
    expect(totalRows).toBe(2);
    expect(truncatedResult.rows).toHaveLength(2);
  });

  it('should truncate when over limit', () => {
    const rows = Array.from({ length: 100 }, (_, i) => ({ id: i }));
    const result: QueryResult = {
      columns: ['id'],
      rows,
      rowsAffected: 0,
    };

    const { truncatedResult, totalRows, isTruncated } = truncateQueryResult(
      result,
      10
    );

    expect(isTruncated).toBe(true);
    expect(totalRows).toBe(100);
    expect(truncatedResult.rows).toHaveLength(10);
  });

  it('should preserve first N rows', () => {
    const rows = Array.from({ length: 100 }, (_, i) => ({ id: i }));
    const result: QueryResult = {
      columns: ['id'],
      rows,
      rowsAffected: 0,
    };

    const { truncatedResult } = truncateQueryResult(result, 5);

    expect(truncatedResult.rows[0]).toEqual({ id: 0 });
    expect(truncatedResult.rows[4]).toEqual({ id: 4 });
  });
});

describe('truncateQueryText', () => {
  it('should not truncate short text', () => {
    const text = 'SELECT * FROM users';
    expect(truncateQueryText(text, 100)).toBe(text);
  });

  it('should truncate long text', () => {
    const text = `SELECT ${'a, '.repeat(100)}`;
    const truncated = truncateQueryText(text, 50);

    expect(truncated.length).toBe(50);
    expect(truncated.endsWith('...')).toBe(true);
  });

  it('should handle exact length', () => {
    const text = '12345';
    expect(truncateQueryText(text, 5)).toBe('12345');
  });
});

describe('estimateQueryResultSize', () => {
  it('should estimate size of small result', () => {
    const result: QueryResult = {
      columns: ['id', 'name'],
      rows: [{ id: 1, name: 'Test' }],
      rowsAffected: 0,
    };

    const size = estimateQueryResultSize(result);
    expect(size).toBeGreaterThan(0);
  });

  it('should estimate larger size for larger result', () => {
    const smallResult: QueryResult = {
      columns: ['id'],
      rows: [{ id: 1 }],
      rowsAffected: 0,
    };

    const largeResult: QueryResult = {
      columns: ['id', 'name', 'email', 'address'],
      rows: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        address: `${i} Main Street, City, Country`,
      })),
      rowsAffected: 0,
    };

    const smallSize = estimateQueryResultSize(smallResult);
    const largeSize = estimateQueryResultSize(largeResult);

    expect(largeSize).toBeGreaterThan(smallSize);
  });
});

describe('estimateCachedResultSize', () => {
  it('should include query and metadata in size', () => {
    const cached = {
      query: 'SELECT * FROM users',
      result: {
        columns: ['id'],
        rows: [{ id: 1 }],
        rowsAffected: 0,
      },
      totalRows: 1,
      isTruncated: false,
      connectionId: 'conn-1',
      cachedAt: Date.now(),
    };

    const size = estimateCachedResultSize(cached);
    expect(size).toBeGreaterThan(0);
    // Should be larger than just the result
    expect(size).toBeGreaterThan(estimateQueryResultSize(cached.result));
  });
});

describe('estimateHistoryEntrySize', () => {
  it('should estimate history entry size', () => {
    const entry = {
      id: '12345',
      dbPath: '/path/to/db.sqlite',
      queryText: 'SELECT * FROM users',
      executedAt: new Date().toISOString(),
      durationMs: 100,
      success: true,
    };

    const size = estimateHistoryEntrySize(entry);
    expect(size).toBeGreaterThan(0);
  });

  it('should handle entries with errors', () => {
    const successEntry = {
      id: '12345',
      dbPath: '/db.sqlite',
      queryText: 'SELECT 1',
      executedAt: new Date().toISOString(),
      durationMs: 10,
      success: true,
    };

    const errorEntry = {
      ...successEntry,
      success: false,
      error: 'Some very long error message that adds to the size',
    };

    const successSize = estimateHistoryEntrySize(successEntry);
    const errorSize = estimateHistoryEntrySize(errorEntry);

    expect(errorSize).toBeGreaterThan(successSize);
  });
});
