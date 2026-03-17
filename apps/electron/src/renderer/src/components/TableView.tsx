import type { BulkEditField } from './BulkEditDialog';
import type { DataTableRef, TableRowData } from './data-table';
import type { ExportOptions } from './ExportDialog';
import type { UIFilterState } from '@/lib/filter-utils';
import type { PageSizeOption } from '@/stores/settings-store';
import type { PendingChange, SortState, TableSchema } from '@/types/database';
import { Button } from '@sqlpro/ui/button';
import { Input } from '@sqlpro/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sqlpro/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sqlpro/ui/tooltip';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Edit3,
  Eye,
  FileText,
  ImageIcon,
  Plus,
  RefreshCw,
  Search,
  Table2,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShortcutKbd } from '@/components/ui/kbd';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useClientSearch } from '@/hooks/useClientSearch';
import { useExport } from '@/hooks/useExport';
import { usePendingChanges } from '@/hooks/usePendingChanges';
import { usePgNotify } from '@/hooks/usePgNotify';
import { useTableData } from '@/hooks/useTableData';
import { convertUIFiltersToAPIFilters } from '@/lib/filter-utils';
import { TOOLTIP_CONTENT_FLEX } from '@/lib/utils';
import { useConnectionStore } from '@/stores/connection-store';
import { useDataTabsStore } from '@/stores/data-tabs-store';
// Direct imports to avoid barrel file overhead (bundle-barrel-imports)
import {
  PAGE_SIZE_OPTIONS,
  usePageSize,
  useSettingsStore,
} from '@/stores/settings-store';
import { BulkEditDialog } from './BulkEditDialog';
import {
  ColumnStats,
  DataQualityIndicator,
  DataTable,
  QuickFilterTags,
  SelectionStats,
  SkeletonTable,
} from './data-table';
import { ActiveFilters } from './data-table/ActiveFilters';
import { DiffPreview } from './DiffPreview';
import { ExportDialog } from './ExportDialog';
import { TableImageGallery } from './image-gallery';

interface TableViewProps {
  /** Optional table override - when provided, uses this table instead of selectedTable from store */
  tableOverride?: TableSchema;
}

