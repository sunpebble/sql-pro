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
  ColumnInfo,
  DatabaseConnectionConfig,
  GetColumnDistributionResponse,
  GetTableDataResponse,
  PendingChangeInfo,
  QdrantSearchFilter,
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
    return {
      success: false,
      error: 'Use getSchemaAsync for Qdrant connections',
    };
  }

  async getSchemaAsync(connectionId: string): Promise<
    | {
        success: true;
        schemas: SchemaInfo[];
        tables: TableInfo[];
        views: TableInfo[];
      }
    | { success: false; error: string }
  > {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }

    try {
      const result = await connection.client.getCollections();

      // Map collections to tables
      const tables: TableInfo[] = result.collections.map((collection) => ({
        name: collection.name,
        type: 'table' as const,
        schema: 'default',
        rowCount: 0, // Will be populated on demand
        columns: [], // Will be populated by getTableStructure
        primaryKey: [], // Qdrant uses point IDs, not traditional primary keys
        indexes: [],
        foreignKeys: [],
        triggers: [],
        sql: '', // Not applicable for Qdrant collections
      }));

      return {
        success: true,
        schemas: [{ name: 'default', tables, views: [] }],
        tables,
        views: [],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
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
    return {
      success: false,
      error: 'Use getTableDataAsync for Qdrant connections',
    };
  }

  async getTableDataAsync(
    connectionId: string,
    table: string,
    page: number,
    pageSize: number,
    _sortColumn?: string,
    _sortDirection?: 'asc' | 'desc',
    filters?: Array<{ column: string; operator: string; value: string }>,
    _schema?: string
  ): Promise<GetTableDataResponse> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }

    try {
      // Get collection info for total count and vector size
      const collectionInfo = await connection.client.getCollection(table);
      const totalRows = collectionInfo.points_count || 0;

      // Get vector size for display
      const vectorConfig = collectionInfo.config.params.vectors;
      let vectorSize = '?';
      if (
        typeof vectorConfig === 'object' &&
        vectorConfig !== null &&
        'size' in vectorConfig
      ) {
        vectorSize = String(vectorConfig.size);
      }

      // Build filter if provided
      const qdrantFilter = this.buildQdrantFilter(filters);

      // Calculate offset for pagination
      const offset = (page - 1) * pageSize;

      // Use scroll with offset
      const result = await connection.client.scroll(table, {
        limit: pageSize,
        offset: offset > 0 ? offset : undefined,
        with_payload: true,
        with_vector: false,
        filter: qdrantFilter,
      });

      // Get structure for columns
      const structureResult = await this.getTableStructureAsync(
        connectionId,
        table
      );
      if (!structureResult.success) {
        return { success: false, error: structureResult.error };
      }

      // Transform points to rows
      const rows = result.points.map((point) => {
        const row: Record<string, unknown> = {
          __id: String(point.id),
          __vector: `[${vectorSize} dims]`,
        };

        if (point.payload) {
          for (const [key, value] of Object.entries(point.payload)) {
            row[key] = value;
          }
        }

        return row;
      });

      return {
        success: true,
        columns: structureResult.structure.columns,
        rows,
        totalRows,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  // Filter building helpers for Qdrant
  private buildQdrantFilter(
    filters?: Array<{ column: string; operator: string; value: string }>
  ): Record<string, unknown> | undefined {
    if (!filters || filters.length === 0) return undefined;

    const must: Array<Record<string, unknown>> = [];

    for (const filter of filters) {
      if (filter.column.startsWith('__')) continue; // Skip special columns

      const condition = this.buildFilterCondition(filter);
      if (condition) must.push(condition);
    }

    return must.length > 0 ? { must } : undefined;
  }

  private buildFilterCondition(filter: {
    column: string;
    operator: string;
    value: string;
  }): Record<string, unknown> | null {
    const parsedValue = this.parseFilterValue(filter.value);

    switch (filter.operator) {
      case '=':
      case 'equals':
        return { key: filter.column, match: { value: parsedValue } };
      case '>':
        return { key: filter.column, range: { gt: Number(filter.value) } };
      case '>=':
        return { key: filter.column, range: { gte: Number(filter.value) } };
      case '<':
        return { key: filter.column, range: { lt: Number(filter.value) } };
      case '<=':
        return { key: filter.column, range: { lte: Number(filter.value) } };
      case 'contains':
      case 'like':
        return { key: filter.column, match: { text: filter.value } };
      default:
        return null;
    }
  }

  private parseFilterValue(value: string): unknown {
    const num = Number(value);
    if (!Number.isNaN(num)) return num;
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    return value;
  }

  getTableStructure(
    _connectionId: string,
    _tableName: string,
    _schema?: string
  ):
    | { success: true; structure: TableInfo }
    | { success: false; error: string } {
    return {
      success: false,
      error: 'Use getTableStructureAsync for Qdrant connections',
    };
  }

  async getTableStructureAsync(
    connectionId: string,
    tableName: string,
    _schema?: string
  ): Promise<
    { success: true; structure: TableInfo } | { success: false; error: string }
  > {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }

    try {
      // Get collection info
      const collectionInfo = await connection.client.getCollection(tableName);

      // Get sample points to infer payload schema
      const samplePoints = await connection.client.scroll(tableName, {
        limit: 100,
        with_payload: true,
        with_vector: false,
      });

      // Infer columns from payload
      const payloadFields = new Map<string, string>();

      for (const point of samplePoints.points) {
        if (point.payload) {
          for (const [key, value] of Object.entries(point.payload)) {
            if (!payloadFields.has(key)) {
              payloadFields.set(key, this.inferType(value));
            }
          }
        }
      }

      // Get vector size - handle both simple and named vector configurations
      const vectorConfig = collectionInfo.config.params.vectors;
      let vectorSize = '?';
      if (typeof vectorConfig === 'object' && vectorConfig !== null) {
        if ('size' in vectorConfig) {
          vectorSize = String(vectorConfig.size);
        }
      }

      // Build columns array
      const columns: ColumnInfo[] = [
        {
          name: '__id',
          type: 'TEXT',
          nullable: false,
          isPrimaryKey: true,
          defaultValue: null,
        },
        {
          name: '__vector',
          type: `VECTOR[${vectorSize}]`,
          nullable: false,
          isPrimaryKey: false,
          defaultValue: null,
        },
      ];

      // Add payload columns
      for (const [name, type] of payloadFields) {
        columns.push({
          name,
          type,
          nullable: true,
          isPrimaryKey: false,
          defaultValue: null,
        });
      }

      const structure: TableInfo = {
        name: tableName,
        type: 'table',
        schema: 'default',
        rowCount: collectionInfo.points_count || 0,
        columns,
        primaryKey: ['__id'],
        indexes: [],
        foreignKeys: [],
        triggers: [],
        sql: '',
      };

      return { success: true, structure };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  private inferType(value: unknown): string {
    if (value === null || value === undefined) return 'TEXT';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'INTEGER' : 'FLOAT';
    }
    if (typeof value === 'boolean') return 'BOOLEAN';
    if (typeof value === 'string') return 'TEXT';
    if (Array.isArray(value)) return 'ARRAY';
    if (typeof value === 'object') return 'JSON';
    return 'TEXT';
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
    return {
      success: false,
      error: 'Use applyChangesAsync for Qdrant connections',
    };
  }

  async applyChangesAsync(
    connectionId: string,
    changes: PendingChangeInfo[]
  ): Promise<
    { success: true; appliedCount: number } | { success: false; error: string }
  > {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }

    try {
      let appliedCount = 0;

      for (const change of changes) {
        const collectionName = change.table;

        switch (change.type) {
          case 'insert': {
            if (!change.newValues) continue;

            const { __vector, __id, ...payload } = change.newValues as Record<
              string,
              unknown
            >;

            // Parse vector if provided as string
            let vector: number[] | undefined;
            if (__vector && typeof __vector === 'string') {
              try {
                vector = JSON.parse(__vector);
              } catch {
                return {
                  success: false,
                  error:
                    'Invalid vector format. Expected JSON array of numbers.',
                };
              }
            } else if (Array.isArray(__vector)) {
              vector = __vector as number[];
            }

            if (!vector || !Array.isArray(vector)) {
              return {
                success: false,
                error:
                  'Vector is required for insert. Provide __vector as array of numbers.',
              };
            }

            // Generate ID if not provided
            const pointId = __id ? String(__id) : crypto.randomUUID();

            await connection.client.upsert(collectionName, {
              wait: true,
              points: [{ id: pointId, vector, payload }],
            });
            appliedCount++;
            break;
          }

          case 'update': {
            if (!change.newValues) continue;

            const pointId = String(change.rowId);
            const {
              __vector: _v,
              __id: _i,
              ...payload
            } = change.newValues as Record<string, unknown>;

            // Update payload only (vector updates would require full upsert)
            await connection.client.setPayload(collectionName, {
              wait: true,
              points: [pointId],
              payload,
            });
            appliedCount++;
            break;
          }

          case 'delete': {
            const pointId = String(change.rowId);
            await connection.client.delete(collectionName, {
              wait: true,
              points: [pointId],
            });
            appliedCount++;
            break;
          }
        }
      }

      return { success: true, appliedCount };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  // ============================================
  // Vector Search Methods
  // ============================================

  async vectorSearch(
    connectionId: string,
    collection: string,
    params: {
      vector: number[];
      limit: number;
      scoreThreshold?: number;
      filter?: QdrantSearchFilter;
      withPayload?: boolean;
      withVector?: boolean;
    }
  ): Promise<
    | {
        success: true;
        results: Array<{
          id: string | number;
          score: number;
          payload: Record<string, unknown>;
          vector?: number[];
        }>;
      }
    | { success: false; error: string }
  > {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }

    try {
      const searchResult = await connection.client.search(collection, {
        vector: params.vector,
        limit: params.limit,
        score_threshold: params.scoreThreshold,
        filter: params.filter,
        with_payload: params.withPayload ?? true,
        with_vector: params.withVector ?? false,
      });

      const results = searchResult.map((point) => ({
        id: point.id,
        score: point.score,
        payload: (point.payload as Record<string, unknown>) || {},
        vector: point.vector as number[] | undefined,
      }));

      return { success: true, results };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  async searchSimilar(
    connectionId: string,
    collection: string,
    pointId: string | number,
    limit: number,
    filter?: QdrantSearchFilter
  ): Promise<
    | {
        success: true;
        results: Array<{
          id: string | number;
          score: number;
          payload: Record<string, unknown>;
        }>;
      }
    | { success: false; error: string }
  > {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }

    try {
      // First, get the vector for the specified point
      const pointResult = await connection.client.retrieve(collection, {
        ids: [pointId],
        with_vector: true,
        with_payload: false,
      });

      if (pointResult.length === 0) {
        return { success: false, error: `Point ${pointId} not found` };
      }

      const sourceVector = pointResult[0].vector as number[];
      if (!sourceVector || !Array.isArray(sourceVector)) {
        return { success: false, error: 'Point does not have a vector' };
      }

      // Search for similar points, excluding the source point
      const searchResult = await connection.client.search(collection, {
        vector: sourceVector,
        limit: limit + 1, // Get one extra to filter out the source
        filter,
        with_payload: true,
        with_vector: false,
      });

      // Filter out the source point and limit results
      const results = searchResult
        .filter((point) => String(point.id) !== String(pointId))
        .slice(0, limit)
        .map((point) => ({
          id: point.id,
          score: point.score,
          payload: (point.payload as Record<string, unknown>) || {},
        }));

      return { success: true, results };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  async getPointsWithVectors(
    connectionId: string,
    collection: string,
    options: {
      limit: number;
      ids?: (string | number)[];
    }
  ): Promise<
    | {
        success: true;
        points: Array<{
          id: string | number;
          vector: number[];
          payload: Record<string, unknown>;
        }>;
        vectorDimension: number;
      }
    | { success: false; error: string }
  > {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }

    try {
      // Get collection info for vector dimension
      const collectionInfo = await connection.client.getCollection(collection);
      const vectorConfig = collectionInfo.config.params.vectors;
      let vectorDimension = 0;
      if (
        typeof vectorConfig === 'object' &&
        vectorConfig !== null &&
        'size' in vectorConfig
      ) {
        vectorDimension = vectorConfig.size as number;
      }

      let points: Array<{
        id: string | number;
        vector: number[];
        payload: Record<string, unknown>;
      }>;

      if (options.ids && options.ids.length > 0) {
        // Retrieve specific points by ID
        const result = await connection.client.retrieve(collection, {
          ids: options.ids,
          with_vector: true,
          with_payload: true,
        });

        points = result.map((point) => ({
          id: point.id,
          vector: point.vector as number[],
          payload: (point.payload as Record<string, unknown>) || {},
        }));
      } else {
        // Random sample using scroll
        const result = await connection.client.scroll(collection, {
          limit: options.limit,
          with_vector: true,
          with_payload: true,
        });

        points = result.points.map((point) => ({
          id: point.id,
          vector: point.vector as number[],
          payload: (point.payload as Record<string, unknown>) || {},
        }));
      }

      return { success: true, points, vectorDimension };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
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
