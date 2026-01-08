import type { Cell } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import type { TableRowData } from './hooks/useTableCore';
import type { ColumnSchema } from '@/types/database';
import { flexRender } from '@tanstack/react-table';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
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

    // Track whether we were previously editing to detect edit mode transitions
    const prevIsEditingRef = useRef(isEditing);

    // Initialize edit state when entering edit mode - this avoids useEffect setState
    // by checking state changes during render (React's recommended pattern)
    if (isEditing && !prevIsEditingRef.current) {
      // Entering edit mode - set initial values synchronously during render
      setEditValue(value === null ? '' : String(value));
      setValidationError(null);
    }
    prevIsEditingRef.current = isEditing;

    // Focus the input when entering edit mode
    useEffect(() => {
      if (isEditing) {
        const timeoutId = setTimeout(() => inputRef.current?.focus(), 0);
        return () => clearTimeout(timeoutId);
      }
      return undefined;
    }, [isEditing]);

    // Memoized validation function
    const validateValue = useCallback(
      (val: string): string | null => {
        // Check NOT NULL constraint
        if (columnSchema && !columnSchema.nullable) {
          if (val === '' || val.toLowerCase() === 'null') {
            return 'This field cannot be empty';
          }
        }

        // Type validation for numeric types
        const type = columnType.toLowerCase();
        if (type.includes('int')) {
          if (val !== '' && val.toLowerCase() !== 'null') {
            const parsed = Number.parseInt(val, 10);
            if (Number.isNaN(parsed)) {
              return 'Must be a valid integer';
            }
          }
        } else if (
          type.includes('real') ||
          type.includes('float') ||
          type.includes('double')
        ) {
          if (val !== '' && val.toLowerCase() !== 'null') {
            const parsed = Number.parseFloat(val);
            if (Number.isNaN(parsed)) {
              return 'Must be a valid number';
            }
          }
        }

        return null;
      },
      [columnSchema, columnType]
    );

    // Memoized save handler
    const handleSave = useCallback(() => {
      const error = validateValue(editValue);
      if (error) {
        setValidationError(error);
        return;
      }

      let newValue: unknown = editValue;
      const type = columnType.toLowerCase();

      // Convert to appropriate type
      if (editValue === '' || editValue.toLowerCase() === 'null') {
        newValue = null;
      } else if (type.includes('int')) {
        newValue = Number.parseInt(editValue, 10);
        if (Number.isNaN(newValue as number)) newValue = editValue;
      } else if (
        type.includes('real') ||
        type.includes('float') ||
        type.includes('double')
      ) {
        newValue = Number.parseFloat(editValue);
        if (Number.isNaN(newValue as number)) newValue = editValue;
      }

      setValidationError(null);
      onCellSave?.(newValue);
    }, [editValue, columnType, validateValue, onCellSave]);

    // Memoized key handler
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Tab') {
          handleSave();
        } else if (e.key === 'Enter') {
          handleSave();
        } else if (e.key === 'Escape') {
          setValidationError(null);
          stopEditing?.();
        }
      },
      [handleSave, stopEditing]
    );

    // Memoized change handler
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditValue(e.target.value);
        if (validationError) {
          setValidationError(null);
        }
      },
      [validationError]
    );

    // Memoized click handler
    const handleClick = useCallback(() => {
      onCellClick?.(rowId, columnId);
    }, [onCellClick, rowId, columnId]);

    // Memoized double-click handler
    const handleDoubleClick = useCallback(() => {
      if (editable) {
        onCellDoubleClick?.(rowId, columnId);
      }
    }, [editable, onCellDoubleClick, rowId, columnId]);

    // Calculate pinned styles
    const pinnedStyles: React.CSSProperties = {};
    if (isPinned) {
      pinnedStyles.position = 'sticky';
      pinnedStyles.left = pinnedOffset ?? 0;
      pinnedStyles.zIndex = 1;
    }

    const pinnedClassName = cn(
      isPinned && 'bg-background',
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
            'text-muted-foreground border-border border-r border-b px-1.5 py-0.5 whitespace-nowrap',
            pinnedClassName
          )}
          style={pinnedStyles}
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
              className="bg-destructive text-destructive-foreground absolute -top-6 left-0 z-50 rounded px-1.5 py-0.5 text-xs whitespace-nowrap shadow-sm"
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
          'border-border cursor-pointer border-r border-b px-1.5 py-0.5 whitespace-nowrap',
          isFocused && 'ring-ring ring-2 ring-inset',
          hasChange && 'bg-amber-500/20',
          pinnedClassName
        )}
        style={pinnedStyles}
        title={
          hasChange && oldValue !== undefined
            ? `Original: ${oldValue}`
            : undefined
        }
      >
        <CellDisplay value={value} type={columnType} />
      </td>
    );
  },
  areTableCellPropsEqual
);
