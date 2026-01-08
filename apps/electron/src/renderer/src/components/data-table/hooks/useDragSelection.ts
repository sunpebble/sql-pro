import type { Table } from '@tanstack/react-table';
import type { RefObject } from 'react';
import type { TableRowData } from './useTableCore';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseDragSelectionOptions<T> {
  table: Table<T>;
  containerRef: RefObject<HTMLElement | null>;
  enabled?: boolean;
}

interface UseDragSelectionReturn {
  /**
   * Whether a drag selection is currently in progress
   */
  isDragging: boolean;

  /**
   * The start index of the current drag selection
   */
  dragStartIndex: number | null;

  /**
   * The current end index of the drag selection
   */
  dragEndIndex: number | null;

  /**
   * Mouse down handler for starting drag selection
   */
  handleMouseDown: (e: React.MouseEvent, rowIndex: number) => void;

  /**
   * Check if a row is within the current drag selection range
   */
  isInDragRange: (rowIndex: number) => boolean;
}

/**
 * Hook for handling drag selection in tables.
 * Allows users to click and drag to select multiple rows.
 */
export function useDragSelection<T extends TableRowData>({
  table,
  containerRef,
  enabled = true,
}: UseDragSelectionOptions<T>): UseDragSelectionReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null);
  const [dragEndIndex, setDragEndIndex] = useState<number | null>(null);

  // Track initial selection state when drag starts
  const initialSelectionRef = useRef<Record<string, boolean>>({});
  // Track if shift key was pressed at drag start
  const isExtendingRef = useRef(false);

  /**
   * Get the row index from a DOM element
   */
  const getRowIndexFromElement = useCallback(
    (element: Element | null): number | null => {
      if (!element) return null;

      // Find the closest tr element with data-row-index
      const row = element.closest('tr[data-row-index]');
      if (!row) return null;

      const indexStr = row.getAttribute('data-row-index');
      if (indexStr === null) return null;

      const index = Number.parseInt(indexStr, 10);
      return Number.isNaN(index) ? null : index;
    },
    []
  );

  /**
   * Select rows in a range
   */
  const selectRange = useCallback(
    (startIndex: number, endIndex: number, extend: boolean) => {
      const rows = table.getRowModel().rows;
      const minIndex = Math.min(startIndex, endIndex);
      const maxIndex = Math.max(startIndex, endIndex);

      // Build new selection state
      const newSelection: Record<string, boolean> = extend
        ? { ...initialSelectionRef.current }
        : {};

      for (let i = minIndex; i <= maxIndex; i++) {
        const row = rows[i];
        if (row && !row.getIsGrouped?.()) {
          newSelection[row.id] = true;
        }
      }

      // Apply selection
      table.setRowSelection(newSelection);
    },
    [table]
  );

  /**
   * Handle mouse down to start drag selection
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, rowIndex: number) => {
      if (!enabled) return;

      // Only handle left mouse button
      if (e.button !== 0) return;

      // Don't start drag if clicking directly on interactive elements (except checkbox for selection)
      const target = e.target as HTMLElement;
      if (
        target.closest('button') ||
        target.closest('input') ||
        target.closest('a')
      ) {
        return;
      }

      // Store current selection state for extending
      initialSelectionRef.current = { ...table.getState().rowSelection };
      isExtendingRef.current = e.shiftKey;

      setIsDragging(true);
      setDragStartIndex(rowIndex);
      setDragEndIndex(rowIndex);

      // Select the clicked row immediately (if not extending with shift)
      if (!e.shiftKey) {
        const row = table.getRowModel().rows[rowIndex];
        if (row && !row.getIsGrouped?.()) {
          table.setRowSelection({ [row.id]: true });
        }
      } else {
        // With shift, select range from first selected to current
        selectRange(rowIndex, rowIndex, true);
      }

      // Prevent text selection during drag
      e.preventDefault();
    },
    [enabled, table, selectRange]
  );

  /**
   * Handle mouse move during drag
   */
  useEffect(() => {
    if (!isDragging || !enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      // Get the element under the cursor
      const elementUnderCursor = document.elementFromPoint(
        e.clientX,
        e.clientY
      );
      const newEndIndex = getRowIndexFromElement(elementUnderCursor);

      if (newEndIndex !== null && newEndIndex !== dragEndIndex) {
        setDragEndIndex(newEndIndex);

        // Select range
        if (dragStartIndex !== null) {
          selectRange(dragStartIndex, newEndIndex, isExtendingRef.current);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Keep the final selection, just reset drag state
      setDragStartIndex(null);
      setDragEndIndex(null);
    };

    // Add listeners to document to handle mouse events outside container
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isDragging,
    enabled,
    containerRef,
    dragStartIndex,
    dragEndIndex,
    getRowIndexFromElement,
    selectRange,
  ]);

  /**
   * Check if a row is within the current drag selection range
   */
  const isInDragRange = useCallback(
    (rowIndex: number): boolean => {
      if (!isDragging || dragStartIndex === null || dragEndIndex === null) {
        return false;
      }
      const minIndex = Math.min(dragStartIndex, dragEndIndex);
      const maxIndex = Math.max(dragStartIndex, dragEndIndex);
      return rowIndex >= minIndex && rowIndex <= maxIndex;
    },
    [isDragging, dragStartIndex, dragEndIndex]
  );

  return {
    isDragging,
    dragStartIndex,
    dragEndIndex,
    handleMouseDown,
    isInDragRange,
  };
}
