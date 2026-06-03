import type { Row } from '@tanstack/react-table';
import type { VirtualItem, Virtualizer } from '@tanstack/react-virtual';
import type { TableRowData } from './hooks/useTableCore';
import type { ColumnSchema, PendingChange } from '@/types/database';
import { Checkbox } from '@sqlpro/ui/checkbox';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@sqlpro/ui/context-menu';
import { ClipboardCopy, Copy, FileText, Trash2 } from 'lucide-react';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { cn } from '@/lib/utils';
import { GroupRow } from './GroupRow';
import { TableCell } from './TableCell';

// Row height must match the h-6 (24px) CSS class on DataRow <tr>
const ROW_HEIGHT = 24;

// Pre-computed striped background for <tbody>.
// This repeating gradient matches the even/odd row coloring pattern.
// During fast scrolling, spacer rows (which are transparent) reveal this
// background instead of a blank white area, eliminating the flash effect.
// Uses color-mix to pre-blend the muted/20 opacity with background color
// so the gradient is fully opaque and renders correctly everywhere.
const STRIPE_BACKGROUND = `repeating-linear-gradient(to bottom,var(--background) 0px,var(--background) ${ROW_HEIGHT}px,color-mix(in srgb,var(--muted) 20%,var(--background)) ${ROW_HEIGHT}px,color-mix(in srgb,var(--muted) 20%,var(--background)) ${ROW_HEIGHT * 2}px)`;

interface DataRowProps {
  row: Row<TableRowData>;
  /** The actual row index in the data array (stable) */
  dataIndex: number;
  isDeleted: boolean;
  isNewRow: boolean;
  isSelected: boolean;
  change?: PendingChange;
  editable?: boolean;
  onCellClick?: (rowId: string, columnId: string) => void;
  onCellDoubleClick?: (rowId: string, columnId: string) => void;
  onCellSave?: (newValue: unknown) => void;
  stopEditing?: () => void;
  isCellFocused?: (rowId: string, columnId: string) => boolean;
  isCellEditing?: (rowId: string, columnId: string) => boolean;
  /** Key of the currently focused cell in this row (rowId:columnId format), or null */
  focusedCellKey?: string | null;
  /** Key of the currently editing cell in this row (rowId:columnId format), or null */
  editingCellKey?: string | null;
  /** Pinned column IDs (left only) */
  pinnedColumns?: string[];
  /** Pinned column offsets */
  pinnedOffsets?: Record<string, number>;
  /** Enable row selection */
  enableSelection?: boolean;
  /** Handler for drag selection start */
  onDragStart?: (e: React.MouseEvent, rowIndex: number) => void;
  /** Whether this row is in the current drag selection range */
  isInDragRange?: boolean;
  /** Callback to toggle row selection */
  onToggleSelected?: (selected: boolean) => void;
  /** Number of selected rows (for context menu label) */
  selectedRowCount?: number;
  /** Handler to copy row(s) as SQL INSERT */
  onCopyRowAsSQL?: (rowIds: string[]) => void;
  /** Handler to copy row data to clipboard */
  onCopyRow?: (rowId: string) => void;
  /** Handler to delete row */
  onDeleteRow?: (rowId: string) => void;
  /** Translation function */
  t: (key: string, options?: Record<string, unknown>) => string;
}

