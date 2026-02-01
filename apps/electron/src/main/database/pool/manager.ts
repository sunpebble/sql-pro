/**
 * Connection Pool Manager
 *
 * Manages database connection pools for efficient connection reuse.
 * Provides connection lifecycle management, health checking, and cleanup.
 */

import type { DatabaseType } from '@shared/types';
import type {
  AdapterConnectionInfo,
  IDatabaseAdapter,
} from '../adapters/interface';

// ============================================
// Pool Configuration
// ============================================

export interface PoolConfig {
  /** Maximum number of connections per database type */
  maxConnections: number;
  /** Connection idle timeout in milliseconds */
  idleTimeoutMs: number;
  /** Health check interval in milliseconds */
  healthCheckIntervalMs: number;
  /** Whether to enable connection validation before use */
  validateOnBorrow: boolean;
}

const DEFAULT_POOL_CONFIG: PoolConfig = {
  maxConnections: 10,
  idleTimeoutMs: 30000, // 30 seconds
  healthCheckIntervalMs: 60000, // 1 minute
  validateOnBorrow: true,
};

// ============================================
// Pool Entry
// ============================================

interface PoolEntry {
  connectionId: string;
  adapter: IDatabaseAdapter;
  connectionInfo: AdapterConnectionInfo;
  createdAt: Date;
  lastUsedAt: Date;
  inUse: boolean;
}

// ============================================
// Connection Pool Manager
// ============================================

/**
 * Manages connection pools for different database types.
 * Currently a thin wrapper around the existing adapter system,
 * with hooks for future pooling enhancements.
 */
class ConnectionPoolManager {
  private pools: Map<DatabaseType, Map<string, PoolEntry>> = new Map();
  private adapters: Map<DatabaseType, IDatabaseAdapter> = new Map();
  private config: PoolConfig;
  private healthCheckTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<PoolConfig> = {}) {
    this.config = { ...DEFAULT_POOL_CONFIG, ...config };
  }

  /**
   * Register an adapter for a database type
   */
  registerAdapter(type: DatabaseType, adapter: IDatabaseAdapter): void {
    this.adapters.set(type, adapter);
    this.pools.set(type, new Map());
  }

  /**
   * Get the adapter for a database type
   */
  getAdapter(type: DatabaseType): IDatabaseAdapter | undefined {
    return this.adapters.get(type);
  }

  /**
   * Track a connection in the pool
   */
  trackConnection(
    type: DatabaseType,
    connectionId: string,
    adapter: IDatabaseAdapter,
    connectionInfo: AdapterConnectionInfo
  ): void {
    const pool = this.pools.get(type);
    if (!pool) {
      this.pools.set(type, new Map());
    }

    const entry: PoolEntry = {
      connectionId,
      adapter,
      connectionInfo,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      inUse: true,
    };

    this.pools.get(type)!.set(connectionId, entry);
  }

  /**
   * Mark a connection as in use
   */
  markInUse(connectionId: string): void {
    for (const pool of this.pools.values()) {
      const entry = pool.get(connectionId);
      if (entry) {
        entry.inUse = true;
        entry.lastUsedAt = new Date();
        return;
      }
    }
  }

  /**
   * Mark a connection as idle
   */
  markIdle(connectionId: string): void {
    for (const pool of this.pools.values()) {
      const entry = pool.get(connectionId);
      if (entry) {
        entry.inUse = false;
        entry.lastUsedAt = new Date();
        return;
      }
    }
  }

  /**
   * Remove a connection from the pool
   */
  removeConnection(connectionId: string): boolean {
    for (const pool of this.pools.values()) {
      if (pool.has(connectionId)) {
        pool.delete(connectionId);
        return true;
      }
    }
    return false;
  }

  /**
   * Get connection entry from the pool
   */
  getConnection(connectionId: string): PoolEntry | undefined {
    for (const pool of this.pools.values()) {
      const entry = pool.get(connectionId);
      if (entry) {
        return entry;
      }
    }
    return undefined;
  }

  /**
   * Get all connections of a specific type
   */
  getConnectionsByType(type: DatabaseType): PoolEntry[] {
    const pool = this.pools.get(type);
    if (!pool) return [];
    return Array.from(pool.values());
  }

  /**
   * Get total connection count across all pools
   */
  getTotalConnectionCount(): number {
    let count = 0;
    for (const pool of this.pools.values()) {
      count += pool.size;
    }
    return count;
  }

  /**
   * Get connection count for a specific type
   */
  getConnectionCount(type: DatabaseType): number {
    return this.pools.get(type)?.size ?? 0;
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks(): void {
    if (this.healthCheckTimer) {
      return;
    }

    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckIntervalMs);
  }

  /**
   * Stop periodic health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * Perform health check on all connections
   */
  private performHealthCheck(): void {
    const now = Date.now();

    for (const [type, pool] of this.pools) {
      for (const [connectionId, entry] of pool) {
        // Check for idle timeout
        if (!entry.inUse) {
          const idleTime = now - entry.lastUsedAt.getTime();
          if (idleTime > this.config.idleTimeoutMs) {
            // Close idle connection
            const adapter = this.adapters.get(type);
            if (adapter) {
              adapter.close(connectionId);
            }
            pool.delete(connectionId);
            // Idle connection closed: connectionId
          }
        }
      }
    }
  }

  /**
   * Close all connections and clear pools
   */
  closeAll(): void {
    this.stopHealthChecks();

    for (const [type, pool] of this.pools) {
      const adapter = this.adapters.get(type);
      if (adapter) {
        adapter.closeAll();
      }
      pool.clear();
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    byType: Record<string, { total: number; active: number; idle: number }>;
  } {
    let totalConnections = 0;
    let activeConnections = 0;
    let idleConnections = 0;
    const byType: Record<
      string,
      { total: number; active: number; idle: number }
    > = {};

    for (const [type, pool] of this.pools) {
      let typeActive = 0;
      let typeIdle = 0;

      for (const entry of pool.values()) {
        if (entry.inUse) {
          typeActive++;
          activeConnections++;
        } else {
          typeIdle++;
          idleConnections++;
        }
        totalConnections++;
      }

      byType[type] = {
        total: pool.size,
        active: typeActive,
        idle: typeIdle,
      };
    }

    return {
      totalConnections,
      activeConnections,
      idleConnections,
      byType,
    };
  }
}

// Export singleton instance
export const connectionPool = new ConnectionPoolManager();

// Export class for custom instances
export { ConnectionPoolManager };
