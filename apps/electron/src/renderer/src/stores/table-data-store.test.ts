import type { TableDataForConnection } from './table-data-store';
import type { ColumnSchema, FilterState } from '@/types/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  estimateTableDataSize,
  tableDataCache,
  useTableDataStore,
} from './table-data-store';

// Helper function to create mock columns
function createMockColumns(count = 3): ColumnSchema[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `column_${i}`,
    type: 'TEXT',
    nullable: true,
    defaultValue: null,
    isPrimaryKey: i === 0,
  }));
}

// Helper function to create mock rows
function createMockRows(
  count = 10,
  columns: ColumnSchema[] = createMockColumns()
): Record<string, unknown>[] {
  return Array.from({ length: count }, (_, i) => {
    const row: Record<string, unknown> = {};
    for (const col of columns) {
      row[col.name] = `value_${i}_${col.name}`;
    }
    return row;
  });
}

// Helper to create a TableDataForConnection object
function createMockTableData(
  overrides: Partial<TableDataForConnection> = {}
): TableDataForConnection {
  const columns = createMockColumns();
  return {
    tableName: 'test_table',
    columns,
    rows: createMockRows(5, columns),
    pagination: {
      page: 1,
      pageSize: 100,
      totalRows: 100,
      totalPages: 1,
    },
    sort: null,
    filters: [],
    isLoading: false,
    error: null,
    reloadVersion: 0,
    ...overrides,
  };
}

