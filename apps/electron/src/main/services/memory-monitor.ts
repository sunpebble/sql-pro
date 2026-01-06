import { EventEmitter } from 'node:events';
import nodeProcess from 'node:process';
import v8 from 'node:v8';

/**
 * Memory thresholds configuration
 */
export interface MemoryThresholds {
  /** Warning threshold in bytes (default: 150MB) */
  warning: number;
  /** Critical threshold in bytes (default: 200MB) */
  critical: number;
  /** Heap usage percentage for warning (default: 0.7 = 70%) */
  heapWarningPercent: number;
  /** Heap usage percentage for critical (default: 0.85 = 85%) */
  heapCriticalPercent: number;
  /** Heap usage percentage for automatic GC trigger (default: 0.8 = 80%) */
  gcTriggerPercent: number;
}

/**
 * Detailed memory statistics from process.memoryUsage() and v8.getHeapStatistics()
 */
export interface MemoryStats {
  /** Process memory usage */
  process: {
    /** Resident Set Size - total memory allocated for the process */
    rss: number;
    /** Heap total - V8's memory usage for heap */
    heapTotal: number;
    /** Heap used - V8's actual heap memory used */
    heapUsed: number;
    /** Memory used by C++ objects bound to JavaScript objects */
    external: number;
    /** Memory allocated for ArrayBuffers and SharedArrayBuffers */
    arrayBuffers: number;
  };
  /** V8 heap statistics */
  heap: {
    /** Total size of the heap */
    totalHeapSize: number;
    /** Size of executable heap */
    totalHeapSizeExecutable: number;
    /** Total physical size of the heap */
    totalPhysicalSize: number;
    /** Total available heap size */
    totalAvailableSize: number;
    /** Used heap size */
    usedHeapSize: number;
    /** Heap size limit */
    heapSizeLimit: number;
    /** Amount of memory for which malloc'd memory could be released back to OS */
    mallocedMemory: number;
    /** Peak amount of malloc'd memory */
    peakMallocedMemory: number;
    /** Number of native contexts */
    numberOfNativeContexts: number;
    /** Number of detached contexts */
    numberOfDetachedContexts: number;
    /** Does the heap have weak callbacks */
    doesZapGarbage: number;
    /** External memory size */
    externalMemory: number;
  };
  /** Calculated metrics */
  metrics: {
    /** Heap usage percentage (usedHeapSize / heapSizeLimit) */
    heapUsagePercent: number;
    /** Total process memory in MB */
    totalMemoryMB: number;
    /** Used heap in MB */
    usedHeapMB: number;
    /** Available heap in MB */
    availableHeapMB: number;
  };
  /** Current timestamp */
  timestamp: number;
}

/**
 * Memory pressure level
 */
export type MemoryPressureLevel = 'normal' | 'warning' | 'critical';

/**
 * GC event with before/after stats
 */
export interface GCEvent {
  /** Whether GC was successfully triggered */
  triggered: boolean;
  /** Reason for GC trigger */
  reason: 'auto' | 'manual' | 'pressure';
  /** Memory stats before GC */
  statsBefore: MemoryStats;
  /** Memory stats after GC (if triggered) */
  statsAfter?: MemoryStats;
  /** Memory freed in bytes (if triggered) */
  freedBytes?: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * Memory event types emitted by MemoryMonitor
 */
export interface MemoryMonitorEvents {
  'memory-warning': [MemoryStats];
  'memory-critical': [MemoryStats];
  'memory-normal': [MemoryStats];
  'memory-stats': [MemoryStats];
  'gc-triggered': [GCEvent];
}

/**
 * Default memory thresholds
 */
const DEFAULT_THRESHOLDS: MemoryThresholds = {
  warning: 150 * 1024 * 1024, // 150MB
  critical: 200 * 1024 * 1024, // 200MB
  heapWarningPercent: 0.7, // 70%
  heapCriticalPercent: 0.85, // 85%
  gcTriggerPercent: 0.8, // 80% - trigger GC at this heap usage
};

/**
 * Default monitoring interval in milliseconds
 */
const DEFAULT_INTERVAL = 30_000; // 30 seconds

/**
 * MemoryMonitor service for the main process.
 * Periodically checks memory usage and emits events when thresholds are crossed.
 *
 * @example
 * ```typescript
 * import { memoryMonitor } from './memory-monitor';
 *
 * // Start monitoring with default settings
 * memoryMonitor.start();
 *
 * // Listen for memory warnings
 * memoryMonitor.on('memory-warning', (stats) => {
 *   console.log('Memory warning:', stats.metrics.totalMemoryMB, 'MB');
 * });
 *
 * // Get current usage
 * const stats = memoryMonitor.getCurrentUsage();
 * console.log('Current memory:', stats.metrics.totalMemoryMB, 'MB');
 * ```
 */
class MemoryMonitor extends EventEmitter {
  private thresholds: MemoryThresholds;
  private intervalMs: number;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastPressureLevel: MemoryPressureLevel = 'normal';
  private isMonitoring = false;
  private autoGCEnabled = true;
  private lastAutoGCTime = 0;
  private autoGCCooldownMs = 5000; // Minimum 5 seconds between auto GC triggers
  private gcStats = {
    totalGCCount: 0,
    autoGCCount: 0,
    manualGCCount: 0,
    lastGCTime: 0,
    totalFreedBytes: 0,
  };

