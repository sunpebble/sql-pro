import type {
  GetMemoryStatsRequest,
  MemoryPressureChangeEvent,
  MemoryPressureLevel,
  MemoryStats,
  MemoryStatsUpdateEvent,
  MemorySubscribeRequest,
  MemoryTriggerGCRequest,
  MemoryUnsubscribeRequest,
} from '@shared/types';
import { IPC_CHANNELS } from '@shared/types';
import { BrowserWindow, ipcMain } from 'electron';
import { memoryMonitor } from '../memory-monitor';

// Track active subscriptions per window
const windowSubscriptions = new Map<number, string>();
let subscriptionCounter = 0;

/**
 * Send memory stats update to all subscribed windows
 */
function broadcastMemoryStats(stats: MemoryStats): void {
  const pressureLevel = memoryMonitor.getPressureLevel(stats);
  const event: MemoryStatsUpdateEvent = {
    stats,
    pressureLevel,
  };

  for (const windowId of windowSubscriptions.keys()) {
    const window = BrowserWindow.fromId(windowId);
    if (window && !window.isDestroyed()) {
      window.webContents.send(IPC_CHANNELS.MEMORY_STATS_UPDATE, event);
    }
  }
}

/**
 * Send pressure level change to all subscribed windows
 */
function broadcastPressureChange(
  previousLevel: MemoryPressureLevel,
  currentLevel: MemoryPressureLevel,
  stats: MemoryStats
): void {
  const event: MemoryPressureChangeEvent = {
    previousLevel,
    currentLevel,
    stats,
  };

  for (const windowId of windowSubscriptions.keys()) {
    const window = BrowserWindow.fromId(windowId);
    if (window && !window.isDestroyed()) {
      window.webContents.send(IPC_CHANNELS.MEMORY_PRESSURE_CHANGE, event);
    }
  }
}

// Track last pressure level for change detection
let lastBroadcastLevel: MemoryPressureLevel = 'normal';

/**
 * Set up memory monitoring IPC handlers
 */
