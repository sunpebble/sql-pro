/**
 * Database Adapter Interface
 *
 * Unified interface for all database adapters (SQLite, MySQL, PostgreSQL, etc.)
 * This re-exports and extends the existing types from the services layer.
 */

import type {
  ColumnInfo,
  DatabaseConnectionConfig,
  DatabaseType,
  ErrorCode,
  ErrorPosition,
  GetColumnDistributionResponse,
  GetTableDataResponse,
  PendingChangeInfo,
  QueryPlanNode,
  QueryPlanStats,
  SchemaInfo,
  TableInfo,
  ValidationResult,
} from '@shared/types';

// ============================================
// Connection Types
// ============================================

/**
 * Connection information returned by adapters
 */
export interface AdapterConnectionInfo {
  id: string;
  path: string;
  filename: string;
  isEncrypted: boolean;
  isReadOnly: boolean;
  databaseType: DatabaseType;
}

/**
 * Open connection result
 */
export type OpenResult =
  | { success: true; connection: AdapterConnectionInfo }
  | {
      success: false;
      error: string;
      needsPassword?: boolean;
      errorCode?: ErrorCode;
      troubleshootingSteps?: string[];
      documentationUrl?: string;
    };

/**
 * Query execution result
 */
export interface QueryResult {
  columns: string[];
  rows: unknown[][];
}

/**
 * Execute (non-SELECT) result
 */
export interface ExecuteResult {
  changes: number;
  lastInsertRowid: number;
}

/**
 * Generic adapter result type
 */
export type AdapterResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      errorCode?: ErrorCode;
      errorPosition?: ErrorPosition;
      troubleshootingSteps?: string[];
      documentationUrl?: string;
    };

// ============================================
// Row Range Types (for virtual scrolling)
// ============================================

/**
 * Result type for getTableRowRange operation
 */
export interface RowRangeResult {
  success: boolean;
  columns?: ColumnInfo[];
  rows?: Record<string, unknown>[];
  totalRows?: number;
  isEstimatedTotal?: boolean;
  actualStartRow?: number;
  actualEndRow?: number;
  error?: string;
}

// ============================================
// Database Adapter Interface
// ============================================

/**
 * Abstract database adapter interface
 * All database-specific adapters must implement this interface
 */
export interface IDatabaseAdapter {
  /**
   * Get the database type this adapter handles
   */
  readonly type: DatabaseType;

  // ============================================
  // Connection Management
  // ============================================

  /**
   * Test database connection without establishing a persistent connection
   */
  testConnection: (config: DatabaseConnectionConfig) => Promise<
    | {
        success: true;
        latencyMs: number;
        serverVersion?: string;
      }
    | {
        success: false;
        error: string;
        errorCode?: ErrorCode;
        troubleshootingSteps?: string[];
      }
  >;

  /**
   * Open a database connection
   */
  open: (config: DatabaseConnectionConfig) => Promise<OpenResult>;

  /**
   * Close a database connection
   */
  close: (
    connectionId: string
  ) => { success: true } | { success: false; error: string };

  /**
   * Get connection information
   */
  getConnection: (connectionId: string) => AdapterConnectionInfo | null;

  /**
   * Close all connections managed by this adapter
   */
  closeAll: () => void;

  // ============================================
  // Schema Operations
  // ============================================

  /**
   * Get database schema (sync version)
   */
  getSchema: (connectionId: string) => | {
        success: true;
        schemas: SchemaInfo[];
        tables: TableInfo[];
        views: TableInfo[];
      }
    | { success: false; error: string };

  /**
   * Get database schema (async version for MySQL/PostgreSQL)
   */
  getSchemaAsync?: (connectionId: string) => Promise<
    | {
        success: true;
        schemas: SchemaInfo[];
        tables: TableInfo[];
        views: TableInfo[];
      }
    | { success: false; error: string }
  >;

  /**
   * Get table structure
   */
  getTableStructure: (
    connectionId: string,
    tableName: string,
    schema?: string
  ) => | { success: true; structure: TableInfo }
    | { success: false; error: string };

  /**
   * Get table structure (async version)
   */
  getTableStructureAsync?: (
    connectionId: string,
    tableName: string,
    schema?: string
  ) => Promise<
    { success: true; structure: TableInfo } | { success: false; error: string }
  >;

  // ============================================
  // Query Execution
  // ============================================

  /**
   * Execute a non-SELECT query (INSERT, UPDATE, DELETE, etc.)
   */
  execute: (
    connectionId: string,
    sql: string,
    params?: unknown[]
  ) => | { success: true; changes: number; lastInsertRowid: number }
    | {
        success: false;
        error: string;
        errorCode?: ErrorCode;
        errorPosition?: ErrorPosition;
        troubleshootingSteps?: string[];
        documentationUrl?: string;
      };

  /**
   * Execute a non-SELECT query (async version)
   */
  executeAsync?: (
    connectionId: string,
    sql: string,
    params?: unknown[]
  ) => Promise<
    | { success: true; changes: number; lastInsertRowid: number }
    | {
        success: false;
        error: string;
        errorCode?: ErrorCode;
      }
  >;

  /**
   * Execute a SELECT query
   */
  query: (
    connectionId: string,
    sql: string,
    params?: unknown[]
  ) => | { success: true; columns: string[]; rows: unknown[][] }
    | {
        success: false;
        error: string;
        errorCode?: ErrorCode;
        errorPosition?: ErrorPosition;
        troubleshootingSteps?: string[];
        documentationUrl?: string;
      };