// Custom comparison function for DataRow to avoid unnecessary re-renders
function areDataRowPropsEqual(
  prevProps: DataRowProps,
  nextProps: DataRowProps
): boolean {
  // Always re-render if row data changed
  if (prevProps.row !== nextProps.row) return false;
  // dataIndex is stable (based on data array position), not virtual position
  if (prevProps.dataIndex !== nextProps.dataIndex) return false;

  // Check state flags
  if (prevProps.isDeleted !== nextProps.isDeleted) return false;
  if (prevProps.isNewRow !== nextProps.isNewRow) return false;
  if (prevProps.isSelected !== nextProps.isSelected) return false;
  if (prevProps.editable !== nextProps.editable) return false;
  if (prevProps.enableSelection !== nextProps.enableSelection) return false;
  if (prevProps.isInDragRange !== nextProps.isInDragRange) return false;

  // Check focused and editing cell keys - these determine which cells need focus/edit styling
  if (prevProps.focusedCellKey !== nextProps.focusedCellKey) return false;
  if (prevProps.editingCellKey !== nextProps.editingCellKey) return false;

  // Check selected row count (affects context menu label)
  if (prevProps.selectedRowCount !== nextProps.selectedRowCount) return false;

  // Check change object - only compare if it exists
  if (prevProps.change !== nextProps.change) {
    // If one is undefined and other isn't, re-render
    if (!prevProps.change || !nextProps.change) return false;
    // Compare relevant change properties
    if (prevProps.change.type !== nextProps.change.type) return false;
    if (prevProps.change.newValues !== nextProps.change.newValues) return false;
  }

  // Check pinned columns array (shallow comparison)
  if (prevProps.pinnedColumns !== nextProps.pinnedColumns) {
    if (!prevProps.pinnedColumns || !nextProps.pinnedColumns) return false;
    if (prevProps.pinnedColumns.length !== nextProps.pinnedColumns.length)
      return false;
    for (let i = 0; i < prevProps.pinnedColumns.length; i++) {
      if (prevProps.pinnedColumns[i] !== nextProps.pinnedColumns[i])
        return false;
    }
  }

  // Check pinned offsets object
  if (prevProps.pinnedOffsets !== nextProps.pinnedOffsets) {
    if (!prevProps.pinnedOffsets || !nextProps.pinnedOffsets) return false;
    const prevKeys = Object.keys(prevProps.pinnedOffsets);
    const nextKeys = Object.keys(nextProps.pinnedOffsets);
    if (prevKeys.length !== nextKeys.length) return false;
    for (const key of prevKeys) {
      if (prevProps.pinnedOffsets[key] !== nextProps.pinnedOffsets[key])
        return false;
    }
  }

  // Callbacks are stable (memoized in parent), skip comparison

  return true;
}

// Stable event handler to avoid creating new function on each render
const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

