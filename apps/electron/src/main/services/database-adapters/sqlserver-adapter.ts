/**
 * Microsoft SQL Server adapter.
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
import type { ConnectionPool, IResult } from 'mssql';
import type {
  AdapterConnectionInfo,
  DatabaseAdapter,
  OpenResult,
} from './types';
import sql from 'mssql';

interface SqlServerConnectionInfo {
  id: string;
  pool: ConnectionPool;
  host: string;
  port: number;
  database: string;
  displayName: string;
  isReadOnly: boolean;
  useTLS: boolean;
}

interface SqlServerTableRow {
  schemaName: string;
  tableName: string;
  tableType: string;
}

interface SqlServerColumnRow {
  columnName: string;
  dataType: string;
  isNullable: string;
  columnDefault: string | null;
  isPrimaryKey: number | boolean | null;
}

interface SqlServerCountRow {
  count?: number;
  rowCount?: number;
  totalRows?: number;
  nullCount?: number;
  distinctCount?: number;
}

const SQLSERVER_NOT_EDITABLE =
  'Inline editing is not yet supported for SQL Server connections';
const BRACKET_REGEX = /\]/g;
const SINGLE_QUOTE_REGEX = /'/g;
const READ_ONLY_SQLSERVER_QUERY_REGEX = /^\s*(?:SELECT|WITH|EXEC\s+sp_)/i;

let idCounter = 0;

function generateId(): string {
  idCounter += 1;
  return `sqlserver_${idCounter}_${Math.random().toString(36).substring(2, 9)}`;
}

function quoteIdentifier(identifier: string): string {
  return `[${identifier.replace(BRACKET_REGEX, ']]')}]`;
}

function quoteLiteral(value: string): string {
  return `'${value.replace(SINGLE_QUOTE_REGEX, "''")}'`;
}

function qualifiedTable(schema: string, table: string): string {
  return `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;
}

function isPrimaryKey(value: unknown): boolean {
  return value === true || value === 1 || value === '1';
}

function recordsetColumns(result: IResult<Record<string, unknown>>): string[] {
  const rows = result.recordset || [];
  const columns = (
    rows as Array<Record<string, unknown>> & {
      columns?: Record<string, unknown>;
    }
  ).columns;

  if (columns) return Object.keys(columns);
  return rows[0] ? Object.keys(rows[0]) : [];
}

function normalizeConfig(config: DatabaseConnectionConfig) {
  const useTLS = config.ssl === true || typeof config.ssl === 'object';
  return {
    host: config.host || '',
    port: config.port || 1433,
    database: config.database || '',
    username: config.username || '',
    password: config.password || '',
    useTLS,
  };
}

function buildWhereClause(
  filters?: Array<{ column: string; operator: string; value: string }>
): string {
  if (!filters || filters.length === 0) return '';

  const clauses = filters
    .map((filter) => {
      const column = quoteIdentifier(filter.column);
      const value = quoteLiteral(filter.value);
      const operator = filter.operator.toLowerCase();

      switch (operator) {
        case '=':
        case 'equals':
          return `${column} = ${value}`;
        case '!=':
        case '<>':
        case 'not equals':
          return `${column} <> ${value}`;
        case '>':
        case '>=':
        case '<':
        case '<=':
          return `${column} ${filter.operator} ${value}`;
        case 'contains':
        case 'like':
          return `${column} LIKE ${quoteLiteral(`%${filter.value}%`)}`;
        case 'starts_with':
        case 'starts with':
          return `${column} LIKE ${quoteLiteral(`${filter.value}%`)}`;
        case 'ends_with':
        case 'ends with':
          return `${column} LIKE ${quoteLiteral(`%${filter.value}`)}`;
        default:
          return null;
      }
    })
    .filter(Boolean);

  return clauses.length > 0 ? ` WHERE ${clauses.join(' AND ')}` : '';
}

export class SQLServerAdapter implements DatabaseAdapter {
  readonly type = 'sqlserver' as const;
  private connections = new Map<string, SqlServerConnectionInfo>();

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
      const pool = await this.createPool(options);
      const id = generateId();
      const displayName =
        config.name || `${options.host}:${options.port}/${options.database}`;
      const connection: SqlServerConnectionInfo = {
        id,
        pool,
        host: options.host,
        port: options.port,
        database: options.database,
        displayName,
        isReadOnly: config.readOnly ?? false,
        useTLS: options.useTLS,
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
          databaseType: 'sqlserver',
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to connect to SQL Server',
        errorCode: 'CONNECTION_ERROR',
        troubleshootingSteps: [
          'Verify SQL Server is reachable at the configured host and port',
          'Check database name, username, and password',
          'Enable TLS only when the SQL Server endpoint expects encryption',
          'Ensure the login can access the selected database',
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

    let pool: ConnectionPool | null = null;
    try {
      pool = await this.createPool(options);
      const startTime = performance.now();
      const result = await pool.request().query('SELECT @@VERSION AS version');
      const latencyMs = Math.round(performance.now() - startTime);
      const version = result.recordset?.[0]?.version;

      return {
        success: true,
        latencyMs,
        serverVersion:
          typeof version === 'string' ? version.split('\n')[0] : 'SQL Server',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to connect to SQL Server',
        errorCode: 'CONNECTION_ERROR',
        troubleshootingSteps: [
          'Verify SQL Server is reachable at the configured host and port',
          'Check database name, username, and password',
          'Enable TLS only when the SQL Server endpoint expects encryption',
          'Ensure the login can access the selected database',
        ],
      };
    } finally {
      await pool?.close();
    }
  }

  close(
    connectionId: string
  ): { success: true } | { success: false; error: string } {
    const connection = this.connections.get(connectionId);
    if (!connection) return { success: false, error: 'Connection not found' };

    void connection.pool.close();
    this.connections.delete(connectionId);
    return { success: true };
  }

  closeAll(): void {
    for (const connection of this.connections.values()) {
      void connection.pool.close();
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
      databaseType: 'sqlserver',
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
    return { success: false, error: 'Use getSchemaAsync for SQL Server' };
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
      const result = await connection.pool.request().query(`
        SELECT
          TABLE_SCHEMA AS schemaName,
          TABLE_NAME AS tableName,
          TABLE_TYPE AS tableType
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE IN ('BASE TABLE', 'VIEW')
        ORDER BY TABLE_SCHEMA, TABLE_NAME
      `);
      const rows = result.recordset as SqlServerTableRow[];
      const schemasByName = new Map<string, SchemaInfo>();
      const tables: TableInfo[] = [];
      const views: TableInfo[] = [];

      for (const row of rows) {
        const table = await this.buildTableInfo(
          connection,
          row.schemaName,
          row.tableName,
          row.tableType === 'VIEW' ? 'view' : 'table'
        );
        const schema =
          schemasByName.get(row.schemaName) ||
          ({
            name: row.schemaName,
            tables: [],
            views: [],
          } satisfies SchemaInfo);
        schemasByName.set(row.schemaName, schema);

        if (table.type === 'view') {
          schema.views.push(table);
          views.push(table);
        } else {
          schema.tables.push(table);
          tables.push(table);
        }
      }

      return {
        success: true,
        schemas: Array.from(schemasByName.values()),
        tables,
        views,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load SQL Server schema',
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
      error: 'Use getTableStructureAsync for SQL Server',
    };
  }

  async getTableStructureAsync(
    connectionId: string,
    tableName: string,
    schema = 'dbo'
  ): Promise<
    { success: true; structure: TableInfo } | { success: false; error: string }
  > {
    const connection = this.connections.get(connectionId);
    if (!connection) return { success: false, error: 'Connection not found' };

    try {
      return {
        success: true,
        structure: await this.buildTableInfo(connection, schema, tableName),
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load SQL Server table structure',
      };
    }
  }

  getTableData(
    _connectionId: string,
    _table: string,
    _page: number,
    _pageSize: number
  ): GetTableDataResponse {
    return { success: false, error: 'Use getTableDataAsync for SQL Server' };
  }

  async getTableDataAsync(
    connectionId: string,
    table: string,
    page: number,
    pageSize: number,
    sortColumn?: string,
    sortDirection?: 'asc' | 'desc',
    filters?: Array<{ column: string; operator: string; value: string }>,
    schema = 'dbo'
  ): Promise<GetTableDataResponse> {
    const connection = this.connections.get(connectionId);
    if (!connection) return { success: false, error: 'Connection not found' };

    try {
      const tableRef = qualifiedTable(schema, table);
      const whereClause = buildWhereClause(filters);
      const offset = Math.max(0, page - 1) * pageSize;
      const orderClause = sortColumn
        ? `ORDER BY ${quoteIdentifier(sortColumn)} ${sortDirection === 'desc' ? 'DESC' : 'ASC'}`
        : 'ORDER BY (SELECT NULL)';
      const dataResult = await connection.pool.request().query(`
        SELECT *
        FROM ${tableRef}
        ${whereClause}
        ${orderClause}
        OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY
      `);
      const countResult = await connection.pool.request().query(`
        SELECT COUNT(*) AS count
        FROM ${tableRef}
        ${whereClause}
      `);
      const structure = await this.buildTableInfo(connection, schema, table);

      return {
        success: true,
        columns: structure.columns,
        rows: dataResult.recordset || [],
        totalRows: Number(countResult.recordset?.[0]?.count || 0),
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load SQL Server table data',
      };
    }
  }

  execute(
    _connectionId: string,
    _sql: string
  ):
    | { success: true; changes: number; lastInsertRowid: number }
    | { success: false; error: string } {
    return { success: false, error: 'Use executeAsync for SQL Server' };
  }

  async executeAsync(
    connectionId: string,
    sqlText: string
  ): Promise<
    | { success: true; changes: number; lastInsertRowid: number }
    | { success: false; error: string }
  > {
    const result = await this.executeQueryAsync(connectionId, sqlText);
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
    return { success: false, error: 'Use queryAsync for SQL Server' };
  }

  async queryAsync(
    connectionId: string,
    sqlText: string
  ): Promise<
    | { success: true; columns: string[]; rows: unknown[][] }
    | { success: false; error: string }
  > {
    const result = await this.executeQueryAsync(connectionId, sqlText);
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
    return { success: false, error: 'Use executeQueryAsync for SQL Server' };
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
    if (connection.isReadOnly && !READ_ONLY_SQLSERVER_QUERY_REGEX.test(query)) {
      return {
        success: false,
        error:
          'Cannot execute write query on a read-only SQL Server connection',
      };
    }

    try {
      const result = await connection.pool.request().query(query);
      const rows = (result.recordset || []) as Record<string, unknown>[];

      return {
        success: true,
        columns: recordsetColumns(result as IResult<Record<string, unknown>>),
        rows,
        changes: (result.rowsAffected || []).reduce(
          (sum, count) => sum + count,
          0
        ),
        lastInsertRowid: 0,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to execute SQL Server query',
      };
    }
  }

  validateQuery(_connectionId: string, query: string): ValidationResult {
    if (!query.trim()) {
      return { isValid: false, error: 'Query cannot be empty' };
    }
    return { isValid: true };
  }

  explainQuery(
    _connectionId: string,
    _sql: string
  ):
    | { success: true; plan: QueryPlanNode; stats: QueryPlanStats }
    | { success: false; error: string } {
    return {
      success: false,
      error: 'Use SQL Server execution plans from the query editor',
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
        error: SQLSERVER_NOT_EDITABLE,
      })),
    };
  }

  applyChanges(
    _connectionId: string,
    _changes: PendingChangeInfo[]
  ):
    | { success: true; appliedCount: number }
    | { success: false; error: string } {
    return { success: false, error: SQLSERVER_NOT_EDITABLE };
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
      error: 'Use getColumnDistributionAsync for SQL Server',
    };
  }

  async getColumnDistributionAsync(
    connectionId: string,
    table: string,
    column: string,
    schema = 'dbo',
    limit?: number
  ): Promise<GetColumnDistributionResponse> {
    const connection = this.connections.get(connectionId);
    if (!connection) return { success: false, error: 'Connection not found' };

    try {
      const tableRef = qualifiedTable(schema, table);
      const columnRef = quoteIdentifier(column);
      const topClause = limit && limit > 0 ? `TOP (${Math.floor(limit)})` : '';
      const distributionResult = await connection.pool.request().query(`
        SELECT ${topClause} ${columnRef} AS value, COUNT(*) AS count
        FROM ${tableRef}
        GROUP BY ${columnRef}
        ORDER BY count DESC
      `);
      const statsResult = await connection.pool.request().query(`
        SELECT
          COUNT(*) AS totalRows,
          SUM(CASE WHEN ${columnRef} IS NULL THEN 1 ELSE 0 END) AS nullCount,
          COUNT(DISTINCT ${columnRef}) AS distinctCount
        FROM ${tableRef}
      `);
      const stats = (statsResult.recordset?.[0] || {}) as SqlServerCountRow;
      const totalRows = Number(stats.totalRows || 0);

      return {
        success: true,
        distribution: (distributionResult.recordset || []).map((row) => ({
          value: row.value,
          count: Number(row.count || 0),
          percentage:
            totalRows > 0 ? (Number(row.count || 0) / totalRows) * 100 : 0,
        })),
        totalRows,
        distinctCount: Number(stats.distinctCount || 0),
        nullCount: Number(stats.nullCount || 0),
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load SQL Server value distribution',
      };
    }
  }

  private validateOptions(
    options: ReturnType<typeof normalizeConfig>
  ): string | null {
    if (!options.host) return 'SQL Server host is required';
    if (!options.database) return 'SQL Server database is required';
    if (!Number.isInteger(options.port) || options.port <= 0) {
      return 'SQL Server port must be a positive integer';
    }
    return null;
  }

  private async createPool(
    options: ReturnType<typeof normalizeConfig>
  ): Promise<ConnectionPool> {
    const pool = new sql.ConnectionPool({
      server: options.host,
      port: options.port,
      database: options.database,
      user: options.username || undefined,
      password: options.password || undefined,
      options: {
        encrypt: options.useTLS,
        trustServerCertificate: !options.useTLS,
      },
    });
    return pool.connect();
  }

  private buildUrl(connection: SqlServerConnectionInfo): string {
    return `sqlserver://${connection.host}:${connection.port}/${connection.database}`;
  }

  private async buildTableInfo(
    connection: SqlServerConnectionInfo,
    schema: string,
    tableName: string,
    type: 'table' | 'view' = 'table'
  ): Promise<TableInfo> {
    const columnsResult = await connection.pool
      .request()
      .input('schema', schema)
      .input('tableName', tableName).query(`
        SELECT
          c.COLUMN_NAME AS columnName,
          c.DATA_TYPE AS dataType,
          c.IS_NULLABLE AS isNullable,
          c.COLUMN_DEFAULT AS columnDefault,
          CASE WHEN pk.COLUMN_NAME IS NULL THEN 0 ELSE 1 END AS isPrimaryKey
        FROM INFORMATION_SCHEMA.COLUMNS c
        LEFT JOIN (
          SELECT ku.TABLE_SCHEMA, ku.TABLE_NAME, ku.COLUMN_NAME
          FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
          INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
            ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
           AND tc.TABLE_SCHEMA = ku.TABLE_SCHEMA
           AND tc.TABLE_NAME = ku.TABLE_NAME
          WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
        ) pk
          ON c.TABLE_SCHEMA = pk.TABLE_SCHEMA
         AND c.TABLE_NAME = pk.TABLE_NAME
         AND c.COLUMN_NAME = pk.COLUMN_NAME
        WHERE c.TABLE_SCHEMA = @schema
          AND c.TABLE_NAME = @tableName
        ORDER BY c.ORDINAL_POSITION
      `);
    const columns = (columnsResult.recordset as SqlServerColumnRow[]).map(
      (column) => ({
        name: column.columnName,
        type: column.dataType,
        nullable: column.isNullable === 'YES',
        defaultValue: column.columnDefault,
        isPrimaryKey: isPrimaryKey(column.isPrimaryKey),
      })
    );
    const primaryKey = columns
      .filter((column) => column.isPrimaryKey)
      .map((column) => column.name);
    const rowCountResult = await connection.pool
      .request()
      .input('schema', schema)
      .input('tableName', tableName).query(`
        SELECT SUM(p.rows) AS rowCount
        FROM sys.tables t
        INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
        INNER JOIN sys.partitions p ON t.object_id = p.object_id
        WHERE s.name = @schema
          AND t.name = @tableName
          AND p.index_id IN (0, 1)
      `);
    const rowCount = Number(
      (rowCountResult.recordset?.[0] as SqlServerCountRow | undefined)
        ?.rowCount || 0
    );

    return {
      name: tableName,
      schema,
      type,
      columns,
      primaryKey,
      indexes: [],
      foreignKeys: [],
      triggers: [],
      rowCount,
      sql: '',
    };
  }
}

export const sqlServerAdapter = new SQLServerAdapter();
