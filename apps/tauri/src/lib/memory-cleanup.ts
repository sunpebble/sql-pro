/**
 * Memory Cleanup Service for Renderer Process
 *
 * Provides structured cleanup utilities for the renderer process to:
 * - Clear old stores and caches
 * - Detach event listeners
 * - Release references to large objects
 * - Coordinate cleanup across different components
 *
 * This complements the main process GC trigger by performing
 * application-level cleanup that V8's GC cannot do automatically.
 */

import type { MemoryPressureLevel, MemoryStats } from '@shared/types';
import { schemaCache } from '@/lib/schema-cache';
import { useQueryStore } from '@/stores/query-store';
import { useTableDataStore } from '@/stores/table-data-store';

/**
 * Cleanup event type
 */
export type CleanupReason =
  | 'pressure-warning'
  | 'pressure-critical'
  | 'manual'
  | 'connection-close'
  | 'idle';

/**
 * Cleanup result
 */
export interface CleanupResult {
  /** Cleanup reason */
  reason: CleanupReason;
  /** Whether cleanup was performed */
  performed: boolean;
  /** Components that were cleaned */
  cleanedComponents: string[];
  /** Timestamp */
  timestamp: number;
}

/**
 * Cleanup handler type
 */
export type CleanupHandler = (reason: CleanupReason) => void;

/**
 * Memory Cleanup Manager
 *
 * Coordinates cleanup across different components in the renderer.
 */
class MemoryCleanupManager {
  private handlers = new Set<CleanupHandler>();
  private lastCleanupTime = 0;
  private cleanupCooldownMs = 3000; // Minimum 3 seconds between cleanups
  private isCleaningUp = false;

