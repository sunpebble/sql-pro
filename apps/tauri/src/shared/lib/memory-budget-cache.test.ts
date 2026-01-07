import type { CacheStats } from './memory-budget-cache';
/**
 * Tests for MemoryBudgetCache
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSizeEstimator, MemoryBudgetCache } from './memory-budget-cache';

describe('memoryBudgetCache', () => {
  let cache: MemoryBudgetCache<string, string>;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should create cache with default options', () => {
      cache = new MemoryBudgetCache<string, string>();
      const stats = cache.getStats();

      expect(stats.maxItems).toBe(Number.POSITIVE_INFINITY);
      expect(stats.maxBytes).toBe(Number.POSITIVE_INFINITY);
      expect(stats.name).toBe('MemoryBudgetCache');
    });

    it('should accept custom maxItems', () => {
      cache = new MemoryBudgetCache<string, string>({ maxItems: 100 });
      expect(cache.getStats().maxItems).toBe(100);
    });

    it('should accept custom maxBytes', () => {
      cache = new MemoryBudgetCache<string, string>({ maxBytes: 1024 * 1024 });
      expect(cache.getStats().maxBytes).toBe(1024 * 1024);
    });

    it('should accept custom name', () => {
      cache = new MemoryBudgetCache<string, string>({ name: 'TestCache' });
      expect(cache.getStats().name).toBe('TestCache');
    });

    it('should accept custom sizeEstimator', () => {
      const customEstimator = vi.fn(() => 100);
      cache = new MemoryBudgetCache<string, string>({
        sizeEstimator: customEstimator,
      });

      cache.set('key', 'value');
      expect(customEstimator).toHaveBeenCalledWith('value');
    });

    it('should throw for non-positive maxItems', () => {
      expect(
        () => new MemoryBudgetCache<string, string>({ maxItems: 0 })
      ).toThrow('maxItems must be positive');
      expect(
        () => new MemoryBudgetCache<string, string>({ maxItems: -1 })
      ).toThrow('maxItems must be positive');
    });

    it('should throw for non-positive maxBytes', () => {
      expect(
        () => new MemoryBudgetCache<string, string>({ maxBytes: 0 })
      ).toThrow('maxBytes must be positive');
      expect(
        () => new MemoryBudgetCache<string, string>({ maxBytes: -1 })
      ).toThrow('maxBytes must be positive');
    });
  });

  describe('get/set', () => {
    beforeEach(() => {
      cache = new MemoryBudgetCache<string, string>();
    });

    it('should set and get a value', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for non-existent key', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should update existing value', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');
      expect(cache.get('key1')).toBe('value2');
      expect(cache.size).toBe(1);
    });

    it('should track hits and misses', () => {
      cache.set('key1', 'value1');

      cache.get('key1'); // hit
      cache.get('key1'); // hit
      cache.get('nonexistent'); // miss

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
    });

    it('should calculate hit rate correctly', () => {
      cache.set('key1', 'value1');

      cache.get('key1'); // hit
      cache.get('nonexistent'); // miss

      expect(cache.getStats().hitRate).toBe(50);
    });

    it('should return 0 hit rate when no requests made', () => {
      expect(cache.getStats().hitRate).toBe(0);
    });
  });

  describe('has', () => {
    beforeEach(() => {
      cache = new MemoryBudgetCache<string, string>();
    });

    it('should return true for existing key', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should not update hit/miss stats', () => {
      cache.set('key1', 'value1');
      cache.has('key1');
      cache.has('nonexistent');

      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('peek', () => {
    beforeEach(() => {
      cache = new MemoryBudgetCache<string, string>();
    });

    it('should return value without updating access time', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      // Peek at key1 (should not update LRU order)
      expect(cache.peek('key1')).toBe('value1');

      // key1 should still be oldest
      expect(cache.keys()[0]).toBe('key1');
    });

    it('should return undefined for non-existent key', () => {
      expect(cache.peek('nonexistent')).toBeUndefined();
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      cache = new MemoryBudgetCache<string, string>();
    });

    it('should delete existing entry', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.has('key1')).toBe(false);
    });

    it('should return false for non-existent key', () => {
      expect(cache.delete('nonexistent')).toBe(false);
    });

    it('should update size', () => {
      cache.set('key1', 'value1');
      const sizeBefore = cache.size;
      cache.delete('key1');
      expect(cache.size).toBe(sizeBefore - 1);
    });

    it('should emit eviction event with manual reason', () => {
      const evictionHandler = vi.fn();
      cache.on('eviction', evictionHandler);

      cache.set('key1', 'value1');
      cache.delete('key1');

      expect(evictionHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'key1',
          value: 'value1',
          reason: 'manual',
        })
      );
    });
  });

  describe('clear', () => {
    beforeEach(() => {
      cache = new MemoryBudgetCache<string, string>();
    });

    it('should remove all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();

      expect(cache.size).toBe(0);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
    });

    it('should reset totalBytes', () => {
      cache.set('key1', 'value1');
      cache.clear();

      expect(cache.getStats().totalBytes).toBe(0);
    });

    it('should emit clear event', () => {
      const clearHandler = vi.fn();
      cache.on('clear', clearHandler);

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();

      expect(clearHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          itemCount: 2,
        })
      );
    });
  });

  describe('lRU eviction by item count', () => {
    it('should evict oldest item when maxItems exceeded', () => {
      cache = new MemoryBudgetCache<string, string>({ maxItems: 3 });

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4'); // Should evict key1

      expect(cache.size).toBe(3);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });

    it('should emit eviction event with max-items reason', () => {
      const evictionHandler = vi.fn();
      cache = new MemoryBudgetCache<string, string>({ maxItems: 2 });
      cache.on('eviction', evictionHandler);

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(evictionHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'key1',
          value: 'value1',
          reason: 'max-items',
        })
      );
    });

    it('should update access order on get', () => {
      cache = new MemoryBudgetCache<string, string>({ maxItems: 3 });

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Access key1, making it most recently used
      cache.get('key1');

      // Add new item, should evict key2 (now oldest)
      cache.set('key4', 'value4');

      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });

    it('should update access order on set (update)', () => {
      cache = new MemoryBudgetCache<string, string>({ maxItems: 3 });

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Update key1, making it most recently used
      cache.set('key1', 'updated1');

      // Add new item, should evict key2 (now oldest)
      cache.set('key4', 'value4');

      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });

    it('should track eviction count', () => {
      cache = new MemoryBudgetCache<string, string>({ maxItems: 2 });

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3'); // eviction 1
      cache.set('key4', 'value4'); // eviction 2

      expect(cache.getStats().evictions).toBe(2);
    });
  });

  describe('lRU eviction by byte size', () => {
    it('should evict when maxBytes exceeded', () => {
      // Each value is ~14 bytes (length * 2 + overhead)
      cache = new MemoryBudgetCache<string, string>({
        maxBytes: 200,
        sizeEstimator: () => 100, // Fixed size for testing
      });

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3'); // Should evict key1

      expect(cache.size).toBe(2);
      expect(cache.has('key1')).toBe(false);
    });

    it('should emit eviction event with max-bytes reason', () => {
      const evictionHandler = vi.fn();
      cache = new MemoryBudgetCache<string, string>({
        maxBytes: 100,
        sizeEstimator: () => 60,
      });
      cache.on('eviction', evictionHandler);

      cache.set('key1', 'value1');
      cache.set('key2', 'value2'); // Should evict key1

      expect(evictionHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'key1',
          reason: 'max-bytes',
        })
      );
    });

    it('should update totalBytes on eviction', () => {
      cache = new MemoryBudgetCache<string, string>({
        maxBytes: 100,
        sizeEstimator: () => 60,
      });

      cache.set('key1', 'value1'); // 60 bytes
      expect(cache.getStats().totalBytes).toBe(60);

      cache.set('key2', 'value2'); // Evict key1, add key2 (60 bytes)
      expect(cache.getStats().totalBytes).toBe(60);
    });

    it('should evict multiple items if needed for large entry', () => {
      cache = new MemoryBudgetCache<string, string>({
        maxBytes: 120,
        sizeEstimator: (v) => (v === 'large' ? 80 : 30),
      });

      cache.set('key1', 'small1'); // 30 bytes
      cache.set('key2', 'small2'); // 30 bytes
      cache.set('key3', 'small3'); // 30 bytes (total 90)

      // Adding large value (80 bytes) would make total 170, exceeding 120
      // Should evict key1 (oldest) to get to 140, then key2 to get to 110
      cache.set('key4', 'large'); // 80 bytes

      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
      expect(cache.getStats().totalBytes).toBe(110); // 30 + 80
    });
  });

  describe('keys/entries/forEach', () => {
    beforeEach(() => {
      cache = new MemoryBudgetCache<string, string>();
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
    });

    it('should return keys in LRU order', () => {
      expect(cache.keys()).toEqual(['key1', 'key2', 'key3']);
    });

    it('should return entries in LRU order', () => {
      expect(cache.entries()).toEqual([
        ['key1', 'value1'],
        ['key2', 'value2'],
        ['key3', 'value3'],
      ]);
    });

    it('should iterate with forEach in LRU order', () => {
      const visited: string[] = [];
      cache.forEach((value, key) => {
        visited.push(`${key}:${value}`);
      });

      expect(visited).toEqual(['key1:value1', 'key2:value2', 'key3:value3']);
    });

    it('should update order after access', () => {
      cache.get('key1');
      expect(cache.keys()).toEqual(['key2', 'key3', 'key1']);
    });
  });

  describe('setMaxItems', () => {
    it('should update maxItems', () => {
      cache = new MemoryBudgetCache<string, string>({ maxItems: 100 });
      cache.setMaxItems(50);
      expect(cache.getStats().maxItems).toBe(50);
    });

    it('should evict if new limit is lower than current count', () => {
      cache = new MemoryBudgetCache<string, string>({ maxItems: 10 });

      for (let i = 0; i < 10; i++) {
        cache.set(`key${i}`, `value${i}`);
      }

      cache.setMaxItems(5);
      expect(cache.size).toBe(5);
    });

    it('should throw for non-positive value', () => {
      cache = new MemoryBudgetCache<string, string>();
      expect(() => cache.setMaxItems(0)).toThrow('maxItems must be positive');
    });
  });

  describe('setMaxBytes', () => {
    it('should update maxBytes', () => {
      cache = new MemoryBudgetCache<string, string>({ maxBytes: 1000 });
      cache.setMaxBytes(500);
      expect(cache.getStats().maxBytes).toBe(500);
    });

    it('should evict if new limit is lower than current usage', () => {
      cache = new MemoryBudgetCache<string, string>({
        maxBytes: 500,
        sizeEstimator: () => 100,
      });

      for (let i = 0; i < 5; i++) {
        cache.set(`key${i}`, `value${i}`); // 500 bytes total
      }

      cache.setMaxBytes(200);
      expect(cache.size).toBe(2);
    });

    it('should throw for non-positive value', () => {
      cache = new MemoryBudgetCache<string, string>();
      expect(() => cache.setMaxBytes(0)).toThrow('maxBytes must be positive');
    });
  });

  describe('resetStats', () => {
    it('should reset hits, misses, and evictions', () => {
      cache = new MemoryBudgetCache<string, string>({ maxItems: 2 });

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.get('key1');
      cache.get('nonexistent');
      cache.set('key3', 'value3'); // eviction

      cache.resetStats();

      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.evictions).toBe(0);
    });

    it('should not affect cache contents', () => {
      cache = new MemoryBudgetCache<string, string>();
      cache.set('key1', 'value1');

      cache.resetStats();

      expect(cache.get('key1')).toBe('value1');
      expect(cache.size).toBe(1);
    });
  });

  describe('event emitters', () => {
    beforeEach(() => {
      cache = new MemoryBudgetCache<string, string>({ maxItems: 2 });
    });

    it('should subscribe to eviction events', () => {
      const handler = vi.fn();
      cache.on('eviction', handler);

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe from eviction events', () => {
      const handler = vi.fn();
      cache.on('eviction', handler);
      cache.off('eviction', handler);

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(handler).not.toHaveBeenCalled();
    });

    it('should support multiple listeners', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      cache.on('eviction', handler1);
      cache.on('eviction', handler2);

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should not throw if listener throws', () => {
      const throwingHandler = vi.fn(() => {
        throw new Error('Listener error');
      });
      const normalHandler = vi.fn();

      cache.on('eviction', throwingHandler);
      cache.on('eviction', normalHandler);

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      expect(() => cache.set('key3', 'value3')).not.toThrow();
      expect(normalHandler).toHaveBeenCalled();
    });

    it('should subscribe to clear events', () => {
      const handler = vi.fn();
      cache.on('clear', handler);

      cache.set('key1', 'value1');
      cache.clear();

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          itemCount: 1,
        })
      );
    });
  });

  describe('defaultSizeEstimator', () => {
    it('should estimate string size correctly', () => {
      const size = defaultSizeEstimator('hello');
      expect(size).toBe(10); // 5 chars * 2 bytes
    });

    it('should return 8 for null', () => {
      expect(defaultSizeEstimator(null)).toBe(8);
    });

    it('should return 8 for undefined', () => {
      expect(defaultSizeEstimator(undefined)).toBe(8);
    });

    it('should return 8 for numbers', () => {
      expect(defaultSizeEstimator(42)).toBe(8);
      expect(defaultSizeEstimator(3.14159)).toBe(8);
    });

    it('should return 4 for booleans', () => {
      expect(defaultSizeEstimator(true)).toBe(4);
      expect(defaultSizeEstimator(false)).toBe(4);
    });

    it('should handle ArrayBuffer', () => {
      const buffer = new ArrayBuffer(100);
      expect(defaultSizeEstimator(buffer)).toBe(100);
    });

    it('should handle typed arrays', () => {
      const arr = new Uint8Array(50);
      expect(defaultSizeEstimator(arr)).toBe(50);
    });

    it('should estimate object size', () => {
      const obj = { name: 'test', value: 123 };
      const size = defaultSizeEstimator(obj);
      expect(size).toBeGreaterThan(0);
    });

    it('should handle circular references gracefully', () => {
      const obj: Record<string, unknown> = { name: 'test' };
      obj.self = obj;

      // Should not throw, returns fallback size
      const size = defaultSizeEstimator(obj);
      expect(size).toBe(1024);
    });
  });

  describe('getStats', () => {
    it('should return comprehensive stats', () => {
      cache = new MemoryBudgetCache<string, string>({
        maxItems: 100,
        maxBytes: 10000,
        name: 'TestCache',
      });

      cache.set('key1', 'value1');
      cache.get('key1');
      cache.get('missing');

      const stats: CacheStats = cache.getStats();

      expect(stats).toEqual({
        itemCount: 1,
        totalBytes: expect.any(Number),
        maxItems: 100,
        maxBytes: 10000,
        hits: 1,
        misses: 1,
        hitRate: 50,
        evictions: 0,
        name: 'TestCache',
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty cache operations', () => {
      cache = new MemoryBudgetCache<string, string>();

      expect(cache.get('nonexistent')).toBeUndefined();
      expect(cache.delete('nonexistent')).toBe(false);
      expect(cache.size).toBe(0);
      expect(cache.keys()).toEqual([]);
      expect(cache.entries()).toEqual([]);

      cache.clear(); // Should not throw
    });

    it('should handle updating value with different size', () => {
      cache = new MemoryBudgetCache<string, string>({
        sizeEstimator: (v) => v.length * 2,
      });

      cache.set('key', 'short'); // 10 bytes
      expect(cache.getStats().totalBytes).toBe(10);

      cache.set('key', 'much longer value'); // 34 bytes
      expect(cache.getStats().totalBytes).toBe(34);
      expect(cache.size).toBe(1);
    });

    it('should handle maxItems of 1', () => {
      cache = new MemoryBudgetCache<string, string>({ maxItems: 1 });

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      expect(cache.size).toBe(1);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
    });

    it('should chain set calls', () => {
      cache = new MemoryBudgetCache<string, string>();

      cache.set('key1', 'value1').set('key2', 'value2').set('key3', 'value3');

      expect(cache.size).toBe(3);
    });

    it('should chain on/off calls', () => {
      cache = new MemoryBudgetCache<string, string>();
      const handler = vi.fn();

      cache
        .on('eviction', handler)
        .on('clear', handler)
        .off('eviction', handler);

      expect(cache).toBeDefined();
    });
  });
});
