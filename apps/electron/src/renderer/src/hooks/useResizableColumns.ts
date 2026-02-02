import type { GhostResizeLineRef } from '@/components/GhostResizeLine';
import type { ColumnSchema } from '@/types/database';
import { useCallback, useMemo, useRef, useState } from 'react';

interface UseResizableColumnsOptions {
  columns: ColumnSchema[];
  rows: Record<string, unknown>[];
  minWidth?: number;
  maxWidth?: number; // undefined = no limit
  /** Ref to the ghost resize line component for zero-rerender drag preview */
  ghostLineRef?: React.RefObject<GhostResizeLineRef | null>;
}

interface UseResizableColumnsReturn {
  columnWidths: number[];
  totalWidth: number;
  handleResizeStart: (columnIndex: number, event: React.MouseEvent) => void;
  handleResizeDoubleClick: (columnIndex: number) => void;
  isResizing: boolean;
  resizingColumn: number | null;
  /** Returns true if a resize operation just completed (within 100ms) - use to block click events */
  isResizeLocked: () => boolean;
}

/**
 * Calculate optimal column width based on content.
 * Scans all rows to find the maximum content width.
 */
function calculateColumnWidth(
  col: ColumnSchema,
  rows: Record<string, unknown>[],
  minWidth: number,
  maxWidth?: number
): number {
  // Header width: column name + padding + icons (key, sort, resize handle)
  const headerWidth = col.name.length * 9 + 60;

  // Content width: scan all rows to find max content width
  const contentWidth = rows.reduce((max, row) => {
    const value = row[col.name];
    if (value === null) return Math.max(max, 50); // "NULL" text width
    const strValue = String(value);
    // Use generous character width estimation to ensure content fits
    // Monospace numbers: ~8px, Regular text: ~8px (conservative)
    const charWidth = 8;
    return Math.max(max, strValue.length * charWidth + 32); // +32 for cell padding
  }, 0);

  const optimalWidth = Math.max(headerWidth, contentWidth, minWidth);
  return maxWidth ? Math.min(optimalWidth, maxWidth) : optimalWidth;
}

/**
 * Hook for managing resizable table columns.
 * - Default: columns sized to fit content (scans all rows)
 * - Drag: manually adjust column width
 * - Double-click: auto-fit to content (scans all rows)
 */
export function useResizableColumns({
  columns,
  rows,
  minWidth = 50,
  maxWidth, // undefined = no limit
  ghostLineRef,
}: UseResizableColumnsOptions): UseResizableColumnsReturn {
  // Calculate initial widths based on content (scan all rows for accuracy)
  const initialWidths = useMemo(() => {
    return columns.map((col) =>
      calculateColumnWidth(col, rows, minWidth, maxWidth)
    );
  }, [columns, rows, minWidth, maxWidth]);

  const [columnWidths, setColumnWidths] = useState<number[]>(initialWidths);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<number | null>(null);

  // Store refs for drag operation
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  const currentColumnIndex = useRef<number | null>(null);

  // Lock mechanism to prevent accidental sort trigger after resize
  const resizeLockTimeoutRef = useRef<number | null>(null);
  const isResizeLockedRef = useRef(false);

  // Track the last initialWidths reference to detect changes
  const prevInitialWidthsRef = useRef(initialWidths);

  // Sync widths when data changes (e.g., different table selected)
  // Using render-time comparison instead of useEffect to avoid eslint warning
  if (prevInitialWidthsRef.current !== initialWidths) {
    prevInitialWidthsRef.current = initialWidths;
    setColumnWidths(initialWidths);
  }

  // Check if resize is locked (within 100ms after resize ended)
  const isResizeLocked = useCallback(() => isResizeLockedRef.current, []);

  // Handle mouse move during resize - update ghost line position only (no setState)
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (currentColumnIndex.current === null) return;

      // Calculate new position for ghost line (using clientX for fixed positioning)
      if (ghostLineRef?.current) {
        ghostLineRef.current.setPosition(event.clientX);
      }
    },
    [ghostLineRef]
  );

  // Handle mouse up to end resize
  const handleMouseUp = useCallback(
    (event: MouseEvent) => {
      if (currentColumnIndex.current === null) return;

      // Calculate final width based on drag distance
      const delta = event.clientX - dragStartX.current;
      let newWidth = Math.max(dragStartWidth.current + delta, minWidth);
      if (maxWidth) {
        newWidth = Math.min(newWidth, maxWidth);
      }

      // Update state once at the end (single rerender)
      setColumnWidths((prev) => {
        const next = [...prev];
        next[currentColumnIndex.current!] = newWidth;
        return next;
      });

      // Hide ghost line
      ghostLineRef?.current?.hide();

      setIsResizing(false);
      setResizingColumn(null);
      currentColumnIndex.current = null;

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      // Set lock to prevent accidental click events (like sort) for 100ms
      isResizeLockedRef.current = true;
      if (resizeLockTimeoutRef.current) {
        window.clearTimeout(resizeLockTimeoutRef.current);
      }
      resizeLockTimeoutRef.current = window.setTimeout(() => {
        isResizeLockedRef.current = false;
        resizeLockTimeoutRef.current = null;
      }, 100);
    },
    [handleMouseMove, minWidth, maxWidth, ghostLineRef]
  );

  // Start resize operation
  const handleResizeStart = useCallback(
    (columnIndex: number, event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      dragStartX.current = event.clientX;
      dragStartWidth.current = columnWidths[columnIndex];
      currentColumnIndex.current = columnIndex;

      setIsResizing(true);
      setResizingColumn(columnIndex);

      // Show ghost line at initial position (using clientX for fixed positioning)
      if (ghostLineRef?.current) {
        ghostLineRef.current.show(event.clientX);
      }

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [columnWidths, handleMouseMove, handleMouseUp, ghostLineRef]
  );

  // Double-click to auto-fit column width (scans ALL rows for accurate width)
  const handleResizeDoubleClick = useCallback(
    (columnIndex: number) => {
      const col = columns[columnIndex];
      if (!col) return;

      // Calculate optimal width by scanning ALL rows (no sampleSize limit)
      const optimalWidth = calculateColumnWidth(col, rows, minWidth, maxWidth);

      setColumnWidths((prev) => {
        const next = [...prev];
        next[columnIndex] = optimalWidth;
        return next;
      });
    },
    [columns, rows, minWidth, maxWidth]
  );

  const totalWidth = columnWidths.reduce((sum, w) => sum + w, 0);

  return {
    columnWidths,
    totalWidth,
    handleResizeStart,
    handleResizeDoubleClick,
    isResizing,
    resizingColumn,
    isResizeLocked,
  };
}