const DataRow = memo(
  ({
    row,
    dataIndex,
    isDeleted,
    isNewRow,
    isSelected,
    change,
    editable,
    onCellClick,
    onCellDoubleClick,
    onCellSave,
    stopEditing,
    isCellFocused,
    isCellEditing,
    focusedCellKey: _focusedCellKey,
    editingCellKey: _editingCellKey,
    pinnedColumns = [],
    pinnedOffsets = {},
    enableSelection = false,
    onDragStart,
    isInDragRange = false,
    onToggleSelected,
    selectedRowCount = 0,
    onCopyRowAsSQL,
    onCopyRow,
    onDeleteRow,
    t,
  }: DataRowProps) => {
    const { copy } = useCopyToClipboard();

    // Use stable dataIndex for even/odd styling (not virtual index)
    const isEven = dataIndex % 2 === 0;

    // Memoize handlers to avoid creating new functions on each render
    const handleDragStart = useCallback(
      (e: React.MouseEvent) => onDragStart?.(e, dataIndex),
      [onDragStart, dataIndex]
    );

    const handleToggleSelected = useCallback(
      (checked: boolean | 'indeterminate') => onToggleSelected?.(!!checked),
      [onToggleSelected]
    );

    // Context menu handlers
    const handleCopyAsSQL = useCallback(() => {
      onCopyRowAsSQL?.([row.id]);
    }, [onCopyRowAsSQL, row.id]);

    const handleCopyRow = useCallback(() => {
      onCopyRow?.(row.id);
    }, [onCopyRow, row.id]);

    const handleDeleteRow = useCallback(() => {
      onDeleteRow?.(row.id);
    }, [onDeleteRow, row.id]);

    // Track which cell was right-clicked for copy cell feature
    const [contextMenuCell, setContextMenuCell] = useState<{
      columnId: string;
      value: unknown;
    } | null>(null);

    // Handle context menu open - determine which cell was clicked
    const handleContextMenuOpenChange = useCallback((open: boolean) => {
      if (!open) {
        setContextMenuCell(null);
      }
    }, []);

    // Handle right-click to capture the cell
    const handleRowContextMenu = useCallback(
      (e: React.MouseEvent) => {
        // Find the cell that was right-clicked
        const target = e.target as HTMLElement;
        const cell = target.closest('td');
        if (cell) {
          const columnId = cell.dataset.columnId;
          if (columnId) {
            const rowData = row.original as Record<string, unknown>;
            const value = rowData[columnId];
            setContextMenuCell({ columnId, value });
          }
        }
      },
      [row.original]
    );

    // Copy cell value to clipboard
    const handleCopyCell = useCallback(() => {
      if (contextMenuCell) {
        const value = contextMenuCell.value;
        const text =
          value === null ? 'NULL' : value === undefined ? '' : String(value);
        copy(text, { successMessage: t('clipboard.copied') });
      }
    }, [contextMenuCell, copy, t]);

    // Get all cells for this row - this is called once per row
    const allCells = row.getVisibleCells();

    // Determine the SQL INSERT label based on selection
    const sqlInsertLabel =
      isSelected && selectedRowCount > 1
        ? t('row.copyRowsAsSQL', {
            count: selectedRowCount,
            defaultValue: `Copy ${selectedRowCount} Rows as SQL INSERT`,
          })
        : t('row.copyRowAsSQL', { defaultValue: 'Copy Row as SQL INSERT' });

    // Build row className
    // NOTE: No transition-colors on rows — during scroll the cursor crosses many rows,
    // and CSS transitions on hover would cause a cascade of animated repaints that
    // degrade scroll performance. Instant hover is also snappier (per design system).
    const rowClassName = cn(
      'group border-border h-6 border-b',
      isEven ? 'bg-background' : 'bg-muted/20',
      'hover:bg-muted/50',
      isDeleted && 'bg-destructive/10 line-through opacity-50',
      isNewRow && 'bg-green-500/10',
      isSelected && 'bg-primary/10 hover:bg-primary/15',
      isInDragRange && !isSelected && 'bg-primary/5'
    );

    return (
      <ContextMenu onOpenChange={handleContextMenuOpenChange}>
        <ContextMenuTrigger
          onContextMenu={handleRowContextMenu}
          render={
            <tr
              className={rowClassName}
              data-row-id={row.id}
              data-row-index={dataIndex}
            />
          }
        >
          {/* Selection cell */}
          {enableSelection && (
            <td
              className="bg-background group-hover:bg-muted/50 sticky left-0 z-10 cursor-default border-r px-2 select-none"
              onClick={stopPropagation}
              onMouseDown={handleDragStart}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={handleToggleSelected}
                aria-label={t('dataTable.selectRow')}
              />
            </td>
          )}

          {/* Render all cells directly - no column virtualization */}
          {allCells.map((cell) => {
            const columnId = cell.column.id;
            const isFocused = isCellFocused?.(row.id, columnId) ?? false;
            const isEditing = isCellEditing?.(row.id, columnId) ?? false;

            // Check if this specific cell has a change
            const hasChange =
              change?.type === 'update' &&
              change.newValues &&
              change.oldValues &&
              columnId in change.newValues &&
              change.newValues[columnId] !== change.oldValues[columnId];

            const oldValue = change?.oldValues?.[columnId];

            // Pinning info
            const isPinned = pinnedColumns.includes(columnId);
            const isLastPinned = isPinned && pinnedColumns.at(-1) === columnId;

            return (
              <TableCell
                key={cell.id}
                cell={cell}
                rowId={row.id}
                isFocused={isFocused}
                isEditing={isEditing && !!editable && !isDeleted}
                hasChange={hasChange ?? false}
                oldValue={oldValue}
                editable={editable && !isDeleted}
                onCellClick={onCellClick}
                onCellDoubleClick={onCellDoubleClick}
                onCellSave={onCellSave}
                stopEditing={stopEditing}
                isPinned={isPinned}
                pinnedOffset={isPinned ? pinnedOffsets[columnId] : undefined}
                isLastPinned={isLastPinned}
              />
            );
          })}
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleCopyCell} disabled={!contextMenuCell}>
            <FileText className="size-4" />
            {t('row.copyCell', { defaultValue: 'Copy Cell' })}
          </ContextMenuItem>
          <ContextMenuItem onClick={handleCopyRow}>
            <Copy className="size-4" />
            {t('row.copyRow', { defaultValue: 'Copy Row' })}
          </ContextMenuItem>
          <ContextMenuItem onClick={handleCopyAsSQL}>
            <ClipboardCopy className="size-4" />
            {sqlInsertLabel}
          </ContextMenuItem>
          {editable && !isDeleted && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem variant="destructive" onClick={handleDeleteRow}>
                <Trash2 className="size-4" />
                {t('row.deleteRow', { defaultValue: 'Delete Row' })}
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
    );
  },
  areDataRowPropsEqual
);