  constructor(
    thresholds: Partial<MemoryThresholds> = {},
    intervalMs: number = DEFAULT_INTERVAL
  ) {
    super();
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    this.intervalMs = intervalMs;
  }

  /**
   * Start monitoring memory usage at the configured interval.
   * If already monitoring, this method does nothing.
   */
  start(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    // Perform initial check
    this.checkMemory();

    // Set up periodic checks
    this.intervalId = setInterval(() => {
      this.checkMemory();
    }, this.intervalMs);
  }

  /**
   * Stop monitoring memory usage.
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isMonitoring = false;
    this.lastPressureLevel = 'normal';
    this.lastAutoGCTime = 0;
  }

  /**
   * Check if the monitor is currently running.
   */
  isRunning(): boolean {
    return this.isMonitoring;
  }

  /**
   * Get current memory usage statistics.
   * This method can be called at any time, regardless of whether monitoring is active.
   */
  getCurrentUsage(): MemoryStats {
    const processMemory = nodeProcess.memoryUsage();
    const heapStats = v8.getHeapStatistics();

    const stats: MemoryStats = {
      process: {
        rss: processMemory.rss,
        heapTotal: processMemory.heapTotal,
        heapUsed: processMemory.heapUsed,
        external: processMemory.external,
        arrayBuffers: processMemory.arrayBuffers,
      },
      heap: {
        totalHeapSize: heapStats.total_heap_size,
        totalHeapSizeExecutable: heapStats.total_heap_size_executable,
        totalPhysicalSize: heapStats.total_physical_size,
        totalAvailableSize: heapStats.total_available_size,
        usedHeapSize: heapStats.used_heap_size,
        heapSizeLimit: heapStats.heap_size_limit,
        mallocedMemory: heapStats.malloced_memory,
        peakMallocedMemory: heapStats.peak_malloced_memory,
        numberOfNativeContexts: heapStats.number_of_native_contexts,
        numberOfDetachedContexts: heapStats.number_of_detached_contexts,
        doesZapGarbage: heapStats.does_zap_garbage,
        externalMemory: heapStats.external_memory,
      },
      metrics: {
        heapUsagePercent: heapStats.used_heap_size / heapStats.heap_size_limit,
        totalMemoryMB: processMemory.rss / (1024 * 1024),
        usedHeapMB: heapStats.used_heap_size / (1024 * 1024),
        availableHeapMB: heapStats.total_available_size / (1024 * 1024),
      },
      timestamp: Date.now(),
    };

    return stats;
  }

  /**
   * Get the current memory pressure level based on thresholds.
   */
  getPressureLevel(stats?: MemoryStats): MemoryPressureLevel {
    const currentStats = stats || this.getCurrentUsage();

    // Check RSS against thresholds
    if (currentStats.process.rss >= this.thresholds.critical) {
      return 'critical';
    }
    if (currentStats.process.rss >= this.thresholds.warning) {
      return 'warning';
    }

    // Check heap usage percentage
    if (
      currentStats.metrics.heapUsagePercent >=
      this.thresholds.heapCriticalPercent
    ) {
      return 'critical';
    }
    if (
      currentStats.metrics.heapUsagePercent >=
      this.thresholds.heapWarningPercent
    ) {
      return 'warning';
    }

    return 'normal';
  }

