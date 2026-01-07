/**
 * Tests for useMemoryMonitor hook
 */
import type {
  MemoryPressureChangeEvent,
  MemoryPressureLevel,
  MemoryStats,
  MemoryStatsUpdateEvent,
} from '@shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Import after mocking
import { sqlPro } from '@/lib/api';
import { useMemoryMonitor } from './useMemoryMonitor';

// Mock the api module
vi.mock('@/lib/api', () => ({
  sqlPro: {
    memory: {
      getStats: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      triggerGC: vi.fn(),
      onStatsUpdate: vi.fn(),
      onPressureChange: vi.fn(),
    },
  },
}));

const mockMemoryStats: MemoryStats = {
  process: {
    rss: 100 * 1024 * 1024,
    heapTotal: 80 * 1024 * 1024,
    heapUsed: 60 * 1024 * 1024,
    external: 1024,
    arrayBuffers: 2048,
  },
  heap: {
    totalHeapSize: 80 * 1024 * 1024,
    totalHeapSizeExecutable: 1024,
    totalPhysicalSize: 80 * 1024 * 1024,
    totalAvailableSize: 120 * 1024 * 1024,
    usedHeapSize: 60 * 1024 * 1024,
    heapSizeLimit: 200 * 1024 * 1024,
    mallocedMemory: 1024,
    peakMallocedMemory: 2048,
    numberOfNativeContexts: 1,
    numberOfDetachedContexts: 0,
    doesZapGarbage: 0,
    externalMemory: 1024,
  },
  metrics: {
    heapUsagePercent: 0.3,
    totalMemoryMB: 100,
    usedHeapMB: 60,
    availableHeapMB: 120,
  },
  timestamp: Date.now(),
};

