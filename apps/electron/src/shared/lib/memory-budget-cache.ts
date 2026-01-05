/**
 * Generic LRU (Least Recently Used) cache with memory budget awareness.
 * Supports both item count and byte-size limits with automatic eviction.
 *
 * @example
 * ```typescript
 * import { MemoryBudgetCache } from './memory-budget-cache';
 *
 * // Create cache with 100 items and 10MB limit
 * const cache = new MemoryBudgetCache<string, MyData>({
 *   maxItems: 100,
 *   maxBytes: 10 * 1024 * 1024,
 *   sizeEstimator: (value) => JSON.stringify(value).length * 2,
 * });
 *
 * // Set with automatic size estimation
 * cache.set('key1', myData);
 *
 * // Listen for evictions
 * cache.on('eviction', ({ key, value, reason }) => {
 *   console.log(`Evicted ${key}: ${reason}`);
 * });
 * ```
 */

/**
 * Configuration options for MemoryBudgetCache
 */
export interface MemoryBudgetCacheOptions<V> {
  /** Maximum number of items in cache (default: Infinity) */
  maxItems?: number;
  /** Maximum total size in bytes (default: Infinity) */
  maxBytes?: number;
  /** Function to estimate size of a value in bytes (default: uses JSON.stringify) */
  sizeEstimator?: (value: V) => number;
  /** Name for the cache (for debugging) */
  name?: string;
}

/**
 * Statistics about cache state
 */
export interface CacheStats {
  /** Current number of items in cache */
  itemCount: number;
  /** Current total size in bytes */
  totalBytes: number;
  /** Maximum allowed items */
  maxItems: number;
  /** Maximum allowed bytes */
  maxBytes: number;
  /** Number of cache hits */
  hits: number;
  /** Number of cache misses */
  misses: number;
  /** Hit rate as percentage (0-100) */
  hitRate: number;
  /** Number of evictions */
  evictions: number;
  /** Cache name */
  name: string;
}

/**
 * Reason for eviction
 */
export type EvictionReason = 'max-items' | 'max-bytes' | 'manual' | 'clear';

/**
 * Eviction event data
 */
export interface EvictionEvent<K, V> {
  /** Key that was evicted */
  key: K;
  /** Value that was evicted */
  value: V;
  /** Size of evicted item in bytes */
  size: number;
  /** Reason for eviction */
  reason: EvictionReason;
}

/**
 * Event types for MemoryBudgetCache
 */
export interface MemoryBudgetCacheEvents<K, V> {
  eviction: EvictionEvent<K, V>;
  clear: { itemCount: number; totalBytes: number };
}

/**
 * Event listener function type
 */
type EventListener<T> = (data: T) => void;

/**
 * Internal cache entry with metadata
 */
interface CacheEntry<V> {
  value: V;
  size: number;
  createdAt: number;
  accessedAt: number;
}

/**
 * Default size estimator using JSON serialization
 */
function defaultSizeEstimator<V>(value: V): number {
  if (value === null || value === undefined) {
    return 8; // Approximate size for null/undefined reference
  }

  if (typeof value === 'string') {
    // JavaScript strings are UTF-16, so ~2 bytes per character
    return value.length * 2;
  }

  if (typeof value === 'number') {
    return 8; // 64-bit float
  }

  if (typeof value === 'boolean') {
    return 4;
  }

  if (value instanceof ArrayBuffer) {
    return value.byteLength;
  }

  if (ArrayBuffer.isView(value)) {
    return value.byteLength;
  }

  // For objects/arrays, use JSON serialization as approximation
  try {
    const json = JSON.stringify(value);
    // Double for UTF-16 encoding + overhead for object structure
    return json.length * 2 + 64;
  } catch {
    // Fallback for circular structures or non-serializable objects
    return 1024; // Conservative estimate
  }
}

/**
 * Generic LRU cache with memory budget awareness.
 * Automatically evicts least recently used entries when limits are exceeded.
 */
