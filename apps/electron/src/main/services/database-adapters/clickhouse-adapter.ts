/**
 * ClickHouse database adapter.
 * Uses ClickHouse's HTTP interface so no native driver is required.
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
import type {
  AdapterConnectionInfo,
  DatabaseAdapter,
  OpenResult,
} from './types';
import { Buffer } from 'node:buffer';
import { sanitizeIdentifier } from '@/utils/sql-sanitize';

interface ClickHouseConnectionInfo {
  id: string;
  host: string;
  port: number;
  database: string;
  username?: string;
  password?: string;
  useTLS: boolean;
  displayName: string;
  isReadOnly: boolean;
}

interface ClickHouseJsonResponse {
  meta?: Array<{ name: string; type: string }>;
  data?: Record<string, unknown>[];
}

interface ClickHouseTableRow {
  database: string;
  name: string;
  engine: string;
  total_rows: string | number | null;
}

interface ClickHouseColumnRow {
  name: string;
  type: string;
  default_expression?: string | null;
  is_in_primary_key?: string | number | boolean;
}

let idCounter = 0;

const READ_QUERY_REGEX = /^\s*(?:SELECT|WITH|SHOW|DESCRIBE|DESC|EXPLAIN)\b/i;
const FORMAT_JSON_REGEX = /\bFORMAT\s+JSON\b/i;
const TRAILING_SEMICOLON_REGEX = /;\s*$/;
const SINGLE_QUOTE_REGEX = /'/g;
const COUNT_COLUMN = 'count';

function generateId(): string {
  idCounter += 1;
  return `clickhouse_${idCounter}_${Math.random().toString(36).substring(2, 9)}`;
}

function quoteLiteral(value: string): string {
  return `'${value.replace(SINGLE_QUOTE_REGEX, "''")}'`;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function isPrimaryKeyValue(value: unknown): boolean {
  return value === true || value === 1 || value === '1';
}

function stripTrailingSemicolon(sql: string): string {
  return sql.trim().replace(TRAILING_SEMICOLON_REGEX, '');
}

function withJsonFormat(sql: string): string {
  const cleanSql = stripTrailingSemicolon(sql);
  return FORMAT_JSON_REGEX.test(cleanSql)
    ? cleanSql
    : `${cleanSql} FORMAT JSON`;
}

function columnFromMeta(meta: { name: string; type: string }): ColumnInfo {
  return {
    name: meta.name,
    type: meta.type,
    nullable: meta.type.startsWith('Nullable('),
    defaultValue: null,
    isPrimaryKey: false,
  };
}

function columnFromSystemColumn(column: ClickHouseColumnRow): ColumnInfo {
  return {
    name: column.name,
    type: column.type,
    nullable: column.type.startsWith('Nullable('),
    defaultValue: column.default_expression || null,
    isPrimaryKey: isPrimaryKeyValue(column.is_in_primary_key),
  };
}

export class ClickHouseAdapter implements DatabaseAdapter {
  readonly type = 'clickhouse' as const;
  private connections: Map<string, ClickHouseConnectionInfo> = new Map();

  async open(config: DatabaseConnectionConfig): Promise<OpenResult> {
    const connectionConfig = this.normalizeConfig(config);
    if (!connectionConfig.host) {
      return {
        success: false,
        error: 'ClickHouse host is required',
        errorCode: 'CONNECTION_ERROR',
      };
    }

    const testResult = await this.testConnection(config);
    if (!testResult.success) {
      return {
        success: false,
        error: testResult.error || 'Failed to connect to ClickHouse',
        errorCode: testResult.errorCode,
        troubleshootingSteps: testResult.troubleshootingSteps,
      };
    }

    const id = generateId();
    const displayName =
      config.name ||
      `${connectionConfig.host}:${connectionConfig.port}/${connectionConfig.database}`;
    const connection: ClickHouseConnectionInfo = {
      id,
      ...connectionConfig,
      displayName,
      isReadOnly: config.readOnly ?? false,
    };

    this.connections.set(id, connection);

    return {
      success: true,
      connection: {
        id,
        path: this.buildUrl(connection),
        filename: displayName,
        isEncrypted: connection.useTLS,
        isReadOnly: connection.isReadOnly,
        databaseType: 'clickhouse',
      },
    };
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
    const connection = this.normalizeConfig(config);
    if (!connection.host) {
      return {
        success: false,
        error: 'ClickHouse host is required',
        errorCode: 'CONNECTION_ERROR',
      };
    }

    try {
      const startTime = performance.now();
      const result = await this.postJson(
        connection,
        'SELECT version() AS version'
      );
      const latencyMs = Math.round(performance.now() - startTime);
      const version = result.data?.[0]?.version;

      return {
        success: true,
        latencyMs,
        serverVersion:
          typeof version === 'string' ? `ClickHouse ${version}` : 'ClickHouse',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to connect to ClickHouse',
        errorCode: 'CONNECTION_ERROR',
        troubleshootingSteps: [
          'Verify the ClickHouse HTTP interface is reachable',
          'Check the host and HTTP/HTTPS port',
          'Verify the database, username, and password are correct',
          'Ensure the user can run SELECT version()',
        ],
      };
    }
  }

  close(
    connectionId: string
  ): { success: true } | { success: false; error: string } {
    if (!this.connections.has(connectionId)) {
      return { success: false, error: 'Connection not found' };
    }
    this.connections.delete(connectionId);
    return { success: true };
  }

  closeAll(): void {
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
      databaseType: 'clickhouse',
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
    return {
      success: false,
      error: 'Use getSchemaAsync for ClickHouse connections',
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
    const connection = this.getRequiredConnection(connectionId);
    if (!connection) return { success: false, error: 'Connection not found' };

    try {
      const database = connection.database || 'default';
      const tablesResult = await this.postJson(
        connection,
        `
          SELECT database, name, engine, total_rows
          FROM system.tables
          WHERE database = ${quoteLiteral(database)}
          ORDER BY name
        `
      );
      const tableRows = (tablesResult.data ||
        []) as unknown as ClickHouseTableRow[];
      const tables: TableInfo[] = [];
      const views: TableInfo[] = [];

      for (const tableRow of tableRows) {
        const table = await this.buildTableInfo(connection, tableRow);
        if (table.type === 'view') {
          views.push(table);
        } else {
          tables.push(table);
        }
      }

      const schemas: SchemaInfo[] = [
        {
          name: database,
          tables,
          views,
        },
      ];

      return { success: true, schemas, tables, views };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load ClickHouse schema',
      };
    }
  }

  async getTableStructureAsync(
    connectionId: string,
    tableName: string,
    schema?: string
  ): Promise<
    { success: true; structure: TableInfo } | { success: false; error: string }
  > {
    const connection = this.getRequiredConnection(connectionId);
    if (!connection) return { success: false, error: 'Connection not found' };

    try {
      const database = schema || connection.database || 'default';
      const result = await this.postJson(
        connection,
        `
          SELECT database, name, engine, total_rows
          FROM system.tables
          WHERE database = ${quoteLiteral(database)}
            AND name = ${quoteLiteral(tableName)}
          LIMIT 1
        `
      );
      const row = result.data?.[0] as ClickHouseTableRow | undefined;
      if (!row) {
        return { success: false, error: `Table "${tableName}" not found` };
      }

      return {
        success: true,
        structure: await this.buildTableInfo(connection, row),
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load ClickHouse table structure',
      };
    }
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
      error: 'Use getTableStructureAsync for ClickHouse connections',
    };
  }

  getTableData(
    _connectionId: string,
    _table: string,
    _page: number,
    _pageSize: number
  ): GetTableDataResponse {
    return {
      success: false,
      error: 'Use getTableDataAsync for ClickHouse connections',
    };
  }

  async getTableDataAsync(
    connectionId: string,
    table: string,
    page: number,
    pageSize: number,
    sortColumn?: string,
    sortDirection?: 'asc' | 'desc',
    filters?: Array<{ column: string; operator: string; value: string }>,
    schema?: string
  ): Promise<GetTableDataResponse> {
    const connection = this.getRequiredConnection(connectionId);
    if (!connection) return { success: false, error: 'Connection not found' };

    try {
      const database = schema || connection.database || 'default';
      const tableRef = this.qualifiedTable(database, table);
      const whereClause = this.buildWhereClause(filters);
      const orderClause = sortColumn
        ? ` ORDER BY ${sanitizeIdentifier(sortColumn, 'mysql')} ${sortDirection === 'desc' ? 'DESC' : 'ASC'}`
        : '';
      const offset = Math.max(0, page - 1) * pageSize;

      const dataResult = await this.postJson(
        connection,
        `SELECT * FROM ${tableRef}${whereClause}${orderClause} LIMIT ${pageSize} OFFSET ${offset}`
      );
      const countResult = await this.postJson(
        connection,
        `SELECT count() AS ${sanitizeIdentifier(COUNT_COLUMN, 'mysql')} FROM ${tableRef}${whereClause}`
      );

      return {
        success: true,
        columns: (dataResult.meta || []).map(columnFromMeta),
        rows: dataResult.data || [],
        totalRows: toOptionalNumber(countResult.data?.[0]?.[COUNT_COLUMN]) || 0,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load ClickHouse table data',
      };
    }
  }

  execute(
    _connectionId: string,
    _sql: string
  ):
    | { success: true; changes: number; lastInsertRowid: number }
    | { success: false; error: string } {
    return { success: false, error: 'Use executeAsync for ClickHouse' };
  }

  async executeAsync(
    connectionId: string,
    sql: string
  ): Promise<
    | { success: true; changes: number; lastInsertRowid: number }
    | { success: false; error: string }
  > {
    const result = await this.executeQueryAsync(connectionId, sql);
    if (!result.success) return result;

    return {
      success: true,
      changes: result.changes || 0,
      lastInsertRowid: result.lastInsertRowid || 0,
    };
  }

  query(
    _connectionId: string,
    _sql: string
  ):
    | { success: true; columns: string[]; rows: unknown[][] }
    | { success: false; error: string } {
    return { success: false, error: 'Use queryAsync for ClickHouse' };
  }

  async queryAsync(
    connectionId: string,
    sql: string
  ): Promise<
    | { success: true; columns: string[]; rows: unknown[][] }
    | { success: false; error: string }
  > {
    const result = await this.executeQueryAsync(connectionId, sql);
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
    return { success: false, error: 'Use executeQueryAsync for ClickHouse' };
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
    const connection = this.getRequiredConnection(connectionId);
    if (!connection) return { success: false, error: 'Connection not found' };

    try {
      if (!READ_QUERY_REGEX.test(query)) {
        if (connection.isReadOnly) {
          return {
            success: false,
            error: 'Cannot execute write query on a read-only connection',
          };
        }

        await this.postText(connection, stripTrailingSemicolon(query));
        return { success: true, changes: 0, lastInsertRowid: 0 };
      }

      const result = await this.postJson(connection, query);
      return {
        success: true,
        columns: (result.meta || []).map((column) => column.name),
        rows: result.data || [],
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to execute ClickHouse query',
      };
    }
  }

  validateQuery(_connectionId: string, sql: string): ValidationResult {
    return {
      valid: sql.trim().length > 0,
      error: sql.trim().length > 0 ? undefined : 'Query cannot be empty',
    };
  }

  explainQuery(
    _connectionId: string,
    _sql: string
  ):
    | { success: true; plan: QueryPlanNode; stats: QueryPlanStats }
    | { success: false; error: string } {
    return {
      success: false,
      error: 'Use explainQueryAsync for ClickHouse connections',
    };
  }

  async explainQueryAsync(
    connectionId: string,
    sql: string
  ): Promise<
    | { success: true; plan: QueryPlanNode; stats: QueryPlanStats }
    | { success: false; error: string }
  > {
    const result = await this.executeQueryAsync(
      connectionId,
      `EXPLAIN ${stripTrailingSemicolon(sql)}`
    );
    if (!result.success) return result;

    return {
      success: true,
      plan: {
        id: 0,
        parent: 0,
        notUsed: 0,
        detail: JSON.stringify(result.rows || []),
      },
      stats: {
        rowsReturned: result.rows?.length || 0,
      },
    };
  }

  validateChanges(
    _connectionId: string,
    changes: PendingChangeInfo[]
  ):
    | { success: true; results: ValidationResult[] }
    | { success: false; error: string } {
    return {
      success: true,
      results: changes.map((change) => ({
        changeId: change.id,
        valid: false,
        error: 'Inline editing is not supported for ClickHouse connections',
      })),
    };
  }

  applyChanges(_connectionId: string, _changes: PendingChangeInfo[]) {
    return {
      success: false as const,
      error: 'Inline editing is not supported for ClickHouse connections',
    };
  }

  getPendingChanges(_connectionId: string) {
    return { success: true as const, changes: [] };
  }

  async getColumnDistribution(
    connectionId: string,
    table: string,
    column: string,
    schema?: string,
    limit?: number
  ): Promise<GetColumnDistributionResponse> {
    const connection = this.getRequiredConnection(connectionId);
    if (!connection) return { success: false, error: 'Connection not found' };

    try {
      const database = schema || connection.database || 'default';
      const columnRef = sanitizeIdentifier(column, 'mysql');
      const limitClause = limit ? ` LIMIT ${limit}` : '';
      const result = await this.postJson(
        connection,
        `
          SELECT ${columnRef} AS value, count() AS count
          FROM ${this.qualifiedTable(database, table)}
          GROUP BY ${columnRef}
          ORDER BY count DESC${limitClause}
        `
      );

      const rows = result.data || [];
      const totalRows = rows.reduce(
        (sum, row) => sum + Number(row.count || 0),
        0
      );

      return {
        success: true,
        distribution: rows.map((row) => ({
          value: row.value,
          count: Number(row.count || 0),
          percentage:
            totalRows > 0 ? (Number(row.count || 0) / totalRows) * 100 : 0,
        })),
        totalRows,
        distinctCount: rows.length,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load ClickHouse column distribution',
      };
    }
  }

  private async buildTableInfo(
    connection: ClickHouseConnectionInfo,
    tableRow: ClickHouseTableRow
  ): Promise<TableInfo> {
    const columns = await this.getColumns(
      connection,
      tableRow.database,
      tableRow.name
    );
    const primaryKey = columns
      .filter((column) => column.isPrimaryKey)
      .map((column) => column.name);
    const isView = tableRow.engine.toLowerCase().includes('view');

    return {
      name: tableRow.name,
      schema: tableRow.database,
      type: isView ? 'view' : 'table',
      columns,
      primaryKey,
      foreignKeys: [],
      indexes: [],
      triggers: [],
      rowCount: toOptionalNumber(tableRow.total_rows),
      sql: `${tableRow.engine} ${this.qualifiedTable(
        tableRow.database,
        tableRow.name
      )}`,
    };
  }

  private async getColumns(
    connection: ClickHouseConnectionInfo,
    database: string,
    table: string
  ): Promise<ColumnInfo[]> {
    const result = await this.postJson(
      connection,
      `
        SELECT name, type, default_expression, is_in_primary_key
        FROM system.columns
        WHERE database = ${quoteLiteral(database)}
          AND table = ${quoteLiteral(table)}
        ORDER BY position
      `
    );

    return ((result.data || []) as unknown as ClickHouseColumnRow[]).map(
      columnFromSystemColumn
    );
  }

  private normalizeConfig(
    config: DatabaseConnectionConfig
  ): Omit<ClickHouseConnectionInfo, 'id' | 'displayName' | 'isReadOnly'> {
    return {
      host: config.host || '',
      port: config.port || (config.ssl ? 8443 : 8123),
      database: config.database || 'default',
      username: config.username,
      password: config.password,
      useTLS: !!config.ssl,
    };
  }

  private getRequiredConnection(
    connectionId: string
  ): ClickHouseConnectionInfo | null {
    return this.connections.get(connectionId) || null;
  }

  private buildUrl(
    connection: Pick<
      ClickHouseConnectionInfo,
      'host' | 'port' | 'useTLS' | 'database'
    >
  ): string {
    const protocol = connection.useTLS ? 'https' : 'http';
    const url = new URL(`${protocol}://${connection.host}:${connection.port}/`);
    if (connection.database) {
      url.searchParams.set('database', connection.database);
    }
    return url.toString();
  }

  private buildHeaders(
    connection: Pick<ClickHouseConnectionInfo, 'username' | 'password'>
  ): Record<string, string> {
    const headers: Record<string, string> = {};
    if (connection.username || connection.password) {
      const username = connection.username || 'default';
      const password = connection.password || '';
      headers.Authorization = `Basic ${Buffer.from(
        `${username}:${password}`
      ).toString('base64')}`;
    }
    return headers;
  }

  private async postJson(
    connection: Pick<
      ClickHouseConnectionInfo,
      'host' | 'port' | 'useTLS' | 'database' | 'username' | 'password'
    >,
    sql: string
  ): Promise<ClickHouseJsonResponse> {
    const responseText = await this.postText(connection, withJsonFormat(sql));
    if (!responseText) return { meta: [], data: [] };
    return JSON.parse(responseText) as ClickHouseJsonResponse;
  }

  private async postText(
    connection: Pick<
      ClickHouseConnectionInfo,
      'host' | 'port' | 'useTLS' | 'database' | 'username' | 'password'
    >,
    sql: string
  ): Promise<string> {
    const response = await fetch(this.buildUrl(connection), {
      method: 'POST',
      headers: this.buildHeaders(connection),
      body: stripTrailingSemicolon(sql),
    });
    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(
        responseText || `ClickHouse HTTP request failed (${response.status})`
      );
    }

    return responseText;
  }

  private qualifiedTable(database: string, table: string): string {
    return `${sanitizeIdentifier(database, 'mysql')}.${sanitizeIdentifier(
      table,
      'mysql'
    )}`;
  }

  private buildWhereClause(
    filters?: Array<{ column: string; operator: string; value: string }>
  ): string {
    if (!filters || filters.length === 0) return '';

    const clauses = filters.map((filter) => {
      const column = sanitizeIdentifier(filter.column, 'mysql');
      switch (filter.operator) {
        case 'eq':
          return `${column} = ${quoteLiteral(filter.value)}`;
        case 'neq':
          return `${column} != ${quoteLiteral(filter.value)}`;
        case 'gt':
          return `${column} > ${quoteLiteral(filter.value)}`;
        case 'lt':
          return `${column} < ${quoteLiteral(filter.value)}`;
        case 'gte':
          return `${column} >= ${quoteLiteral(filter.value)}`;
        case 'lte':
          return `${column} <= ${quoteLiteral(filter.value)}`;
        case 'like':
          return `${column} LIKE ${quoteLiteral(`%${filter.value}%`)}`;
        case 'isnull':
          return `isNull(${column})`;
        case 'notnull':
          return `isNotNull(${column})`;
        default:
          return `${column} = ${quoteLiteral(filter.value)}`;
      }
    });

    return ` WHERE ${clauses.join(' AND ')}`;
  }
}

export const clickhouseAdapter = new ClickHouseAdapter();
