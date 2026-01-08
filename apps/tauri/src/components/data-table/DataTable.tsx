import type { VirtualizerOptions } from '@tanstack/react-virtual';
import type { TableRowData } from './hooks/useTableCore';
import type {
  VirtualDataConfig,
  VirtualDataStats,
} from '@/hooks/useVirtualData';
import type { UIFilterState } from '@/lib/filter-utils';
import type {
  AggregationType,
  ColumnSchema,
  PendingChange,
  SortState,
} from '@/types/database';
import { Button } from '@sqlpro/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@sqlpro/ui/empty';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Filter, Inbox, SearchX } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { useVirtualData } from '@/hooks/useVirtualData';
import { cn } from '@/lib/utils';
import { useTableFont } from '@/stores';
import { useDragSelection } from './hooks/useDragSelection';
import { useTableCore } from './hooks/useTableCore';
import { useTableEditing } from './hooks/useTableEditing';
import { TableBody } from './TableBody';
import { TableHeader } from './TableHeader';

export interface DataTableProps {
  // Data
  columns: ColumnSchema[];
  data: TableRowData[];

  // Sorting
  sort?: SortState | null;
  onSortChange?: (sort: SortState | null) => void;

  // Grouping
  grouping?: string[];
  onGroupingChange?: (grouping: string[]) => void;
  aggregations?: Record<string, AggregationType>;

  // Selection
  enableSelection?: boolean;
  selectedRowIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;

  // Editing
  editable?: boolean;
  onCellChange?: (
    rowId: string | number,
    columnId: string,
    newValue: unknown,
    oldValue: unknown
  ) => void;
  onRowDelete?: (rowId: string | number) => void;
  onRowInsert?: () => void;

  // Change tracking
  changes?: Map<string | number, PendingChange>;

  // Layout
  className?: string;
  primaryKeyColumn?: string;

  // Auto-focus new row
  newRowId?: string | number | null;
  onNewRowFocused?: () => void;

  // Filtering
  filters?: UIFilterState[];
  onFilterAdd?: (filter: UIFilterState) => void;
  onFilterRemove?: (columnId: string) => void;

  // Empty state context
  totalRowsBeforeClientSearch?: number;
  hasActiveFilters?: boolean;
  hasActiveSearch?: boolean;
  onClearFilters?: () => void;
  onClearSearch?: () => void;

  // Virtual data management for memory optimization
  /**
   * Enable memory-efficient virtual data management.
   * When enabled, only visible rows + buffer are kept in memory.
   * @default false
   */
  enableVirtualDataManagement?: boolean;

  /**
   * Configuration for virtual data management
   */
  virtualDataConfig?: VirtualDataConfig;

  /**
   * Callback when virtual data stats change
   * Useful for monitoring memory usage
   */
  onVirtualDataStatsChange?: (stats: VirtualDataStats) => void;

  // Infinite scroll support
  /**
   * Callback to load more data when scrolling near the bottom
   */
  onLoadMore?: () => void;

  /**
   * Whether there is more data to load
   */
  hasMore?: boolean;

  /**
   * Whether more data is currently being loaded
   */
  isLoadingMore?: boolean;
}

export interface DataTableRef {
  scrollToRow: (rowIndex: number) => void;
  focus: () => void;
  resetAllColumnSizes: () => void;
  /** Release rows outside the current viewport buffer from memory */
  releaseOutOfBufferRows?: () => void;
  /** Get current virtual data statistics */
  getVirtualDataStats?: () => VirtualDataStats | null;
}

