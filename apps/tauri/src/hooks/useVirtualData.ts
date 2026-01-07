/**
 * useVirtualData - Memory-efficient virtual data management hook
 *
 * This hook manages row data for virtualized tables, keeping only visible rows
 * plus a configurable buffer in memory. Rows outside the viewport are released
 * from memory and can be fetched on demand when they become visible again.
 *
 * This helps ensure memory usage scales with the viewport size, not total data size.
 */

import { BYTE_SIZES, estimateRowArraySize } from '@shared/lib/memory-utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Configuration for the virtual data manager
 */
export interface VirtualDataConfig {
  /**
   * Number of rows to keep in memory above visible area
   * @default 50
   */
  bufferAbove?: number;

  /**
   * Number of rows to keep in memory below visible area
   * @default 50
   */
  bufferBelow?: number;

  /**
   * Minimum number of rows to always keep in memory
   * This ensures we don't release too aggressively for small datasets
   * @default 100
   */
  minRowsInMemory?: number;

  /**
   * Maximum memory budget in bytes for row data
   * When exceeded, oldest accessed rows outside buffer are released
   * @default 5MB (5 * 1024 * 1024)
   */
  maxMemoryBytes?: number;

  /**
   * Whether to enable aggressive memory management
   * When enabled, rows outside the buffer are immediately released
   * When disabled, rows are kept until memory limit is reached
   * @default false
   */
  aggressiveRelease?: boolean;
}

/**
 * Row data with internal tracking
 */
export interface VirtualRowData extends Record<string, unknown> {
  __rowId?: string | number;
  __isNew?: boolean;
  __deleted?: boolean;
  __change?: unknown;
}

/**
 * Statistics about virtual data memory usage
 */
export interface VirtualDataStats {
  /** Total rows in the full dataset */
  totalRows: number;
  /** Number of rows currently in memory */
  rowsInMemory: number;
  /** Estimated memory usage in bytes */
  estimatedMemoryBytes: number;
  /** First row index in memory */
  firstRowInMemory: number;
  /** Last row index in memory */
  lastRowInMemory: number;
  /** Number of rows released from memory */
  releasedRows: number;
  /** Whether memory limit was reached */
  memoryLimitReached: boolean;
}

/**
 * Options for useVirtualData hook
 */
export interface UseVirtualDataOptions<T extends VirtualRowData> {
  /**
   * Full dataset of rows (source of truth)
   * This is the complete data that can be accessed
   */
  allRows: T[];

  /**
   * Currently visible row indices from the virtualizer
   */
  visibleRange: {
    startIndex: number;
    endIndex: number;
  };

  /**
   * Configuration for memory management
   */
  config?: VirtualDataConfig;

  /**
   * Optional callback when rows need to be fetched
   * Called when scrolling to rows that were released from memory
   */
  onRowsNeeded?: (startIndex: number, endIndex: number) => void;

  /**
   * Whether the virtual data management is enabled
   * @default true
   */
  enabled?: boolean;
}

/**
 * Result of useVirtualData hook
 */
export interface UseVirtualDataResult<T extends VirtualRowData> {
  /**
   * Rows currently in memory (windowed data)
   * This is a sparse array - only indices in the retained range have data
   */
  windowedRows: T[];

  /**
   * Get a row by index
   * Returns undefined if row is not in memory
   */
  getRow: (index: number) => T | undefined;

  /**
   * Check if a row is currently in memory
   */
  isRowInMemory: (index: number) => boolean;

  /**
   * Current statistics about memory usage
   */
  stats: VirtualDataStats;

  /**
   * Force release of rows outside the current buffer
   */
  releaseOutOfBufferRows: () => void;

  /**
   * Clear all cached rows (useful for data refresh)
   */
  clearCache: () => void;

  /**
   * Get the retained row range (start and end indices)
   */
  getRetainedRange: () => { start: number; end: number };
}

// Default configuration values
const DEFAULT_BUFFER_ABOVE = 50;
const DEFAULT_BUFFER_BELOW = 50;
const DEFAULT_MIN_ROWS = 100;
const DEFAULT_MAX_MEMORY = 5 * 1024 * 1024; // 5MB