export function TableView({ tableOverride }: TableViewProps) {
  const {
    connection,
    selectedTable: storeSelectedTable,
    activeConnectionId,
  } = useConnectionStore();
  const {
    updateTabSearchTerm,
    updateTabPage,
    updateTabSort,
    updateTabGrouping,
    updateTabFilters,
  } = useDataTabsStore();
  // Subscribe to the entire tabsByConnection state to ensure re-renders on any tab state change
  const tabsByConnection = useDataTabsStore((state) => state.tabsByConnection);

  // Use tableOverride if provided, otherwise fall back to store's selectedTable
  const selectedTable = tableOverride || storeSelectedTable;
  const dataTableRef = useRef<DataTableRef>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Compute active tab from the subscribed state
  // This ensures component re-renders when any tab state changes (page, sort, filters, etc.)
  const activeTab = useMemo(() => {
    if (!activeConnectionId) return undefined;
    const connState = tabsByConnection[activeConnectionId];
    if (!connState?.activeTabId) return undefined;
    return connState.tabs.find((t) => t.id === connState.activeTabId);
  }, [activeConnectionId, tabsByConnection]);

  const { t } = useTranslation('common');

  // Global page size setting
  const pageSize = usePageSize();
  const setPageSize = useSettingsStore((s) => s.setPageSize);

  // Use state from store (persisted per tab)
  const page = activeTab?.page ?? 1;
  const sort = activeTab?.sort ?? null;
  const grouping = activeTab?.grouping ?? [];
  // Memoize filters to avoid creating new array reference on every render
  const filters = useMemo(() => activeTab?.filters ?? [], [activeTab?.filters]);

  // Local UI state (not persisted)
  const [showDiffPreview, setShowDiffPreview] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  // View mode: 'data' for table view, 'images' for image gallery
  const [viewMode, setViewMode] = useState<'data' | 'images'>('data');
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // Focus the data table when switching back to data view
  useEffect(() => {
    if (viewMode === 'data') {
      // Use a small delay to ensure the table is rendered
      const timer = setTimeout(() => {
        dataTableRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [viewMode]);

  // Setters that update the store
  const setPage = useCallback(
    (newPage: number) => {
      if (activeConnectionId && activeTab?.id) {
        updateTabPage(activeConnectionId, activeTab.id, newPage);
      }
    },
    [activeConnectionId, activeTab?.id, updateTabPage]
  );

  const setSort = useCallback(
    (newSort: SortState | null) => {
      if (activeConnectionId && activeTab?.id) {
        updateTabSort(activeConnectionId, activeTab.id, newSort);
      }
    },
    [activeConnectionId, activeTab?.id, updateTabSort]
  );

  const setGrouping = useCallback(
    (newGrouping: string[]) => {
      if (activeConnectionId && activeTab?.id) {
        updateTabGrouping(activeConnectionId, activeTab.id, newGrouping);
      }
    },
    [activeConnectionId, activeTab?.id, updateTabGrouping]
  );

  const setFilters = useCallback(
    (
      newFilters: UIFilterState[] | ((prev: UIFilterState[]) => UIFilterState[])
    ) => {
      if (activeConnectionId && activeTab?.id) {
        const resolvedFilters =
          typeof newFilters === 'function' ? newFilters(filters) : newFilters;
        updateTabFilters(activeConnectionId, activeTab.id, resolvedFilters);
      }
    },
    [activeConnectionId, activeTab?.id, filters, updateTabFilters]
  );

  // Use search term from store (persisted per tab)
  const searchTerm = activeTab?.searchTerm ?? '';
  const setSearchTerm = useCallback(
    (term: string) => {
      if (activeConnectionId && activeTab?.id) {
        updateTabSearchTerm(activeConnectionId, activeTab.id, term);
      }
    },
    [activeConnectionId, activeTab?.id, updateTabSearchTerm]
  );

  // Track the newly inserted row ID for auto-focus
  const [newRowId, setNewRowId] = useState<string | number | null>(null);

  // Keyboard shortcut to focus search (Cmd+F / Ctrl+F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Find primary key column
  const primaryKeyColumn = selectedTable?.primaryKey[0];

  // Convert UI filters to API filters
  const apiFilters = useMemo(() => {
    return convertUIFiltersToAPIFilters(filters);
  }, [filters]);

  // Auto-refresh configuration
  const isPostgres =
    connection?.databaseType === 'postgresql' ||
    connection?.databaseType === 'supabase';
  const isMySql = connection?.databaseType === 'mysql';

  // PostgreSQL LISTEN/NOTIFY auto-refresh (real-time when triggers are set up)
  usePgNotify(isPostgres ? activeConnectionId : null, 'table_changes', {
    enabled: isPostgres && !!selectedTable,
    autoRefreshTable: selectedTable?.name,
    autoRefreshDebounceMs: 500,
  });

  // Polling-based auto-refresh for MySQL (and as fallback for PostgreSQL)
  // Uses a longer interval (30s) to avoid excessive queries
  useAutoRefresh(isMySql ? activeConnectionId : null, {
    enabled: isMySql && !!selectedTable,
    intervalMs: 30000, // 30 seconds
    pauseWhenHidden: true,
  });

  // Use paginated data hook
  const {
    rows,
    columns,
    totalRows,
    totalPages,
    isLoading,
    isFetching,
    error,
    updateRow,
    insertRow,
    deleteRow,
    refetch,
  } = useTableData({
    connectionId: connection?.id || null,
    schema: selectedTable?.schema,
    table: selectedTable?.name || null,
    page,
    pageSize,
    sortColumn: sort?.column,
    sortDirection: sort?.direction,
    filters: apiFilters,
    enabled: Boolean(connection && selectedTable),
    primaryKeyColumn,
  });

  const {
    changes: pendingChanges,
    hasChanges,
    changeCount,
  } = usePendingChanges({
    connectionId: connection?.id || null,
    schema: selectedTable?.schema,
    table: selectedTable?.name,
  });

  // Export functionality
  const { exportData } = useExport();

  // Transform rows for DataTable display
  const displayRows = useMemo((): TableRowData[] => {
    return rows.map((row) => {
      const rowId = row.__rowId;
      const isNew = '__isNew' in row && row.__isNew;
      const isDeleted = '__isDeleted' in row && row.__isDeleted;

      // Find the corresponding pending change
      const change = pendingChanges.find((c) => c.rowId === rowId);

      return {
        ...row,
        __rowId: rowId,
        __isNew: isNew,
        __deleted: isDeleted,
        __change: change as PendingChange | undefined,
      } as TableRowData;
    });
  }, [rows, pendingChanges]);

  // Get selected rows data for quick statistics (Excel-like)
  const selectedRowsData = useMemo(() => {
    if (selectedRowIds.length === 0) return [];
    const selectedSet = new Set(selectedRowIds);
    return displayRows.filter((row) => selectedSet.has(String(row.__rowId)));
  }, [displayRows, selectedRowIds]);

  // Client-side search on displayed rows
  const { filteredRows: searchFilteredRows, stats: searchStats } =
    useClientSearch({
      rows: displayRows,
      columns,
      searchTerm,
    });

  // Build changes map for DataTable
  const changesMap = useMemo(() => {
    const map = new Map<string | number, PendingChange>();
    pendingChanges.forEach((c) => map.set(c.rowId, c as PendingChange));
    return map;
  }, [pendingChanges]);

  // Handle page change
  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
    },
    [setPage]
  );

  // Handle page size change (global setting)
  const handlePageSizeChange = useCallback(
    (value: string | null) => {
      if (!value) return;
      const newSize = Number.parseInt(value, 10) as PageSizeOption;
      setPageSize(newSize);
      setPage(1); // Reset to first page when changing page size
    },
    [setPageSize, setPage]
  );

  // Handle sort change from DataTable
  const handleSortChange = useCallback(
    (newSort: SortState | null) => {
      setSort(newSort);
      setPage(1); // Reset to first page on sort change
    },
    [setSort, setPage]
  );

  // Handle filter add/update from ColumnFilterPopover
  const handleFilterAdd = useCallback(
    (filter: UIFilterState) => {
      setFilters((prevFilters) => {
        // Check if a filter already exists for this column
        const existingIndex = prevFilters.findIndex(
          (f) => f.column === filter.column
        );
        if (existingIndex >= 0) {
          // Update existing filter
          const newFilters = [...prevFilters];
          newFilters[existingIndex] = filter;
          return newFilters;
        }
        // Add new filter
        return [...prevFilters, filter];
      });
      setPage(1); // Reset to first page on filter change
    },
    [setFilters, setPage]
  );

  // Handle filter removal by column id
  const handleFilterRemove = useCallback(
    (columnId: string) => {
      setFilters((prevFilters) =>
        prevFilters.filter((f) => f.column !== columnId)
      );
      setPage(1); // Reset to first page on filter change
    },
    [setFilters, setPage]
  );

  // Handle clearing all filters
  const handleFiltersClear = useCallback(() => {
    setFilters([]);
    setPage(1); // Reset to first page on filter change
  }, [setFilters, setPage]);

  // Handle cell change from DataTable
  const handleCellChange = useCallback(
    (
      rowId: string | number,
      columnId: string,
      newValue: unknown,
      _oldValue: unknown
    ) => {
      updateRow(rowId, { [columnId]: newValue });
    },
    [updateRow]
  );

  // Handle row delete from DataTable
  const handleRowDelete = useCallback(
    (rowId: string | number) => {
      deleteRow(rowId);
    },
    [deleteRow]
  );

  // Handle bulk delete of selected rows
  const handleBulkDelete = useCallback(() => {
    if (selectedRowIds.length === 0) return;
    selectedRowIds.forEach((rowId) => {
      deleteRow(rowId);
    });
    setSelectedRowIds([]);
  }, [selectedRowIds, deleteRow]);

  // Handle bulk edit of selected rows
  const handleBulkEdit = useCallback(
    (fields: BulkEditField[]) => {
      if (selectedRowIds.length === 0 || fields.length === 0) return;

      // Apply the edits to each selected row
      selectedRowIds.forEach((rowId) => {
        const updates: Record<string, unknown> = {};
        fields.forEach((field) => {
          // Convert empty string to null for nullable columns
          const col = columns.find((c) => c.name === field.column);
          let value = field.value;
          if (col?.nullable && value === '') {
            value = null;
          }
          updates[field.column] = value;
        });
        updateRow(rowId, updates);
      });

      // Clear selection and close dialog
      setSelectedRowIds([]);
    },
    [selectedRowIds, columns, updateRow]
  );

  // Handle selection change
  const handleSelectionChange = useCallback((ids: string[]) => {
    setSelectedRowIds(ids);
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedRowIds([]);
  }, []);

  // Handle adding a new row
  const handleAddRow = useCallback(() => {
    if (!selectedTable || selectedTable.type === 'view') return;

    // Initialize row with smart default values
    const newRow: Record<string, unknown> = {};
    columns.forEach((col) => {
      // Skip auto-increment columns (they'll be generated by the database)
      const type = col.type.toLowerCase();
      const isAutoIncrement =
        col.isPrimaryKey &&
        (type.includes('int') ||
          type === 'integer' ||
          col.defaultValue
            ?.toString()
            .toLowerCase()
            .includes('autoincrement') ||
          col.defaultValue?.toString().toLowerCase().includes('nextval'));

      if (isAutoIncrement) {
        // Leave auto-increment columns as null - database will handle it
        newRow[col.name] = null;
      } else if (col.defaultValue !== undefined && col.defaultValue !== null) {
        newRow[col.name] = col.defaultValue;
      } else {
        newRow[col.name] = null;
      }
    });

    const rowId = insertRow(newRow);
    setNewRowId(rowId);
  }, [selectedTable, columns, insertRow]);

  // Callback when DataTable has focused the new row
  const handleNewRowFocused = useCallback(() => {
    setNewRowId(null);
  }, []);

  // Handle locate in table from image gallery
  const handleLocateInTable = useCallback(
    (rowIndex: number, _column: string) => {
      // Switch to data view
      setViewMode('data');
      // Use setTimeout to ensure the DataTable is rendered before scrolling
      setTimeout(() => {
        dataTableRef.current?.scrollToRow(rowIndex);
      }, 100);
    },
    []
  );

  // Handle successful change application
  const handleChangesApplied = useCallback(() => {
    setShowDiffPreview(false);
    refetch();
  }, [refetch]);

  // Handle export
  const handleExport = useCallback(
    async (options: ExportOptions) => {
      await exportData({
        format: options.format,
        tableName: options.tableName,
        connectionId: options.connectionId,
        rows: options.rows,
        columns: options.columns,
        delimiter: options.delimiter,
        includeHeaders: options.includeHeaders,
        prettyPrint: options.prettyPrint,
        sheetName: options.sheetName,
      });
    },
    [exportData]
  );

  if (!selectedTable) return null;

  return (
    <div className="flex h-full min-h-0 min-w-0 overflow-hidden">
      {/* Main Content */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Selection Toolbar */}
        {selectedRowIds.length > 0 && (
          <div className="border-main/30 bg-main/5 flex items-center justify-between gap-4 border-b px-4 py-2">
            <div className="flex items-center gap-3">
              <span
                className="font-heading text-main"
                style={{ fontSize: 'var(--font-ui-size, 13px)' }}
              >
                {t('table.rowsSelected', { count: selectedRowIds.length })}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                aria-label={t('table.clearSelection', {
                  defaultValue: 'Clear selection',
                })}
                className="h-7"
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
              >
                <X className="mr-1 h-3 w-3" />
                {t('table.clearSelection')}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkEditDialog(true)}
                className="h-7 gap-1"
              >
                <Edit3 className="h-3.5 w-3.5" />
                {t('table.editSelected')}{' '}
                {selectedRowIds.length > 1 ? `(${selectedRowIds.length})` : ''}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="h-7 gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t('table.deleteSelected')}{' '}
                {selectedRowIds.length > 1 ? `(${selectedRowIds.length})` : ''}
              </Button>
            </div>
          </div>
        )}

        {/* Subtle refresh progress bar - skeleton animation */}
        {isFetching && !isLoading && (
          <div className="bg-muted/30 absolute top-0 right-0 left-0 h-0.5 overflow-hidden">
            <div className="bg-primary/40 h-full w-1/3 animate-[shimmer_1.5s_ease-in-out_infinite]" />
          </div>
        )}

        {/* Table Header */}
        <div className="bg-background/50 flex items-center justify-between gap-2 border-b px-4 py-2 backdrop-blur-sm">
          <div className="flex min-w-0 items-center gap-2 overflow-hidden">
            <h2 className="truncate font-medium">{selectedTable.name}</h2>
            <span
              className="text-muted-foreground shrink-0"
              style={{ fontSize: 'var(--font-ui-size, 13px)' }}
            >
              {searchStats.isSearching ? (
                <>
                  ({searchStats.matchedRows.toLocaleString()} of{' '}
                  {searchStats.totalRows.toLocaleString()}{' '}
                  {t('table.rows', { defaultValue: 'rows' })})
                </>
              ) : (
                <>
                  ({totalRows.toLocaleString()}{' '}
                  {t('table.rows', { defaultValue: 'rows' })})
                </>
              )}
            </span>
            {searchStats.isSearching && (
              <span
                className="rounded-base bg-main/10 font-base text-main shrink-0 px-1.5 py-0.5"
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
              >
                {t('table.filtered', { defaultValue: 'Filtered' })}
              </span>
            )}
            {selectedTable.type === 'view' && (
              <span
                className="rounded-base bg-secondary text-muted-foreground flex shrink-0 items-center gap-1 px-1.5 py-0.5"
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
              >
                <Eye className="h-3 w-3" />
                {t('table.view', { defaultValue: 'View' })}
              </span>
            )}
            {/* Data Quality Indicator */}
            {rows.length > 0 && (
              <DataQualityIndicator columns={columns} data={rows} />
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Search Input */}
            <div className="relative hidden lg:block">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder={t('table.searchInResults', {
                  defaultValue: 'Search in results...',
                })}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 w-48 pr-8 pl-8"
                style={{ fontSize: 'var(--font-ui-size, 13px)' }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                  title={t('table.clearSearch', {
                    defaultValue: 'Clear search',
                  })}
                  aria-label={t('table.clearSearch', {
                    defaultValue: 'Clear search',
                  })}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Refresh button */}
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  aria-label={t('table.refreshData', {
                    defaultValue: 'Refresh table data',
                  })}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className={TOOLTIP_CONTENT_FLEX}>
                {t('table.refreshData', { defaultValue: 'Refresh table data' })}{' '}
                (
                <ShortcutKbd action="action.refresh-table" />)
              </TooltipContent>
            </Tooltip>

            {/* Export button */}
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExportDialog(true)}
                  disabled={rows.length === 0}
                  aria-label={t('table.exportData', {
                    defaultValue: 'Export data',
                  })}
                  data-action="export-data"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className={TOOLTIP_CONTENT_FLEX}>
                {t('table.exportData', { defaultValue: 'Export data' })} (
                <ShortcutKbd action="action.export-data" />)
              </TooltipContent>
            </Tooltip>

            {/* Add Row button */}
            {selectedTable.type !== 'view' && (
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddRow}
                    aria-label={t('table.addRow', { defaultValue: 'Add row' })}
                    data-action="add-row"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className={TOOLTIP_CONTENT_FLEX}>
                  {t('table.addRow', { defaultValue: 'Add row' })} (
                  <ShortcutKbd action="action.add-row" />)
                </TooltipContent>
              </Tooltip>
            )}

            {/* Changes indicator & preview button */}
            {changeCount > 0 && (
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDiffPreview(true)}
                    aria-label={t('table.viewChangesCount', {
                      count: changeCount,
                      defaultValue: 'View {{count}} pending changes',
                    })}
                  >
                    <FileText className="h-4 w-4" />
                    <span className="ml-1.5">{changeCount}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className={TOOLTIP_CONTENT_FLEX}>
                  {t('table.viewChanges', {
                    defaultValue: 'View pending changes',
                  })}{' '}
                  (
                  <ShortcutKbd action="action.view-changes" />)
                </TooltipContent>
              </Tooltip>
            )}

            {/* View Mode Toggle - Data/Images */}
            <div className="rounded-base flex border">
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant={viewMode === 'data' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="rounded-r-none border-r"
                    onClick={() => setViewMode('data')}
                    aria-label={t('table.dataView', {
                      defaultValue: 'Data view',
                    })}
                    data-action="view-data"
                  >
                    <Table2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className={TOOLTIP_CONTENT_FLEX}>
                  {t('table.dataView', { defaultValue: 'Data view' })}
                  {' ('}
                  <ShortcutKbd action="view.data-view" />
                  {')'}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant={viewMode === 'images' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="rounded-l-none"
                    onClick={() => setViewMode('images')}
                    aria-label={t('table.mediaGallery', {
                      defaultValue: 'Media gallery',
                    })}
                    data-action="view-gallery"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className={TOOLTIP_CONTENT_FLEX}>
                  {t('table.mediaGallery')}
                  {' ('}
                  <ShortcutKbd action="view.gallery-view" />
                  {')'}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        <ActiveFilters
          filters={filters}
          onFilterRemove={handleFilterRemove}
          onFiltersClear={handleFiltersClear}
        />

        {/* Quick Filter Tags - AI-powered suggestions */}
        {rows.length > 0 && (
          <QuickFilterTags
            columns={columns}
            data={rows}
            activeFilters={filters}
            onFilterAdd={handleFilterAdd}
            onFilterRemove={handleFilterRemove}
          />
        )}

        {/* Data Grid / Image Gallery */}
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          {viewMode === 'images' ? (
            <TableImageGallery
              columns={columns}
              rows={rows}
              isLoading={isLoading}
              onRefresh={refetch}
              onLocateInTable={handleLocateInTable}
            />
          ) : isLoading ? (
            <SkeletonTable columns={columns.length || 5} rows={15} />
          ) : error ? (
            <div className="text-destructive flex h-full items-center justify-center">
              <p>{error.message}</p>
            </div>
          ) : (
            <DataTable
              ref={dataTableRef}
              columns={columns}
              data={searchFilteredRows}
              sort={sort}
              onSortChange={handleSortChange}
              grouping={grouping}
              onGroupingChange={setGrouping}
              enableSelection={selectedTable.type !== 'view'}
              selectedRowIds={selectedRowIds}
              onSelectionChange={handleSelectionChange}
              editable={selectedTable.type !== 'view'}
              onCellChange={handleCellChange}
              onRowDelete={handleRowDelete}
              onRowInsert={handleAddRow}
              changes={changesMap}
              primaryKeyColumn={primaryKeyColumn}
              className="h-full"
              newRowId={newRowId}
              onNewRowFocused={handleNewRowFocused}
              filters={filters}
              onFilterAdd={handleFilterAdd}
              onFilterRemove={handleFilterRemove}
              // Empty state context
              totalRowsBeforeClientSearch={displayRows.length}
              hasActiveFilters={filters.length > 0}
              hasActiveSearch={searchTerm.length > 0}
              onClearFilters={handleFiltersClear}
              onClearSearch={() => setSearchTerm('')}
            />
          )}
        </div>

        {/* Column Statistics Panel - Collapsible */}
        {!isLoading && rows.length > 0 && (
          <ColumnStats
            columns={columns}
            data={rows}
            connectionId={activeConnectionId}
            schema={activeTab?.table?.schema}
            table={selectedTable?.name}
          />
        )}

        {/* Selection Quick Stats - Excel-like status bar */}
        <SelectionStats selectedRows={selectedRowsData} columns={columns} />

        {/* Pagination - Single Row Layout */}
        <div className="bg-background/80 flex shrink-0 items-center justify-center gap-2 border-t px-2 py-2 backdrop-blur-sm sm:gap-3 sm:px-4">
          {/* Page Info - hidden on very small screens */}
          <div
            className="text-muted-foreground hidden whitespace-nowrap sm:block"
            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
          >
            {t('table.pageInfo', {
              defaultValue: 'Page {{page}} of {{totalPages}}',
              page,
              totalPages: totalPages || 1,
            })}
            <span className="text-muted-foreground/70 ml-1">
              ({totalRows.toLocaleString()})
            </span>
          </div>

          {/* Divider - hidden on very small screens */}
          <div className="bg-border hidden h-4 w-px sm:block" />

          {/* Pagination Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handlePageChange(1)}
              disabled={page <= 1 || isLoading}
              title={t('table.firstPage', { defaultValue: 'First page' })}
              aria-label={t('table.firstPage', { defaultValue: 'First page' })}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || isLoading}
              title={t('table.previousPage', {
                defaultValue: 'Previous page',
              })}
              aria-label={t('table.previousPage', {
                defaultValue: 'Previous page',
              })}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page Jump Input */}
            <div className="flex items-center gap-1 whitespace-nowrap">
              <Input
                type="number"
                min={1}
                max={totalPages || 1}
                value={page}
                onChange={(e) => {
                  const value = Number.parseInt(e.target.value, 10);
                  if (
                    !Number.isNaN(value) &&
                    value >= 1 &&
                    value <= totalPages
                  ) {
                    handlePageChange(value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = Number.parseInt(
                      (e.target as HTMLInputElement).value,
                      10
                    );
                    if (!Number.isNaN(value)) {
                      const clampedValue = Math.max(
                        1,
                        Math.min(value, totalPages)
                      );
                      handlePageChange(clampedValue);
                    }
                  }
                }}
                className="h-7 w-12 [appearance:textfield] px-1 text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                disabled={isLoading}
              />
              <span
                className="text-muted-foreground whitespace-nowrap"
                style={{ fontSize: 'var(--font-ui-size, 13px)' }}
              >
                / {totalPages || 1}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || isLoading}
              title={t('table.nextPage', { defaultValue: 'Next page' })}
              aria-label={t('table.nextPage', { defaultValue: 'Next page' })}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handlePageChange(totalPages)}
              disabled={page >= totalPages || isLoading}
              title={t('table.lastPage', { defaultValue: 'Last page' })}
              aria-label={t('table.lastPage', { defaultValue: 'Last page' })}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Divider */}
          <div className="bg-border h-4 w-px" />

          {/* Page Size Selector */}
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <Select
              value={String(pageSize)}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger size="sm" className="h-7 w-[4.5rem]">
                <SelectValue>
                  {pageSize === -1
                    ? t('pagination.all')
                    : pageSize.toLocaleString()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="center">
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size === -1 ? t('pagination.all') : size.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Diff Preview Panel */}
      {showDiffPreview && hasChanges && (
        <div className="w-96">
          <DiffPreview
            onClose={() => setShowDiffPreview(false)}
            onApplied={handleChangesApplied}
          />
        </div>
      )}

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        tableName={selectedTable.name}
        columns={columns}
        rows={searchFilteredRows.map((row) => {
          // Strip internal properties before export
          const { __rowId, __isNew, __deleted, __change, ...data } = row;
          return data;
        })}
        connectionId={connection?.id || ''}
        onExport={handleExport}
      />

      {/* Bulk Edit Dialog */}
      <BulkEditDialog
        open={showBulkEditDialog}
        onOpenChange={setShowBulkEditDialog}
        columns={columns}
        selectedRowCount={selectedRowIds.length}
        onApply={handleBulkEdit}
      />
    </div>
  );
}
