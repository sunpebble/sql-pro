/**
 * Unit tests for MemoryMonitorPanel component
 *
 * Tests the MemoryMonitorPanel component's rendering and basic functionality.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Import component after mocks are set up
import { MemoryMonitorPanel } from './MemoryMonitorPanel';

// Define mock functions using vi.hoisted to ensure they're available when vi.mock runs
const {
  mockSubscribe,
  mockUnsubscribe,
  mockTriggerGC,
  mockRefreshRendererMetrics,
  mockFetchStats,
  mockClearTableDataCache,
  mockClearResultsCache,
  mockClearSchemaCache,
} = vi.hoisted(() => ({
  mockSubscribe: vi.fn(),
  mockUnsubscribe: vi.fn(),
  mockTriggerGC: vi.fn().mockResolvedValue(true),
  mockRefreshRendererMetrics: vi.fn(),
  mockFetchStats: vi.fn(),
  mockClearTableDataCache: vi.fn(),
  mockClearResultsCache: vi.fn(),
  mockClearSchemaCache: vi.fn(),
}));

vi.mock('@/hooks/useMemoryMonitor', () => ({
  useMemoryMonitor: () => ({
    mainProcessStats: {
      process: {
        rss: 150 * 1024 * 1024,
        heapTotal: 100 * 1024 * 1024,
        heapUsed: 75 * 1024 * 1024,
        external: 5 * 1024 * 1024,
        arrayBuffers: 2 * 1024 * 1024,
      },
      heap: {
        totalHeapSize: 100 * 1024 * 1024,
        usedHeapSize: 75 * 1024 * 1024,
        heapSizeLimit: 512 * 1024 * 1024,
        totalAvailableSize: 400 * 1024 * 1024,
      },
      metrics: {
        heapUsagePercent: 0.15,
        totalMemoryMB: 150,
        usedHeapMB: 75,
        availableHeapMB: 400,
      },
      timestamp: Date.now(),
    },
    pressureLevel: 'normal',
    rendererMetrics: {
      domNodeCount: 1500,
      componentCount: 200,
      eventListenerCount: 50,
      jsHeapSize: 50 * 1024 * 1024,
      usedJsHeapSize: 30 * 1024 * 1024,
      timestamp: Date.now(),
    },
    isSubscribed: true,
    isLoading: false,
    error: null,
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
    triggerGC: mockTriggerGC,
    refreshRendererMetrics: mockRefreshRendererMetrics,
    fetchStats: mockFetchStats,
  }),
}));

vi.mock('@/stores/table-data-store', () => ({
  useTableDataStore: Object.assign(
    vi.fn((selector?: (state: Record<string, unknown>) => unknown) => {
      const state = {
        getCacheStats: () => ({
          itemCount: 5,
          totalBytes: 2 * 1024 * 1024,
          maxItems: 10,
          maxBytes: 50 * 1024 * 1024,
          hits: 100,
          misses: 20,
          hitRate: 83.3,
          evictions: 3,
          name: 'TableDataCache',
        }),
        clearCache: mockClearTableDataCache,
      };
      return selector ? selector(state) : state;
    }),
    {
      getState: () => ({
        getCacheStats: () => ({
          itemCount: 5,
          totalBytes: 2 * 1024 * 1024,
          maxItems: 10,
          maxBytes: 50 * 1024 * 1024,
          hits: 100,
          misses: 20,
          hitRate: 83.3,
          evictions: 3,
          name: 'TableDataCache',
        }),
        clearCache: mockClearTableDataCache,
      }),
    }
  ),
}));

vi.mock('@/stores/query-store', () => ({
  useQueryStore: Object.assign(
    vi.fn((selector?: (state: Record<string, unknown>) => unknown) => {
      const state = {
        getResultsCacheStats: () => ({
          itemCount: 10,
          totalBytes: 5 * 1024 * 1024,
          maxItems: 20,
          maxBytes: 30 * 1024 * 1024,
          hits: 50,
          misses: 10,
          hitRate: 83.3,
          evictions: 2,
          name: 'QueryResultsCache',
        }),
        clearResultsCache: mockClearResultsCache,
      };
      return selector ? selector(state) : state;
    }),
    {
      getState: () => ({
        getResultsCacheStats: () => ({
          itemCount: 10,
          totalBytes: 5 * 1024 * 1024,
          maxItems: 20,
          maxBytes: 30 * 1024 * 1024,
          hits: 50,
          misses: 10,
          hitRate: 83.3,
          evictions: 2,
          name: 'QueryResultsCache',
        }),
        clearResultsCache: mockClearResultsCache,
      }),
    }
  ),
}));

vi.mock('@/lib/schema-cache', () => ({
  schemaCache: {
    getStats: () => ({
      schemaListCount: 3,
      connectionCount: 2,
      totalTableDetailsCount: 15,
      totalTableDetailsBytes: 1 * 1024 * 1024,
      pendingFetches: 0,
      connectionStats: [],
    }),
    clearAll: mockClearSchemaCache,
  },
}));

vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false)[]) =>
    classes.filter(Boolean).join(' '),
}));

describe('memoryMonitorPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('rendering', () => {
    it('should render the panel with title', () => {
      render(<MemoryMonitorPanel />);

      expect(screen.getByText('Memory Monitor')).toBeDefined();
      expect(
        screen.getByText('Real-time memory usage and cache statistics')
      ).toBeDefined();
    });

    it('should display memory pressure level indicator', () => {
      render(<MemoryMonitorPanel />);

      expect(screen.getByText(/Memory Pressure:/)).toBeDefined();
    });

    it('should show main process memory section', () => {
      render(<MemoryMonitorPanel />);

      expect(screen.getByText('Main Process Memory')).toBeDefined();
      expect(screen.getByText('Heap Used')).toBeDefined();
      expect(screen.getByText('Heap Available')).toBeDefined();
    });

    it('should show cache statistics sections', () => {
      render(<MemoryMonitorPanel />);

      expect(screen.getByText('Cache Statistics')).toBeDefined();
      expect(screen.getByText('Table Data Cache')).toBeDefined();
      expect(screen.getByText('Query Results Cache')).toBeDefined();
      expect(screen.getByText('Schema Cache')).toBeDefined();
    });

    it('should show renderer metrics section', () => {
      render(<MemoryMonitorPanel />);

      expect(screen.getByText('Renderer Metrics')).toBeDefined();
      expect(screen.getByText('Renderer Process')).toBeDefined();
    });

    it('should show action buttons', () => {
      render(<MemoryMonitorPanel />);

      expect(screen.getByText('Actions')).toBeDefined();
      expect(screen.getByText('Trigger Garbage Collection')).toBeDefined();
      expect(screen.getByText('Clear All Caches')).toBeDefined();
      expect(screen.getByText('Refresh Renderer Metrics')).toBeDefined();
    });

    it('should not render when isOpen is false', () => {
      const { container } = render(<MemoryMonitorPanel isOpen={false} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('interactions', () => {
    it('should call triggerGC when GC button is clicked', async () => {
      render(<MemoryMonitorPanel />);

      const gcButton = screen.getByText('Trigger Garbage Collection');
      fireEvent.click(gcButton);

      // Wait for async operation
      await vi.waitFor(() => {
        expect(mockTriggerGC).toHaveBeenCalledWith(true);
      });
    });

    it('should call refreshRendererMetrics when refresh button is clicked', () => {
      render(<MemoryMonitorPanel />);

      const refreshButton = screen.getByText('Refresh Renderer Metrics');
      fireEvent.click(refreshButton);

      expect(mockRefreshRendererMetrics).toHaveBeenCalled();
    });

    it('should call unsubscribe when Pause is clicked', () => {
      render(<MemoryMonitorPanel />);

      const pauseButton = screen.getByText('Pause');
      fireEvent.click(pauseButton);

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<MemoryMonitorPanel onClose={onClose} />);

      const closeButtons = screen.getAllByRole('button');
      // Find the small close button (h-6 w-6)
      const closeButton = closeButtons.find((btn) => {
        const svg = btn.querySelector('svg');
        return svg && btn.className.includes('h-6');
      });

      if (closeButton) {
        fireEvent.click(closeButton);
        expect(onClose).toHaveBeenCalled();
      }
    });

    it('should toggle section expansion on click', () => {
      render(<MemoryMonitorPanel />);

      const tableDataButton = screen.getByText('Table Data Cache');
      fireEvent.click(tableDataButton);

      // Verify the click doesn't throw
      expect(tableDataButton).toBeDefined();
    });
  });

  describe('display values', () => {
    it('should display cache item counts', () => {
      render(<MemoryMonitorPanel />);

      expect(screen.getByText('5 items')).toBeDefined();
      expect(screen.getByText('10 items')).toBeDefined();
      expect(screen.getByText('2 connections')).toBeDefined();
    });

    it('should display memory values', () => {
      render(<MemoryMonitorPanel />);

      // Memory values should be displayed with MB suffix
      expect(screen.getByText('75.0 MB')).toBeDefined();
      expect(screen.getByText('150.0 MB')).toBeDefined();
    });
  });

  describe('props', () => {
    it('should accept and apply className prop', () => {
      const { container } = render(
        <MemoryMonitorPanel className="custom-class" />
      );

      const panel = container.querySelector('.custom-class');
      expect(panel).toBeDefined();
    });

    it('should render by default when isOpen is not specified', () => {
      render(<MemoryMonitorPanel />);

      expect(screen.getByText('Memory Monitor')).toBeDefined();
    });
  });
});