  /**
   * Update the memory thresholds.
   */
  setThresholds(thresholds: Partial<MemoryThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Get the current thresholds.
   */
  getThresholds(): MemoryThresholds {
    return { ...this.thresholds };
  }

  /**
   * Set the monitoring interval.
   * If monitoring is active, it will be restarted with the new interval.
   */
  setInterval(intervalMs: number): void {
    this.intervalMs = intervalMs;
    if (this.isMonitoring) {
      this.stop();
      this.start();
    }
  }

  /**
   * Get the current monitoring interval in milliseconds.
   */
  getInterval(): number {
    return this.intervalMs;
  }

  /**
   * Force a garbage collection if available.
   * Note: This only works if the app is started with --expose-gc flag.
   * Returns a GCEvent with details about the operation.
   */
  triggerGC(reason: 'manual' | 'pressure' = 'manual'): GCEvent {
    const statsBefore = this.getCurrentUsage();
    const timestamp = Date.now();

    const gc = (globalThis as unknown as { gc?: () => void }).gc;
    if (typeof gc === 'function') {
      gc();

      const statsAfter = this.getCurrentUsage();
      const freedBytes =
        statsBefore.heap.usedHeapSize - statsAfter.heap.usedHeapSize;

      // Update stats
      this.gcStats.totalGCCount++;
      if (reason === 'manual') {
        this.gcStats.manualGCCount++;
      }
      this.gcStats.lastGCTime = timestamp;
      if (freedBytes > 0) {
        this.gcStats.totalFreedBytes += freedBytes;
      }

      const event: GCEvent = {
        triggered: true,
        reason,
        statsBefore,
        statsAfter,
        freedBytes: freedBytes > 0 ? freedBytes : 0,
        timestamp,
      };

      this.emit('gc-triggered', event);
      return event;
    }

    const event: GCEvent = {
      triggered: false,
      reason,
      statsBefore,
      timestamp,
    };

    return event;
  }

  /**
   * Automatically trigger GC if heap usage exceeds threshold.
   * Returns the GCEvent if triggered, undefined otherwise.
   */
  private autoTriggerGC(stats: MemoryStats): GCEvent | undefined {
    if (!this.autoGCEnabled) {
      return undefined;
    }

    // Check cooldown
    const now = Date.now();
    if (now - this.lastAutoGCTime < this.autoGCCooldownMs) {
      return undefined;
    }

    // Check if heap usage exceeds GC trigger threshold
    if (stats.metrics.heapUsagePercent >= this.thresholds.gcTriggerPercent) {
      this.lastAutoGCTime = now;
      this.gcStats.autoGCCount++;

      const event = this.triggerGC('auto');
      return event;
    }

    return undefined;
  }

  /**
   * Enable or disable automatic GC triggering.
   */
  setAutoGC(enabled: boolean): void {
    this.autoGCEnabled = enabled;
  }

  /**
   * Check if automatic GC is enabled.
   */
  isAutoGCEnabled(): boolean {
    return this.autoGCEnabled;
  }

  /**
   * Set the cooldown between automatic GC triggers.
   */
  setAutoGCCooldown(cooldownMs: number): void {
    this.autoGCCooldownMs = Math.max(1000, cooldownMs); // Minimum 1 second
  }

  /**
   * Get the auto GC cooldown in milliseconds.
   */
  getAutoGCCooldown(): number {
    return this.autoGCCooldownMs;
  }

  /**
   * Get GC statistics.
   */
  getGCStats(): typeof this.gcStats {
    return { ...this.gcStats };
  }

  /**
   * Reset GC statistics.
   */
  resetGCStats(): void {
    this.gcStats = {
      totalGCCount: 0,
      autoGCCount: 0,
      manualGCCount: 0,
      lastGCTime: 0,
      totalFreedBytes: 0,
    };
  }

  /**
   * Check if GC is available (app started with --expose-gc).
   */
  isGCAvailable(): boolean {
    return (
      typeof (globalThis as unknown as { gc?: () => void }).gc === 'function'
    );
  }

  /**
   * Notify all browser windows about memory status.
   * This is useful for keeping the renderer process informed about memory pressure.
   */
  notifyWindows(channel: string, stats: MemoryStats): void {
    // Dynamically import electron to avoid issues in test environments
    import('electron')
      .then(({ BrowserWindow: BW }) => {
        const allWindows = BW.getAllWindows();
        for (const window of allWindows) {
          if (!window.isDestroyed()) {
            window.webContents.send(channel, stats);
          }
        }
      })
      .catch(() => {
        // Electron not available (e.g., in tests)
      });
  }

  /**
   * Perform a memory check and emit appropriate events.
   * Also triggers automatic GC if heap usage exceeds threshold.
   */
  private checkMemory(): void {
    const stats = this.getCurrentUsage();
    const currentLevel = this.getPressureLevel(stats);

    // Always emit stats event
    this.emit('memory-stats', stats);

    // Emit level-specific events when level changes
    if (currentLevel !== this.lastPressureLevel) {
      switch (currentLevel) {
        case 'critical':
          this.emit('memory-critical', stats);
          break;
        case 'warning':
          this.emit('memory-warning', stats);
          break;
        case 'normal':
          // Only emit normal if we're coming down from a higher level
          if (this.lastPressureLevel !== 'normal') {
            this.emit('memory-normal', stats);
          }
          break;
      }
      this.lastPressureLevel = currentLevel;
    }

    // Try to trigger automatic GC if heap usage is high
    this.autoTriggerGC(stats);
  }
}

// Export singleton instance for global access
export const memoryMonitor = new MemoryMonitor();

// Export class for testing or custom instances
export { MemoryMonitor };