  /**
   * Execute a SELECT query (async version)
   */
  queryAsync?: (
    connectionId: string,
    sql: string,
    params?: unknown[]
  ) => Promise<
    | { success: true; columns: string[]; rows: unknown[][] }
    | { success: false; error: string }
  >;

  /**
   * Execute one or more SQL statements
   */
  executeQuery: (
    connectionId: string,
    query: string
  ) => | {
        success: true;
        columns?: string[];
        rows?: Record<string, unknown>[];
        resultSets?: Array<{
          columns: string[];
          rows: Record<string, unknown>[];
        }>;
        changes?: number;
        lastInsertRowid?: number;
        executedStatements?: number;
        totalChanges?: number;
      }
    | {
        success: false;
        error: string;
        errorCode?: ErrorCode;
        errorPosition?: ErrorPosition;
        troubleshootingSteps?: string[];
        documentationUrl?: string;
      };

  /**
   * Execute one or more SQL statements (async version)
   */
  executeQueryAsync?: (
    connectionId: string,
    query: string
  ) => Promise<
    | {
        success: true;
        columns?: string[];
        rows?: Record<string, unknown>[];
        changes?: number;
        lastInsertRowid?: number;
      }
    | { success: false; error: string }
  >;

  // ============================================
  // Data Retrieval
  // ============================================

  /**
   * Get table data with pagination, sorting, and filtering
   */
  getTableData: (
    connectionId: string,
    table: string,
    page: number,
    pageSize: number,
    sortColumn?: string,
    sortDirection?: 'asc' | 'desc',
    filters?: Array<{
      column: string;
      operator: string;
      value: string;
    }>,
    schema?: string
  ) => GetTableDataResponse;

  /**
   * Get table data (async version)
   */
  getTableDataAsync?: (
    connectionId: string,
    table: string,
    page: number,
    pageSize: number,
    sortColumn?: string,
    sortDirection?: 'asc' | 'desc',
    filters?: Array<{
      column: string;
      operator: string;
      value: string;
    }>,
    schema?: string
  ) => Promise<GetTableDataResponse>;

  /**
   * Get a range of rows from a table (for virtual scrolling)
   */
  getTableRowRange?: (
    connectionId: string,
    table: string,
    startRow: number,
    endRow: number,
    sortColumn?: string,
    sortDirection?: 'asc' | 'desc',
    filters?: Array<{
      column: string;
      operator: string;
      value: string;
    }>,
    schema?: string
  ) => RowRangeResult;

  /**
   * Get column value distribution (GROUP BY aggregation)
   */
  getColumnDistribution: (
    connectionId: string,
    table: string,
    column: string,
    schema?: string,
    limit?: number
  ) => GetColumnDistributionResponse | Promise<GetColumnDistributionResponse>;

  // ============================================
  // Query Plan & Validation
  // ============================================

  /**
   * Validate a SQL query without executing it
   */
  validateQuery: (connectionId: string, sql: string) => ValidationResult;

  /**
   * Get query execution plan
   */
  explainQuery: (
    connectionId: string,
    sql: string
  ) => | { success: true; plan: QueryPlanNode; stats: QueryPlanStats }
    | { success: false; error: string };

  /**
   * Get query execution plan (async version)
   */
  explainQueryAsync?: (
    connectionId: string,
    sql: string
  ) => Promise<
    | { success: true; plan: QueryPlanNode; stats: QueryPlanStats }
    | { success: false; error: string }
  >;

  // ============================================
  // Change Management
  // ============================================

  /**
   * Validate pending changes
   */
  validateChanges: (
    connectionId: string,
    changes: PendingChangeInfo[]
  ) => | { success: true; results: ValidationResult[] }
    | { success: false; error: string };

  /**
   * Apply pending changes
   */
  applyChanges: (
    connectionId: string,
    changes: PendingChangeInfo[]
  ) => | { success: true; appliedCount: number }
    | { success: false; error: string };

  /**
   * Apply pending changes (async version)
   */
  applyChangesAsync?: (
    connectionId: string,
    changes: PendingChangeInfo[]
  ) => Promise<
    { success: true; appliedCount: number } | { success: false; error: string }
  >;

  /**
   * Get pending changes for a connection
   */
  getPendingChanges: (
    connectionId: string
  ) => | { success: true; changes: PendingChangeInfo[] }
    | { success: false; error: string };
}

// ============================================
// Constants
// ============================================

/**
 * Default port numbers for each database type
 */
export const DEFAULT_PORTS: Record<DatabaseType, number> = {
  sqlite: 0, // Not applicable
  mysql: 3306,
  postgresql: 5432,
  supabase: 5432, // Supabase uses PostgreSQL
  qdrant: 6333, // Qdrant REST API default port
  turso: 0, // Not applicable - uses HTTPS URLs
};

/**
 * Display names for database types
 */
export const DATABASE_TYPE_NAMES: Record<DatabaseType, string> = {
  sqlite: 'SQLite',
  mysql: 'MySQL',
  postgresql: 'PostgreSQL',
  supabase: 'Supabase',
  qdrant: 'Qdrant',
  turso: 'Turso',
};

// Re-export for compatibility
export type { DatabaseAdapter } from '../../services/database-adapters/types';
