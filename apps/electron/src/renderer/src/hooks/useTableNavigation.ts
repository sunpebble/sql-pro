import type { TableSchema } from '@/types/database';
import { useCallback, useMemo } from 'react';
// Direct imports to avoid barrel file overhead (bundle-barrel-imports)
import { useConnectionStore } from '@/stores/connection-store';
import { useDataTabsStore } from '@/stores/data-tabs-store';
import { useTableOrganizationStore } from '@/stores/table-organization-store';

/**
 * Hook that provides table navigation functionality for keyboard shortcuts.
 * Returns the list of visible tables (respecting sort/filter/pins) and
 * navigation functions to go to next/previous table.
 */
export function useTableNavigation() {
  const {
    schema,
    selectedTable,
    setSelectedTable,
    connection,
    activeConnectionId,
  } = useConnectionStore();
  const { openTable } = useDataTabsStore();
  const { sortOption, activeTagFilter, getTableKey, getTableMetadata } =
    useTableOrganizationStore();

  /**
   * Get the list of all visible/navigable tables respecting current filters,
   * sort order, and pinned status. This mirrors the logic in Sidebar.tsx's
   * filteredSchemas useMemo.
   */
  const navigableTables = useMemo(() => {
    if (!schema?.schemas) return [];

    const tables: TableSchema[] = [];

    // Helper function to sort tables based on current sort option
    const sortTables = (tablesToSort: TableSchema[]): TableSchema[] => {
      const sorted = [...tablesToSort];

      // First, separate pinned and non-pinned tables
      const pinned: TableSchema[] = [];
      const unpinned: TableSchema[] = [];

      for (const table of sorted) {
        const key = getTableKey(
          connection?.path || '',
          table.schema,
          table.name
        );
        const metadata = getTableMetadata(key);
        if (metadata.pinned) {
          pinned.push(table);
        } else {
          unpinned.push(table);
        }
      }

      // Sort unpinned tables based on sort option
      const sortFn = (a: TableSchema, b: TableSchema): number => {
        switch (sortOption) {
          case 'name-asc':
            return a.name.localeCompare(b.name);
          case 'name-desc':
            return b.name.localeCompare(a.name);
          case 'row-count-asc':
            return (a.rowCount ?? 0) - (b.rowCount ?? 0);
          case 'row-count-desc':
            return (b.rowCount ?? 0) - (a.rowCount ?? 0);
          case 'custom': {
            const keyA = getTableKey(connection?.path || '', a.schema, a.name);
            const keyB = getTableKey(connection?.path || '', b.schema, b.name);
            const orderA = getTableMetadata(keyA).sortOrder ?? Infinity;
            const orderB = getTableMetadata(keyB).sortOrder ?? Infinity;
            return orderA - orderB;
          }
          default:
            return a.name.localeCompare(b.name);
        }
      };

      pinned.sort(sortFn);
      unpinned.sort(sortFn);

      return [...pinned, ...unpinned];
    };

    // Helper function to filter by active tag
    const filterByTag = (tablesToFilter: TableSchema[]): TableSchema[] => {
      if (!activeTagFilter) return tablesToFilter;
      return tablesToFilter.filter((table) => {
        const key = getTableKey(
          connection?.path || '',
          table.schema,
          table.name
        );
        const metadata = getTableMetadata(key);
        return metadata.tagIds.includes(activeTagFilter);
      });
    };

    // Process each schema's tables and views
    for (const schemaInfo of schema.schemas) {
      // Get tables and views, apply tag filter, then sort
      let schemaTables = filterByTag(schemaInfo.tables);
      let schemaViews = filterByTag(schemaInfo.views);

      schemaTables = sortTables(schemaTables);
      schemaViews = sortTables(schemaViews);

      // Add all tables and views to the navigable list
      tables.push(...schemaTables, ...schemaViews);
    }

    return tables;
  }, [
    schema?.schemas,
    sortOption,
    activeTagFilter,
    connection?.path,
    getTableKey,
    getTableMetadata,
  ]);

  /**
   * Select and open a table, switching to the data view
   */
  const selectTable = useCallback(
    (table: TableSchema) => {
      if (!connection || !activeConnectionId) return;

      setSelectedTable(table);
      openTable(activeConnectionId, table);
    },
    [connection, activeConnectionId, setSelectedTable, openTable]
  );

  /**
   * Navigate to the next table in the list.
   * Wraps around to the first table when at the end.
   */
  const nextTable = useCallback(() => {
    if (navigableTables.length === 0) return;

    if (!selectedTable) {
      // No table selected, select the first one
      selectTable(navigableTables[0]);
      return;
    }

    // Find current table index
    const currentIndex = navigableTables.findIndex(
      (t) => t.name === selectedTable.name && t.schema === selectedTable.schema
    );

    if (currentIndex === -1) {
      // Current table not in list (maybe filtered out), select first
      selectTable(navigableTables[0]);
      return;
    }

    // Navigate to next table with wrapping
    const nextIndex = (currentIndex + 1) % navigableTables.length;
    selectTable(navigableTables[nextIndex]);
  }, [navigableTables, selectedTable, selectTable]);

  /**
   * Navigate to the previous table in the list.
   * Wraps around to the last table when at the beginning.
   */
  const prevTable = useCallback(() => {
    if (navigableTables.length === 0) return;

    if (!selectedTable) {
      // No table selected, select the last one
      selectTable(navigableTables.at(-1)!);
      return;
    }

    // Find current table index
    const currentIndex = navigableTables.findIndex(
      (t) => t.name === selectedTable.name && t.schema === selectedTable.schema
    );

    if (currentIndex === -1) {
      // Current table not in list (maybe filtered out), select last
      selectTable(navigableTables.at(-1)!);
      return;
    }

    // Navigate to previous table with wrapping
    const prevIndex =
      (currentIndex - 1 + navigableTables.length) % navigableTables.length;
    selectTable(navigableTables[prevIndex]);
  }, [navigableTables, selectedTable, selectTable]);

  return {
    /** List of all navigable tables (respecting filters, sort, pins) */
    navigableTables,
    /** Currently selected table */
    selectedTable,
    /** Navigate to the next table (wraps around) */
    nextTable,
    /** Navigate to the previous table (wraps around) */
    prevTable,
    /** Whether table navigation is available (has tables to navigate) */
    canNavigate: navigableTables.length > 0,
    /** Number of tables available for navigation */
    tableCount: navigableTables.length,
  };
}