export function setupMemoryHandlers(): void {
  // Handle: Get current memory stats
  ipcMain.handle(
    IPC_CHANNELS.MEMORY_GET_STATS,
    async (_event, _request?: GetMemoryStatsRequest) => {
      try {
        const stats = memoryMonitor.getCurrentUsage();
        const pressureLevel = memoryMonitor.getPressureLevel(stats);
        return {
          success: true,
          stats,
          pressureLevel,
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to get memory stats',
        };
      }
    }
  );

  // Handle: Subscribe to memory updates
  ipcMain.handle(
    IPC_CHANNELS.MEMORY_SUBSCRIBE,
    async (event, request?: MemorySubscribeRequest) => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);
        if (!window) {
          return {
            success: false,
            error: 'No window found for sender',
          };
        }

        const windowId = window.id;

        // If window already subscribed, return existing subscription
        if (windowSubscriptions.has(windowId)) {
          return {
            success: true,
            subscriptionId: windowSubscriptions.get(windowId),
          };
        }

        // Create new subscription
        const subscriptionId = `mem-sub-${++subscriptionCounter}`;
        windowSubscriptions.set(windowId, subscriptionId);

        // Start monitoring if not already running
        if (!memoryMonitor.isRunning()) {
          memoryMonitor.start();
        }

        // Set up memory stats listener if this is the first subscription
        if (windowSubscriptions.size === 1) {
          memoryMonitor.on('memory-stats', broadcastMemoryStats);

          memoryMonitor.on('memory-warning', (stats) => {
            if (lastBroadcastLevel !== 'warning') {
              broadcastPressureChange(lastBroadcastLevel, 'warning', stats);
              lastBroadcastLevel = 'warning';
            }
          });

          memoryMonitor.on('memory-critical', (stats) => {
            if (lastBroadcastLevel !== 'critical') {
              broadcastPressureChange(lastBroadcastLevel, 'critical', stats);
              lastBroadcastLevel = 'critical';
            }
          });

          memoryMonitor.on('memory-normal', (stats) => {
            if (lastBroadcastLevel !== 'normal') {
              broadcastPressureChange(lastBroadcastLevel, 'normal', stats);
              lastBroadcastLevel = 'normal';
            }
          });
        }

        // Clean up when window is closed
        window.on('closed', () => {
          windowSubscriptions.delete(windowId);

          // Stop monitoring if no more subscriptions
          if (windowSubscriptions.size === 0) {
            memoryMonitor.removeAllListeners('memory-stats');
            memoryMonitor.removeAllListeners('memory-warning');
            memoryMonitor.removeAllListeners('memory-critical');
            memoryMonitor.removeAllListeners('memory-normal');
          }
        });

        // Update interval if specified
        if (request?.intervalMs && request.intervalMs > 0) {
          memoryMonitor.setInterval(request.intervalMs);
        }

        return {
          success: true,
          subscriptionId,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to subscribe',
        };
      }
    }
  );

  // Handle: Unsubscribe from memory updates
  ipcMain.handle(
    IPC_CHANNELS.MEMORY_UNSUBSCRIBE,
    async (event, request: MemoryUnsubscribeRequest) => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);
        if (!window) {
          return {
            success: false,
            error: 'No window found for sender',
          };
        }

        const windowId = window.id;
        const existingSubscription = windowSubscriptions.get(windowId);

        if (
          !existingSubscription ||
          existingSubscription !== request.subscriptionId
        ) {
          return {
            success: false,
            error: 'Invalid subscription ID',
          };
        }

        windowSubscriptions.delete(windowId);

        // Clean up listeners if no more subscriptions
        if (windowSubscriptions.size === 0) {
          memoryMonitor.removeAllListeners('memory-stats');
          memoryMonitor.removeAllListeners('memory-warning');
          memoryMonitor.removeAllListeners('memory-critical');
          memoryMonitor.removeAllListeners('memory-normal');
        }

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to unsubscribe',
        };
      }
    }
  );

  // Handle: Trigger garbage collection
  ipcMain.handle(
    IPC_CHANNELS.MEMORY_TRIGGER_GC,
    async (_event, request?: MemoryTriggerGCRequest) => {
      try {
        const statsBefore = memoryMonitor.getCurrentUsage();
        const pressureLevel = memoryMonitor.getPressureLevel(statsBefore);

        // Only trigger GC if forced or under memory pressure
        const shouldTrigger = request?.force || pressureLevel !== 'normal';

        if (!shouldTrigger) {
          return {
            success: true,
            gcTriggered: false,
            error:
              'GC not triggered: memory pressure is normal (use force: true to override)',
          };
        }

        const gcTriggered = memoryMonitor.triggerGC();

        if (gcTriggered) {
          // Small delay to let GC complete
          await new Promise((resolve) => setTimeout(resolve, 100));
          const statsAfterGC = memoryMonitor.getCurrentUsage();
          return {
            success: true,
            gcTriggered: true,
            statsAfterGC,
          };
        }

        return {
          success: true,
          gcTriggered: false,
          error: 'GC not available (app must be started with --expose-gc flag)',
        };
      } catch (error) {
        return {
          success: false,
          gcTriggered: false,
          error:
            error instanceof Error ? error.message : 'Failed to trigger GC',
        };
      }
    }
  );
}

/**
 * Clean up memory handlers
 */
export function cleanupMemoryHandlers(): void {
  ipcMain.removeHandler(IPC_CHANNELS.MEMORY_GET_STATS);
  ipcMain.removeHandler(IPC_CHANNELS.MEMORY_SUBSCRIBE);
  ipcMain.removeHandler(IPC_CHANNELS.MEMORY_UNSUBSCRIBE);
  ipcMain.removeHandler(IPC_CHANNELS.MEMORY_TRIGGER_GC);

  // Clear all subscriptions
  windowSubscriptions.clear();

  // Remove all memory monitor listeners
  memoryMonitor.removeAllListeners('memory-stats');
  memoryMonitor.removeAllListeners('memory-warning');
  memoryMonitor.removeAllListeners('memory-critical');
  memoryMonitor.removeAllListeners('memory-normal');
}