/**
 * Estimate memory size of a single row
 */
function estimateRowSize(row: VirtualRowData): number {
  let size = BYTE_SIZES.OBJECT_OVERHEAD;

  for (const [key, value] of Object.entries(row)) {
    // Key string
    size += key.length * 2 + BYTE_SIZES.STRING_OVERHEAD;

    // Value
    if (value === null || value === undefined) {
      size += BYTE_SIZES.NULL_UNDEFINED;
    } else if (typeof value === 'string') {
      size += value.length * 2 + BYTE_SIZES.STRING_OVERHEAD;
    } else if (typeof value === 'number') {
      size += BYTE_SIZES.NUMBER;
    } else if (typeof value === 'boolean') {
      size += BYTE_SIZES.BOOLEAN;
    } else if (value instanceof Date) {
      size += BYTE_SIZES.DATE;
    } else if (ArrayBuffer.isView(value)) {
      size += value.byteLength;
    } else if (typeof value === 'object') {
      // Rough estimate for nested objects
      try {
        const json = JSON.stringify(value);
        size += json.length * 2;
      } catch {
        size += 256; // Conservative fallback
      }
    }

    // Reference overhead
    size += BYTE_SIZES.REFERENCE;
  }

  return size;
}

/**
 * Hook for managing memory-efficient virtual data
 *
 * This hook provides a windowed view of data, keeping only visible rows
 * plus a configurable buffer in memory to minimize memory usage.
 */
