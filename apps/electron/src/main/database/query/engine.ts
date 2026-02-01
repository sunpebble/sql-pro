/**
 * Query Execution Engine
 *
 * Unified query execution layer that provides:
 * - Query routing to appropriate adapters
 * - Query timing and logging
 * - Result transformation
 * - Error handling and enhancement
 */

import type { ErrorCode, ErrorPosition } from '@shared/types';
import { connectionPool } from '../pool/manager';

// ============================================
// Query Types
// ============================================

export interface QueryOptions {
  /** Query timeout in milliseconds */
  timeout?: number;
  /** Whether to log the query */
  enableLogging?: boolean;
  /** Custom parameters for the query */
  params?: unknown[];
}

export interface QueryTiming {
  startTime: number;
  endTime: number;
  durationMs: number;
}

export interface QueryExecutionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: ErrorCode;
  errorPosition?: ErrorPosition;
  troubleshootingSteps?: string[];
  timing?: QueryTiming;
}

// ============================================
// Query Engine
// ============================================

/**
 * Query execution engine that routes queries to the appropriate adapter
 * and provides unified error handling and logging.
 */
class QueryEngine {
  /**
   * Execute a SELECT query
   */
  async executeSelect(
    connectionId: string,
    sql: string,
    options: QueryOptions = {}
  ): Promise<QueryExecutionResult<{ columns: string[]; rows: unknown[][] }>> {
    const startTime = performance.now();

    try {
      const entry = connectionPool.getConnection(connectionId);
      if (!entry) {
        return {
          success: false,
          error: 'Connection not found',
          timing: this.createTiming(startTime),
        };
      }

      const adapter = entry.adapter;
      connectionPool.markInUse(connectionId);

      const result = adapter.queryAsync
        ? await adapter.queryAsync(connectionId, sql, options.params)
        : adapter.query(connectionId, sql, options.params);

      connectionPool.markIdle(connectionId);

      if (result.success) {
        return {
          success: true,
          data: {
            columns: result.columns,
            rows: result.rows,
          },
          timing: this.createTiming(startTime),
        };
      }

      return {
        success: false,
        error: result.error,
        errorCode:
          'errorCode' in result ? (result.errorCode as ErrorCode) : undefined,
        errorPosition:
          'errorPosition' in result
            ? (result.errorPosition as ErrorPosition)
            : undefined,
        troubleshootingSteps:
          'troubleshootingSteps' in result
            ? (result.troubleshootingSteps as string[])
            : undefined,
        timing: this.createTiming(startTime),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timing: this.createTiming(startTime),
      };
    }
  }

  /**
   * Execute a non-SELECT query (INSERT, UPDATE, DELETE, etc.)
   */
  async executeModify(
    connectionId: string,
    sql: string,
    options: QueryOptions = {}
  ): Promise<
    QueryExecutionResult<{ changes: number; lastInsertRowid: number }>
  > {
    const startTime = performance.now();

    try {
      const entry = connectionPool.getConnection(connectionId);
      if (!entry) {
        return {
          success: false,
          error: 'Connection not found',
          timing: this.createTiming(startTime),
        };
      }

      const adapter = entry.adapter;
      connectionPool.markInUse(connectionId);

      const result = adapter.executeAsync
        ? await adapter.executeAsync(connectionId, sql, options.params)
        : adapter.execute(connectionId, sql, options.params);

      connectionPool.markIdle(connectionId);

      if (result.success) {
        return {
          success: true,
          data: {
            changes: result.changes,
            lastInsertRowid: result.lastInsertRowid,
          },
          timing: this.createTiming(startTime),
        };
      }

      return {
        success: false,
        error: result.error,
        errorCode: 'errorCode' in result ? result.errorCode : undefined,
        timing: this.createTiming(startTime),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timing: this.createTiming(startTime),
      };
    }
  }

  /**
   * Execute one or more SQL statements
   */
  async executeMultiple(
    connectionId: string,
    sql: string,
    _options: QueryOptions = {}
  ): Promise<
    QueryExecutionResult<{
      columns?: string[];
      rows?: Record<string, unknown>[];
      changes?: number;
      executedStatements?: number;
    }>
  > {
    const startTime = performance.now();

    try {
      const entry = connectionPool.getConnection(connectionId);
      if (!entry) {
        return {
          success: false,
          error: 'Connection not found',
          timing: this.createTiming(startTime),
        };
      }

      const adapter = entry.adapter;
      connectionPool.markInUse(connectionId);

      const result = adapter.executeQueryAsync
        ? await adapter.executeQueryAsync(connectionId, sql)
        : adapter.executeQuery(connectionId, sql);

      connectionPool.markIdle(connectionId);

      if (result.success) {
        return {
          success: true,
          data: {
            columns: result.columns,
            rows: result.rows,
            changes: result.changes,
            executedStatements:
              'executedStatements' in result
                ? (result.executedStatements as number)
                : undefined,
          },
          timing: this.createTiming(startTime),
        };
      }

      return {
        success: false,
        error: result.error,
        errorCode:
          'errorCode' in result ? (result.errorCode as ErrorCode) : undefined,
        errorPosition:
          'errorPosition' in result
            ? (result.errorPosition as ErrorPosition)
            : undefined,
        troubleshootingSteps:
          'troubleshootingSteps' in result
            ? (result.troubleshootingSteps as string[])
            : undefined,
        timing: this.createTiming(startTime),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timing: this.createTiming(startTime),
      };
    }
  }

  /**
   * Get query execution plan
   */
  async explainQuery(
    connectionId: string,
    sql: string
  ): Promise<
    QueryExecutionResult<{
      plan: import('@shared/types').QueryPlanNode;
      stats: import('@shared/types').QueryPlanStats;
    }>
  > {
    const startTime = performance.now();

    try {
      const entry = connectionPool.getConnection(connectionId);
      if (!entry) {
        return {
          success: false,
          error: 'Connection not found',
          timing: this.createTiming(startTime),
        };
      }

      const adapter = entry.adapter;

      const result = adapter.explainQueryAsync
        ? await adapter.explainQueryAsync(connectionId, sql)
        : adapter.explainQuery(connectionId, sql);

      if (result.success) {
        return {
          success: true,
          data: {
            plan: result.plan,
            stats: result.stats,
          },
          timing: this.createTiming(startTime),
        };
      }

      return {
        success: false,
        error: result.error,
        timing: this.createTiming(startTime),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timing: this.createTiming(startTime),
      };
    }
  }

  /**
   * Validate a SQL query
   */
  validateQuery(
    connectionId: string,
    sql: string
  ): import('@shared/types').ValidationResult {
    const entry = connectionPool.getConnection(connectionId);
    if (!entry) {
      return { isValid: false, error: 'Connection not found' };
    }

    return entry.adapter.validateQuery(connectionId, sql);
  }

  /**
   * Create timing information
   */
  private createTiming(startTime: number): QueryTiming {
    const endTime = performance.now();
    return {
      startTime,
      endTime,
      durationMs: Math.round(endTime - startTime),
    };
  }
}

// Export singleton instance
export const queryEngine = new QueryEngine();

// Export class for custom instances
export { QueryEngine };