export const DataTable = function DataTable({
  ref,
  columns,
  data,
  sort,
  onSortChange,
  grouping: externalGrouping,
  onGroupingChange,
  aggregations,
  enableSelection = false,
  selectedRowIds: _selectedRowIds,
  onSelectionChange,
  editable = false,
  onCellChange,
  onRowDelete,
  onRowInsert,
  changes,
  className,
  primaryKeyColumn,
  newRowId,
  onNewRowFocused,
  filters,
  onFilterAdd,
  onFilterRemove,
  totalRowsBeforeClientSearch,
  hasActiveFilters,
  hasActiveSearch,
  onClearFilters,
  onClearSearch,
  enableVirtualDataManagement = false,
  virtualDataConfig,
  onVirtualDataStatsChange,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: DataTableProps & { ref?: React.RefObject<DataTableRef | null> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tableFont = useTableFont();

  // Initialize TanStack Table
  const {
    table,
    toggleGrouping,
    grouping,
    resetColumnSize,
    resetAllColumnSizes,
    pinnedColumns,
    toggleColumnPin,
    selectedRowIds,
  } = useTableCore({
    columns,
    data,
    sort,
    onSortChange,
    grouping: externalGrouping,
    onGroupingChange,
    aggregations,
    primaryKeyColumn,
  });

  // Notify parent of selection changes
  useEffect(() => {
    if (enableSelection && onSelectionChange) {
      onSelectionChange(selectedRowIds);
    }
  }, [enableSelection, selectedRowIds, onSelectionChange]);

  // Get column sizing state for dependency tracking
  // columnSizing and columnSizingInfo are intentionally included as dependencies even though
  // they're derived from table.getState(). The table object is stable between renders, but we
  // need to recalculate column sizes when the sizing state changes.
  const columnSizing = table.getState().columnSizing;
  const columnSizingInfo = table.getState().columnSizingInfo;

  // Pre-compute column sizes as a Map for O(1) lookup
  // This avoids creating CSS variables which trigger style recalculation on the entire table
   
  const columnSizes = useMemo(() => {
    const headers = table.getFlatHeaders();
    const sizes = new Map<string, number>();
    for (const header of headers) {
      sizes.set(header.id, header.getSize());
    }
    return sizes;
  }, [columnSizing, columnSizingInfo, table]);

  // Get rows from table
  const { rows } = table.getRowModel();

  // Calculate group count (number of top-level groups) when grouping is active
  const groupCount = useMemo(() => {
    if (grouping.length === 0) return undefined;
    // Count top-level grouped rows
    return rows.filter((row) => row.getIsGrouped() && row.depth === 0).length;
  }, [rows, grouping]);

  // Initialize editing
  const {
    focusedCell,
    editingCell,
    handleCellClick,
    handleCellDoubleClick,
    handleKeyDown,
    handleCellSave,
    stopEditing,
    startEditing,
    setFocusedCell,
    isCellFocused,
    isCellEditing,
  } = useTableEditing({
    table,
    containerRef,
    editable,
    onCellChange,
    onRowDelete,
    onRowInsert,
  });

  // Create cell keys for memo comparison in child components
  const focusedCellKey = focusedCell
    ? `${focusedCell.rowId}:${focusedCell.columnId}`
    : null;
  const editingCellKey = editingCell
    ? `${editingCell.rowId}:${editingCell.columnId}`
    : null;

  // Initialize drag selection for row multi-select
  const { handleMouseDown: handleDragStart, isInDragRange } = useDragSelection({
    table,
    containerRef,
    enabled: enableSelection,
  });

  // Auto-focus and start editing the first editable cell of new row
  useEffect(() => {
    if (newRowId === null || newRowId === undefined) return undefined;

    // Find the new row
    const newRow = rows.find((r) => {
      const rowData = r.original as TableRowData;
      return rowData.__rowId === newRowId;
    });

    if (!newRow) return undefined;

    // Find the first non-primary-key column (more likely to be editable)
    const visibleColumns = table.getVisibleLeafColumns();
    const firstEditableColumn = visibleColumns.find((col) => {
      // Skip primary key columns for auto-increment tables
      if (primaryKeyColumn && col.id === primaryKeyColumn) {
        const colSchema = columns.find((c) => c.name === col.id);
        if (colSchema?.isPrimaryKey) {
          const type = colSchema.type.toLowerCase();
          if (type.includes('int') || type === 'integer') {
            return false;
          }
        }
      }
      return true;
    });

    if (firstEditableColumn) {
      // Focus the container first
      containerRef.current?.focus();

      // Set focused cell and start editing
      const timer = setTimeout(() => {
        setFocusedCell({ rowId: newRow.id, columnId: firstEditableColumn.id });
        startEditing(newRow.id, firstEditableColumn.id);
        onNewRowFocused?.();
      }, 0);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [
    newRowId,
    rows,
    table,
    columns,
    primaryKeyColumn,
    setFocusedCell,
    startEditing,
    onNewRowFocused,
  ]);

  // Handle container focus
  const handleContainerFocus = useCallback(() => {
    // If no cell is focused, focus the first cell
    if (!focusedCell && rows.length > 0) {
      const firstRow = rows.find((r) => !r.getIsGrouped?.());
      const firstColumn = table.getVisibleLeafColumns()[0];
      if (firstRow && firstColumn) {
        handleCellClick(firstRow.id, firstColumn.id);
      }
    }
  }, [focusedCell, rows, table, handleCellClick]);

  // Row height for virtualization (compact VS Code style)
  const ROW_HEIGHT = 24;

  // Calculate dynamic overscan based on data size for better performance
  // Lower overscan reduces DOM nodes and style recalculations during scroll
  const rowOverscan = useMemo(() => {
    if (rows.length > 100000) return 10;
    if (rows.length > 50000) return 15;
    if (rows.length > 20000) return 20;
    if (rows.length > 5000) return 25;
    // For moderate datasets, use moderate overscan
    return 30;
  }, [rows.length]);

  // Stable callbacks for virtualizers - defined outside useVirtualizer to avoid recreating on each render
  const getRowKey = useCallback(
    (index: number) => {
      const row = rows[index];
      if (!row) return index;
      const rowData = row.original as TableRowData;
      return rowData.__rowId ?? row.id;
    },
    [rows]
  );

  // Setup row virtualization with optimized configuration
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: rowOverscan,
    getItemKey: getRowKey,
    // Enable smooth scrolling mode - reduces re-renders during scroll
    isScrollingResetDelay: 150,
  } satisfies Partial<VirtualizerOptions<HTMLDivElement, Element>>);

  // Get the virtual items for visible range calculation
  const virtualItems = rowVirtualizer.getVirtualItems();

  // Track previous visible range to avoid unnecessary updates
  const prevVisibleRangeRef = useRef({ startIndex: 0, endIndex: 0 });

  // Calculate visible range from virtual items - only update when range actually changes
  const visibleRange = useMemo(() => {
    if (virtualItems.length === 0) {
      return prevVisibleRangeRef.current;
    }
    const newStart = virtualItems[0].index;
    const newEnd = virtualItems[virtualItems.length - 1].index;

    // Only create new object if range actually changed
    if (
      newStart === prevVisibleRangeRef.current.startIndex &&
      newEnd === prevVisibleRangeRef.current.endIndex
    ) {
      return prevVisibleRangeRef.current;
    }

    const newRange = { startIndex: newStart, endIndex: newEnd };
    prevVisibleRangeRef.current = newRange;
    return newRange;
  }, [virtualItems]);

  // Use virtual data management for memory-efficient row handling
  const virtualData = useVirtualData({
    allRows: data,
    visibleRange,
    config: virtualDataConfig,
    enabled: enableVirtualDataManagement,
  });

  // Notify parent of virtual data stats changes
  useEffect(() => {
    if (enableVirtualDataManagement && onVirtualDataStatsChange) {
      onVirtualDataStatsChange(virtualData.stats);
    }
  }, [
    enableVirtualDataManagement,
    virtualData.stats,
    onVirtualDataStatsChange,
  ]);

  // Infinite scroll: load more when approaching the end
  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoadingMore) return;

    // Check if we're near the end of the data
    const lastVisibleIndex = visibleRange.endIndex;
    const totalRows = rows.length;
    const threshold = 20; // Load more when within 20 rows of the end

    if (totalRows > 0 && lastVisibleIndex >= totalRows - threshold) {
      onLoadMore();
    }
  }, [visibleRange.endIndex, rows.length, onLoadMore, hasMore, isLoadingMore]);

  // Expose imperative methods
  useImperativeHandle(ref, () => ({
    scrollToRow: (rowIndex: number) => {
      const row = containerRef.current?.querySelector(
        `[data-row-index="${rowIndex}"]`
      );
      row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    focus: () => {
      containerRef.current?.focus();
    },
    resetAllColumnSizes,
    releaseOutOfBufferRows: enableVirtualDataManagement
      ? virtualData.releaseOutOfBufferRows
      : undefined,
    getVirtualDataStats: enableVirtualDataManagement
      ? () => virtualData.stats
      : undefined,
  }));

  return (
    <ScrollArea
      viewportRef={containerRef}
      className={cn(
        'bg-background rounded-md outline-none',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2',
        className
      )}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onFocus={handleContainerFocus}
    >
      <table
        className="bg-background w-max min-w-full border-separate border-spacing-0"
        style={{
          minWidth: table.getTotalSize(),
          fontFamily: tableFont.family || undefined,
          fontSize: tableFont.size ? `${tableFont.size}px` : undefined,
          // Force GPU compositing layer to reduce flickering
          transform: 'translateZ(0)',
          willChange: 'transform',
        }}
      >
        {/* Column group for width control - apply sizes directly to avoid CSS variable overhead */}
        <colgroup>
          {/* Selection column - auto width based on content */}
          {enableSelection && <col />}
          {table.getVisibleLeafColumns().map((column) => {
            const size = columnSizes.get(column.id) ?? 150;
            return (
              <col
                key={column.id}
                style={{
                  width: size,
                  minWidth: size,
                }}
              />
            );
          })}
        </colgroup>
        {/* Fixed header */}
        <TableHeader
          table={table}
          onToggleGrouping={toggleGrouping}
          onResetColumnSize={resetColumnSize}
          onTogglePin={toggleColumnPin}
          grouping={grouping}
          groupCount={groupCount}
          sorting={sort}
          columnSizingInfo={{
            isResizingColumn: columnSizingInfo.isResizingColumn,
          }}
          filters={filters}
          onFilterAdd={onFilterAdd}
          onFilterRemove={onFilterRemove}
          pinnedColumns={pinnedColumns}
          enableSelection={enableSelection}
        />

        {/* Virtualized table body */}
        <TableBody
          rows={rows}
          virtualRowItems={virtualItems}
          totalRowSize={rowVirtualizer.getTotalSize()}
          editable={editable}
          onCellClick={handleCellClick}
          onCellDoubleClick={handleCellDoubleClick}
          onCellSave={handleCellSave}
          stopEditing={stopEditing}
          isCellFocused={isCellFocused}
          isCellEditing={isCellEditing}
          focusedCellKey={focusedCellKey}
          editingCellKey={editingCellKey}
          changes={changes}
          pinnedColumns={pinnedColumns}
          getColumnSize={(columnId) => columnSizes.get(columnId) ?? 150}
          enableSelection={enableSelection}
          onDragStart={handleDragStart}
          isInDragRange={isInDragRange}
          // Disable virtualization for very small datasets to prevent flickering
          // Keep threshold low (50) to avoid layout thrashing with many DOM nodes
          disableVirtualization={rows.length < 50}
        />
      </table>

      {/* Empty state */}
      {rows.length === 0 && (
        <EmptyState
          hasActiveFilters={hasActiveFilters}
          hasActiveSearch={hasActiveSearch}
          totalRowsBeforeClientSearch={totalRowsBeforeClientSearch}
          onClearFilters={onClearFilters}
          onClearSearch={onClearSearch}
        />
      )}
    </ScrollArea>
  );
};

