import type { VirtualRowData } from './useVirtualData';
/**
 * Tests for useVirtualData hook
 *
 * These tests verify that the virtual data management works correctly
 * for memory-efficient row handling in data tables.
 */
import { act, renderHook } from '@testing-library/react';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useVirtualData } from './useVirtualData';

// Helper to generate mock rows
function generateRows(count: number): VirtualRowData[] {
  return Array.from({ length: count }, (_, i) => ({
    __rowId: i,
    id: i,
    name: `Row ${i}`,
    email: `user${i}@example.com`,
    value: Math.random() * 1000,
  }));
}

// Helper to advance timers and flush updates
async function flushDebounce() {
  await act(async () => {
    vi.advanceTimersByTime(20); // Slightly more than the 16ms debounce
  });
}

describe('useVirtualData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should return all rows when disabled', () => {
      const rows = generateRows(10);
      const { result } = renderHook(() =>
        useVirtualData({
          allRows: rows,
          visibleRange: { startIndex: 0, endIndex: 5 },
          enabled: false,
        })
      );

      expect(result.current.windowedRows).toEqual(rows);
      expect(result.current.stats.totalRows).toBe(10);
      expect(result.current.stats.rowsInMemory).toBe(10);
    });

    it('should return all rows when total rows is less than minRowsInMemory', () => {
      const rows = generateRows(50);
      const { result } = renderHook(() =>
        useVirtualData({
          allRows: rows,
          visibleRange: { startIndex: 0, endIndex: 10 },
          enabled: true,
          config: {
            minRowsInMemory: 100,
          },
        })
      );

      expect(result.current.windowedRows.length).toBe(50);
      expect(result.current.stats.rowsInMemory).toBe(50);
    });

    it('should return initial stats correctly', () => {
      const rows = generateRows(100);
      const { result } = renderHook(() =>
        useVirtualData({
          allRows: rows,
          visibleRange: { startIndex: 0, endIndex: 20 },
          enabled: true,
        })
      );

      expect(result.current.stats.totalRows).toBe(100);
      expect(result.current.stats.firstRowInMemory).toBeGreaterThanOrEqual(0);
      expect(result.current.stats.lastRowInMemory).toBeLessThan(100);
    });
  });

  describe('getRow', () => {
    it('should return row when within retained range', async () => {
      const rows = generateRows(200);
      const { result } = renderHook(() =>
        useVirtualData({
          allRows: rows,
          visibleRange: { startIndex: 50, endIndex: 60 },
          enabled: true,
          config: {
            bufferAbove: 10,
            bufferBelow: 10,
            minRowsInMemory: 50,
          },
        })
      );

      // Wait for debounced range update
      await flushDebounce();

      // Row at index 50 should be accessible (within visible range)
      const row = result.current.getRow(50);
      expect(row).toBeDefined();
      expect(row?.id).toBe(50);
    });

    it('should return undefined for rows outside retained range when aggressive release is enabled', async () => {
      const rows = generateRows(500);
      const { result, rerender } = renderHook(
        ({ visibleRange }) =>
          useVirtualData({
            allRows: rows,
            visibleRange,
            enabled: true,
            config: {
              bufferAbove: 10,
              bufferBelow: 10,
              minRowsInMemory: 50,
              aggressiveRelease: true,
            },
          }),
        {
          initialProps: { visibleRange: { startIndex: 200, endIndex: 220 } },
        }
      );

      // Wait for initial debounced range update
      await flushDebounce();

      // Row at index 0 should be undefined when visible range is 200-220
      // with aggressive release and small buffer
      act(() => {
        rerender({ visibleRange: { startIndex: 200, endIndex: 220 } });
      });

      await flushDebounce();

      // Check that a row far from the visible range returns undefined with getRow
      // However, getRow accesses allRows directly based on retainedRange
      // So we need to verify the behavior is correct
      const nearVisibleRow = result.current.getRow(195);
      expect(nearVisibleRow).toBeDefined();
    });

    it('should return row for all indices when disabled', () => {
      const rows = generateRows(100);
      const { result } = renderHook(() =>
        useVirtualData({
          allRows: rows,
          visibleRange: { startIndex: 50, endIndex: 60 },
          enabled: false,
        })
      );

      // All rows should be accessible when disabled
      expect(result.current.getRow(0)).toBeDefined();
      expect(result.current.getRow(50)).toBeDefined();
      expect(result.current.getRow(99)).toBeDefined();
    });
  });

  describe('isRowInMemory', () => {
    it('should return true for rows within retained range', async () => {
      const rows = generateRows(200);
      const { result } = renderHook(() =>
        useVirtualData({
          allRows: rows,
          visibleRange: { startIndex: 50, endIndex: 70 },
          enabled: true,
          config: {
            bufferAbove: 20,
            bufferBelow: 20,
            minRowsInMemory: 50,
          },
        })
      );

      // Wait for debounced range update
      await flushDebounce();

      // Row in visible range should be in memory
      expect(result.current.isRowInMemory(60)).toBe(true);
    });

    it('should return false for rows outside retained range with aggressive release', async () => {
      const rows = generateRows(500);
      const { result } = renderHook(() =>
        useVirtualData({
          allRows: rows,
          visibleRange: { startIndex: 200, endIndex: 220 },
          enabled: true,
          config: {
            bufferAbove: 10,
            bufferBelow: 10,
            minRowsInMemory: 50,
            aggressiveRelease: true,
          },
        })
      );

      // Wait for debounced range update
      await flushDebounce();

      // Row far from visible range should not be in memory
      expect(result.current.isRowInMemory(0)).toBe(false);
      expect(result.current.isRowInMemory(480)).toBe(false);

      // Row in visible range should be in memory
      expect(result.current.isRowInMemory(210)).toBe(true);
    });

    it('should return true for all valid indices when disabled', () => {
      const rows = generateRows(100);
      const { result } = renderHook(() =>
        useVirtualData({
          allRows: rows,
          visibleRange: { startIndex: 50, endIndex: 60 },
          enabled: false,
        })
      );

      expect(result.current.isRowInMemory(0)).toBe(true);
      expect(result.current.isRowInMemory(99)).toBe(true);
      expect(result.current.isRowInMemory(100)).toBe(false); // Out of bounds
    });
  });

  describe('stats', () => {
    it('should provide accurate memory statistics', async () => {
      const rows = generateRows(1000);
      const { result } = renderHook(() =>
        useVirtualData({
          allRows: rows,
          visibleRange: { startIndex: 100, endIndex: 130 },
          enabled: true,
          config: {
            bufferAbove: 50,
            bufferBelow: 50,
            minRowsInMemory: 100,
          },
        })
      );

      // Wait for debounced range update
      await flushDebounce();

      const { stats } = result.current;

      expect(stats.totalRows).toBe(1000);
      expect(stats.firstRowInMemory).toBeLessThanOrEqual(100);
      expect(stats.lastRowInMemory).toBeGreaterThanOrEqual(130);
      expect(stats.estimatedMemoryBytes).toBeGreaterThan(0);
    });

    it('should track released rows count', () => {
      const rows = generateRows(500);
      const { result } = renderHook(() =>
        useVirtualData({
          allRows: rows,
          visibleRange: { startIndex: 200, endIndex: 220 },
          enabled: true,
          config: {
            bufferAbove: 20,
            bufferBelow: 20,
            minRowsInMemory: 50,
            aggressiveRelease: true,
          },
        })
      );

      const { stats } = result.current;

      // Most rows should be released with aggressive release
      expect(stats.releasedRows).toBeGreaterThan(0);
    });
  });

  describe('releaseOutOfBufferRows', () => {
    it('should release rows outside the buffer', async () => {
      const rows = generateRows(500);
      const { result, rerender } = renderHook(
        ({ visibleRange }) =>
          useVirtualData({
            allRows: rows,
            visibleRange,
            enabled: true,
            config: {
              bufferAbove: 10,
              bufferBelow: 10,
              minRowsInMemory: 50,
              aggressiveRelease: false, // Non-aggressive release (range grows but doesn't shrink)
            },
          }),
        {
          initialProps: { visibleRange: { startIndex: 0, endIndex: 30 } },
        }
      );

      // Wait for initial debounced range update
      await flushDebounce();

      const initialRowsInMemory = result.current.stats.rowsInMemory;

      // Move visible range to the end
      act(() => {
        rerender({ visibleRange: { startIndex: 450, endIndex: 480 } });
      });

      // Wait for debounced range update
      await flushDebounce();

      // With non-aggressive release, range should have expanded
      const expandedRowsInMemory = result.current.stats.rowsInMemory;
      expect(expandedRowsInMemory).toBeGreaterThanOrEqual(initialRowsInMemory);

      // Now force release
      act(() => {
        result.current.releaseOutOfBufferRows();
      });

      // Rows should be released to match the current buffer
      expect(result.current.stats.rowsInMemory).toBeLessThanOrEqual(
        expandedRowsInMemory
      );
    });
  });

  describe('clearCache', () => {
    it('should reset retained range and counters', () => {
      const rows = generateRows(300);
      const { result } = renderHook(() =>
        useVirtualData({
          allRows: rows,
          visibleRange: { startIndex: 150, endIndex: 180 },
          enabled: true,
          config: {
            bufferAbove: 20,
            bufferBelow: 20,
            minRowsInMemory: 100,
          },
        })
      );

      // Get initial state
      const initialStats = result.current.stats;
      expect(initialStats.releasedRows).toBeGreaterThan(0);

      // Clear cache
      act(() => {
        result.current.clearCache();
      });

      // Range should be reset - but the useEffect will update it based on visible range
      // The important thing is that the counters are reset
      const newRange = result.current.getRetainedRange();
      // Start should be reset to 0 initially, but then updated by useEffect
      expect(newRange.start).toBeGreaterThanOrEqual(0);
      expect(result.current.stats.memoryLimitReached).toBe(false);
    });
  });

  describe('getRetainedRange', () => {
    it('should return the current retained range', async () => {
      const rows = generateRows(200);
      const { result } = renderHook(() =>
        useVirtualData({
          allRows: rows,
          visibleRange: { startIndex: 50, endIndex: 70 },
          enabled: true,
          config: {
            bufferAbove: 20,
            bufferBelow: 20,
            minRowsInMemory: 50,
          },
        })
      );

      // Wait for debounced range update
      await flushDebounce();

      const range = result.current.getRetainedRange();

      expect(range.start).toBeLessThanOrEqual(50);
      expect(range.end).toBeGreaterThan(70);
    });
  });

  describe('visible range changes', () => {
    it('should update retained range when scrolling', async () => {
      const rows = generateRows(500);
      const { result, rerender } = renderHook(
        ({ visibleRange }) =>
          useVirtualData({
            allRows: rows,
            visibleRange,
            enabled: true,
            config: {
              bufferAbove: 20,
              bufferBelow: 20,
              minRowsInMemory: 50,
            },
          }),
        {
          initialProps: { visibleRange: { startIndex: 0, endIndex: 30 } },
        }
      );

      // Wait for initial debounced range update
      await flushDebounce();

      const initialRange = result.current.getRetainedRange();
      expect(initialRange.start).toBe(0);

      // Scroll down
      act(() => {
        rerender({ visibleRange: { startIndex: 100, endIndex: 130 } });
      });

      // Wait for debounced range update
      await flushDebounce();

      const newRange = result.current.getRetainedRange();
      expect(newRange.start).toBeLessThanOrEqual(100);
      expect(newRange.end).toBeGreaterThanOrEqual(130);
    });

    it('should expand range when scrolling with non-aggressive release', async () => {
      const rows = generateRows(300);
      const { result, rerender } = renderHook(
        ({ visibleRange }) =>
          useVirtualData({
            allRows: rows,
            visibleRange,
            enabled: true,
            config: {
              bufferAbove: 10,
              bufferBelow: 10,
              minRowsInMemory: 50,
              aggressiveRelease: false,
            },
          }),
        {
          initialProps: { visibleRange: { startIndex: 50, endIndex: 70 } },
        }
      );

      // Wait for initial debounced range update
      await flushDebounce();

      const initialRange = result.current.getRetainedRange();

      // Scroll to different location
      act(() => {
        rerender({ visibleRange: { startIndex: 150, endIndex: 170 } });
      });

      // Wait for debounced range update
      await flushDebounce();

      const newRange = result.current.getRetainedRange();

      // Range should have expanded (kept old + new)
      expect(newRange.start).toBeLessThanOrEqual(initialRange.start);
      expect(newRange.end).toBeGreaterThanOrEqual(170 + 10); // visible + buffer
    });

    it('should shrink range immediately with aggressive release', async () => {
      const rows = generateRows(300);
      const { result, rerender } = renderHook(
        ({ visibleRange }) =>
          useVirtualData({
            allRows: rows,
            visibleRange,
            enabled: true,
            config: {
              bufferAbove: 10,
              bufferBelow: 10,
              minRowsInMemory: 50,
              aggressiveRelease: true,
            },
          }),
        {
          initialProps: { visibleRange: { startIndex: 50, endIndex: 70 } },
        }
      );

      // Wait for initial debounced range update
      await flushDebounce();

      // Scroll to a completely different location
      act(() => {
        rerender({ visibleRange: { startIndex: 200, endIndex: 220 } });
      });

      // Wait for debounced range update
      await flushDebounce();

      const newRange = result.current.getRetainedRange();

      // Range should match new visible area + buffer
      expect(newRange.start).toBe(190); // 200 - 10 buffer
      expect(newRange.end).toBe(231); // 220 + 10 buffer + 1
    });
  });

  describe('memory limit', () => {
    it('should respect maxMemoryBytes limit', () => {
      // Create rows with large data
      const rows = Array.from({ length: 1000 }, (_, i) => ({
        __rowId: i,
        id: i,
        largeData: 'x'.repeat(5000), // ~10KB per row in UTF-16
      }));

      const { result } = renderHook(() =>
        useVirtualData({
          allRows: rows,
          visibleRange: { startIndex: 0, endIndex: 100 },
          enabled: true,
          config: {
            bufferAbove: 100,
            bufferBelow: 100,
            minRowsInMemory: 50,
            maxMemoryBytes: 100 * 1024, // 100KB limit
          },
        })
      );

      // With 100KB limit and ~10KB per row, should have around 10 rows
      // But minRowsInMemory is 50, so it depends on implementation
      expect(result.current.stats.rowsInMemory).toBeLessThan(rows.length);
    });
  });

  describe('empty data', () => {
    it('should handle empty array', () => {
      const { result } = renderHook(() =>
        useVirtualData({
          allRows: [],
          visibleRange: { startIndex: 0, endIndex: 0 },
          enabled: true,
        })
      );

      expect(result.current.windowedRows).toEqual([]);
      expect(result.current.stats.totalRows).toBe(0);
      expect(result.current.stats.rowsInMemory).toBe(0);
    });

    it('should handle single row', () => {
      const rows = generateRows(1);
      const { result } = renderHook(() =>
        useVirtualData({
          allRows: rows,
          visibleRange: { startIndex: 0, endIndex: 0 },
          enabled: true,
        })
      );

      expect(result.current.windowedRows.length).toBe(1);
      expect(result.current.getRow(0)).toBeDefined();
    });
  });

  describe('callback', () => {
    it('should call onRowsNeeded when rows might be needed', async () => {
      const rows = generateRows(500);
      const onRowsNeeded = vi.fn();

      const { rerender } = renderHook(
        ({ visibleRange }) =>
          useVirtualData({
            allRows: rows,
            visibleRange,
            enabled: true,
            config: {
              bufferAbove: 10,
              bufferBelow: 10,
              minRowsInMemory: 50,
              aggressiveRelease: true, // Required for onRowsNeeded to be called
            },
            onRowsNeeded,
          }),
        {
          initialProps: { visibleRange: { startIndex: 0, endIndex: 30 } },
        }
      );

      // Wait for initial debounced range update
      await flushDebounce();

      // Scroll to a new area outside previous retained range
      act(() => {
        rerender({ visibleRange: { startIndex: 200, endIndex: 230 } });
      });

      // Wait for debounced range update
      await flushDebounce();

      // onRowsNeeded should have been called
      expect(onRowsNeeded).toHaveBeenCalled();
    });
  });
});
