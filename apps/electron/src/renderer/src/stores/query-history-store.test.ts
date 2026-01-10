import type { QueryHistoryEntry } from '@/shared/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useQueryHistoryStore } from './query-history-store';

// Helper function to create a mock QueryHistoryEntry
function createMockHistoryEntry(
  overrides: Partial<QueryHistoryEntry> = {}
): QueryHistoryEntry {
  return {
    id: crypto.randomUUID(),
    dbPath: '/test/db.sqlite',
    queryText: 'SELECT * FROM users',
    executedAt: new Date().toISOString(),
    durationMs: 100,
    success: true,
    ...overrides,
  };
}

// Helper to create a date in ISO format
function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

describe('query-history-store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useQueryHistoryStore.setState({
      filter: {},
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have empty filter state', () => {
      const { filter } = useQueryHistoryStore.getState();
      expect(filter).toEqual({});
    });

    it('should not have searchText filter set', () => {
      const { filter } = useQueryHistoryStore.getState();
      expect(filter.searchText).toBeUndefined();
    });

    it('should not have status filter set', () => {
      const { filter } = useQueryHistoryStore.getState();
      expect(filter.status).toBeUndefined();
    });

    it('should not have dateRange filter set', () => {
      const { filter } = useQueryHistoryStore.getState();
      expect(filter.dateRange).toBeUndefined();
    });
  });

  describe('setFilter', () => {
    it('should set searchText filter', () => {
      const { setFilter } = useQueryHistoryStore.getState();

      setFilter({ searchText: 'SELECT' });

      const { filter } = useQueryHistoryStore.getState();
      expect(filter.searchText).toBe('SELECT');
    });

    it('should set status filter', () => {
      const { setFilter } = useQueryHistoryStore.getState();

      setFilter({ status: 'success' });

      const { filter } = useQueryHistoryStore.getState();
      expect(filter.status).toBe('success');
    });

    it('should set dateRange filter', () => {
      const { setFilter } = useQueryHistoryStore.getState();

      setFilter({ dateRange: { start: '2024-01-01', end: '2024-12-31' } });

      const { filter } = useQueryHistoryStore.getState();
      expect(filter.dateRange).toEqual({
        start: '2024-01-01',
        end: '2024-12-31',
      });
    });

    it('should merge partial filter updates', () => {
      const { setFilter } = useQueryHistoryStore.getState();

      setFilter({ searchText: 'SELECT' });
      setFilter({ status: 'failed' });

      const { filter } = useQueryHistoryStore.getState();
      expect(filter.searchText).toBe('SELECT');
      expect(filter.status).toBe('failed');
    });

    it('should override existing filter values', () => {
      const { setFilter } = useQueryHistoryStore.getState();

      setFilter({ searchText: 'SELECT' });
      setFilter({ searchText: 'INSERT' });

      const { filter } = useQueryHistoryStore.getState();
      expect(filter.searchText).toBe('INSERT');
    });

    it('should handle empty string searchText', () => {
      const { setFilter } = useQueryHistoryStore.getState();

      setFilter({ searchText: '' });

      const { filter } = useQueryHistoryStore.getState();
      expect(filter.searchText).toBe('');
    });
  });

  describe('clearFilters', () => {
    it('should clear all filters', () => {
      const { setFilter, clearFilters } = useQueryHistoryStore.getState();

      setFilter({
        searchText: 'SELECT',
        status: 'success',
        dateRange: { start: '2024-01-01', end: '2024-12-31' },
      });
      clearFilters();

      const { filter } = useQueryHistoryStore.getState();
      expect(filter).toEqual({});
    });

    it('should be safe to call when no filters are set', () => {
      const { clearFilters } = useQueryHistoryStore.getState();

      expect(() => clearFilters()).not.toThrow();

      const { filter } = useQueryHistoryStore.getState();
      expect(filter).toEqual({});
    });
  });

  describe('getFilteredHistory - searchText', () => {
    it('should return all entries when no filter is set', () => {
      const { getFilteredHistory } = useQueryHistoryStore.getState();
      const history = [
        createMockHistoryEntry({ queryText: 'SELECT * FROM users' }),
        createMockHistoryEntry({ queryText: 'INSERT INTO users' }),
      ];

      const result = getFilteredHistory(history);

      expect(result).toHaveLength(2);
    });

    it('should filter by queryText (case-insensitive)', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const history = [
        createMockHistoryEntry({ queryText: 'SELECT * FROM users' }),
        createMockHistoryEntry({ queryText: 'INSERT INTO users' }),
        createMockHistoryEntry({ queryText: 'DELETE FROM orders' }),
      ];

      setFilter({ searchText: 'select' });
      const result = getFilteredHistory(history);

      expect(result).toHaveLength(1);
      expect(result[0].queryText).toBe('SELECT * FROM users');
    });

    it('should filter by queryText with uppercase search', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const history = [
        createMockHistoryEntry({ queryText: 'select * from users' }),
        createMockHistoryEntry({ queryText: 'INSERT INTO users' }),
      ];

      setFilter({ searchText: 'SELECT' });
      const result = getFilteredHistory(history);

      expect(result).toHaveLength(1);
      expect(result[0].queryText).toBe('select * from users');
    });

    it('should filter using query property as fallback', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const history = [
        createMockHistoryEntry({
          queryText: undefined,
          query: 'SELECT * FROM orders',
        }),
        createMockHistoryEntry({ queryText: 'INSERT INTO users' }),
      ];

      setFilter({ searchText: 'orders' });
      const result = getFilteredHistory(history);

      expect(result).toHaveLength(1);
    });

    it('should match partial text', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const history = [
        createMockHistoryEntry({ queryText: 'SELECT * FROM users' }),
        createMockHistoryEntry({ queryText: 'INSERT INTO users' }),
      ];

      setFilter({ searchText: 'users' });
      const result = getFilteredHistory(history);

      expect(result).toHaveLength(2);
    });

    it('should filter by description', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const history = [
        createMockHistoryEntry({
          queryText: 'SELECT * FROM users',
          description: 'Get all customers',
        }),
        createMockHistoryEntry({ queryText: 'INSERT INTO users' }),
      ];

      setFilter({ searchText: 'customers' });
      const result = getFilteredHistory(history);

      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('Get all customers');
    });

    it('should filter by error message', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const history = [
        createMockHistoryEntry({
          queryText: 'SELECT * FROM nonexistent',
          success: false,
          error: 'Table not found',
        }),
        createMockHistoryEntry({ queryText: 'SELECT * FROM users' }),
      ];

      setFilter({ searchText: 'not found' });
      const result = getFilteredHistory(history);

      expect(result).toHaveLength(1);
      expect(result[0].error).toBe('Table not found');
    });

    it('should return empty array when no matches', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const history = [
        createMockHistoryEntry({ queryText: 'SELECT * FROM users' }),
        createMockHistoryEntry({ queryText: 'INSERT INTO users' }),
      ];

      setFilter({ searchText: 'nonexistent' });
      const result = getFilteredHistory(history);

      expect(result).toHaveLength(0);
    });

    it('should handle entries with missing queryText and query', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const history = [
        createMockHistoryEntry({
          queryText: undefined,
          query: undefined,
        }),
        createMockHistoryEntry({ queryText: 'SELECT * FROM users' }),
      ];

      setFilter({ searchText: 'SELECT' });
      const result = getFilteredHistory(history);

      expect(result).toHaveLength(1);
    });
  });

  describe('getFilteredHistory - status', () => {
    it('should return all entries when status is "all"', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const history = [
        createMockHistoryEntry({ success: true }),
        createMockHistoryEntry({ success: false }),
      ];

      setFilter({ status: 'all' });
      const result = getFilteredHistory(history);

      expect(result).toHaveLength(2);
    });

    it('should filter by success status', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const history = [
        createMockHistoryEntry({ success: true }),
        createMockHistoryEntry({ success: false }),
        createMockHistoryEntry({ success: true }),
      ];

      setFilter({ status: 'success' });
      const result = getFilteredHistory(history);

      expect(result).toHaveLength(2);
      expect(result.every((e) => e.success === true)).toBe(true);
    });

    it('should filter by failed status', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const history = [
        createMockHistoryEntry({ success: true }),
        createMockHistoryEntry({ success: false, error: 'Syntax error' }),
        createMockHistoryEntry({ success: false, error: 'Table not found' }),
      ];

      setFilter({ status: 'failed' });
      const result = getFilteredHistory(history);

      expect(result).toHaveLength(2);
      expect(result.every((e) => e.success === false)).toBe(true);
    });

    it('should return empty array when no entries match status', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const history = [
        createMockHistoryEntry({ success: true }),
        createMockHistoryEntry({ success: true }),
      ];

      setFilter({ status: 'failed' });
      const result = getFilteredHistory(history);

      expect(result).toHaveLength(0);
    });
  });

  describe('getFilteredHistory - dateRange', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    it('should filter by start date only', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const history = [
        createMockHistoryEntry({ executedAt: today.toISOString() }),
        createMockHistoryEntry({ executedAt: yesterday.toISOString() }),
        createMockHistoryEntry({ executedAt: threeDaysAgo.toISOString() }),
      ];

      setFilter({ dateRange: { start: toISODate(yesterday) } });
      const result = getFilteredHistory(history);

      expect(result).toHaveLength(2);
    });

    it('should filter by end date only', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const history = [
        createMockHistoryEntry({ executedAt: today.toISOString() }),
        createMockHistoryEntry({ executedAt: yesterday.toISOString() }),
        createMockHistoryEntry({ executedAt: threeDaysAgo.toISOString() }),
      ];

      setFilter({ dateRange: { end: toISODate(yesterday) } });
      const result = getFilteredHistory(history);

      expect(result).toHaveLength(2);
    });

    it('should filter by both start and end date', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const history = [
        createMockHistoryEntry({ executedAt: today.toISOString() }),
        createMockHistoryEntry({ executedAt: yesterday.toISOString() }),
        createMockHistoryEntry({ executedAt: twoDaysAgo.toISOString() }),
        createMockHistoryEntry({ executedAt: threeDaysAgo.toISOString() }),
      ];

      setFilter({
        dateRange: { start: toISODate(twoDaysAgo), end: toISODate(yesterday) },
      });
      const result = getFilteredHistory(history);

      expect(result).toHaveLength(2);
    });

    it('should include entries on the start date', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const startOfYesterday = new Date(yesterday);
      startOfYesterday.setHours(0, 0, 0, 0);

      const history = [
        createMockHistoryEntry({ executedAt: startOfYesterday.toISOString() }),
        createMockHistoryEntry({ executedAt: threeDaysAgo.toISOString() }),
      ];

      setFilter({ dateRange: { start: toISODate(yesterday) } });
      const result = getFilteredHistory(history);

      expect(result).toHaveLength(1);
    });

    it('should include entries on the end date', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);

      const history = [
        createMockHistoryEntry({ executedAt: endOfYesterday.toISOString() }),
        createMockHistoryEntry({ executedAt: today.toISOString() }),
      ];

      setFilter({ dateRange: { end: toISODate(yesterday) } });
      const result = getFilteredHistory(history);

      expect(result).toHaveLength(1);
    });

    it('should use timestamp property as fallback', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const history = [
        createMockHistoryEntry({
          executedAt: undefined,
          timestamp: today.toISOString(),
        }),
        createMockHistoryEntry({
          executedAt: undefined,
          timestamp: threeDaysAgo.toISOString(),
        }),
      ];

      setFilter({ dateRange: { start: toISODate(yesterday) } });
      const result = getFilteredHistory(history);

      expect(result).toHaveLength(1);
    });

    it('should handle empty dateRange gracefully', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const history = [
        createMockHistoryEntry({ executedAt: today.toISOString() }),
        createMockHistoryEntry({ executedAt: yesterday.toISOString() }),
      ];

      setFilter({ dateRange: {} });
      const result = getFilteredHistory(history);

      expect(result).toHaveLength(2);
    });
  });

  describe('getFilteredHistory - combined filters', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    it('should apply searchText and status filters together', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const history = [
        createMockHistoryEntry({
          queryText: 'SELECT * FROM users',
          success: true,
        }),
        createMockHistoryEntry({
          queryText: 'SELECT * FROM orders',
          success: false,
        }),
        createMockHistoryEntry({
          queryText: 'INSERT INTO users',
          success: true,
        }),
      ];

      setFilter({ searchText: 'SELECT', status: 'success' });
      const result = getFilteredHistory(history);

      expect(result).toHaveLength(1);
      expect(result[0].queryText).toBe('SELECT * FROM users');
    });

    it('should apply searchText and dateRange filters together', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const history = [
        createMockHistoryEntry({
          queryText: 'SELECT * FROM users',
          executedAt: today.toISOString(),
        }),
        createMockHistoryEntry({
          queryText: 'SELECT * FROM orders',
          executedAt: twoDaysAgo.toISOString(),
        }),
        createMockHistoryEntry({
          queryText: 'INSERT INTO users',
          executedAt: today.toISOString(),
        }),
      ];

      setFilter({
        searchText: 'SELECT',
        dateRange: { start: toISODate(yesterday) },
      });
      const result = getFilteredHistory(history);

      expect(result).toHaveLength(1);
      expect(result[0].queryText).toBe('SELECT * FROM users');
    });

    it('should apply status and dateRange filters together', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const history = [
        createMockHistoryEntry({
          success: true,
          executedAt: today.toISOString(),
        }),
        createMockHistoryEntry({
          success: false,
          executedAt: today.toISOString(),
        }),
        createMockHistoryEntry({
          success: true,
          executedAt: twoDaysAgo.toISOString(),
        }),
      ];

      setFilter({
        status: 'success',
        dateRange: { start: toISODate(yesterday) },
      });
      const result = getFilteredHistory(history);

      expect(result).toHaveLength(1);
    });

    it('should apply all three filters together', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const history = [
        createMockHistoryEntry({
          queryText: 'SELECT * FROM users',
          success: true,
          executedAt: today.toISOString(),
        }),
        createMockHistoryEntry({
          queryText: 'SELECT * FROM users',
          success: false,
          executedAt: today.toISOString(),
        }),
        createMockHistoryEntry({
          queryText: 'SELECT * FROM users',
          success: true,
          executedAt: twoDaysAgo.toISOString(),
        }),
        createMockHistoryEntry({
          queryText: 'INSERT INTO users',
          success: true,
          executedAt: today.toISOString(),
        }),
      ];

      setFilter({
        searchText: 'SELECT',
        status: 'success',
        dateRange: { start: toISODate(yesterday) },
      });
      const result = getFilteredHistory(history);

      expect(result).toHaveLength(1);
      expect(result[0].queryText).toBe('SELECT * FROM users');
      expect(result[0].success).toBe(true);
    });

    it('should return empty when combined filters have no matches', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const history = [
        createMockHistoryEntry({
          queryText: 'SELECT * FROM users',
          success: true,
          executedAt: today.toISOString(),
        }),
        createMockHistoryEntry({
          queryText: 'INSERT INTO orders',
          success: false,
          executedAt: yesterday.toISOString(),
        }),
      ];

      setFilter({
        searchText: 'DELETE',
        status: 'failed',
        dateRange: { start: toISODate(twoDaysAgo) },
      });
      const result = getFilteredHistory(history);

      expect(result).toHaveLength(0);
    });
  });

  describe('getActiveFilterCount', () => {
    it('should return 0 when no filters are active', () => {
      const { getActiveFilterCount } = useQueryHistoryStore.getState();

      expect(getActiveFilterCount()).toBe(0);
    });

    it('should count searchText filter', () => {
      const { setFilter, getActiveFilterCount } =
        useQueryHistoryStore.getState();

      setFilter({ searchText: 'SELECT' });

      expect(getActiveFilterCount()).toBe(1);
    });

    it('should not count empty searchText', () => {
      const { setFilter, getActiveFilterCount } =
        useQueryHistoryStore.getState();

      setFilter({ searchText: '' });

      expect(getActiveFilterCount()).toBe(0);
    });

    it('should count status filter when not "all"', () => {
      const { setFilter, getActiveFilterCount } =
        useQueryHistoryStore.getState();

      setFilter({ status: 'success' });

      expect(getActiveFilterCount()).toBe(1);
    });

    it('should not count status filter when "all"', () => {
      const { setFilter, getActiveFilterCount } =
        useQueryHistoryStore.getState();

      setFilter({ status: 'all' });

      expect(getActiveFilterCount()).toBe(0);
    });

    it('should count dateRange filter when start is set', () => {
      const { setFilter, getActiveFilterCount } =
        useQueryHistoryStore.getState();

      setFilter({ dateRange: { start: '2024-01-01' } });

      expect(getActiveFilterCount()).toBe(1);
    });

    it('should count dateRange filter when end is set', () => {
      const { setFilter, getActiveFilterCount } =
        useQueryHistoryStore.getState();

      setFilter({ dateRange: { end: '2024-12-31' } });

      expect(getActiveFilterCount()).toBe(1);
    });

    it('should count dateRange as 1 when both start and end are set', () => {
      const { setFilter, getActiveFilterCount } =
        useQueryHistoryStore.getState();

      setFilter({ dateRange: { start: '2024-01-01', end: '2024-12-31' } });

      expect(getActiveFilterCount()).toBe(1);
    });

    it('should not count empty dateRange', () => {
      const { setFilter, getActiveFilterCount } =
        useQueryHistoryStore.getState();

      setFilter({ dateRange: {} });

      expect(getActiveFilterCount()).toBe(0);
    });

    it('should count all active filters', () => {
      const { setFilter, getActiveFilterCount } =
        useQueryHistoryStore.getState();

      setFilter({
        searchText: 'SELECT',
        status: 'failed',
        dateRange: { start: '2024-01-01' },
      });

      expect(getActiveFilterCount()).toBe(3);
    });

    it('should update count when filters change', () => {
      const { setFilter, clearFilters, getActiveFilterCount } =
        useQueryHistoryStore.getState();

      setFilter({ searchText: 'SELECT' });
      expect(getActiveFilterCount()).toBe(1);

      setFilter({ status: 'success' });
      expect(getActiveFilterCount()).toBe(2);

      clearFilters();
      expect(getActiveFilterCount()).toBe(0);
    });
  });

  describe('store API', () => {
    it('should expose getState method', () => {
      expect(typeof useQueryHistoryStore.getState).toBe('function');
    });

    it('should expose setState method', () => {
      expect(typeof useQueryHistoryStore.setState).toBe('function');
    });

    it('should expose subscribe method', () => {
      expect(typeof useQueryHistoryStore.subscribe).toBe('function');
    });

    it('should allow subscribing to state changes', () => {
      const listener = vi.fn();
      const unsubscribe = useQueryHistoryStore.subscribe(listener);

      const { setFilter } = useQueryHistoryStore.getState();
      setFilter({ searchText: 'SELECT' });

      expect(listener).toHaveBeenCalled();

      unsubscribe();
    });

    it('should stop receiving updates after unsubscribe', () => {
      const listener = vi.fn();
      const unsubscribe = useQueryHistoryStore.subscribe(listener);

      unsubscribe();
      listener.mockClear();

      const { setFilter } = useQueryHistoryStore.getState();
      setFilter({ searchText: 'SELECT' });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty history array', () => {
      const { getFilteredHistory } = useQueryHistoryStore.getState();

      const result = getFilteredHistory([]);

      expect(result).toEqual([]);
    });

    it('should handle special characters in search text', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const history = [
        createMockHistoryEntry({
          queryText: "SELECT * FROM users WHERE name = 'O''Brien'",
        }),
      ];

      setFilter({ searchText: "O''Brien" });
      const result = getFilteredHistory(history);

      expect(result).toHaveLength(1);
    });

    it('should handle unicode in search text', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const history = [
        createMockHistoryEntry({
          queryText: "SELECT * FROM users WHERE name = '日本語'",
        }),
      ];

      setFilter({ searchText: '日本語' });
      const result = getFilteredHistory(history);

      expect(result).toHaveLength(1);
    });

    it('should handle very long query text', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const longQuery = `SELECT ${'a, '.repeat(1000)}b FROM table`;
      const history = [createMockHistoryEntry({ queryText: longQuery })];

      setFilter({ searchText: 'table' });
      const result = getFilteredHistory(history);

      expect(result).toHaveLength(1);
    });

    it('should handle entries with undefined success field', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const history = [
        createMockHistoryEntry({ success: undefined as unknown as boolean }),
        createMockHistoryEntry({ success: true }),
      ];

      setFilter({ status: 'success' });
      const result = getFilteredHistory(history);

      expect(result).toHaveLength(1);
    });

    it('should handle entries with invalid date format', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const history = [
        createMockHistoryEntry({ executedAt: 'invalid-date' }),
        createMockHistoryEntry({ executedAt: new Date().toISOString() }),
      ];

      setFilter({ dateRange: { start: toISODate(new Date()) } });
      const result = getFilteredHistory(history);

      // Invalid date should be filtered out (NaN comparison fails)
      expect(result).toHaveLength(1);
    });

    it('should handle multiple rapid filter changes', () => {
      const { setFilter, getFilteredHistory } = useQueryHistoryStore.getState();
      const history = [
        createMockHistoryEntry({ queryText: 'SELECT * FROM users' }),
        createMockHistoryEntry({ queryText: 'INSERT INTO orders' }),
      ];

      setFilter({ searchText: 'SELECT' });
      setFilter({ searchText: 'INSERT' });
      setFilter({ searchText: 'DELETE' });
      setFilter({ searchText: 'SELECT' });

      const result = getFilteredHistory(history);

      expect(result).toHaveLength(1);
      expect(result[0].queryText).toBe('SELECT * FROM users');
    });
  });
});