export class MemoryBudgetCache<K, V> {
  private readonly cache = new Map<K, CacheEntry<V>>();
  private readonly accessOrder: K[] = [];
  private readonly maxItems: number;
  private readonly maxBytes: number;
  private readonly sizeEstimator: (value: V) => number;
  private readonly name: string;

  private totalBytes = 0;
  private hits = 0;
  private misses = 0;
  private evictionCount = 0;

  private readonly eventListeners = new Map<
    keyof MemoryBudgetCacheEvents<K, V>,
    Set<
      | EventListener<EvictionEvent<K, V>>
      | EventListener<{ itemCount: number; totalBytes: number }>
    >
  >();

  constructor(options: MemoryBudgetCacheOptions<V> = {}) {
    this.maxItems = options.maxItems ?? Number.POSITIVE_INFINITY;
    this.maxBytes = options.maxBytes ?? Number.POSITIVE_INFINITY;
    this.sizeEstimator = options.sizeEstimator ?? defaultSizeEstimator;
    this.name = options.name ?? 'MemoryBudgetCache';

    if (this.maxItems <= 0) {
      throw new Error('maxItems must be positive');
    }
    if (this.maxBytes <= 0) {
      throw new Error('maxBytes must be positive');
    }
  }

  /**
   * Get a value from the cache.
   * Updates access time for LRU ordering.
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (entry === undefined) {
      this.misses++;
      return undefined;
    }

    this.hits++;
    entry.accessedAt = Date.now();
    this.moveToEnd(key);

    return entry.value;
  }

  /**
   * Check if a key exists in the cache without updating access time.
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Get a value without updating access time.
   * Useful for inspection without affecting LRU order.
   */
  peek(key: K): V | undefined {
    const entry = this.cache.get(key);
    return entry?.value;
  }

  /**
   * Set a value in the cache.
   * May trigger evictions if limits are exceeded.
   */
  set(key: K, value: V): this {
    const size = this.sizeEstimator(value);
    const now = Date.now();

    // Check if we're updating an existing entry
    const existingEntry = this.cache.get(key);
    if (existingEntry) {
      // Update existing entry
      this.totalBytes -= existingEntry.size;
      this.totalBytes += size;
      existingEntry.value = value;
      existingEntry.size = size;
      existingEntry.accessedAt = now;
      this.moveToEnd(key);
    } else {
      // Add new entry
      const entry: CacheEntry<V> = {
        value,
        size,
        createdAt: now,
        accessedAt: now,
      };

      this.cache.set(key, entry);
      this.accessOrder.push(key);
      this.totalBytes += size;
    }

    // Evict if needed
    this.evictIfNeeded();

    return this;
  }

  /**
   * Delete a specific entry from the cache.
   */
  delete(key: K): boolean {
    const entry = this.cache.get(key);

    if (entry === undefined) {
      return false;
    }

    this.cache.delete(key);
    this.totalBytes -= entry.size;
    this.removeFromAccessOrder(key);

    this.emitEviction(key, entry.value, entry.size, 'manual');

    return true;
  }

  /**
   * Clear all entries from the cache.
   */
  clear(): void {
    const itemCount = this.cache.size;
    const totalBytes = this.totalBytes;

    this.cache.clear();
    this.accessOrder.length = 0;
    this.totalBytes = 0;

    this.emitClear(itemCount, totalBytes);
  }

