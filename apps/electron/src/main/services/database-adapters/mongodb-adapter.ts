/**
 * MongoDB adapter.
 * Maps collections to tables and documents to rows for the shared data grid.
 */

import type {
  ColumnInfo,
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
import type { Collection, Document, Filter, Sort } from 'mongodb';
import type {
  AdapterConnectionInfo,
  DatabaseAdapter,
  OpenResult,
} from './types';
import { MongoClient, ObjectId } from 'mongodb';

interface MongoConnectionOptions {
  uri: string;
  host: string;
  port: number;
  database: string;
  useTLS: boolean;
}

interface MongoConnectionInfo extends MongoConnectionOptions {
  id: string;
  client: MongoClient;
  displayName: string;
  isReadOnly: boolean;
}

interface MongoCommandCursorResult {
  cursor?: {
    firstBatch?: Document[];
  };
  values?: unknown[];
}

const MONGODB_NOT_EDITABLE =
  'Inline editing is not yet supported for MongoDB collections';
const MONGO_URI_PREFIX_REGEX = /^mongodb(?:\+srv)?:\/\//i;
const LEADING_SLASH_REGEX = /^\//;
const REGEX_ESCAPE_REGEX = /[.*+?^${}()|[\]\\]/g;
const READ_ONLY_COMMANDS = new Set([
  'aggregate',
  'buildInfo',
  'collStats',
  'count',
  'dbStats',
  'distinct',
  'find',
  'listCollections',
  'listIndexes',
  'ping',
  'serverStatus',
]);

let idCounter = 0;

function generateId(): string {
  idCounter += 1;
  return `mongodb_${idCounter}_${Math.random().toString(36).substring(2, 9)}`;
}

function normalizeConfig(
  config: DatabaseConnectionConfig
): MongoConnectionOptions {
  const host = config.host || '';
  const useTLS = config.ssl === true || typeof config.ssl === 'object';
  const databaseFromConfig = config.database || '';

  if (MONGO_URI_PREFIX_REGEX.test(host)) {
    return {
      uri: host,
      host,
      port: config.port || 27017,
      database: databaseFromConfig || databaseFromUri(host) || 'admin',
      useTLS,
    };
  }

  const auth =
    config.username || config.password
      ? `${encodeURIComponent(config.username || '')}:${encodeURIComponent(
          config.password || ''
        )}@`
      : '';
  const port = config.port || 27017;

  return {
    uri: `mongodb://${auth}${host}:${port}`,
    host,
    port,
    database: databaseFromConfig,
    useTLS,
  };
}

function databaseFromUri(uri: string): string | undefined {
  try {
    const url = new URL(uri);
    const database = decodeURIComponent(
      url.pathname.replace(LEADING_SLASH_REGEX, '')
    );
    return database || undefined;
  } catch {
    return undefined;
  }
}

function inferMongoType(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (value instanceof ObjectId) return 'ObjectId';
  if (value instanceof Date) return 'Date';
  if (Array.isArray(value)) return 'Array';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'Integer' : 'Double';
  }
  if (typeof value === 'boolean') return 'Boolean';
  if (typeof value === 'object') return 'Document';
  return 'String';
}

function serializeMongoValue(value: unknown): unknown {
  if (value instanceof ObjectId) return value.toHexString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value) || (value && typeof value === 'object')) {
    return JSON.stringify(value, (_key, nestedValue: unknown) =>
      nestedValue instanceof ObjectId
        ? nestedValue.toHexString()
        : nestedValue instanceof Date
          ? nestedValue.toISOString()
          : nestedValue
    );
  }
  return value;
}

function serializeDocument(document: Document): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(document)) {
    row[key] = serializeMongoValue(value);
  }
  return row;
}

function valueForFilter(column: string, value: string): unknown {
  if (column === '_id' && ObjectId.isValid(value)) {
    return new ObjectId(value);
  }

  if (value === 'true') return true;
  if (value === 'false') return false;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && value.trim() !== ''
    ? numberValue
    : value;
}