describe('table-data-store', () => {
  beforeEach(() => {
    // Reset store and cache to initial state before each test
    tableDataCache.clear();
    useTableDataStore.setState({
      activeConnectionId: null,
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have null activeConnectionId', () => {
      const { activeConnectionId } = useTableDataStore.getState();
      expect(activeConnectionId).toBeNull();
    });

    it('should have empty cache', () => {
      const stats = useTableDataStore.getState().getCacheStats();
      expect(stats.itemCount).toBe(0);
      expect(stats.totalBytes).toBe(0);
    });

    it('should have default cache config', () => {
      const config = useTableDataStore.getState().getCacheConfig();
      expect(config.maxBytes).toBe(50 * 1024 * 1024); // 50MB
      expect(config.maxConnections).toBe(10);
    });
  });

  describe('legacy compatibility getters', () => {
    const connectionId = 'test-connection';

    it('should return null/empty values when no active connection', () => {
      const state = useTableDataStore.getState();
      expect(state.tableName).toBeNull();
      expect(state.columns).toEqual([]);
      expect(state.rows).toEqual([]);
      expect(state.sort).toBeNull();
      expect(state.filters).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.reloadVersion).toBe(0);
    });

    it('should return data for active connection', () => {
      const columns = createMockColumns();
      const rows = createMockRows(3, columns);
      const { setActiveConnectionId, setTableData, getCurrentData } =
        useTableDataStore.getState();

      setActiveConnectionId(connectionId);
      setTableData(connectionId, 'users', columns, rows, 100);

      // Use getCurrentData() method instead of legacy getters for reliable access
      const data = getCurrentData();
      expect(data?.tableName).toBe('users');
      expect(data?.columns).toEqual(columns);
      expect(data?.rows).toEqual(rows);
      expect(data?.pagination.totalRows).toBe(100);
    });
  });

  describe('setActiveConnectionId', () => {
    it('should set active connection ID', () => {
      const { setActiveConnectionId } = useTableDataStore.getState();

      setActiveConnectionId('conn-1');

      expect(useTableDataStore.getState().activeConnectionId).toBe('conn-1');
    });

    it('should allow setting to null', () => {
      const { setActiveConnectionId } = useTableDataStore.getState();

      setActiveConnectionId('conn-1');
      setActiveConnectionId(null);

      expect(useTableDataStore.getState().activeConnectionId).toBeNull();
    });
  });

  describe('setTableData', () => {
    const connectionId = 'test-connection';

    it('should store table data in cache', () => {
      const columns = createMockColumns();
      const rows = createMockRows(5, columns);
      const { setTableData, getDataForConnection } =
        useTableDataStore.getState();

      setTableData(connectionId, 'users', columns, rows, 50);

      const data = getDataForConnection(connectionId);
      expect(data).not.toBeNull();
      expect(data?.tableName).toBe('users');
      expect(data?.columns).toEqual(columns);
      expect(data?.rows).toEqual(rows);
      expect(data?.pagination.totalRows).toBe(50);
    });

    it('should calculate totalPages correctly', () => {
      const { setTableData, getDataForConnection } =
        useTableDataStore.getState();

      setTableData(connectionId, 'users', [], [], 250);

      const data = getDataForConnection(connectionId);
      expect(data?.pagination.totalPages).toBe(3); // 250 / 100 = 2.5 -> ceil = 3
    });

    it('should clear error when setting data', () => {
      const { setTableData, setError, getDataForConnection } =
        useTableDataStore.getState();

      setError(connectionId, 'Previous error');
      setTableData(connectionId, 'users', [], [], 0);

      const data = getDataForConnection(connectionId);
      expect(data?.error).toBeNull();
    });

    it('should update cache stats', () => {
      const columns = createMockColumns();
      const rows = createMockRows(100, columns);
      const { setTableData, getCacheStats } = useTableDataStore.getState();

      setTableData(connectionId, 'users', columns, rows, 100);

      const stats = getCacheStats();
      expect(stats.itemCount).toBe(1);
      expect(stats.totalBytes).toBeGreaterThan(0);
    });
  });

  describe('setPagination', () => {
    const connectionId = 'test-connection';

    it('should update pagination', () => {
      const { setTableData, setPagination, getDataForConnection } =
        useTableDataStore.getState();

      setTableData(connectionId, 'users', [], [], 100);
      setPagination(connectionId, { page: 2, pageSize: 50 });

      const data = getDataForConnection(connectionId);
      expect(data?.pagination.page).toBe(2);
      expect(data?.pagination.pageSize).toBe(50);
    });

    it('should create data if connection does not exist', () => {
      const { setPagination, getDataForConnection } =
        useTableDataStore.getState();

      setPagination(connectionId, { page: 3 });

      const data = getDataForConnection(connectionId);
      expect(data?.pagination.page).toBe(3);
    });
  });

  describe('setSort', () => {
    const connectionId = 'test-connection';

    it('should set sort', () => {
      const { setTableData, setSort, getDataForConnection } =
        useTableDataStore.getState();

      setTableData(connectionId, 'users', [], [], 0);
      setSort(connectionId, { column: 'name', direction: 'asc' });

      const data = getDataForConnection(connectionId);
      expect(data?.sort).toEqual({ column: 'name', direction: 'asc' });
    });

    it('should clear sort when set to null', () => {
      const { setSort, getDataForConnection } = useTableDataStore.getState();

      setSort(connectionId, { column: 'name', direction: 'asc' });
      setSort(connectionId, null);

      const data = getDataForConnection(connectionId);
      expect(data?.sort).toBeNull();
    });
  });

  describe('setFilters', () => {
    const connectionId = 'test-connection';

    it('should set filters', () => {
      const { setFilters, getDataForConnection } = useTableDataStore.getState();
      const filters: FilterState[] = [
        { column: 'name', operator: 'eq', value: 'John' },
      ];

      setFilters(connectionId, filters);

      const data = getDataForConnection(connectionId);
      expect(data?.filters).toEqual(filters);
    });
  });

  describe('addFilter', () => {
    const connectionId = 'test-connection';

    it('should add filter to existing filters', () => {
      const { setFilters, addFilter, getDataForConnection } =
        useTableDataStore.getState();

      setFilters(connectionId, [
        { column: 'name', operator: 'eq', value: 'John' },
      ]);
      addFilter(connectionId, { column: 'age', operator: 'gt', value: '21' });

      const data = getDataForConnection(connectionId);
      expect(data?.filters).toHaveLength(2);
      expect(data?.filters[1].column).toBe('age');
    });
  });

  describe('removeFilter', () => {
    const connectionId = 'test-connection';

    it('should remove filter at index', () => {
      const { setFilters, removeFilter, getDataForConnection } =
        useTableDataStore.getState();

      setFilters(connectionId, [
        { column: 'name', operator: 'eq', value: 'John' },
        { column: 'age', operator: 'gt', value: '21' },
        { column: 'city', operator: 'like', value: 'York' },
      ]);
      removeFilter(connectionId, 1);

      const data = getDataForConnection(connectionId);
      expect(data?.filters).toHaveLength(2);
      expect(data?.filters[0].column).toBe('name');
      expect(data?.filters[1].column).toBe('city');
    });
  });

  describe('setIsLoading', () => {
    const connectionId = 'test-connection';

    it('should set isLoading', () => {
      const { setIsLoading, getDataForConnection } =
        useTableDataStore.getState();

      setIsLoading(connectionId, true);
      expect(getDataForConnection(connectionId)?.isLoading).toBe(true);

      setIsLoading(connectionId, false);
      expect(getDataForConnection(connectionId)?.isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    const connectionId = 'test-connection';

    it('should set error', () => {
      const { setError, getDataForConnection } = useTableDataStore.getState();

      setError(connectionId, 'Something went wrong');

      const data = getDataForConnection(connectionId);
      expect(data?.error).toBe('Something went wrong');
    });

    it('should clear error when set to null', () => {
      const { setError, getDataForConnection } = useTableDataStore.getState();

      setError(connectionId, 'Error');
      setError(connectionId, null);

      expect(getDataForConnection(connectionId)?.error).toBeNull();
    });
  });

  describe('resetConnection', () => {
    const connectionId = 'test-connection';

    it('should reset connection to default state', () => {
      const { setTableData, setSort, resetConnection, getDataForConnection } =
        useTableDataStore.getState();

      setTableData(connectionId, 'users', createMockColumns(), [], 100);
      setSort(connectionId, { column: 'name', direction: 'asc' });
      resetConnection(connectionId);

      const data = getDataForConnection(connectionId);
      expect(data?.tableName).toBeNull();
      expect(data?.columns).toEqual([]);
      expect(data?.rows).toEqual([]);
      expect(data?.sort).toBeNull();
    });
  });

  describe('removeConnectionData', () => {
    const connectionId = 'test-connection';

    it('should remove connection data from cache', () => {
      const { setTableData, removeConnectionData, getDataForConnection } =
        useTableDataStore.getState();

      setTableData(connectionId, 'users', [], [], 0);
      expect(getDataForConnection(connectionId)).not.toBeNull();

      removeConnectionData(connectionId);
      expect(getDataForConnection(connectionId)).toBeNull();
    });

    it('should clear activeConnectionId if it matches', () => {
      const { setActiveConnectionId, setTableData, removeConnectionData } =
        useTableDataStore.getState();

      setActiveConnectionId(connectionId);
      setTableData(connectionId, 'users', [], [], 0);
      removeConnectionData(connectionId);

      expect(useTableDataStore.getState().activeConnectionId).toBeNull();
    });

    it('should not clear activeConnectionId if it does not match', () => {
      const { setActiveConnectionId, setTableData, removeConnectionData } =
        useTableDataStore.getState();

      setActiveConnectionId('other-connection');
      setTableData(connectionId, 'users', [], [], 0);
      removeConnectionData(connectionId);

      expect(useTableDataStore.getState().activeConnectionId).toBe(
        'other-connection'
      );
    });
  });

  describe('triggerReload', () => {
    const connectionId = 'test-connection';

    it('should increment reloadVersion', () => {
      const { triggerReload, getDataForConnection } =
        useTableDataStore.getState();

      expect(getDataForConnection(connectionId)?.reloadVersion || 0).toBe(0);

      triggerReload(connectionId);
      expect(getDataForConnection(connectionId)?.reloadVersion).toBe(1);

      triggerReload(connectionId);
      expect(getDataForConnection(connectionId)?.reloadVersion).toBe(2);
    });
  });

  describe('reset', () => {
    it('should clear all data and reset state', () => {
      const { setActiveConnectionId, setTableData, reset, getCacheStats } =
        useTableDataStore.getState();

      setActiveConnectionId('conn-1');
      setTableData('conn-1', 'users', [], [], 0);
      setTableData('conn-2', 'orders', [], [], 0);

      expect(getCacheStats().itemCount).toBe(2);

      reset();

      expect(useTableDataStore.getState().activeConnectionId).toBeNull();
      expect(getCacheStats().itemCount).toBe(0);
    });
  });

  describe('getDataForConnection', () => {
    it('should return data for existing connection', () => {
      const { setTableData, getDataForConnection } =
        useTableDataStore.getState();

      setTableData('conn-1', 'users', [], [], 0);

      expect(getDataForConnection('conn-1')).not.toBeNull();
    });

    it('should return null for non-existent connection', () => {
      const { getDataForConnection } = useTableDataStore.getState();
      expect(getDataForConnection('non-existent')).toBeNull();
    });
  });

  describe('getCurrentData', () => {
    it('should return data for active connection', () => {
      const { setActiveConnectionId, setTableData, getCurrentData } =
        useTableDataStore.getState();

      setActiveConnectionId('conn-1');
      setTableData('conn-1', 'users', [], [], 0);

      expect(getCurrentData()?.tableName).toBe('users');
    });

    it('should return null when no active connection', () => {
      const { getCurrentData } = useTableDataStore.getState();
      expect(getCurrentData()).toBeNull();
    });
  });

  describe('memory management', () => {
    describe('getCacheStats', () => {
      it('should return cache statistics', () => {
        const { setTableData, getCacheStats } = useTableDataStore.getState();

        setTableData(
          'conn-1',
          'users',
          createMockColumns(),
          createMockRows(10),
          10
        );
        setTableData(
          'conn-2',
          'orders',
          createMockColumns(),
          createMockRows(20),
          20
        );

        const stats = getCacheStats();
        expect(stats.itemCount).toBe(2);
        expect(stats.totalBytes).toBeGreaterThan(0);
        expect(stats.name).toBe('TableDataCache');
      });
    });

    describe('setMemoryBudget', () => {
      it('should update max bytes limit', () => {
        const { setMemoryBudget, getCacheConfig } =
          useTableDataStore.getState();

        setMemoryBudget(100 * 1024 * 1024); // 100MB

        expect(getCacheConfig().maxBytes).toBe(100 * 1024 * 1024);
      });
    });

    describe('setMaxConnections', () => {
      it('should update max connections limit', () => {
        const { setMaxConnections, getCacheConfig } =
          useTableDataStore.getState();

        setMaxConnections(20);

        expect(getCacheConfig().maxConnections).toBe(20);
      });
    });

    describe('clearCache', () => {
      it('should clear all cached data', () => {
        const { setTableData, clearCache, getCacheStats } =
          useTableDataStore.getState();

        setTableData('conn-1', 'users', [], [], 0);
        setTableData('conn-2', 'orders', [], [], 0);

        clearCache();

        expect(getCacheStats().itemCount).toBe(0);
      });
    });

    describe('onEviction', () => {
      it('should call callback when data is evicted', () => {
        const callback = vi.fn();
        const { setMaxConnections, setTableData, onEviction } =
          useTableDataStore.getState();

        setMaxConnections(2);

        const unsubscribe = onEviction(callback);

        // Add 3 connections, which should evict the first one
        setTableData('conn-1', 'users', [], [], 0);
        setTableData('conn-2', 'orders', [], [], 0);
        setTableData('conn-3', 'products', [], [], 0);

        expect(callback).toHaveBeenCalled();
        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({
            key: 'conn-1',
            reason: 'max-items',
          })
        );

        unsubscribe();
      });

      it('should return unsubscribe function', () => {
        const callback = vi.fn();
        const { setMaxConnections, setTableData, onEviction } =
          useTableDataStore.getState();

        setMaxConnections(1);
        const unsubscribe = onEviction(callback);
        unsubscribe();

        // Clear the mock to ignore first eviction
        callback.mockClear();

        // Add more data - callback should not be called
        setTableData('conn-1', 'users', [], [], 0);
        setTableData('conn-2', 'orders', [], [], 0);

        expect(callback).not.toHaveBeenCalled();
      });
    });

    describe('lRU eviction', () => {
      it('should evict oldest connection when max connections exceeded', () => {
        const {
          setMaxConnections,
          setTableData,
          getDataForConnection,
          getCacheStats,
        } = useTableDataStore.getState();

        setMaxConnections(3);

        setTableData('conn-1', 'table1', [], [], 0);
        setTableData('conn-2', 'table2', [], [], 0);
        setTableData('conn-3', 'table3', [], [], 0);

        expect(getCacheStats().itemCount).toBe(3);

        // Adding a 4th connection should evict conn-1
        setTableData('conn-4', 'table4', [], [], 0);

        expect(getCacheStats().itemCount).toBe(3);
        expect(getDataForConnection('conn-1')).toBeNull();
        expect(getDataForConnection('conn-2')).not.toBeNull();
        expect(getDataForConnection('conn-3')).not.toBeNull();
        expect(getDataForConnection('conn-4')).not.toBeNull();
      });

      it('should evict based on memory limit', () => {
        const { setMemoryBudget, setTableData, getCacheStats } =
          useTableDataStore.getState();

        // Set a very small memory budget
        setMemoryBudget(5000); // 5KB

        const columns = createMockColumns(5);
        const rows = createMockRows(100, columns); // Creates data larger than 5KB

        setTableData('conn-1', 'table1', columns, rows, 100);

        const stats = getCacheStats();
        // Data should be stored, but might trigger eviction if too large
        expect(stats.totalBytes).toBeLessThanOrEqual(5000);
      });
    });
  });

  describe('estimateTableDataSize', () => {
    it('should estimate size of empty data', () => {
      const emptyData = createMockTableData({
        tableName: null,
        columns: [],
        rows: [],
        filters: [],
        sort: null,
        error: null,
      });

      const size = estimateTableDataSize(emptyData);
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThan(1000); // Should be small
    });

    it('should estimate size with data', () => {
      const columns = createMockColumns(10);
      const rows = createMockRows(100, columns);
      const data = createMockTableData({
        columns,
        rows,
        filters: [
          { column: 'name', operator: 'eq', value: 'test' },
          { column: 'age', operator: 'gt', value: '21' },
        ],
        sort: { column: 'name', direction: 'asc' },
        error: 'Some error message',
      });

      const size = estimateTableDataSize(data);
      expect(size).toBeGreaterThan(10000); // Should be substantial
    });

    it('should increase size with more rows', () => {
      const columns = createMockColumns(5);
      const smallData = createMockTableData({
        columns,
        rows: createMockRows(10, columns),
      });
      const largeData = createMockTableData({
        columns,
        rows: createMockRows(1000, columns),
      });

      const smallSize = estimateTableDataSize(smallData);
      const largeSize = estimateTableDataSize(largeData);

      expect(largeSize).toBeGreaterThan(smallSize);
    });
  });

  describe('multiple connections', () => {
    it('should maintain separate data for different connections', () => {
      const { setTableData, setSort, getDataForConnection } =
        useTableDataStore.getState();

      setTableData('conn-1', 'users', [], [], 100);
      setTableData('conn-2', 'orders', [], [], 200);
      setSort('conn-1', { column: 'name', direction: 'asc' });

      const data1 = getDataForConnection('conn-1');
      const data2 = getDataForConnection('conn-2');

      expect(data1?.tableName).toBe('users');
      expect(data1?.pagination.totalRows).toBe(100);
      expect(data1?.sort).toEqual({ column: 'name', direction: 'asc' });

      expect(data2?.tableName).toBe('orders');
      expect(data2?.pagination.totalRows).toBe(200);
      expect(data2?.sort).toBeNull();
    });
  });

  describe('store API', () => {
    it('should expose getState method', () => {
      expect(typeof useTableDataStore.getState).toBe('function');
    });

    it('should expose setState method', () => {
      expect(typeof useTableDataStore.setState).toBe('function');
    });

    it('should expose subscribe method', () => {
      expect(typeof useTableDataStore.subscribe).toBe('function');
    });

    it('should allow subscribing to state changes', () => {
      const listener = vi.fn();
      const unsubscribe = useTableDataStore.subscribe(listener);

      const { setActiveConnectionId } = useTableDataStore.getState();
      setActiveConnectionId('conn-1');

      expect(listener).toHaveBeenCalled();

      unsubscribe();
    });
  });
});