interface TableBodyProps {
  rows: Row<TableRowData>[];
  /** Row virtualizer instance from @tanstack/react-virtual */
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
  /** Virtual items array - passed as prop to ensure memo re-renders on scroll */
  virtualItems: VirtualItem[];
  /** Total column count (including selection column) for spacer row colSpan */
  columnCount: number;
  // Editing props
  editable?: boolean;
  onCellClick?: (rowId: string, columnId: string) => void;
  onCellDoubleClick?: (rowId: string, columnId: string) => void;
  onCellSave?: (newValue: unknown) => void;
  stopEditing?: () => void;
  isCellFocused?: (rowId: string, columnId: string) => boolean;
  isCellEditing?: (rowId: string, columnId: string) => boolean;
  /** Currently focused cell key in format "rowId:columnId", or null */
  focusedCellKey?: string | null;
  /** Currently editing cell key in format "rowId:columnId", or null */
  editingCellKey?: string | null;
  // Change tracking
  changes?: Map<string | number, PendingChange>;
  // Column pinning (left only)
  pinnedColumns?: string[];
  /** Get column size by id */
  getColumnSize?: (columnId: string) => number;
  /** Enable row selection */
  enableSelection?: boolean;
  /** Handler for drag selection start */
  onDragStart?: (e: React.MouseEvent, rowIndex: number) => void;
  /** Check if row is in drag selection range */
  isInDragRange?: (rowIndex: number) => boolean;
  // Context menu props
  /** Table name for SQL generation */
  tableName?: string;
  /** Column schema for SQL generation */
  columns?: ColumnSchema[];
  /** Handler to copy row(s) as SQL INSERT */
  onCopyRowAsSQL?: (rowIds: string[]) => void;
  /** Handler to copy row data to clipboard */
  onCopyRow?: (rowId: string) => void;
  /** Handler to delete row */
  onDeleteRow?: (rowId: string) => void;
}

