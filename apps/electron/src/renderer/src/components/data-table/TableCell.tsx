import type { Cell } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import type { TableRowData } from './hooks/useTableCore';
import type { ColumnSchema } from '@/types/database';
import { flexRender } from '@tanstack/react-table';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

// Memoized cell display component for better performance
const CellDisplay = memo(
  ({ value, type }: { value: unknown; type: string }) => {
    if (value === null) {
      return <span className="text-muted-foreground italic">NULL</span>;
    }

    if (typeof value === 'boolean') {
      return <span>{value ? 'true' : 'false'}</span>;
    }

    if (typeof value === 'number') {
      return <span className="font-mono tabular-nums">{value}</span>;
    }

    if (type.toLowerCase().includes('blob')) {
      return <span className="text-muted-foreground italic">[BLOB]</span>;
    }

    const strValue = String(value);
    return (
      <span className="whitespace-nowrap" title={strValue}>
        {strValue}
      </span>
    );
  }
);

interface TableCellProps {
  cell: Cell<TableRowData, unknown>;
  rowId: string;
  isFocused: boolean;
  isEditing: boolean;
  hasChange: boolean;
  oldValue?: unknown;
  editable?: boolean;
  onCellClick?: (rowId: string, columnId: string) => void;
  onCellDoubleClick?: (rowId: string, columnId: string) => void;
  onCellSave?: (value: unknown) => void;
  stopEditing?: () => void;
  /** Whether this column is pinned */
  isPinned?: boolean;
  /** Offset for pinned columns */
  pinnedOffset?: number;
  /** Whether this is the last pinned column */
  isLastPinned?: boolean;
}

// Custom comparison function for TableCell to avoid unnecessary re-renders
function areTableCellPropsEqual(
  prevProps: TableCellProps,
  nextProps: TableCellProps
): boolean {
  // Check cell identity - if the cell object is the same, values are the same
  if (prevProps.cell !== nextProps.cell) return false;
  if (prevProps.rowId !== nextProps.rowId) return false;

  // Check visual state flags
  if (prevProps.isFocused !== nextProps.isFocused) return false;
  if (prevProps.isEditing !== nextProps.isEditing) return false;
  if (prevProps.hasChange !== nextProps.hasChange) return false;
  if (prevProps.editable !== nextProps.editable) return false;

  // Check pinning state
  if (prevProps.isPinned !== nextProps.isPinned) return false;
  if (prevProps.pinnedOffset !== nextProps.pinnedOffset) return false;
  if (prevProps.isLastPinned !== nextProps.isLastPinned) return false;

  // oldValue only matters if hasChange is true
  if (nextProps.hasChange && prevProps.oldValue !== nextProps.oldValue) {
    return false;
  }

  // Callbacks are stable (memoized in parent), skip comparison
  return true;
}

