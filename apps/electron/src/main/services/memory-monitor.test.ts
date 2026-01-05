/**
 * Tests for MemoryMonitor service
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryMonitor, memoryMonitor } from './memory-monitor';

// Mock electron's BrowserWindow
vi.mock('electron', () => ({
  BrowserWindow: {
    getAllWindows: vi.fn(() => []),
  },
}));

describe('memoryMonitor', () => {
  let monitor: MemoryMonitor;

  beforeEach(() => {
    monitor = new MemoryMonitor();
    vi.useFakeTimers();
  });

  afterEach(() => {
    monitor.stop();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should create instance with default thresholds', () => {
      const thresholds = monitor.getThresholds();

      expect(thresholds.warning).toBe(150 * 1024 * 1024); // 150MB
      expect(thresholds.critical).toBe(200 * 1024 * 1024); // 200MB
      expect(thresholds.heapWarningPercent).toBe(0.7);
      expect(thresholds.heapCriticalPercent).toBe(0.85);
    });

    it('should accept custom thresholds', () => {
      const customMonitor = new MemoryMonitor({
        warning: 100 * 1024 * 1024,
        critical: 150 * 1024 * 1024,
      });

      const thresholds = customMonitor.getThresholds();
      expect(thresholds.warning).toBe(100 * 1024 * 1024);
      expect(thresholds.critical).toBe(150 * 1024 * 1024);
      customMonitor.stop();
    });

    it('should accept custom interval', () => {
      const customMonitor = new MemoryMonitor({}, 5000);
      expect(customMonitor.getInterval()).toBe(5000);
      customMonitor.stop();
    });
  });

  describe('getCurrentUsage', () => {
    it('should return detailed memory stats', () => {
      const stats = monitor.getCurrentUsage();

      // Check process memory fields
      expect(stats.process).toBeDefined();
      expect(typeof stats.process.rss).toBe('number');
      expect(typeof stats.process.heapTotal).toBe('number');
      expect(typeof stats.process.heapUsed).toBe('number');
      expect(typeof stats.process.external).toBe('number');
      expect(typeof stats.process.arrayBuffers).toBe('number');

      // Check heap fields
      expect(stats.heap).toBeDefined();
      expect(typeof stats.heap.totalHeapSize).toBe('number');
      expect(typeof stats.heap.usedHeapSize).toBe('number');
      expect(typeof stats.heap.heapSizeLimit).toBe('number');
      expect(typeof stats.heap.totalAvailableSize).toBe('number');

      // Check metrics
      expect(stats.metrics).toBeDefined();
      expect(typeof stats.metrics.heapUsagePercent).toBe('number');
      expect(typeof stats.metrics.totalMemoryMB).toBe('number');
      expect(typeof stats.metrics.usedHeapMB).toBe('number');
      expect(typeof stats.metrics.availableHeapMB).toBe('number');

      // Check timestamp
      expect(typeof stats.timestamp).toBe('number');
      expect(stats.timestamp).toBeGreaterThan(0);
    });

    it('should return positive values for all memory metrics', () => {
      const stats = monitor.getCurrentUsage();

      expect(stats.process.rss).toBeGreaterThan(0);
      expect(stats.process.heapTotal).toBeGreaterThan(0);
      expect(stats.process.heapUsed).toBeGreaterThan(0);
      expect(stats.metrics.heapUsagePercent).toBeGreaterThan(0);
      expect(stats.metrics.heapUsagePercent).toBeLessThan(1);
    });
  });

  describe('start/stop', () => {
    it('should start monitoring', () => {
      expect(monitor.isRunning()).toBe(false);
      monitor.start();
      expect(monitor.isRunning()).toBe(true);
    });

    it('should stop monitoring', () => {
      monitor.start();
      expect(monitor.isRunning()).toBe(true);
      monitor.stop();
      expect(monitor.isRunning()).toBe(false);
    });

    it('should not start multiple times', () => {
      const statsHandler = vi.fn();
      monitor.on('memory-stats', statsHandler);

      monitor.start();
      monitor.start(); // Second call should be ignored

      // Initial check on start
      expect(statsHandler).toHaveBeenCalledTimes(1);
    });

    it('should emit memory-stats on start', () => {
      const statsHandler = vi.fn();
      monitor.on('memory-stats', statsHandler);

      monitor.start();

      expect(statsHandler).toHaveBeenCalledTimes(1);
      expect(statsHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          process: expect.any(Object),
          heap: expect.any(Object),
          metrics: expect.any(Object),
          timestamp: expect.any(Number),
        })
      );
    });

    it('should emit memory-stats periodically', () => {
      const statsHandler = vi.fn();
      monitor.on('memory-stats', statsHandler);

      monitor.start();
      expect(statsHandler).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(30000); // Default interval
      expect(statsHandler).toHaveBeenCalledTimes(2);

      vi.advanceTimersByTime(30000);
      expect(statsHandler).toHaveBeenCalledTimes(3);
    });
  });

  describe('getPressureLevel', () => {
    it('should return normal for low memory usage', () => {
      const level = monitor.getPressureLevel({
        process: {
          rss: 50 * 1024 * 1024, // 50MB - below warning
          heapTotal: 40 * 1024 * 1024,
          heapUsed: 30 * 1024 * 1024,
          external: 1024,
          arrayBuffers: 1024,
        },
        heap: {
          totalHeapSize: 40 * 1024 * 1024,
          totalHeapSizeExecutable: 1024,
          totalPhysicalSize: 40 * 1024 * 1024,
          totalAvailableSize: 100 * 1024 * 1024,
          usedHeapSize: 30 * 1024 * 1024,
          heapSizeLimit: 200 * 1024 * 1024,
          mallocedMemory: 1024,
          peakMallocedMemory: 2048,
          numberOfNativeContexts: 1,
          numberOfDetachedContexts: 0,
          doesZapGarbage: 0,
          externalMemory: 1024,
        },
        metrics: {
          heapUsagePercent: 0.15, // Below warning (0.7)
          totalMemoryMB: 50,
          usedHeapMB: 30,
          availableHeapMB: 100,
        },
        timestamp: Date.now(),
      });

      expect(level).toBe('normal');
    });

    it('should return warning when RSS exceeds warning threshold', () => {
      const level = monitor.getPressureLevel({
        process: {
          rss: 160 * 1024 * 1024, // 160MB - above warning (150MB)
          heapTotal: 40 * 1024 * 1024,
          heapUsed: 30 * 1024 * 1024,
          external: 1024,
          arrayBuffers: 1024,
        },
        heap: {
          totalHeapSize: 40 * 1024 * 1024,
          totalHeapSizeExecutable: 1024,
          totalPhysicalSize: 40 * 1024 * 1024,
          totalAvailableSize: 100 * 1024 * 1024,
          usedHeapSize: 30 * 1024 * 1024,
          heapSizeLimit: 200 * 1024 * 1024,
          mallocedMemory: 1024,
          peakMallocedMemory: 2048,
          numberOfNativeContexts: 1,
          numberOfDetachedContexts: 0,
          doesZapGarbage: 0,
          externalMemory: 1024,
        },
        metrics: {
          heapUsagePercent: 0.15,
          totalMemoryMB: 160,
          usedHeapMB: 30,
          availableHeapMB: 100,
        },
        timestamp: Date.now(),
      });

      expect(level).toBe('warning');
    });

    it('should return critical when RSS exceeds critical threshold', () => {
      const level = monitor.getPressureLevel({
        process: {
          rss: 210 * 1024 * 1024, // 210MB - above critical (200MB)
          heapTotal: 40 * 1024 * 1024,
          heapUsed: 30 * 1024 * 1024,
          external: 1024,
          arrayBuffers: 1024,
        },
        heap: {
          totalHeapSize: 40 * 1024 * 1024,
          totalHeapSizeExecutable: 1024,
          totalPhysicalSize: 40 * 1024 * 1024,
          totalAvailableSize: 100 * 1024 * 1024,
          usedHeapSize: 30 * 1024 * 1024,
          heapSizeLimit: 200 * 1024 * 1024,
          mallocedMemory: 1024,
          peakMallocedMemory: 2048,
          numberOfNativeContexts: 1,
          numberOfDetachedContexts: 0,
          doesZapGarbage: 0,
          externalMemory: 1024,
        },
        metrics: {
          heapUsagePercent: 0.15,
          totalMemoryMB: 210,
          usedHeapMB: 30,
          availableHeapMB: 100,
        },
        timestamp: Date.now(),
      });

      expect(level).toBe('critical');
    });

    it('should return warning when heap usage exceeds heapWarningPercent', () => {
      const level = monitor.getPressureLevel({
        process: {
          rss: 50 * 1024 * 1024, // 50MB - below RSS warning
          heapTotal: 40 * 1024 * 1024,
          heapUsed: 30 * 1024 * 1024,
          external: 1024,
          arrayBuffers: 1024,
        },
        heap: {
          totalHeapSize: 40 * 1024 * 1024,
          totalHeapSizeExecutable: 1024,
          totalPhysicalSize: 40 * 1024 * 1024,
          totalAvailableSize: 100 * 1024 * 1024,
          usedHeapSize: 30 * 1024 * 1024,
          heapSizeLimit: 200 * 1024 * 1024,
          mallocedMemory: 1024,
          peakMallocedMemory: 2048,
          numberOfNativeContexts: 1,
          numberOfDetachedContexts: 0,
          doesZapGarbage: 0,
          externalMemory: 1024,
        },
        metrics: {
          heapUsagePercent: 0.75, // Above warning (0.7)
          totalMemoryMB: 50,
          usedHeapMB: 30,
          availableHeapMB: 100,
        },
        timestamp: Date.now(),
      });

      expect(level).toBe('warning');
    });

    it('should return critical when heap usage exceeds heapCriticalPercent', () => {
      const level = monitor.getPressureLevel({
        process: {
          rss: 50 * 1024 * 1024, // 50MB - below RSS warning
          heapTotal: 40 * 1024 * 1024,
          heapUsed: 30 * 1024 * 1024,
          external: 1024,
          arrayBuffers: 1024,
        },
        heap: {
          totalHeapSize: 40 * 1024 * 1024,
          totalHeapSizeExecutable: 1024,
          totalPhysicalSize: 40 * 1024 * 1024,
          totalAvailableSize: 100 * 1024 * 1024,
          usedHeapSize: 30 * 1024 * 1024,
          heapSizeLimit: 200 * 1024 * 1024,
          mallocedMemory: 1024,
          peakMallocedMemory: 2048,
          numberOfNativeContexts: 1,
          numberOfDetachedContexts: 0,
          doesZapGarbage: 0,
          externalMemory: 1024,
        },
        metrics: {
          heapUsagePercent: 0.9, // Above critical (0.85)
          totalMemoryMB: 50,
          usedHeapMB: 30,
          availableHeapMB: 100,
        },
        timestamp: Date.now(),
      });

      expect(level).toBe('critical');
    });
  });

  describe('threshold events', () => {
    it('should emit memory-warning when crossing warning threshold', () => {
      const warningHandler = vi.fn();
      monitor.on('memory-warning', warningHandler);

      // Mock getCurrentUsage to return high memory
      const mockStats = {
        process: {
          rss: 160 * 1024 * 1024, // Above warning
          heapTotal: 40 * 1024 * 1024,
          heapUsed: 30 * 1024 * 1024,
          external: 1024,
          arrayBuffers: 1024,
        },
        heap: {
          totalHeapSize: 40 * 1024 * 1024,
          totalHeapSizeExecutable: 1024,
          totalPhysicalSize: 40 * 1024 * 1024,
          totalAvailableSize: 100 * 1024 * 1024,
          usedHeapSize: 30 * 1024 * 1024,
          heapSizeLimit: 200 * 1024 * 1024,
          mallocedMemory: 1024,
          peakMallocedMemory: 2048,
          numberOfNativeContexts: 1,
          numberOfDetachedContexts: 0,
          doesZapGarbage: 0,
          externalMemory: 1024,
        },
        metrics: {
          heapUsagePercent: 0.15,
          totalMemoryMB: 160,
          usedHeapMB: 30,
          availableHeapMB: 100,
        },
        timestamp: Date.now(),
      };

      vi.spyOn(monitor, 'getCurrentUsage').mockReturnValue(mockStats);
      monitor.start();

      expect(warningHandler).toHaveBeenCalledTimes(1);
    });

    it('should emit memory-critical when crossing critical threshold', () => {
      const criticalHandler = vi.fn();
      monitor.on('memory-critical', criticalHandler);

      const mockStats = {
        process: {
          rss: 210 * 1024 * 1024, // Above critical
          heapTotal: 40 * 1024 * 1024,
          heapUsed: 30 * 1024 * 1024,
          external: 1024,
          arrayBuffers: 1024,
        },
        heap: {
          totalHeapSize: 40 * 1024 * 1024,
          totalHeapSizeExecutable: 1024,
          totalPhysicalSize: 40 * 1024 * 1024,
          totalAvailableSize: 100 * 1024 * 1024,
          usedHeapSize: 30 * 1024 * 1024,
          heapSizeLimit: 200 * 1024 * 1024,
          mallocedMemory: 1024,
          peakMallocedMemory: 2048,
          numberOfNativeContexts: 1,
          numberOfDetachedContexts: 0,
          doesZapGarbage: 0,
          externalMemory: 1024,
        },
        metrics: {
          heapUsagePercent: 0.15,
          totalMemoryMB: 210,
          usedHeapMB: 30,
          availableHeapMB: 100,
        },
        timestamp: Date.now(),
      };

      vi.spyOn(monitor, 'getCurrentUsage').mockReturnValue(mockStats);
      monitor.start();

      expect(criticalHandler).toHaveBeenCalledTimes(1);
    });

    it('should emit memory-normal when returning from elevated state', () => {
      const normalHandler = vi.fn();
      monitor.on('memory-normal', normalHandler);

      // First, set up warning state
      const warningStats = {
        process: {
          rss: 160 * 1024 * 1024,
          heapTotal: 40 * 1024 * 1024,
          heapUsed: 30 * 1024 * 1024,
          external: 1024,
          arrayBuffers: 1024,
        },
        heap: {
          totalHeapSize: 40 * 1024 * 1024,
          totalHeapSizeExecutable: 1024,
          totalPhysicalSize: 40 * 1024 * 1024,
          totalAvailableSize: 100 * 1024 * 1024,
          usedHeapSize: 30 * 1024 * 1024,
          heapSizeLimit: 200 * 1024 * 1024,
          mallocedMemory: 1024,
          peakMallocedMemory: 2048,
          numberOfNativeContexts: 1,
          numberOfDetachedContexts: 0,
          doesZapGarbage: 0,
          externalMemory: 1024,
        },
        metrics: {
          heapUsagePercent: 0.15,
          totalMemoryMB: 160,
          usedHeapMB: 30,
          availableHeapMB: 100,
        },
        timestamp: Date.now(),
      };

      const normalStats = {
        process: {
          rss: 50 * 1024 * 1024,
          heapTotal: 40 * 1024 * 1024,
          heapUsed: 30 * 1024 * 1024,
          external: 1024,
          arrayBuffers: 1024,
        },
        heap: {
          totalHeapSize: 40 * 1024 * 1024,
          totalHeapSizeExecutable: 1024,
          totalPhysicalSize: 40 * 1024 * 1024,
          totalAvailableSize: 100 * 1024 * 1024,
          usedHeapSize: 30 * 1024 * 1024,
          heapSizeLimit: 200 * 1024 * 1024,
          mallocedMemory: 1024,
          peakMallocedMemory: 2048,
          numberOfNativeContexts: 1,
          numberOfDetachedContexts: 0,
          doesZapGarbage: 0,
          externalMemory: 1024,
        },
        metrics: {
          heapUsagePercent: 0.15,
          totalMemoryMB: 50,
          usedHeapMB: 30,
          availableHeapMB: 100,
        },
        timestamp: Date.now(),
      };

      const getCurrentUsageSpy = vi.spyOn(monitor, 'getCurrentUsage');
      getCurrentUsageSpy.mockReturnValue(warningStats);
      monitor.start();

      // Now return to normal
      getCurrentUsageSpy.mockReturnValue(normalStats);
      vi.advanceTimersByTime(30000);

      expect(normalHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('setThresholds', () => {
    it('should update thresholds', () => {
      monitor.setThresholds({
        warning: 100 * 1024 * 1024,
        critical: 180 * 1024 * 1024,
      });

      const thresholds = monitor.getThresholds();
      expect(thresholds.warning).toBe(100 * 1024 * 1024);
      expect(thresholds.critical).toBe(180 * 1024 * 1024);
    });

    it('should preserve unchanged thresholds', () => {
      const original = monitor.getThresholds();
      monitor.setThresholds({ warning: 100 * 1024 * 1024 });

      const updated = monitor.getThresholds();
      expect(updated.warning).toBe(100 * 1024 * 1024);
      expect(updated.critical).toBe(original.critical);
      expect(updated.heapWarningPercent).toBe(original.heapWarningPercent);
    });
  });

  describe('setInterval', () => {
    it('should update interval', () => {
      monitor.setInterval(5000);
      expect(monitor.getInterval()).toBe(5000);
    });

    it('should restart monitoring with new interval if running', () => {
      const statsHandler = vi.fn();
      monitor.on('memory-stats', statsHandler);
      monitor.start();

      expect(statsHandler).toHaveBeenCalledTimes(1);

      // Change interval to 5 seconds
      monitor.setInterval(5000);

      vi.advanceTimersByTime(5000);
      expect(statsHandler).toHaveBeenCalledTimes(3); // 1 initial + 1 from restart + 1 from new interval
    });
  });

  describe('triggerGC', () => {
    it('should return false when gc is not available', () => {
      const result = monitor.triggerGC();
      expect(result).toBe(false);
    });

    it('should return true and call gc when available', () => {
      const mockGc = vi.fn();
      (globalThis as unknown as { gc: () => void }).gc = mockGc;

      const result = monitor.triggerGC();

      expect(result).toBe(true);
      expect(mockGc).toHaveBeenCalled();

      delete (globalThis as unknown as { gc?: () => void }).gc;
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(memoryMonitor).toBeInstanceOf(MemoryMonitor);
    });

    it('should be the same instance on multiple imports', async () => {
      const { memoryMonitor: secondImport } = await import('./memory-monitor');
      expect(memoryMonitor).toBe(secondImport);
    });
  });
});