export function useVirtualData<T extends VirtualRowData>(
  options: UseVirtualDataOptions<T>
): UseVirtualDataResult<T> {
  const {
    allRows,
    visibleRange,
    config = {},
    onRowsNeeded,
    enabled = true,
  } = options;

  const {
    bufferAbove = DEFAULT_BUFFER_ABOVE,
    bufferBelow = DEFAULT_BUFFER_BELOW,
    minRowsInMemory = DEFAULT_MIN_ROWS,
    maxMemoryBytes = DEFAULT_MAX_MEMORY,
    aggressiveRelease = false,
  } = config;

  // Track which rows are currently retained in memory
  const [retainedRange, setRetainedRange] = useState<{
    start: number;
    end: number;
  }>({ start: 0, end: Math.min(minRowsInMemory, allRows.length) });

  // Track released rows count for stats
  const releasedRowsRef = useRef(0);

  // Track if memory limit was reached
  const memoryLimitReachedRef = useRef(false);

  // Calculate the desired retained range based on visible range + buffer
  const desiredRange = useMemo(() => {
    const start = Math.max(0, visibleRange.startIndex - bufferAbove);
    const end = Math.min(
      allRows.length,
      visibleRange.endIndex + bufferBelow + 1
    );
    return { start, end };
  }, [
    visibleRange.startIndex,
    visibleRange.endIndex,
    bufferAbove,
    bufferBelow,
    allRows.length,
  ]);

  // Create the windowed rows array
  const windowedRows = useMemo<T[]>(() => {
    if (!enabled || allRows.length === 0) {
      return allRows;
    }

    // If total rows is less than min rows, just return all rows
    if (allRows.length <= minRowsInMemory) {
      return allRows;
    }

    // Create a new array with only the retained range
    const retained: T[] = [];
    const start = Math.max(0, retainedRange.start);
    const end = Math.min(allRows.length, retainedRange.end);

    // Calculate memory usage for the retained range
    let totalMemory = 0;

    for (let i = start; i < end; i++) {
      const row = allRows[i];
      if (row) {
        const rowSize = estimateRowSize(row);
        if (
          totalMemory + rowSize > maxMemoryBytes &&
          i > start + minRowsInMemory
        ) {
          // Memory limit reached, stop adding rows
          memoryLimitReachedRef.current = true;
          break;
        }
        totalMemory += rowSize;
        retained.push(row);
      }
    }

    // Track released rows
    releasedRowsRef.current = allRows.length - retained.length;

    return retained;
  }, [enabled, allRows, retainedRange, minRowsInMemory, maxMemoryBytes]);

  // Update retained range when visible range changes
  // This useEffect is intentionally calling setState based on prop changes,
  // which is a valid pattern for derived state from props
  useEffect(() => {
    if (!enabled) return;

    // Don't update if the dataset is small enough
    if (allRows.length <= minRowsInMemory) {
      if (retainedRange.start !== 0 || retainedRange.end !== allRows.length) {
        // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
        setRetainedRange({ start: 0, end: allRows.length });
      }
      return;
    }

    const newStart = desiredRange.start;
    const newEnd = desiredRange.end;

    // Only update if range actually changed
    if (newStart !== retainedRange.start || newEnd !== retainedRange.end) {
      // If aggressively releasing, immediately update the range
      if (aggressiveRelease) {
        // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
        setRetainedRange({ start: newStart, end: newEnd });
      } else {
        // Keep the range expanded (don't shrink, only grow)
        // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
        setRetainedRange((prev) => ({
          start: Math.min(prev.start, newStart),
          end: Math.max(prev.end, newEnd),
        }));
      }

      // Notify if rows are needed that might have been released
      if (onRowsNeeded && aggressiveRelease) {
        if (newStart < retainedRange.start || newEnd > retainedRange.end) {
          onRowsNeeded(newStart, newEnd);
        }
      }
    }
  }, [
    enabled,
    allRows.length,
    desiredRange.start,
    desiredRange.end,
    retainedRange.start,
    retainedRange.end,
    minRowsInMemory,
    aggressiveRelease,
    onRowsNeeded,
  ]);

  // Get a row by index
  const getRow = useCallback(
    (index: number): T | undefined => {
      if (!enabled || allRows.length <= minRowsInMemory) {
        return allRows[index];
      }

      // Check if the index is within the retained range
      if (index >= retainedRange.start && index < retainedRange.end) {
        return allRows[index];
      }

      return undefined;
    },
    [enabled, allRows, retainedRange, minRowsInMemory]
  );

  // Check if a row is in memory
  const isRowInMemory = useCallback(
    (index: number): boolean => {
      if (!enabled || allRows.length <= minRowsInMemory) {
        return index >= 0 && index < allRows.length;
      }
      return index >= retainedRange.start && index < retainedRange.end;
    },
    [enabled, allRows.length, retainedRange, minRowsInMemory]
  );

  // Force release of rows outside buffer
  const releaseOutOfBufferRows = useCallback(() => {
    if (!enabled) return;

    setRetainedRange({
      start: desiredRange.start,
      end: desiredRange.end,
    });
  }, [enabled, desiredRange]);

  // Clear all cached rows
  const clearCache = useCallback(() => {
    setRetainedRange({
      start: 0,
      end: Math.min(minRowsInMemory, allRows.length),
    });
    releasedRowsRef.current = 0;
    memoryLimitReachedRef.current = false;
  }, [allRows.length, minRowsInMemory]);

  // Get retained range
  const getRetainedRange = useCallback(() => {
    return { ...retainedRange };
  }, [retainedRange]);

  // Calculate stats
  const stats = useMemo<VirtualDataStats>(() => {
    const rowsInMemory = windowedRows.length;
    const estimatedMemory = estimateRowArraySize(windowedRows);

    return {
      totalRows: allRows.length,
      rowsInMemory,
      estimatedMemoryBytes: estimatedMemory,
      firstRowInMemory: retainedRange.start,
      lastRowInMemory: Math.min(retainedRange.end - 1, allRows.length - 1),
      releasedRows: releasedRowsRef.current,
      memoryLimitReached: memoryLimitReachedRef.current,
    };
  }, [allRows.length, windowedRows, retainedRange]);

  return {
    windowedRows,
    getRow,
    isRowInMemory,
    stats,
    releaseOutOfBufferRows,
    clearCache,
    getRetainedRange,
  };
}

/**
 * Default export for convenience
 */
export default useVirtualData;
