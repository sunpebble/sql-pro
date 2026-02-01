/**
 * Memory Monitor Service
 *
 * Monitors memory usage and detects potential memory leaks.
 */

import process from 'node:process';
import { getLogger } from '../logger';

export interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  rss: number;
  timestamp: Date;
}

export interface MemoryThresholds {
  heapUsedWarning: number; // Percentage (0-100)
  heapUsedCritical: number; // Percentage (0-100)
  rssWarning: number; // Bytes
}

export interface MemoryMonitorOptions {
  interval?: number; // Check interval in ms (default: 30000)
  thresholds?: Partial<MemoryThresholds>;
  onWarning?: (metrics: MemoryMetrics, message: string) => void;
  onCritical?: (metrics: MemoryMetrics, message: string) => void;
}

const DEFAULT_THRESHOLDS: MemoryThresholds = {
  heapUsedWarning: 70,
  heapUsedCritical: 90,
  rssWarning: 1024 * 1024 * 1024, // 1GB
};

export class MemoryMonitor {
  private interval: number;
  private thresholds: MemoryThresholds;
  private timer: NodeJS.Timeout | null = null;
  private history: MemoryMetrics[] = [];
  private maxHistorySize = 100;
  private onWarning?: (metrics: MemoryMetrics, message: string) => void;
  private onCritical?: (metrics: MemoryMetrics, message: string) => void;

  constructor(options: MemoryMonitorOptions = {}) {
    this.interval = options.interval ?? 30000;
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...options.thresholds };
    this.onWarning = options.onWarning;
    this.onCritical = options.onCritical;
  }

  start(): void {
    if (this.timer) return;

    this.check(); // Initial check
    this.timer = setInterval(() => this.check(), this.interval);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  getMetrics(): MemoryMetrics {
    const mem = process.memoryUsage();
    return {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
      arrayBuffers: mem.arrayBuffers,
      rss: mem.rss,
      timestamp: new Date(),
    };
  }

  getHistory(): MemoryMetrics[] {
    return [...this.history];
  }

  private check(): void {
    const metrics = this.getMetrics();
    this.history.push(metrics);

    // Trim history
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }

    const heapPercentage = (metrics.heapUsed / metrics.heapTotal) * 100;

    try {
      const logger = getLogger().child('memory');

      // Check thresholds
      if (heapPercentage >= this.thresholds.heapUsedCritical) {
        const message = `Critical: Heap usage at ${heapPercentage.toFixed(1)}%`;
        logger.error(message, { metrics });
        this.onCritical?.(metrics, message);
      } else if (heapPercentage >= this.thresholds.heapUsedWarning) {
        const message = `Warning: Heap usage at ${heapPercentage.toFixed(1)}%`;
        logger.warn(message, { metrics });
        this.onWarning?.(metrics, message);
      }

      if (metrics.rss >= this.thresholds.rssWarning) {
        const rssGB = (metrics.rss / (1024 * 1024 * 1024)).toFixed(2);
        const message = `Warning: RSS at ${rssGB}GB`;
        logger.warn(message, { metrics });
        this.onWarning?.(metrics, message);
      }

      // Detect potential memory leak (continuous growth)
      if (this.history.length >= 10) {
        const recentHistory = this.history.slice(-10);
        const isGrowing = recentHistory.every((m, i) => {
          if (i === 0) return true;
          return m.heapUsed > recentHistory[i - 1].heapUsed;
        });

        if (isGrowing) {
          const growthRate =
            ((recentHistory[recentHistory.length - 1].heapUsed -
              recentHistory[0].heapUsed) /
              recentHistory[0].heapUsed) *
            100;

          if (growthRate > 20) {
            const message = `Potential memory leak detected: ${growthRate.toFixed(1)}% growth over last ${(10 * this.interval) / 1000}s`;
            logger.warn(message, { metrics, growthRate });
            this.onWarning?.(metrics, message);
          }
        }
      }
    } catch {
      // Logger not initialized yet, skip logging
    }
  }

  forceGC(): void {
    if (globalThis.gc) {
      globalThis.gc();
    }
  }
}

// Singleton instance
let monitor: MemoryMonitor | null = null;

export function initializeMemoryMonitor(
  options?: MemoryMonitorOptions
): MemoryMonitor {
  monitor = new MemoryMonitor(options);
  return monitor;
}

export function getMemoryMonitor(): MemoryMonitor {
  if (!monitor) {
    throw new Error(
      'MemoryMonitor not initialized. Call initializeMemoryMonitor first.'
    );
  }
  return monitor;
}

export function memoryMonitor(): MemoryMonitor {
  return getMemoryMonitor();
}