  /**
   * Get the number of items in the cache.
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get current cache statistics.
   */
  getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    return {
      itemCount: this.cache.size,
      totalBytes: this.totalBytes,
      maxItems: this.maxItems,
      maxBytes: this.maxBytes,
      hits: this.hits,
      misses: this.misses,
      hitRate: totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0,
      evictions: this.evictionCount,
      name: this.name,
    };
  }

  /**
   * Reset statistics counters.
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
    this.evictionCount = 0;
  }

  /**
   * Get all keys in the cache in LRU order (oldest first).
   */
  keys(): K[] {
    return [...this.accessOrder];
  }

  /**
   * Get all entries in the cache in LRU order (oldest first).
   */
  entries(): Array<[K, V]> {
    return this.accessOrder.map((key) => {
      const entry = this.cache.get(key);
      return [key, entry!.value] as [K, V];
    });
  }

  /**
   * Iterate over all entries in LRU order.
   */
  forEach(callback: (value: V, key: K, cache: this) => void): void {
    for (const key of this.accessOrder) {
      const entry = this.cache.get(key);
      if (entry) {
        callback(entry.value, key, this);
      }
    }
  }

  /**
   * Update the maximum items limit.
   * May trigger evictions if new limit is lower than current count.
   */
  setMaxItems(maxItems: number): void {
    if (maxItems <= 0) {
      throw new Error('maxItems must be positive');
    }
    (this as { maxItems: number }).maxItems = maxItems;
    this.evictIfNeeded();
  }

  /**
   * Update the maximum bytes limit.
   * May trigger evictions if new limit is lower than current usage.
   */
  setMaxBytes(maxBytes: number): void {
    if (maxBytes <= 0) {
      throw new Error('maxBytes must be positive');
    }
    (this as { maxBytes: number }).maxBytes = maxBytes;
    this.evictIfNeeded();
  }

  /**
   * Subscribe to eviction events.
   */
  on(event: 'eviction', listener: EventListener<EvictionEvent<K, V>>): this;
  on(
    event: 'clear',
    listener: EventListener<{ itemCount: number; totalBytes: number }>
  ): this;
  on(
    event: keyof MemoryBudgetCacheEvents<K, V>,
    listener:
      | EventListener<EvictionEvent<K, V>>
      | EventListener<{ itemCount: number; totalBytes: number }>
  ): this {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
    return this;
  }

  /**
   * Unsubscribe from eviction events.
   */
  off(event: 'eviction', listener: EventListener<EvictionEvent<K, V>>): this;
  off(
    event: 'clear',
    listener: EventListener<{ itemCount: number; totalBytes: number }>
  ): this;
  off(
    event: keyof MemoryBudgetCacheEvents<K, V>,
    listener:
      | EventListener<EvictionEvent<K, V>>
      | EventListener<{ itemCount: number; totalBytes: number }>
  ): this {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
    return this;
  }

  /**
   * Evict entries until within limits.
   */
  private evictIfNeeded(): void {
    // Evict for max items
    while (this.cache.size > this.maxItems) {
      this.evictOldest('max-items');
    }

    // Evict for max bytes
    while (this.totalBytes > this.maxBytes && this.cache.size > 0) {
      this.evictOldest('max-bytes');
    }
  }

  /**
   * Evict the oldest (least recently used) entry.
   */
  private evictOldest(reason: EvictionReason): void {
    if (this.accessOrder.length === 0) {
      return;
    }

    const oldestKey = this.accessOrder.shift()!;
    const entry = this.cache.get(oldestKey);

    if (entry) {
      this.cache.delete(oldestKey);
      this.totalBytes -= entry.size;
      this.evictionCount++;

      this.emitEviction(oldestKey, entry.value, entry.size, reason);
    }
  }

  /**
   * Move a key to the end of the access order (most recently used).
   */
  private moveToEnd(key: K): void {
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  /**
   * Remove a key from the access order.
   */
  private removeFromAccessOrder(key: K): void {
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Emit an eviction event.
   */
  private emitEviction(
    key: K,
    value: V,
    size: number,
    reason: EvictionReason
  ): void {
    const listeners = this.eventListeners.get('eviction');
    if (listeners) {
      const event: EvictionEvent<K, V> = { key, value, size, reason };
      for (const listener of listeners) {
        try {
          (listener as EventListener<EvictionEvent<K, V>>)(event);
        } catch {
          // Ignore listener errors
        }
      }
    }
  }

  /**
   * Emit a clear event.
   */
  private emitClear(itemCount: number, totalBytes: number): void {
    const listeners = this.eventListeners.get('clear');
    if (listeners) {
      for (const listener of listeners) {
        try {
          (
            listener as EventListener<{ itemCount: number; totalBytes: number }>
          )({ itemCount, totalBytes });
        } catch {
          // Ignore listener errors
        }
      }
    }
  }
}

// Export default size estimator for reuse
export { defaultSizeEstimator };