export const TableCell = memo(
  ({
    cell,
    rowId,
    isFocused,
    isEditing,
    hasChange,
    oldValue,
    editable,
    onCellClick,
    onCellDoubleClick,
    onCellSave,
    stopEditing,
    isPinned,
    pinnedOffset,
    isLastPinned,
  }: TableCellProps) => {
    const { t } = useTranslation('common');
    const [editValue, setEditValue] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const columnId = cell.column.id;
    const value = cell.getValue();
    const columnMeta = cell.column.columnDef.meta as
      | { schema?: ColumnSchema; type?: string }
      | undefined;
    const columnSchema = columnMeta?.schema;
    const columnType = columnSchema?.type ?? columnMeta?.type ?? 'text';

    // Use refs for callback dependencies to avoid recreating handlers
    const callbackRefs = useRef({
      onCellClick,
      onCellDoubleClick,
      onCellSave,
      stopEditing,
    });
    callbackRefs.current = {
      onCellClick,
      onCellDoubleClick,
      onCellSave,
      stopEditing,
    };

    // Track whether we were previously editing to detect edit mode transitions
    const prevIsEditingRef = useRef(isEditing);

    // Initialize edit state when entering edit mode
    // Using useEffect to avoid state updates during render (which causes flushSync warnings)
    useEffect(() => {
      if (isEditing && !prevIsEditingRef.current) {
        // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Intentional: init state on edit mode transition
        setEditValue(value === null ? '' : String(value));
        // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Intentional: clear validation on edit mode transition
        setValidationError(null);
      }
      prevIsEditingRef.current = isEditing;
    }, [isEditing, value]);

    // Focus the input when entering edit mode
    useEffect(() => {
      if (isEditing) {
        const timeoutId = setTimeout(() => inputRef.current?.focus(), 0);
        return () => clearTimeout(timeoutId);
      }
      return undefined;
    }, [isEditing]);

    // Stable validation function using ref
    const validateValue = useCallback(
      (val: string): string | null => {
        if (columnSchema && !columnSchema.nullable) {
          if (val === '' || val.toLowerCase() === 'null') {
            return t('editableCell.fieldCannotBeEmpty');
          }
        }
        const type = columnType.toLowerCase();
        if (
          type.includes('int') &&
          val !== '' &&
          val.toLowerCase() !== 'null'
        ) {
          if (Number.isNaN(Number.parseInt(val, 10)))
            return t('editableCell.mustBeValidInteger');
        } else if (
          (type.includes('real') ||
            type.includes('float') ||
            type.includes('double')) &&
          val !== '' &&
          val.toLowerCase() !== 'null'
        ) {
          if (Number.isNaN(Number.parseFloat(val)))
            return t('editableCell.mustBeValidNumber');
        }
        return null;
      },
      [columnSchema, columnType, t]
    );

    // Stable save handler using refs - no dependency on editValue
    const handleSave = useCallback(() => {
      const currentEditValue = inputRef.current?.value ?? '';
      const error = validateValue(currentEditValue);
      if (error) {
        setValidationError(error);
        return;
      }

      let newValue: unknown = currentEditValue;
      const type = columnType.toLowerCase();

      if (
        currentEditValue === '' ||
        currentEditValue.toLowerCase() === 'null'
      ) {
        newValue = null;
      } else if (type.includes('int')) {
        const parsed = Number.parseInt(currentEditValue, 10);
        newValue = Number.isNaN(parsed) ? currentEditValue : parsed;
      } else if (
        type.includes('real') ||
        type.includes('float') ||
        type.includes('double')
      ) {
        const parsed = Number.parseFloat(currentEditValue);
        newValue = Number.isNaN(parsed) ? currentEditValue : parsed;
      }

      setValidationError(null);
      callbackRefs.current.onCellSave?.(newValue);
    }, [columnType, validateValue]);

    // Stable key handler
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Tab' || e.key === 'Enter') {
          handleSave();
        } else if (e.key === 'Escape') {
          setValidationError(null);
          callbackRefs.current.stopEditing?.();
        }
      },
      [handleSave]
    );

    // Stable change handler
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditValue(e.target.value);
        setValidationError(null);
      },
      []
    );

    // Stable click handler using refs
    const handleClick = useCallback(() => {
      callbackRefs.current.onCellClick?.(rowId, columnId);
    }, [rowId, columnId]);

    // Stable double-click handler using refs
    const handleDoubleClick = useCallback(() => {
      if (editable) {
        callbackRefs.current.onCellDoubleClick?.(rowId, columnId);
      }
    }, [editable, rowId, columnId]);

    // Memoize pinned styles to avoid object recreation
    const pinnedStyles = useMemo<React.CSSProperties>(() => {
      if (!isPinned) return {};
      return { position: 'sticky', left: pinnedOffset ?? 0, zIndex: 1 };
    }, [isPinned, pinnedOffset]);

    const pinnedClassName = cn(
      isPinned &&
        'bg-background group-hover:bg-muted/50 transition-colors duration-100',
      isLastPinned &&
        'after:bg-border after:absolute after:top-0 after:right-0 after:bottom-0 after:w-px after:shadow-[2px_0_4px_rgba(0,0,0,0.1)]'
    );

    // For grouped cells, show the aggregated value
    if (cell.getIsAggregated()) {
      const renderedValue =
        flexRender(cell.column.columnDef.aggregatedCell, cell.getContext()) ??
        (cell.renderValue() as ReactNode);
      return (
        <td
          className={cn(
            'text-muted-foreground border-border overflow-hidden border-r border-b px-1.5 py-0.5 whitespace-nowrap',
            pinnedClassName
          )}
          style={pinnedStyles}
          data-column-id={columnId}
        >
          {renderedValue}
        </td>
      );
    }

    // For placeholder cells in grouped rows
    if (cell.getIsPlaceholder()) {
      return (
        <td
          className={cn('border-border border-r border-b', pinnedClassName)}
          style={pinnedStyles}
          data-column-id={columnId}
        />
      );
    }

    // Edit mode
    if (isEditing) {
      return (
        <td
          className={cn(
            'border-border relative border-r border-b p-0',
            pinnedClassName
          )}
          style={pinnedStyles}
          data-column-id={columnId}
        >
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={handleChange}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={cn(
              'bg-background h-full w-full px-1.5 py-0.5 ring-2 outline-none ring-inset',
              validationError ? 'ring-destructive' : 'ring-ring'
            )}
            aria-invalid={!!validationError}
            aria-describedby={validationError ? 'cell-error' : undefined}
          />
          {validationError && (
            <div
              id="cell-error"
              className="bg-destructive text-destructive-foreground absolute -top-6 left-0 z-50 rounded px-1.5 py-0.5 whitespace-nowrap shadow-sm"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              {validationError}
            </div>
          )}
        </td>
      );
    }

    // Display mode
    return (
      <td
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={cn(
          'border-border cursor-pointer overflow-hidden border-r border-b px-1.5 py-0.5 whitespace-nowrap',
          isFocused && 'ring-ring ring-2 ring-inset',
          hasChange && 'bg-amber-500/20',
          pinnedClassName
        )}
        style={pinnedStyles}
        data-column-id={columnId}
        title={
          hasChange && oldValue !== undefined
            ? t('dataTable.originalValue', { value: oldValue })
            : undefined
        }
      >
        <CellDisplay value={value} type={columnType} />
      </td>
    );
  },
  areTableCellPropsEqual
);