export const TableBody = memo(
  ({
    rows,
    rowVirtualizer,
    virtualItems,
    columnCount,
    editable = false,
    onCellClick,
    onCellDoubleClick,
    onCellSave,
    stopEditing,
    isCellFocused,
    isCellEditing,
    focusedCellKey,
    editingCellKey,
    changes,
    pinnedColumns = [],
    getColumnSize,
    enableSelection = false,
    onDragStart,
    isInDragRange,
    tableName: _tableName,
    columns: _columns,
    onCopyRowAsSQL,
    onCopyRow,
    onDeleteRow,
  }: TableBodyProps) => {
    const { t } = useTranslation('common');

    // Calculate pinned offsets
    // Selection column width: checkbox (16px) + padding (12px * 2) + border (1px) ≈ 41px
    const SELECTION_COLUMN_WIDTH = 41;
    const pinnedOffsets = useMemo(() => {
      const offsets: Record<string, number> = {};
      let offset = enableSelection ? SELECTION_COLUMN_WIDTH : 0; // Account for selection column
      for (const colId of pinnedColumns) {
        offsets[colId] = offset;
        offset += getColumnSize?.(colId) ?? 150;
      }
      return offsets;
    }, [pinnedColumns, getColumnSize, enableSelection]);

    // Stable callback for toggling row selection
    // This uses the row from the closure, so each row gets its own stable callback
    const toggleHandlersRef = useRef(
      new Map<string, (selected: boolean) => void>()
    );

    // Get or create a stable toggle handler for a row
    const getToggleHandler = useCallback((row: Row<TableRowData>) => {
      let handler = toggleHandlersRef.current.get(row.id);
      if (!handler) {
        handler = (selected: boolean) => row.toggleSelected(selected);
        toggleHandlersRef.current.set(row.id, handler);
      }
      return handler;
    }, []);

    // Pre-compute focused and editing row IDs to avoid string operations in render loop
    // Extract row ID from cell key format "rowId:columnId"
    const focusedRowId = useMemo(() => {
      if (!focusedCellKey) return null;
      const colonIndex = focusedCellKey.indexOf(':');
      return colonIndex > 0 ? focusedCellKey.slice(0, colonIndex) : null;
    }, [focusedCellKey]);

    const editingRowId = useMemo(() => {
      if (!editingCellKey) return null;
      const colonIndex = editingCellKey.indexOf(':');
      return colonIndex > 0 ? editingCellKey.slice(0, colonIndex) : null;
    }, [editingCellKey]);

    // Pre-compute drag range for virtual items only (not all rows)
    const dragRangeByIndex = useMemo(() => {
      if (!isInDragRange) return null;
      const result = new Map<number, boolean>();
      for (const virtualItem of virtualItems) {
        result.set(virtualItem.index, isInDragRange(virtualItem.index));
      }
      return result;
    }, [virtualItems, isInDragRange]);

    // Compute selected row count for context menu label
    const selectedRowCount = useMemo(() => {
      return rows.filter((row) => row.getIsSelected()).length;
    }, [rows]);

    // Calculate padding for virtual space before and after visible rows
    const [paddingTop, paddingBottom] = useMemo(() => {
      if (virtualItems.length === 0) return [0, 0];
      const first = virtualItems[0];
      const last = virtualItems.at(-1)!;
      return [first.start, rowVirtualizer.getTotalSize() - last.end];
    }, [virtualItems, rowVirtualizer]);

    return (
      <tbody style={{ background: STRIPE_BACKGROUND }}>
        {/* Top spacer row for virtual scroll space */}
        {paddingTop > 0 && (
          <tr aria-hidden="true">
            <td
              colSpan={columnCount}
              style={{ height: paddingTop, padding: 0, border: 'none' }}
            />
          </tr>
        )}

        {/* Only render visible virtual items */}
        {virtualItems.map((virtualItem) => {
          const dataIndex = virtualItem.index;
          const row = rows[dataIndex];
          if (!row) return null;

          const isGroupRow = row.getIsGrouped?.() ?? false;
          const rowData = row.original as TableRowData;
          const rowId = rowData.__rowId ?? row.id;
          const isDeleted = rowData.__deleted ?? false;
          const isNewRow = rowData.__isNew ?? false;

          // Get change for this row
          const change = changes?.get(rowId);

          if (isGroupRow) {
            return (
              <GroupRow
                key={`group-${rowId}`}
                row={row}
                isExpanded={row.getIsExpanded()}
              />
            );
          }

          // Use pre-computed row IDs for faster comparison
          const rowFocusedCellKey =
            focusedRowId === row.id ? focusedCellKey : null;
          const rowEditingCellKey =
            editingRowId === row.id ? editingCellKey : null;

          return (
            <DataRow
              key={rowId}
              row={row}
              dataIndex={dataIndex}
              isDeleted={isDeleted}
              isNewRow={isNewRow}
              isSelected={row.getIsSelected()}
              change={change}
              editable={editable}
              onCellClick={onCellClick}
              onCellDoubleClick={onCellDoubleClick}
              onCellSave={onCellSave}
              stopEditing={stopEditing}
              isCellFocused={isCellFocused}
              isCellEditing={isCellEditing}
              focusedCellKey={rowFocusedCellKey}
              editingCellKey={rowEditingCellKey}
              pinnedColumns={pinnedColumns}
              pinnedOffsets={pinnedOffsets}
              enableSelection={enableSelection}
              onDragStart={onDragStart}
              isInDragRange={dragRangeByIndex?.get(dataIndex) ?? false}
              onToggleSelected={getToggleHandler(row)}
              selectedRowCount={selectedRowCount}
              onCopyRowAsSQL={onCopyRowAsSQL}
              onCopyRow={onCopyRow}
              onDeleteRow={onDeleteRow}
              t={t}
            />
          );
        })}

        {/* Bottom spacer row for virtual scroll space */}
        {paddingBottom > 0 && (
          <tr aria-hidden="true">
            <td
              colSpan={columnCount}
              style={{ height: paddingBottom, padding: 0, border: 'none' }}
            />
          </tr>
        )}
      </tbody>
    );
  }
);