describe('useMemoryMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Set up default mock implementations
    vi.mocked(sqlPro.memory.getStats).mockResolvedValue({
      success: true,
      stats: mockMemoryStats,
      pressureLevel: 'normal' as MemoryPressureLevel,
    });

    vi.mocked(sqlPro.memory.subscribe).mockResolvedValue({
      success: true,
      subscriptionId: 'test-subscription-123',
    });

    vi.mocked(sqlPro.memory.unsubscribe).mockResolvedValue({
      success: true,
    });

    vi.mocked(sqlPro.memory.triggerGC).mockResolvedValue({
      success: true,
      gcTriggered: true,
      statsAfterGC: mockMemoryStats,
    });

    vi.mocked(sqlPro.memory.onStatsUpdate).mockReturnValue(vi.fn());
    vi.mocked(sqlPro.memory.onPressureChange).mockReturnValue(vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should return initial state correctly', () => {
      const { result } = renderHook(() => useMemoryMonitor());

      expect(result.current.mainProcessStats).toBeNull();
      expect(result.current.pressureLevel).toBe('normal');
      expect(result.current.isSubscribed).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should have renderer metrics with DOM node count', () => {
      const { result } = renderHook(() => useMemoryMonitor());

      expect(result.current.rendererMetrics).toBeDefined();
      expect(typeof result.current.rendererMetrics.domNodeCount).toBe('number');
      expect(typeof result.current.rendererMetrics.componentCount).toBe(
        'number'
      );
      expect(typeof result.current.rendererMetrics.eventListenerCount).toBe(
        'number'
      );
      expect(typeof result.current.rendererMetrics.timestamp).toBe('number');
    });
  });

  describe('fetchStats', () => {
    it('should fetch stats from main process', async () => {
      const { result } = renderHook(() => useMemoryMonitor());

      await act(async () => {
        await result.current.fetchStats();
      });

      expect(sqlPro.memory.getStats).toHaveBeenCalled();
      expect(result.current.mainProcessStats).toEqual(mockMemoryStats);
      expect(result.current.pressureLevel).toBe('normal');
    });

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: unknown) => void;
      vi.mocked(sqlPro.memory.getStats).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );

      const { result } = renderHook(() => useMemoryMonitor());

      // Start fetch
      let fetchPromise: Promise<void>;
      act(() => {
        fetchPromise = result.current.fetchStats();
      });

      // Check loading state
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!({
          success: true,
          stats: mockMemoryStats,
          pressureLevel: 'normal',
        });
        await fetchPromise!;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle fetch errors', async () => {
      vi.mocked(sqlPro.memory.getStats).mockResolvedValue({
        success: false,
        error: 'Failed to get stats',
      });

      const { result } = renderHook(() => useMemoryMonitor());

      await act(async () => {
        await result.current.fetchStats();
      });

      expect(result.current.error).toBe('Failed to get stats');
      expect(result.current.mainProcessStats).toBeNull();
    });
  });

  describe('subscribe', () => {
    it('should subscribe to memory updates', async () => {
      const { result } = renderHook(() => useMemoryMonitor());

      await act(async () => {
        await result.current.subscribe();
      });

      expect(sqlPro.memory.subscribe).toHaveBeenCalled();
      expect(result.current.isSubscribed).toBe(true);
    });

    it('should set up event listeners on subscribe', async () => {
      const { result } = renderHook(() => useMemoryMonitor());

      await act(async () => {
        await result.current.subscribe();
      });

      expect(sqlPro.memory.onStatsUpdate).toHaveBeenCalled();
      expect(sqlPro.memory.onPressureChange).toHaveBeenCalled();
    });

    it('should not subscribe multiple times', async () => {
      const { result } = renderHook(() => useMemoryMonitor());

      await act(async () => {
        await result.current.subscribe();
      });

      await act(async () => {
        await result.current.subscribe();
      });

      expect(sqlPro.memory.subscribe).toHaveBeenCalledTimes(1);
    });

    it('should handle subscribe errors', async () => {
      vi.mocked(sqlPro.memory.subscribe).mockResolvedValue({
        success: false,
        error: 'Subscription failed',
      });

      const { result } = renderHook(() => useMemoryMonitor());

      await act(async () => {
        await result.current.subscribe();
      });

      expect(result.current.error).toBe('Subscription failed');
      expect(result.current.isSubscribed).toBe(false);
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe from memory updates', async () => {
      const { result } = renderHook(() => useMemoryMonitor());

      await act(async () => {
        await result.current.subscribe();
      });

      expect(result.current.isSubscribed).toBe(true);

      await act(async () => {
        await result.current.unsubscribe();
      });

      expect(sqlPro.memory.unsubscribe).toHaveBeenCalledWith({
        subscriptionId: 'test-subscription-123',
      });
      expect(result.current.isSubscribed).toBe(false);
    });

    it('should do nothing if not subscribed', async () => {
      const { result } = renderHook(() => useMemoryMonitor());

      await act(async () => {
        await result.current.unsubscribe();
      });

      expect(sqlPro.memory.unsubscribe).not.toHaveBeenCalled();
    });
  });

  describe('triggerGC', () => {
    it('should trigger GC and return true on success', async () => {
      const { result } = renderHook(() => useMemoryMonitor());

      let gcResult: boolean;
      await act(async () => {
        gcResult = await result.current.triggerGC(true);
      });

      expect(gcResult!).toBe(true);
      expect(sqlPro.memory.triggerGC).toHaveBeenCalledWith({ force: true });
    });

    it('should update stats after GC', async () => {
      const { result } = renderHook(() => useMemoryMonitor());

      await act(async () => {
        await result.current.triggerGC(true);
      });

      expect(result.current.mainProcessStats).toEqual(mockMemoryStats);
    });

    it('should return false when GC not triggered', async () => {
      vi.mocked(sqlPro.memory.triggerGC).mockResolvedValue({
        success: true,
        gcTriggered: false,
        error: 'GC not available',
      });

      const { result } = renderHook(() => useMemoryMonitor());

      let gcResult: boolean;
      await act(async () => {
        gcResult = await result.current.triggerGC();
      });

      expect(gcResult!).toBe(false);
      expect(result.current.error).toBe('GC not available');
    });

    it('should handle GC errors', async () => {
      vi.mocked(sqlPro.memory.triggerGC).mockRejectedValue(
        new Error('GC failed')
      );

      const { result } = renderHook(() => useMemoryMonitor());

      let gcResult: boolean;
      await act(async () => {
        gcResult = await result.current.triggerGC();
      });

      expect(gcResult!).toBe(false);
      expect(result.current.error).toBe('GC failed');
    });
  });

  describe('autoSubscribe', () => {
    it('should auto-subscribe when autoSubscribe option is true', async () => {
      // Use real timers for this test since we're using waitFor
      vi.useRealTimers();

      const { result } = renderHook(() =>
        useMemoryMonitor({ autoSubscribe: true })
      );

      await waitFor(() => {
        expect(result.current.isSubscribed).toBe(true);
      });

      expect(sqlPro.memory.subscribe).toHaveBeenCalled();

      // Restore fake timers for other tests
      vi.useFakeTimers();
    });

    it('should not auto-subscribe when autoSubscribe option is false', () => {
      const { result } = renderHook(() =>
        useMemoryMonitor({ autoSubscribe: false })
      );

      expect(result.current.isSubscribed).toBe(false);
      expect(sqlPro.memory.subscribe).not.toHaveBeenCalled();
    });
  });

  describe('callbacks', () => {
    it('should call onStatsUpdate callback when stats are updated', async () => {
      const onStatsUpdate = vi.fn();
      let statsCallback: (event: MemoryStatsUpdateEvent) => void;

      vi.mocked(sqlPro.memory.onStatsUpdate).mockImplementation((callback) => {
        statsCallback = callback;
        return vi.fn();
      });

      const { result } = renderHook(() => useMemoryMonitor({ onStatsUpdate }));

      await act(async () => {
        await result.current.subscribe();
      });

      const updateEvent: MemoryStatsUpdateEvent = {
        stats: mockMemoryStats,
        pressureLevel: 'normal',
      };

      act(() => {
        statsCallback(updateEvent);
      });

      expect(onStatsUpdate).toHaveBeenCalledWith(updateEvent);
    });

    it('should call onPressureChange callback when pressure level changes', async () => {
      const onPressureChange = vi.fn();
      let pressureCallback: (event: MemoryPressureChangeEvent) => void;

      vi.mocked(sqlPro.memory.onPressureChange).mockImplementation(
        (callback) => {
          pressureCallback = callback;
          return vi.fn();
        }
      );

      const { result } = renderHook(() =>
        useMemoryMonitor({ onPressureChange })
      );

      await act(async () => {
        await result.current.subscribe();
      });

      const pressureEvent: MemoryPressureChangeEvent = {
        previousLevel: 'normal',
        currentLevel: 'warning',
        stats: mockMemoryStats,
      };

      act(() => {
        pressureCallback(pressureEvent);
      });

      expect(onPressureChange).toHaveBeenCalledWith(pressureEvent);
      expect(result.current.pressureLevel).toBe('warning');
    });
  });

  describe('refreshRendererMetrics', () => {
    it('should update renderer metrics when called', () => {
      const { result } = renderHook(() => useMemoryMonitor());

      const originalTimestamp = result.current.rendererMetrics.timestamp;

      // Advance time and refresh
      vi.advanceTimersByTime(1000);

      act(() => {
        result.current.refreshRendererMetrics();
      });

      expect(result.current.rendererMetrics.timestamp).toBeGreaterThan(
        originalTimestamp
      );
    });
  });

  describe('cleanup', () => {
    it('should clean up on unmount', async () => {
      // Use real timers for this test since we're using waitFor
      vi.useRealTimers();

      const cleanupFn = vi.fn();
      vi.mocked(sqlPro.memory.onStatsUpdate).mockReturnValue(cleanupFn);
      vi.mocked(sqlPro.memory.onPressureChange).mockReturnValue(cleanupFn);

      const { result, unmount } = renderHook(() =>
        useMemoryMonitor({ autoSubscribe: true })
      );

      await waitFor(() => {
        expect(result.current.isSubscribed).toBe(true);
      });

      unmount();

      // Cleanup functions should be called
      expect(cleanupFn).toHaveBeenCalled();

      // Restore fake timers for other tests
      vi.useFakeTimers();
    });
  });
});