/**
 * Empty state component that distinguishes between:
 * 1. No data in table - simple "No data" message
 * 2. No results from server-side filters - "No matching results" with clear filters
 * 3. No results from client-side search - "No matching results" with clear search
 */
function EmptyState({
  hasActiveFilters,
  hasActiveSearch,
  totalRowsBeforeClientSearch,
  onClearFilters,
  onClearSearch,
}: {
  hasActiveFilters?: boolean;
  hasActiveSearch?: boolean;
  totalRowsBeforeClientSearch?: number;
  onClearFilters?: () => void;
  onClearSearch?: () => void;
}) {
  // Case 3: Client-side search produced no results (but there were rows before search)
  if (
    hasActiveSearch &&
    totalRowsBeforeClientSearch &&
    totalRowsBeforeClientSearch > 0
  ) {
    return (
      <Empty className="absolute inset-0 border-none">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchX className="h-5 w-5" />
          </EmptyMedia>
          <EmptyTitle>No matching results</EmptyTitle>
          <EmptyDescription>
            No rows match your search criteria
          </EmptyDescription>
        </EmptyHeader>
        {onClearSearch && (
          <Button variant="outline" size="sm" onClick={onClearSearch}>
            Clear search
          </Button>
        )}
      </Empty>
    );
  }

  // Case 2: Server-side filters produced no results
  if (hasActiveFilters) {
    return (
      <Empty className="absolute inset-0 border-none">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Filter className="h-5 w-5" />
          </EmptyMedia>
          <EmptyTitle>No matching results</EmptyTitle>
          <EmptyDescription>No rows match the current filters</EmptyDescription>
        </EmptyHeader>
        {onClearFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear all filters
          </Button>
        )}
      </Empty>
    );
  }

  // Case 1: Table is truly empty (no data)
  return (
    <Empty className="absolute inset-0 border-none">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Inbox className="h-5 w-5" />
        </EmptyMedia>
        <EmptyTitle>No data</EmptyTitle>
        <EmptyDescription>This table is empty</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

// Re-export types
export type { TableRowData };
