/**
 * Tests for MemoryCleanupManager service
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Import after mocks
import {
  memoryCleanup,
  MemoryCleanupManager,
  performFullCleanup,
  requestGC,
} from './memory-cleanup';

// Create hoisted mock functions that can be tracked
const {
  mockClearTableCache,
  mockRemoveTableConnectionData,
  mockGetTableCacheStats,
  mockClearQueryResultsCache,
  mockRemoveQueryConnectionResults,
  mockGetQueryResultsCacheStats,
  mockSchemaCacheGetStats,
  mockSchemaCacheClearAll,
  mockSchemaCacheClearConnection,
} = vi.hoisted(() => ({
  mockClearTableCache: vi.fn(),
  mockRemoveTableConnectionData: vi.fn(),
  mockGetTableCacheStats: vi.fn(() => ({ itemCount: 5 })),
  mockClearQueryResultsCache: vi.fn(),
  mockRemoveQueryConnectionResults: vi.fn(),
  mockGetQueryResultsCacheStats: vi.fn(() => ({ itemCount: 3 })),
  mockSchemaCacheGetStats: vi.fn(() => ({ totalTableDetailsCount: 10 })),
  mockSchemaCacheClearAll: vi.fn(),
  mockSchemaCacheClearConnection: vi.fn(),
}));

// Mock the stores and cache
vi.mock('@/stores/table-data-store', () => ({
  useTableDataStore: {
    getState: () => ({
      getCacheStats: mockGetTableCacheStats,
      clearCache: mockClearTableCache,
      removeConnectionData: mockRemoveTableConnectionData,
    }),
  },
}));

vi.mock('@/stores/query-store', () => ({
  useQueryStore: {
    getState: () => ({
      getResultsCacheStats: mockGetQueryResultsCacheStats,
      clearResultsCache: mockClearQueryResultsCache,
      removeConnectionResults: mockRemoveQueryConnectionResults,
    }),
  },
}));

vi.mock('@/lib/schema-cache', () => ({
  schemaCache: {
    getStats: mockSchemaCacheGetStats,
    clearAll: mockSchemaCacheClearAll,
    clearConnection: mockSchemaCacheClearConnection,
  },
}));

describe('memoryCleanupManager', () => {
  let manager: MemoryCleanupManager;

  beforeEach(() => {
    manager = new MemoryCleanupManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    manager.reset();
  });

  describe('performCleanup', () => {
    it('should perform cleanup and return result', () => {
      const result = manager.performCleanup('manual');

      expect(result.reason).toBe('manual');
      expect(result.performed).toBe(true);
      expect(result.cleanedComponents).toContain('table-data-cache');
      expect(result.cleanedComponents).toContain('query-results-cache');
      expect(result.cleanedComponents).toContain('schema-cache');
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('should respect cooldown for non-critical cleanup', () => {
      const result1 = manager.performCleanup('pressure-warning');
      expect(result1.performed).toBe(true);

      // Second cleanup should be skipped due to cooldown
      const result2 = manager.performCleanup('pressure-warning');
      expect(result2.performed).toBe(false);
    });

    it('should bypass cooldown for critical cleanup', () => {
      const result1 = manager.performCleanup('pressure-warning');
      expect(result1.performed).toBe(true);

      // Critical cleanup should bypass cooldown
      const result2 = manager.performCleanup('pressure-critical');
      expect(result2.performed).toBe(true);
    });

    it('should bypass cooldown for connection-close cleanup', () => {
      const result1 = manager.performCleanup('pressure-warning');
      expect(result1.performed).toBe(true);

      // Connection close should bypass cooldown
      const result2 = manager.performCleanup('connection-close');
      expect(result2.performed).toBe(true);
    });

    it('should only clean schema cache on critical or manual cleanup', () => {
      // Warning cleanup should not clear schema cache
      mockSchemaCacheGetStats.mockReturnValue({
        totalTableDetailsCount: 10,
      });

      const warningResult = manager.performCleanup('pressure-warning');
      expect(warningResult.cleanedComponents).not.toContain('schema-cache');

      // Reset cooldown by resetting manager
      manager.reset();

      // Manual cleanup should clear schema cache
      const manualResult = manager.performCleanup('manual');
      expect(manualResult.cleanedComponents).toContain('schema-cache');
    });

    it('should notify registered handlers', () => {
      const handler = vi.fn();
      manager.onCleanup(handler);

      manager.performCleanup('manual');

      expect(handler).toHaveBeenCalledWith('manual');
    });

    it('should allow unsubscribing handlers', () => {
      const handler = vi.fn();
      const unsubscribe = manager.onCleanup(handler);

      unsubscribe();
      manager.performCleanup('manual');

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('cleanupConnection', () => {
    it('should cleanup resources for a specific connection', () => {
      const result = manager.cleanupConnection('test-connection-id');

      expect(result.reason).toBe('connection-close');
      expect(result.performed).toBe(true);
      expect(result.cleanedComponents).toContain('table-data-store');
      expect(result.cleanedComponents).toContain('query-store');
      expect(result.cleanedComponents).toContain('schema-cache');

      // Verify specific connection cleanup was called
      expect(mockRemoveTableConnectionData).toHaveBeenCalledWith(
        'test-connection-id'
      );
      expect(mockRemoveQueryConnectionResults).toHaveBeenCalledWith(
        'test-connection-id'
      );
      expect(mockSchemaCacheClearConnection).toHaveBeenCalledWith(
        'test-connection-id'
      );
    });
  });

  describe('handlePressureChange', () => {
    it('should cleanup when escalating from normal to warning', () => {
      const result = manager.handlePressureChange(
        'normal',
        'warning',
        {} as never
      );

      expect(result).toBeDefined();
      expect(result?.reason).toBe('pressure-warning');
    });

    it('should cleanup when reaching critical level', () => {
      manager.reset(); // Reset to clear any cooldowns

      const result = manager.handlePressureChange(
        'warning',
        'critical',
        {} as never
      );

      expect(result).toBeDefined();
      expect(result?.reason).toBe('pressure-critical');
    });

    it('should not cleanup when de-escalating', () => {
      const result = manager.handlePressureChange(
        'warning',
        'normal',
        {} as never
      );

      expect(result).toBeUndefined();
    });

    it('should not cleanup when staying at normal', () => {
      const result = manager.handlePressureChange(
        'normal',
        'normal',
        {} as never
      );

      expect(result).toBeUndefined();
    });
  });

  describe('cooldown management', () => {
    it('should have default cooldown of 3000ms', () => {
      expect(manager.getCooldown()).toBe(3000);
    });

    it('should set cooldown with minimum of 1000ms', () => {
      manager.setCooldown(5000);
      expect(manager.getCooldown()).toBe(5000);

      manager.setCooldown(500); // Below minimum
      expect(manager.getCooldown()).toBe(1000);
    });

    it('should track last cleanup time', () => {
      expect(manager.getLastCleanupTime()).toBe(0);

      manager.performCleanup('manual');

      expect(manager.getLastCleanupTime()).toBeGreaterThan(0);
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      const handler = vi.fn();
      manager.onCleanup(handler);
      manager.performCleanup('manual');

      manager.reset();

      expect(manager.getLastCleanupTime()).toBe(0);

      // Handler should be cleared
      manager.performCleanup('manual');
      expect(handler).toHaveBeenCalledTimes(1); // Only from before reset
    });
  });
});

describe('memoryCleanup singleton', () => {
  it('should export a singleton instance', () => {
    expect(memoryCleanup).toBeInstanceOf(MemoryCleanupManager);
  });
});

describe('requestGC', () => {
  it('should return error when memory API is not available', async () => {
    // window.quarry is not defined in test environment
    const result = await requestGC();

    expect(result.success).toBe(false);
    expect(result.gcTriggered).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should call memory API when available', async () => {
    const mockTriggerGC = vi.fn().mockResolvedValue({
      success: true,
      gcTriggered: true,
    });

    // Mock window.quarry.memory
    (
      globalThis as unknown as { window: { quarry: { memory: unknown } } }
    ).window = {
      quarry: {
        memory: {
          triggerGC: mockTriggerGC,
        },
      },
    };

    const result = await requestGC(true);

    expect(mockTriggerGC).toHaveBeenCalledWith({ force: true });
    expect(result.success).toBe(true);

    // Cleanup
    delete (globalThis as unknown as { window?: unknown }).window;
  });
});

describe('performFullCleanup', () => {
  beforeEach(() => {
    memoryCleanup.reset();
  });

  it('should perform cleanup and request GC', async () => {
    const result = await performFullCleanup();

    expect(result.cleanupResult.reason).toBe('manual');
    expect(result.cleanupResult.performed).toBe(true);
    expect(result.gcResult).toBeDefined();
  });
});
