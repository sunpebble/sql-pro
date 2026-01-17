/**
 * Qdrant vector database adapter
 * Maps Qdrant concepts to SQL Pro's database abstraction:
 * - Collection -> Table
 * - Point -> Row
 * - Payload fields -> Columns
 * - Vector -> Special __vector column
 * - Point ID -> __rowId
 */

import type {
  DatabaseConnectionConfig,
  GetColumnDistributionResponse,
  GetTableDataResponse,
  PendingChangeInfo,
  QueryPlanNode,
  QueryPlanStats,
  SchemaInfo,
  TableInfo,
  ValidationResult,
} from '@shared/types';
import type {
  AdapterConnectionInfo,
  DatabaseAdapter,
  OpenResult,
} from './types';
import { QdrantClient } from '@qdrant/js-client-rest';

interface QdrantConnectionInfo {
  id: string;
  client: QdrantClient;
  host: string;
  port: number;
  useTLS: boolean;
  displayName: string;
}

// ID generator following existing pattern
let idCounter = 0;
function generateId(): string {
  idCounter += 1;
  return `qdrant_${idCounter}_${Math.random().toString(36).substring(2, 9)}`;
}

// Error message for SQL operations not supported by Qdrant
const SQL_NOT_SUPPORTED_ERROR =
  'SQL operations are not supported for Qdrant vector database';
const NOT_IMPLEMENTED_ERROR = 'Not implemented yet';

/**
 * Qdrant vector database adapter implementation
 */
export class QdrantAdapter implements DatabaseAdapter {
  readonly type = 'qdrant' as const;
  private connections: Map<string, QdrantConnectionInfo> = new Map();

  private getConnectionConfig(config: DatabaseConnectionConfig) {
    return {
      host: config.qdrantHost || config.host || 'localhost',
      port: config.qdrantPort || config.port || 6333,
      useTLS: config.qdrantUseTLS ?? false,
      apiKey: config.qdrantApiKey,
    };
  }

  async open(config: DatabaseConnectionConfig): Promise<OpenResult> {
    const { host, port, useTLS, apiKey } = this.getConnectionConfig(config);

    try {
      const client = new QdrantClient({
        host,
        port,
        https: useTLS,
        apiKey,
      });

      // Test connection by listing collections
      await client.getCollections();

      const id = generateId();
      // Build a display name for the connection
      const displayName = config.name || `${host}:${port}`;
      const connectionInfo: QdrantConnectionInfo = {
        id,
        client,
        host,
        port,
        useTLS,
        displayName,
      };

      this.connections.set(id, connectionInfo);

      return {
        success: true,
        connection: {
          id,
          path: `${useTLS ? 'https' : 'http'}://${host}:${port}`,
          filename: displayName,
          isEncrypted: !!apiKey,
          isReadOnly: false,
          databaseType: 'qdrant',
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to connect to Qdrant: ${errorMessage}`,
        errorCode: 'CONNECTION_ERROR',
        troubleshootingSteps: [
          `Verify Qdrant is running at ${host}:${port}`,
          'Check if the port is correct (default: 6333 for REST API)',
          'Ensure network connectivity to the Qdrant server',
          'If using TLS, verify the certificate is valid',
          'If using API key, verify it is correct',
        ],
      };
    }
  }

  async testConnection(config: DatabaseConnectionConfig): Promise<
    | { success: true; latencyMs: number; serverVersion?: string }
    | {
        success: false;
        error: string;
        errorCode?: 'CONNECTION_ERROR';
        troubleshootingSteps?: string[];
      }
  > {
    const { host, port, useTLS, apiKey } = this.getConnectionConfig(config);

    try {
      const client = new QdrantClient({
        host,
        port,
        https: useTLS,
        apiKey,
      });

      // Test connection by listing collections
      const startTime = performance.now();
      await client.getCollections();
      const latencyMs = Math.round(performance.now() - startTime);

      return {
        success: true,
        latencyMs,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to connect to Qdrant: ${errorMessage}`,
        errorCode: 'CONNECTION_ERROR',
        troubleshootingSteps: [
          `Verify Qdrant is running at ${host}:${port}`,
          'Check if the port is correct (default: 6333 for REST API)',
          'Ensure network connectivity to the Qdrant server',
          'If using TLS, verify the certificate is valid',
          'If using API key, verify it is correct',
        ],
      };
    }
  }

  close(
    connectionId: string
  ): { success: true } | { success: false; error: string } {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return { success: false, error: `Connection not found: ${connectionId}` };
    }

    // QdrantClient doesn't have an explicit close method
    // Just remove from our connections map
    this.connections.delete(connectionId);
    return { success: true };
  }