function buildMongoFilter(
  filters?: Array<{ column: string; operator: string; value: string }>
): Filter<Document> {
  if (!filters || filters.length === 0) return {};

  const query: Filter<Document> = {};
  for (const filter of filters) {
    const value = valueForFilter(filter.column, filter.value);
    const operator = filter.operator.toLowerCase();

    switch (operator) {
      case '=':
      case 'equals':
        query[filter.column] = value;
        break;
      case '!=':
      case '<>':
      case 'not equals':
        query[filter.column] = { $ne: value };
        break;
      case '>':
        query[filter.column] = { $gt: value };
        break;
      case '>=':
        query[filter.column] = { $gte: value };
        break;
      case '<':
        query[filter.column] = { $lt: value };
        break;
      case '<=':
        query[filter.column] = { $lte: value };
        break;
      case 'contains':
      case 'like':
        query[filter.column] = {
          $regex: filter.value.replace(REGEX_ESCAPE_REGEX, '\\$&'),
          $options: 'i',
        };
        break;
      default:
        break;
    }
  }

  return query;
}

function columnsFromDocuments(documents: Document[]): ColumnInfo[] {
  const fields = new Map<string, string>();
  fields.set('_id', 'ObjectId');

  for (const document of documents) {
    for (const [key, value] of Object.entries(document)) {
      if (!fields.has(key)) fields.set(key, inferMongoType(value));
    }
  }

  return Array.from(fields.entries()).map(([name, type]) => ({
    name,
    type,
    nullable: name !== '_id',
    defaultValue: null,
    isPrimaryKey: name === '_id',
  }));
}

function rowsFromCommandResult(result: Document): {
  columns: string[];
  rows: Record<string, unknown>[];
} {
  const cursorResult = result as MongoCommandCursorResult;
  const batch = cursorResult.cursor?.firstBatch;
  if (Array.isArray(batch)) {
    const rows = batch.map(serializeDocument);
    return {
      columns: rows[0] ? Object.keys(rows[0]) : [],
      rows,
    };
  }

  if (Array.isArray(cursorResult.values)) {
    return {
      columns: ['index', 'value'],
      rows: cursorResult.values.map((value, index) => ({
        index,
        value: serializeMongoValue(value),
      })),
    };
  }

  const row = serializeDocument(result);
  return {
    columns: Object.keys(row),
    rows: [row],
  };
}

export class MongoDBAdapter implements DatabaseAdapter {
  readonly type = 'mongodb' as const;
  private connections = new Map<string, MongoConnectionInfo>();

