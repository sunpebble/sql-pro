import type { GhostResizeLineRef } from './GhostResizeLine';
import type { ColumnSchema, SortState } from '@/types/database';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowDown, ArrowUp, Key } from 'lucide-react';
import { memo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useResizableColumns } from '@/hooks/useResizableColumns';
import { cn } from '@/lib/utils';
import { ColumnResizeHandle } from './ColumnResizeHandle';
import { GhostResizeLine } from './GhostResizeLine';

interface CellValueProps {
  value: unknown;
  type: string;
}

const CellValue = memo<CellValueProps>(({ value, type }) => {
  if (value === null) {
    return <span className="text-muted-foreground text-sm italic">NULL</span>;
  }

  if (typeof value === 'boolean') {
    return <span className="text-sm">{value ? 'true' : 'false'}</span>;
  }

  if (typeof value === 'number') {
    return <span className="font-mono text-sm tabular-nums">{value}</span>;
  }

  // Blob/binary data
  if (value instanceof Uint8Array || type.toLowerCase().includes('blob')) {
    return (
      <span className="text-muted-foreground text-sm italic">
        [BLOB{' '}
        {typeof value === 'object' ? (value as ArrayBuffer).byteLength : '?'}{' '}
        bytes]
      </span>
    );
  }

  const strValue = String(value);
  return (
    <span className="text-sm whitespace-nowrap" title={strValue}>
      {strValue}
    </span>
  );
});
CellValue.displayName = 'CellValue';

interface DataGridProps {
  columns: ColumnSchema[];
  rows: Record<string, unknown>[];
  sort: SortState | null;
  onSort: (column: string) => void;
}

export function DataGrid({ columns, rows, sort, onSort }: DataGridProps) {
  const { t } = useTranslation('common');
  const parentRef = useRef<HTMLDivElement>(null);
  const ghostLineRef = useRef<GhostResizeLineRef>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 10,
  });

  // Resizable columns with ghost resize support
  const {
    columnWidths,
    totalWidth,
    handleResizeStart,
    handleResizeDoubleClick,
    isResizing,
    resizingColumn,
    isResizeLocked,
  } = useResizableColumns({
    columns,
    rows,
    minWidth: 50,
    ghostLineRef,
  });

  if (columns.length === 0) {
    return (
      <div className="bg-grid-dot text-muted-foreground flex h-full items-center justify-center">
        {t('dataGrid.noDataToDisplay')}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={cn(
        'relative h-full overflow-auto',
        isResizing && 'select-none'
      )}
      role="grid"
      aria-rowcount={rows.length}
      aria-colcount={columns.length}
    >
      {/* Ghost resize line for smooth column resize preview */}
      <GhostResizeLine ref={ghostLineRef} />
      <div style={{ minWidth: totalWidth }}>
        {/* Header */}
        <div
          className="bg-muted sticky top-0 z-10 flex border-b"
          role="row"
          aria-rowindex={1}
        >
          {columns.map((col, idx) => (
            <div
              key={col.name}
              className="relative flex items-center gap-1 border-r px-3 py-2 last:border-r-0"
              style={{ width: columnWidths[idx], minWidth: columnWidths[idx] }}
              role="columnheader"
              aria-colindex={idx + 1}
              aria-sort={
                sort?.column === col.name
                  ? sort.direction === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : undefined
              }
            >
              <button
                type="button"
                onClick={() => {
                  // Prevent sort if resize just completed
                  if (isResizeLocked()) return;
                  onSort(col.name);
                }}
                className="hover:text-foreground flex flex-1 items-center gap-1 text-left text-sm font-medium"
                aria-label={t('dataGrid.sortBy', {
                  column: col.name,
                  currentSort:
                    sort?.column === col.name
                      ? t(
                          sort.direction === 'asc'
                            ? 'dataGrid.currentlyAscending'
                            : 'dataGrid.currentlyDescending'
                        )
                      : '',
                })}
              >
                {col.isPrimaryKey && <Key className="h-3 w-3 text-amber-500" />}
                <span className="truncate">{col.name}</span>
                {sort?.column === col.name &&
                  (sort.direction === 'asc' ? (
                    <ArrowUp className="h-3 w-3 shrink-0" />
                  ) : (
                    <ArrowDown className="h-3 w-3 shrink-0" />
                  ))}
              </button>
              <ColumnResizeHandle
                onMouseDown={(e) => handleResizeStart(idx, e)}
                onDoubleClick={() => handleResizeDoubleClick(idx)}
                isResizing={resizingColumn === idx}
              />
            </div>
          ))}
        </div>

        {/* Body */}
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <div
                key={virtualRow.index}
                className={cn(
                  'absolute left-0 flex w-full border-b',
                  virtualRow.index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                )}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                role="row"
                aria-rowindex={virtualRow.index + 2}
              >
                {columns.map((col, idx) => {
                  const value = row[col.name];
                  return (
                    <div
                      key={col.name}
                      className="flex items-center border-r px-3 last:border-r-0"
                      style={{
                        width: columnWidths[idx],
                        minWidth: columnWidths[idx],
                      }}
                      role="gridcell"
                      aria-colindex={idx + 1}
                    >
                      <CellValue value={value} type={col.type} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