  closeAll(): void {
    // Clear all connections
    this.connections.clear();
  }

  getConnection(connectionId: string): AdapterConnectionInfo | null {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return null;
    }

    return {
      id: connection.id,
      path: `${connection.useTLS ? 'https' : 'http'}://${connection.host}:${connection.port}`,
      filename: connection.displayName,
      isEncrypted: false,
      isReadOnly: false,
      databaseType: 'qdrant',
    };
  }

  // ============================================
  // Schema and Data Methods (Not Yet Implemented)
  // ============================================

  getSchema(_connectionId: string):
    | {
        success: true;
        schemas: SchemaInfo[];
        tables: TableInfo[];
        views: TableInfo[];
      }
    | { success: false; error: string } {
    return { success: false, error: NOT_IMPLEMENTED_ERROR };
  }

  getTableData(
    _connectionId: string,
    _table: string,
    _page: number,
    _pageSize: number,
    _sortColumn?: string,
    _sortDirection?: 'asc' | 'desc',
    _filters?: Array<{ column: string; operator: string; value: string }>,
    _schema?: string
  ): GetTableDataResponse {
    return { success: false, error: NOT_IMPLEMENTED_ERROR };
  }

  getTableStructure(
    _connectionId: string,
    _tableName: string,
    _schema?: string
  ):
    | { success: true; structure: TableInfo }
    | { success: false; error: string } {
    return { success: false, error: NOT_IMPLEMENTED_ERROR };
  }

  getColumnDistribution(
    _connectionId: string,
    _table: string,
    _column: string,
    _schema?: string,
    _limit?: number
  ): GetColumnDistributionResponse {
    return { success: false, error: NOT_IMPLEMENTED_ERROR };
  }

  // ============================================
  // SQL Methods (Not Supported for Qdrant)
  // ============================================

  execute(
    _connectionId: string,
    _sql: string,
    _params?: unknown[]
  ):
    | { success: true; changes: number; lastInsertRowid: number }
    | { success: false; error: string; errorCode?: 'QUERY_EXECUTION_ERROR' } {
    return {
      success: false,
      error: SQL_NOT_SUPPORTED_ERROR,
      errorCode: 'QUERY_EXECUTION_ERROR',
    };
  }

  query(
    _connectionId: string,
    _sql: string,
    _params?: unknown[]
  ):
    | { success: true; columns: string[]; rows: unknown[][] }
    | { success: false; error: string; errorCode?: 'QUERY_EXECUTION_ERROR' } {
    return {
      success: false,
      error: SQL_NOT_SUPPORTED_ERROR,
      errorCode: 'QUERY_EXECUTION_ERROR',
    };
  }

  executeQuery(
    _connectionId: string,
    _query: string
  ):
    | {
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
    | { success: false; error: string; errorCode?: 'QUERY_EXECUTION_ERROR' } {
    return {
      success: false,
      error: SQL_NOT_SUPPORTED_ERROR,
      errorCode: 'QUERY_EXECUTION_ERROR',
    };
  }

  validateQuery(_connectionId: string, _sql: string): ValidationResult {
    return { isValid: false, error: SQL_NOT_SUPPORTED_ERROR };
  }

  explainQuery(
    _connectionId: string,
    _sql: string
  ):
    | { success: true; plan: QueryPlanNode; stats: QueryPlanStats }
    | { success: false; error: string } {
    return { success: false, error: SQL_NOT_SUPPORTED_ERROR };
  }

  // ============================================
  // Change Management (Not Yet Implemented)
  // ============================================

  validateChanges(
    _connectionId: string,
    _changes: PendingChangeInfo[]
  ):
    | { success: true; results: ValidationResult[] }
    | { success: false; error: string } {
    return { success: false, error: NOT_IMPLEMENTED_ERROR };
  }

  applyChanges(
    _connectionId: string,
    _changes: PendingChangeInfo[]
  ):
    | { success: true; appliedCount: number }
    | { success: false; error: string } {
    return { success: false, error: NOT_IMPLEMENTED_ERROR };
  }

  getPendingChanges(
    _connectionId: string
  ):
    | { success: true; changes: PendingChangeInfo[] }
    | { success: false; error: string } {
    return { success: false, error: NOT_IMPLEMENTED_ERROR };
  }
}

export const qdrantAdapter = new QdrantAdapter();