  async open(config: DatabaseConnectionConfig): Promise<OpenResult> {
    const options = normalizeConfig(config);
    const validationError = this.validateOptions(options);
    if (validationError) {
      return {
        success: false,
        error: validationError,
        errorCode: 'CONNECTION_ERROR',
      };
    }

    try {
      const client = await this.createClient(options);
      await client.db(options.database).command({ ping: 1 });
      const id = generateId();
      const displayName =
        config.name || `${options.host}:${options.port}/${options.database}`;
      const connection: MongoConnectionInfo = {
        id,
        client,
        displayName,
        isReadOnly: config.readOnly ?? false,
        ...options,
      };

      this.connections.set(id, connection);

      return {
        success: true,
        connection: {
          id,
          path: this.buildUrl(connection),
          filename: displayName,
          isEncrypted: options.useTLS,
          isReadOnly: connection.isReadOnly,
          databaseType: 'mongodb',
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to connect to MongoDB',
        errorCode: 'CONNECTION_ERROR',
        troubleshootingSteps: [
          'Verify MongoDB is reachable at the configured host and port',
          'Check database name, username, and password',
          'Use a full mongodb:// or mongodb+srv:// URI for clusters with custom options',
          'Enable TLS only when the MongoDB endpoint expects TLS',
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
    const options = normalizeConfig(config);
    const validationError = this.validateOptions(options);
    if (validationError) {
      return {
        success: false,
        error: validationError,
        errorCode: 'CONNECTION_ERROR',
      };
    }

    let client: MongoClient | null = null;
    try {
      client = await this.createClient(options);
      const startTime = performance.now();
      await client.db(options.database).command({ ping: 1 });
      const serverInfo = await client.db(options.database).admin().serverInfo();
      const latencyMs = Math.round(performance.now() - startTime);
      const version = serverInfo.version;

      return {
        success: true,
        latencyMs,
        serverVersion:
          typeof version === 'string' ? `MongoDB ${version}` : 'MongoDB',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to connect to MongoDB',
        errorCode: 'CONNECTION_ERROR',
        troubleshootingSteps: [
          'Verify MongoDB is reachable at the configured host and port',
          'Check database name, username, and password',
          'Use a full mongodb:// or mongodb+srv:// URI for clusters with custom options',
          'Enable TLS only when the MongoDB endpoint expects TLS',
        ],
      };
    } finally {
      await client?.close();
    }
  }

  close(
    connectionId: string
  ): { success: true } | { success: false; error: string } {
    const connection = this.connections.get(connectionId);
    if (!connection) return { success: false, error: 'Connection not found' };

    void connection.client.close();
    this.connections.delete(connectionId);
    return { success: true };
  }

  closeAll(): void {
    for (const connection of this.connections.values()) {
      void connection.client.close();
    }
    this.connections.clear();
  }

  getConnection(connectionId: string): AdapterConnectionInfo | null {
    const connection = this.connections.get(connectionId);
    if (!connection) return null;

    return {
      id: connection.id,
      path: this.buildUrl(connection),
      filename: connection.displayName,
      isEncrypted: connection.useTLS,
      isReadOnly: connection.isReadOnly,
      databaseType: 'mongodb',
    };
  }

  getSchema(_connectionId: string):
    | {
        success: true;
        schemas: SchemaInfo[];
        tables: TableInfo[];
        views: TableInfo[];
      }
    | { success: false; error: string } {
    return { success: false, error: 'Use getSchemaAsync for MongoDB' };
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
    if (!connection) return { success: false, error: 'Connection not found' };

    try {
      const db = connection.client.db(connection.database);
      const collections = await db.listCollections().toArray();
      const tables = await Promise.all(
        collections.map((collection) =>
          this.buildTableInfo(connection, collection.name)
        )
      );
      const schema = {
        name: connection.database,
        tables,
        views: [],
      };

      return {
        success: true,
        schemas: [schema],
        tables,
        views: [],
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load MongoDB schema',
      };
    }
  }

  getTableStructure(
    _connectionId: string,
    _tableName: string
  ):
    | { success: true; structure: TableInfo }
    | { success: false; error: string } {
    return {
      success: false,
      error: 'Use getTableStructureAsync for MongoDB',
    };
  }

  async getTableStructureAsync(
    connectionId: string,
    tableName: string
  ): Promise<
    { success: true; structure: TableInfo } | { success: false; error: string }
  > {
    const connection = this.connections.get(connectionId);
    if (!connection) return { success: false, error: 'Connection not found' };

    try {
      return {
        success: true,
        structure: await this.buildTableInfo(connection, tableName),
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load MongoDB collection structure',
      };
    }
  }

  getTableData(
    _connectionId: string,
    _table: string,
    _page: number,
    _pageSize: number
  ): GetTableDataResponse {
    return { success: false, error: 'Use getTableDataAsync for MongoDB' };
  }

  async getTableDataAsync(
    connectionId: string,
    table: string,
    page: number,
    pageSize: number,
    sortColumn?: string,
    sortDirection?: 'asc' | 'desc',
    filters?: Array<{ column: string; operator: string; value: string }>
  ): Promise<GetTableDataResponse> {
    const connection = this.connections.get(connectionId);
    if (!connection) return { success: false, error: 'Connection not found' };

    try {
      const collection = this.collection(connection, table);
      const filter = buildMongoFilter(filters);
      const sort: Sort = sortColumn
        ? { [sortColumn]: sortDirection === 'desc' ? -1 : 1 }
        : { _id: 1 };
      const offset = Math.max(0, page - 1) * pageSize;
      const [documents, totalRows, structure] = await Promise.all([
        collection
          .find(filter)
          .sort(sort)
          .skip(offset)
          .limit(pageSize)
          .toArray(),
        collection.countDocuments(filter),
        this.buildTableInfo(connection, table),
      ]);

      return {
        success: true,
        columns: structure.columns,
        rows: documents.map(serializeDocument),
        totalRows,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load MongoDB collection data',
      };
    }
  }

  execute(
    _connectionId: string,
    _sql: string
  ):
    | { success: true; changes: number; lastInsertRowid: number }
    | { success: false; error: string } {
    return { success: false, error: 'Use executeAsync for MongoDB' };
  }

  async executeAsync(
    connectionId: string,
    query: string
  ): Promise<
    | { success: true; changes: number; lastInsertRowid: number }
    | { success: false; error: string }
  > {
    const result = await this.executeQueryAsync(connectionId, query);
    if (!result.success) return result;

    return {
      success: true,
      changes: result.changes || 0,
      lastInsertRowid: 0,
    };
  }

  query(
    _connectionId: string,
    _sql: string
  ):
    | { success: true; columns: string[]; rows: unknown[][] }
    | { success: false; error: string } {
    return { success: false, error: 'Use queryAsync for MongoDB' };
  }

  async queryAsync(
    connectionId: string,
    query: string
  ): Promise<
    | { success: true; columns: string[]; rows: unknown[][] }
    | { success: false; error: string }
  > {
    const result = await this.executeQueryAsync(connectionId, query);
    if (!result.success) return result;

    return {
      success: true,
      columns: result.columns || [],
      rows: (result.rows || []).map((row) =>
        (result.columns || []).map((column) => row[column])
      ),
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
        changes?: number;
        lastInsertRowid?: number;
      }
    | { success: false; error: string } {
    return { success: false, error: 'Use executeQueryAsync for MongoDB' };
  }

  async executeQueryAsync(
    connectionId: string,
    query: string
  ): Promise<
    | {
        success: true;
        columns?: string[];
        rows?: Record<string, unknown>[];
        changes?: number;
        lastInsertRowid?: number;
      }
    | { success: false; error: string }
  > {
    const connection = this.connections.get(connectionId);
    if (!connection) return { success: false, error: 'Connection not found' };

    try {
      const command = JSON.parse(query) as Document;
      const commandName = Object.keys(command)[0];
      if (
        connection.isReadOnly &&
        (!commandName || !READ_ONLY_COMMANDS.has(commandName))
      ) {
        return {
          success: false,
          error: `Cannot run ${commandName || 'command'} on a read-only MongoDB connection`,
        };
      }

      const result = await connection.client
        .db(connection.database)
        .command(command);
      const mapped = rowsFromCommandResult(result);
      return {
        success: true,
        ...mapped,
        changes: 0,
        lastInsertRowid: 0,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'MongoDB query must be a JSON command object',
      };
    }
  }

  validateQuery(_connectionId: string, query: string): ValidationResult {
    try {
      const parsed = JSON.parse(query);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return {
          isValid: false,
          error: 'MongoDB query must be a JSON command object',
        };
      }
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Invalid JSON command',
      };
    }
  }

  explainQuery(
    _connectionId: string,
    _sql: string
  ):
    | { success: true; plan: QueryPlanNode; stats: QueryPlanStats }
    | { success: false; error: string } {
    return {
      success: false,
      error:
        'MongoDB command explain is not available through this adapter yet',
    };
  }

  validateChanges(
    connectionId: string,
    changes: PendingChangeInfo[]
  ):
    | { success: true; results: ValidationResult[] }
    | { success: false; error: string } {
    if (!this.connections.has(connectionId)) {
      return { success: false, error: 'Connection not found' };
    }

    return {
      success: true,
      results: changes.map((change) => ({
        changeId: change.id,
        isValid: false,
        error: MONGODB_NOT_EDITABLE,
      })),
    };
  }

  applyChanges(
    _connectionId: string,
    _changes: PendingChangeInfo[]
  ):
    | { success: true; appliedCount: number }
    | { success: false; error: string } {
    return { success: false, error: MONGODB_NOT_EDITABLE };
  }

  getPendingChanges(
    connectionId: string
  ):
    | { success: true; changes: PendingChangeInfo[] }
    | { success: false; error: string } {
    if (!this.connections.has(connectionId)) {
      return { success: false, error: 'Connection not found' };
    }
    return { success: true, changes: [] };
  }

  getColumnDistribution(
    _connectionId: string,
    _table: string,
    _column: string
  ): GetColumnDistributionResponse {
    return {
      success: false,
      error: 'Use getColumnDistributionAsync for MongoDB',
    };
  }

  async getColumnDistributionAsync(
    connectionId: string,
    table: string,
    column: string,
    _schema?: string,
    limit?: number
  ): Promise<GetColumnDistributionResponse> {
    const connection = this.connections.get(connectionId);
    if (!connection) return { success: false, error: 'Connection not found' };

    try {
      const collection = this.collection(connection, table);
      const pipeline: Document[] = [
        { $group: { _id: `$${column}`, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ];
      if (limit && limit > 0) pipeline.push({ $limit: Math.floor(limit) });

      const [distributionRows, totalRows, nullCount, distinctValues] =
        await Promise.all([
          collection.aggregate(pipeline).toArray(),
          collection.countDocuments({}),
          collection.countDocuments({ [column]: null }),
          collection.distinct(column, { [column]: { $ne: null } }),
        ]);

      return {
        success: true,
        distribution: distributionRows.map((row) => ({
          value: serializeMongoValue(row._id),
          count: Number(row.count || 0),
          percentage:
            totalRows > 0 ? (Number(row.count || 0) / totalRows) * 100 : 0,
        })),
        totalRows,
        distinctCount: distinctValues.length,
        nullCount,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load MongoDB value distribution',
      };
    }
  }

  private validateOptions(options: MongoConnectionOptions): string | null {
    if (!options.host) return 'MongoDB host is required';
    if (!options.database) return 'MongoDB database is required';
    return null;
  }

  private async createClient(
    options: MongoConnectionOptions
  ): Promise<MongoClient> {
    const client = new MongoClient(options.uri, {
      serverSelectionTimeoutMS: 8000,
      tls: options.useTLS || undefined,
    });
    return client.connect();
  }

  private buildUrl(connection: MongoConnectionInfo): string {
    return MONGO_URI_PREFIX_REGEX.test(connection.host)
      ? connection.host
      : `mongodb://${connection.host}:${connection.port}/${connection.database}`;
  }

  private collection(
    connection: MongoConnectionInfo,
    collectionName: string
  ): Collection<Document> {
    return connection.client.db(connection.database).collection(collectionName);
  }

  private async buildTableInfo(
    connection: MongoConnectionInfo,
    collectionName: string
  ): Promise<TableInfo> {
    const collection = this.collection(connection, collectionName);
    const [rowCount, sampleDocuments, indexes] = await Promise.all([
      collection.estimatedDocumentCount(),
      collection.find({}).limit(50).toArray(),
      collection.indexes().catch(() => []),
    ]);

    return {
      name: collectionName,
      type: 'table',
      schema: connection.database,
      rowCount,
      columns: columnsFromDocuments(sampleDocuments),
      primaryKey: ['_id'],
      indexes: indexes.map((index) => ({
        name: index.name || '',
        columns: Object.keys(index.key || {}),
        isUnique: !!index.unique,
        sql: JSON.stringify(index),
      })),
      foreignKeys: [],
      triggers: [],
      sql: '',
    };
  }
}

export const mongoDBAdapter = new MongoDBAdapter();