  /**
   * Register a cleanup handler.
   * Returns an unsubscribe function.
   */
  onCleanup(handler: CleanupHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  /**
   * Perform cleanup based on memory pressure level.
   * Returns a CleanupResult with details about what was cleaned.
   */
  performCleanup(reason: CleanupReason): CleanupResult {
    const now = Date.now();
    const cleanedComponents: string[] = [];

    // Check cooldown (except for critical pressure and connection close)
    if (
      reason !== 'pressure-critical' &&
      reason !== 'connection-close' &&
      now - this.lastCleanupTime < this.cleanupCooldownMs
    ) {
      return {
        reason,
        performed: false,
        cleanedComponents: [],
        timestamp: now,
      };
    }

    // Prevent re-entry
    if (this.isCleaningUp) {
      return {
        reason,
        performed: false,
        cleanedComponents: [],
        timestamp: now,
      };
    }

    this.isCleaningUp = true;
    this.lastCleanupTime = now;

    try {
      // Clean table data cache
      try {
        const tableDataStore = useTableDataStore.getState();
        const beforeStats = tableDataStore.getCacheStats();
        if (beforeStats.itemCount > 0) {
          tableDataStore.clearCache();
          cleanedComponents.push('table-data-cache');
        }
      } catch {
        // Store might not be initialized
      }

      // Clean query results cache
      try {
        const queryStore = useQueryStore.getState();
        const beforeStats = queryStore.getResultsCacheStats();
        if (beforeStats.itemCount > 0) {
          queryStore.clearResultsCache();
          cleanedComponents.push('query-results-cache');
        }
      } catch {
        // Store might not be initialized
      }

      // Clean schema cache (only on critical or manual)
      if (reason === 'pressure-critical' || reason === 'manual') {
        try {
          const beforeStats = schemaCache.getStats();
          if (beforeStats.totalTableDetailsCount > 0) {
            schemaCache.clearAll();
            cleanedComponents.push('schema-cache');
          }
        } catch {
          // Cache might not be initialized
        }
      }

      // Notify all registered handlers
      for (const handler of this.handlers) {
        try {
          handler(reason);
        } catch {
          // Ignore handler errors
        }
      }

      return {
        reason,
        performed: true,
        cleanedComponents,
        timestamp: now,
      };
    } finally {
      this.isCleaningUp = false;
    }
  }

  /**
   * Clean up resources for a specific connection.
   */
  cleanupConnection(connectionId: string): CleanupResult {
    const now = Date.now();
    const cleanedComponents: string[] = [];

    try {
      // Remove table data for connection
      try {
        const tableDataStore = useTableDataStore.getState();
        tableDataStore.removeConnectionData(connectionId);
        cleanedComponents.push('table-data-store');
      } catch {
        // Store might not be initialized
      }

      // Remove query results for connection
      try {
        const queryStore = useQueryStore.getState();
        queryStore.removeConnectionResults(connectionId);
        cleanedComponents.push('query-store');
      } catch {
        // Store might not be initialized
      }

      // Clear schema cache for connection
      try {
        schemaCache.clearConnection(connectionId);
        cleanedComponents.push('schema-cache');
      } catch {
        // Cache might not be initialized
      }

      return {
        reason: 'connection-close',
        performed: true,
        cleanedComponents,
        timestamp: now,
      };
    } catch {
      return {
        reason: 'connection-close',
        performed: false,
        cleanedComponents: [],
        timestamp: now,
      };
    }
  }

  /**
   * Handle memory pressure change from main process.
   */
  handlePressureChange(
    previousLevel: MemoryPressureLevel,
    currentLevel: MemoryPressureLevel,
    _stats: MemoryStats
  ): CleanupResult | undefined {
    // Only clean up when escalating to warning or critical
    if (currentLevel === 'warning' && previousLevel === 'normal') {
      return this.performCleanup('pressure-warning');
    }

    if (currentLevel === 'critical') {
      return this.performCleanup('pressure-critical');
    }

    return undefined;
  }

  /**
   * Set the cleanup cooldown in milliseconds.
   */
  setCooldown(cooldownMs: number): void {
    this.cleanupCooldownMs = Math.max(1000, cooldownMs); // Minimum 1 second
  }

  /**
   * Get the cleanup cooldown in milliseconds.
   */
  getCooldown(): number {
    return this.cleanupCooldownMs;
  }

  /**
   * Get the timestamp of the last cleanup.
   */
  getLastCleanupTime(): number {
    return this.lastCleanupTime;
  }

  /**
   * Reset state (useful for testing).
   */
  reset(): void {
    this.handlers.clear();
    this.lastCleanupTime = 0;
    this.isCleaningUp = false;
  }
}

/** Singleton instance */
export const memoryCleanup = new MemoryCleanupManager();

/**
 * Request garbage collection from main process.
 * This is a convenience wrapper around the IPC call.
 */
export async function requestGC(force = false): Promise<{
  success: boolean;
  gcTriggered: boolean;
  statsAfterGC?: MemoryStats;
  error?: string;
}> {
  try {
    if (typeof window !== 'undefined' && window.sqlPro?.memory) {
      const result = await window.sqlPro.memory.triggerGC({ force });
      return {
        success: result.success,
        gcTriggered: result.gcTriggered ?? false,
        statsAfterGC: result.statsAfterGC,
        error: result.error,
      };
    }
    return {
      success: false,
      gcTriggered: false,
      error: 'Memory API not available',
    };
  } catch (err) {
    return {
      success: false,
      gcTriggered: false,
      error: err instanceof Error ? err.message : 'Failed to trigger GC',
    };
  }
}

/**
 * Perform a full cleanup cycle:
 * 1. Clean renderer caches/stores
 * 2. Request GC from main process
 *
 * Returns the cleanup result and GC status.
 */
export async function performFullCleanup(): Promise<{
  cleanupResult: CleanupResult;
  gcResult: {
    success: boolean;
    gcTriggered: boolean;
    error?: string;
  };
}> {
  // First, clean renderer resources
  const cleanupResult = memoryCleanup.performCleanup('manual');

  // Then request GC from main process
  const gcResult = await requestGC(true);

  return {
    cleanupResult,
    gcResult,
  };
}

// Export the manager class for testing
export { MemoryCleanupManager };
