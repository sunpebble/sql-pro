/**
 * MySQL database adapter
 * Uses mysql2 for MySQL/MariaDB connections
 */

import type {
  ColumnInfo,
  DatabaseConnectionConfig,
  ErrorCode,
  ForeignKeyInfo,
  GetColumnDistributionResponse,
  GetTableDataResponse,
  IndexInfo,
  PendingChangeInfo,
  QueryPlanNode,
  QueryPlanStats,
  SchemaInfo,
  TableInfo,
  TriggerInfo,
  ValidationResult,
} from '@shared/types';
import type {
  AdapterConnectionInfo,
  DatabaseAdapter,
  OpenResult,
} from './types';
import { sqlLogger } from '../sql-logger';

// MySQL2 types - we'll use dynamic import to avoid issues if not installed
interface MySQLConnection {
  query: (sql: string, params?: unknown[]) => Promise<[unknown[], unknown]>;
  execute: (sql: string, params?: unknown[]) => Promise<[unknown, unknown]>;
  end: () => Promise<void>;
  ping: () => Promise<void>;
}

interface MySQLConnectionInfo {
  id: string;
  connection: MySQLConnection;
  config: DatabaseConnectionConfig;
  filename: string;
  isReadOnly: boolean;
}

// Simple ID generator
let idCounter = 0;
function generateId(): string {
  idCounter += 1;
  return `mysql_${idCounter}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * MySQL database adapter implementation
 */
export class MySQLAdapter implements DatabaseAdapter {
  readonly type = 'mysql' as const;
  private connections: Map<string, MySQLConnectionInfo> = new Map();
  private mysql2: typeof import('mysql2/promise') | null = null;

  private async getMySQL2() {
    if (!this.mysql2) {
      try {
        this.mysql2 = await import('mysql2/promise');
      } catch {
        throw new Error(
          'MySQL2 driver not installed. Please install mysql2 package: npm install mysql2'
        );
      }
    }
    return this.mysql2;
  }

  async open(config: DatabaseConnectionConfig): Promise<OpenResult> {
    if (!config.host) {
      return {
        success: false,
        error: 'MySQL host is required',
        errorCode: 'CONNECTION_ERROR',
      };
    }

    try {
      const mysql2 = await this.getMySQL2();

      const connectionConfig: import('mysql2/promise').ConnectionOptions = {
        host: config.host,
        port: config.port || 3306,
        user: config.username,
        password: config.password,
        database: config.database,
        connectTimeout: 15000, // 15 second connection timeout
      };

      // SSL configuration
      if (config.ssl) {
        if (typeof config.ssl === 'boolean') {
          connectionConfig.ssl = config.ssl ? {} : undefined;
        } else {
          connectionConfig.ssl = {
            rejectUnauthorized: config.ssl.rejectUnauthorized,
            ca: config.ssl.ca,
            cert: config.ssl.cert,
            key: config.ssl.key,
          };
        }
      }

      const connection = await mysql2.createConnection(connectionConfig);

      // Test connection
      await connection.ping();

      const id = generateId();
      const filename =
        config.name ||
        `${config.host}:${config.port || 3306}/${config.database || ''}`;

      const connectionInfo: MySQLConnectionInfo = {
        id,
        connection: connection as unknown as MySQLConnection,
        config,
        filename,
        isReadOnly: config.readOnly ?? false,
      };

      this.connections.set(id, connectionInfo);

      // Log successful open
      sqlLogger.logOpen({
        connectionId: id,
        dbPath: filename,
        success: true,
      });

      return {
        success: true,
        connection: {
          id,
          path: filename,
          filename,
          isEncrypted: !!config.ssl,
          isReadOnly: config.readOnly ?? false,
          databaseType: 'mysql',
        },
      };
    } catch (error) {
      let errorMessage =
        error instanceof Error ? error.message : 'Failed to connect to MySQL';

      // Provide more user-friendly message for timeout errors
      if (
        errorMessage.includes('timeout') ||
        errorMessage.includes('ETIMEDOUT') ||
        errorMessage.includes('ECONNREFUSED')
      ) {
        errorMessage = `Connection timeout: Unable to reach ${config.host}:${config.port || 3306}. Please verify the host address is correct and the server is accessible.`;
      }

      sqlLogger.logOpen({
        connectionId: 'unknown',
        dbPath: `${config.host}:${config.port || 3306}`,
        success: false,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
        errorCode: 'CONNECTION_ERROR',
        troubleshootingSteps: [
          'Verify the MySQL server is running and accessible',
          'Check that the host and port are correct',
          'Verify the username and password are correct',
          'Ensure the database exists and the user has access',
          'Check firewall settings if connecting remotely',
        ],
      };
    }
  }

  /**
   * Test MySQL database connection without establishing a persistent connection
   */
  async testConnection(config: DatabaseConnectionConfig): Promise<
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
  > {
    if (!config.host) {
      return {
        success: false,
        error: 'MySQL host is required',
        errorCode: 'CONNECTION_ERROR',
      };
    }

    const startTime = performance.now();
    let connection: MySQLConnection | null = null;

    try {
      const mysql2 = await this.getMySQL2();

      const connectionConfig: import('mysql2/promise').ConnectionOptions = {
        host: config.host,
        port: config.port || 3306,
        user: config.username,
        password: config.password,
        database: config.database,
        connectTimeout: 10000, // 10 second timeout for test
      };

      // SSL configuration
      if (config.ssl) {
        if (typeof config.ssl === 'boolean') {
          connectionConfig.ssl = config.ssl ? {} : undefined;
        } else {
          connectionConfig.ssl = {
            rejectUnauthorized: config.ssl.rejectUnauthorized,
            ca: config.ssl.ca,
            cert: config.ssl.cert,
            key: config.ssl.key,
          };
        }
      }

      connection = (await mysql2.createConnection(
        connectionConfig
      )) as unknown as MySQLConnection;

      // Test connection with ping
      await connection.ping();

      // Get server version
      const [rows] = await connection.query('SELECT VERSION() as version');
      const versionRow = (rows as Array<{ version: string }>)[0];
      const serverVersion = versionRow?.version
        ? `MySQL ${versionRow.version}`
        : undefined;

      const latencyMs = Math.round(performance.now() - startTime);

      // Close the test connection
      await connection.end();

      return {
        success: true,
        latencyMs,
        serverVersion,
      };
    } catch (error) {
      if (connection) {
        try {
          await connection.end();
        } catch {
          // Ignore close errors
        }
      }

      let errorMessage =
        error instanceof Error ? error.message : 'Failed to connect to MySQL';

      // Provide more user-friendly message for timeout errors
      if (
        errorMessage.includes('timeout') ||
        errorMessage.includes('ETIMEDOUT') ||
        errorMessage.includes('ECONNREFUSED')
      ) {
        errorMessage = `Connection timeout: Unable to reach the server. Please verify the host address is correct and the server is accessible.`;
      }

      return {
        success: false,
        error: errorMessage,
        errorCode: 'CONNECTION_ERROR',
        troubleshootingSteps: [
          'Verify the MySQL server is running and accessible',
          'Check that the host and port are correct',
          'Verify the username and password are correct',
          'Ensure the database exists and the user has access',
          'Check firewall settings if connecting remotely',
        ],
      };
    }
  }

  close(
    connectionId: string
  ): { success: true } | { success: false; error: string } {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: 'Connection not found' };
    }

    try {
      // Handle the promise with catch to log any closure errors
      conn.connection.end().catch((err) => {
        sqlLogger.logClose({
          connectionId,
          dbPath: conn.filename,
          success: false,
          error: err instanceof Error ? err.message : 'Connection close failed',
        });
      });
      this.connections.delete(connectionId);

      sqlLogger.logClose({
        connectionId,
        dbPath: conn.filename,
        success: true,
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to close connection';

      sqlLogger.logClose({
        connectionId,
        dbPath: conn.filename,
        success: false,
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }

  getConnection(connectionId: string): AdapterConnectionInfo | null {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return null;
    }

    return {
      id: conn.id,
      path: conn.filename,
      filename: conn.filename,
      isEncrypted: !!conn.config.ssl,
      isReadOnly: conn.isReadOnly,
      databaseType: 'mysql',
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
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: 'Connection not found' };
    }

    try {
      const database = conn.config.database;
      if (!database) {
        return { success: false, error: 'No database selected' };
      }

      // Get tables
      const [tablesResult] = (await conn.connection.query(
        `SELECT TABLE_NAME, TABLE_TYPE 
         FROM information_schema.TABLES 
         WHERE TABLE_SCHEMA = ?`,
        [database]
      )) as [Array<{ TABLE_NAME: string; TABLE_TYPE: string }>, unknown];

      const tables: TableInfo[] = [];
      const views: TableInfo[] = [];

      for (const row of tablesResult) {
        const tableInfo = await this.getTableInfoAsync(
          conn,
          database,
          row.TABLE_NAME
        );
        if (row.TABLE_TYPE === 'VIEW') {
          views.push({ ...tableInfo, type: 'view' });
        } else {
          tables.push({ ...tableInfo, type: 'table' });
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
        error: error instanceof Error ? error.message : 'Failed to get schema',
      };
    }
  }

  // Synchronous wrapper for interface compatibility
  getSchema(_connectionId: string):
    | {
        success: true;
        schemas: SchemaInfo[];
        tables: TableInfo[];
        views: TableInfo[];
      }
    | { success: false; error: string } {
    // Return a placeholder - actual implementation will be async
    // The database service will call getSchemaAsync directly
    return {
      success: false,
      error: 'Use getSchemaAsync for MySQL connections',
    };
  }

  private async getTableInfoAsync(
    conn: MySQLConnectionInfo,
    database: string,
    tableName: string
  ): Promise<TableInfo> {
    // Get columns
    const [columnsResult] = (await conn.connection.query(
      `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY, EXTRA
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
       ORDER BY ORDINAL_POSITION`,
      [database, tableName]
    )) as [
      Array<{
        COLUMN_NAME: string;
        DATA_TYPE: string;
        IS_NULLABLE: string;
        COLUMN_DEFAULT: string | null;
        COLUMN_KEY: string;
        EXTRA: string;
      }>,
      unknown,
    ];

    const columns: ColumnInfo[] = columnsResult.map((col) => ({
      name: col.COLUMN_NAME,
      type: col.DATA_TYPE,
      nullable: col.IS_NULLABLE === 'YES',
      defaultValue: col.COLUMN_DEFAULT,
      isPrimaryKey: col.COLUMN_KEY === 'PRI',
    }));

    const primaryKey = columns.filter((c) => c.isPrimaryKey).map((c) => c.name);

    // Get foreign keys
    const [fkResult] = (await conn.connection.query(
      `SELECT COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME,
              DELETE_RULE, UPDATE_RULE
       FROM information_schema.KEY_COLUMN_USAGE kcu
       JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
         ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
         AND kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
       WHERE kcu.TABLE_SCHEMA = ? AND kcu.TABLE_NAME = ?
         AND REFERENCED_TABLE_NAME IS NOT NULL`,
      [database, tableName]
    )) as [
      Array<{
        COLUMN_NAME: string;
        REFERENCED_TABLE_NAME: string;
        REFERENCED_COLUMN_NAME: string;
        DELETE_RULE: string;
        UPDATE_RULE: string;
      }>,
      unknown,
    ];

    const foreignKeys: ForeignKeyInfo[] = fkResult.map((fk) => ({
      column: fk.COLUMN_NAME,
      referencedTable: fk.REFERENCED_TABLE_NAME,
      referencedColumn: fk.REFERENCED_COLUMN_NAME,
      onDelete: fk.DELETE_RULE,
      onUpdate: fk.UPDATE_RULE,
    }));

    // Get indexes
    const [indexResult] = (await conn.connection.query(
      `SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE
       FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
       ORDER BY INDEX_NAME, SEQ_IN_INDEX`,
      [database, tableName]
    )) as [
      Array<{
        INDEX_NAME: string;
        COLUMN_NAME: string;
        NON_UNIQUE: number;
      }>,
      unknown,
    ];

    const indexMap = new Map<
      string,
      { columns: string[]; isUnique: boolean }
    >();
    for (const idx of indexResult) {
      if (!indexMap.has(idx.INDEX_NAME)) {
        indexMap.set(idx.INDEX_NAME, {
          columns: [],
          isUnique: idx.NON_UNIQUE === 0,
        });
      }
      indexMap.get(idx.INDEX_NAME)!.columns.push(idx.COLUMN_NAME);
    }

    const indexes: IndexInfo[] = Array.from(indexMap.entries()).map(
      ([name, info]) => ({
        name,
        columns: info.columns,
        isUnique: info.isUnique,
        sql: '', // MySQL doesn't provide CREATE INDEX statement easily
      })
    );

    // Get triggers
    const [triggerResult] = (await conn.connection.query(
      `SELECT TRIGGER_NAME, ACTION_TIMING, EVENT_MANIPULATION, ACTION_STATEMENT
       FROM information_schema.TRIGGERS
       WHERE EVENT_OBJECT_SCHEMA = ? AND EVENT_OBJECT_TABLE = ?`,
      [database, tableName]
    )) as [
      Array<{
        TRIGGER_NAME: string;
        ACTION_TIMING: string;
        EVENT_MANIPULATION: string;
        ACTION_STATEMENT: string;
      }>,
      unknown,
    ];

    const triggers: TriggerInfo[] = triggerResult.map((t) => ({
      name: t.TRIGGER_NAME,
      tableName,
      timing: t.ACTION_TIMING as 'BEFORE' | 'AFTER' | 'INSTEAD OF',
      event: t.EVENT_MANIPULATION as 'INSERT' | 'UPDATE' | 'DELETE',
      sql: t.ACTION_STATEMENT,
    }));

    // Get row count
    const [countResult] = (await conn.connection.query(
      `SELECT COUNT(*) as count FROM \`${database}\`.\`${tableName}\``
    )) as [Array<{ count: number }>, unknown];
    const rowCount = countResult[0]?.count ?? 0;

    return {
      name: tableName,
      schema: database,
      type: 'table',
      columns,
      primaryKey,
      foreignKeys,
      indexes,
      triggers,
      rowCount,
      sql: '', // Would need SHOW CREATE TABLE
    };
  }

  execute(
    _connectionId: string,
    _sql: string,
    _params?: unknown[]
  ):
    | { success: true; changes: number; lastInsertRowid: number }
    | {
        success: false;
        error: string;
        errorCode?: ErrorCode;
      } {
    // Synchronous wrapper - returns error directing to async method
    return {
      success: false,
      error: 'Use executeAsync for MySQL connections',
    };
  }

  async executeAsync(
    connectionId: string,
    sql: string,
    params?: unknown[]
  ): Promise<
    | { success: true; changes: number; lastInsertRowid: number }
    | { success: false; error: string; errorCode?: ErrorCode }
  > {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: 'Connection not found' };
    }

    const startTime = performance.now();
    try {
      const [result] = (await conn.connection.execute(sql, params)) as [
        { affectedRows?: number; insertId?: number },
        unknown,
      ];
      const durationMs = performance.now() - startTime;

      sqlLogger.logExecute({
        connectionId,
        dbPath: conn.filename,
        sql,
        durationMs,
        success: true,
        rowCount: (result as { affectedRows?: number }).affectedRows ?? 0,
      });

      return {
        success: true,
        changes: (result as { affectedRows?: number }).affectedRows ?? 0,
        lastInsertRowid: Number(
          (result as { insertId?: number }).insertId ?? 0
        ),
      };
    } catch (error) {
      const durationMs = performance.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      sqlLogger.logExecute({
        connectionId,
        dbPath: conn.filename,
        sql,
        durationMs,
        success: false,
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  }

  query(
    _connectionId: string,
    _sql: string,
    _params?: unknown[]
  ):
    | { success: true; columns: string[]; rows: unknown[][] }
    | { success: false; error: string } {
    return {
      success: false,
      error: 'Use queryAsync for MySQL connections',
    };
  }

  async queryAsync(
    connectionId: string,
    sql: string,
    params?: unknown[]
  ): Promise<
    | { success: true; columns: string[]; rows: unknown[][] }
    | { success: false; error: string }
  > {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: 'Connection not found' };
    }

    const startTime = performance.now();
    try {
      const [rows] = (await conn.connection.query(sql, params)) as [
        Array<Record<string, unknown>>,
        unknown,
      ];
      const durationMs = performance.now() - startTime;

      if (!Array.isArray(rows) || rows.length === 0) {
        sqlLogger.logQuery({
          connectionId,
          dbPath: conn.filename,
          sql,
          durationMs,
          success: true,
          rowCount: 0,
        });
        return { success: true, columns: [], rows: [] };
      }

      const columns = Object.keys(rows[0]);
      const rowsArray = rows.map((row) => columns.map((col) => row[col]));

      sqlLogger.logQuery({
        connectionId,
        dbPath: conn.filename,
        sql,
        durationMs,
        success: true,
        rowCount: rows.length,
      });

      return { success: true, columns, rows: rowsArray };
    } catch (error) {
      const durationMs = performance.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      sqlLogger.logQuery({
        connectionId,
        dbPath: conn.filename,
        sql,
        durationMs,
        success: false,
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
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
      error: 'Use getTableDataAsync for MySQL connections',
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
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: 'Connection not found' };
    }

    const database = schema || conn.config.database;
    if (!database) {
      return { success: false, error: 'No database selected' };
    }

    let sql = `SELECT * FROM \`${database}\`.\`${table}\``;
    const params: unknown[] = [];

    try {
      if (filters && filters.length > 0) {
        const conditions = filters.map((f) => {
          switch (f.operator) {
            case 'eq':
              params.push(f.value);
              return `\`${f.column}\` = ?`;
            case 'neq':
              params.push(f.value);
              return `\`${f.column}\` != ?`;
            case 'gt':
              params.push(f.value);
              return `\`${f.column}\` > ?`;
            case 'lt':
              params.push(f.value);
              return `\`${f.column}\` < ?`;
            case 'gte':
              params.push(f.value);
              return `\`${f.column}\` >= ?`;
            case 'lte':
              params.push(f.value);
              return `\`${f.column}\` <= ?`;
            case 'like':
              params.push(`%${f.value}%`);
              return `\`${f.column}\` LIKE ?`;
            case 'isnull':
              return `\`${f.column}\` IS NULL`;
            case 'notnull':
              return `\`${f.column}\` IS NOT NULL`;
            default:
              params.push(f.value);
              return `\`${f.column}\` = ?`;
          }
        });
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }

      if (sortColumn) {
        sql += ` ORDER BY \`${sortColumn}\` ${sortDirection === 'desc' ? 'DESC' : 'ASC'}`;
      }

      // Get count (without ORDER BY clause since it's not needed for counting)
      const countSql = sql
        .replace(/SELECT \*/, 'SELECT COUNT(*) as count')
        .replace(/ ORDER BY `[^`]+` (ASC|DESC)/, '');
      const [countResult] = (await conn.connection.query(countSql, params)) as [
        Array<{ count: number }>,
        unknown,
      ];
      const totalRows = countResult[0]?.count ?? 0;

      // Get data with pagination
      const offset = (page - 1) * pageSize;
      sql += ` LIMIT ? OFFSET ?`;
      params.push(pageSize, offset);

      const [rows] = (await conn.connection.query(sql, params)) as [
        Array<Record<string, unknown>>,
        unknown,
      ];

      // Get column info
      const tableInfo = await this.getTableInfoAsync(conn, database, table);

      return {
        success: true,
        columns: tableInfo.columns,
        rows: rows as Record<string, unknown>[],
        totalRows,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to get table data',
      };
    }
  }

  executeQuery(_connectionId: string, _query: string) {
    return {
      success: false as const,
      error: 'Use executeQueryAsync for MySQL connections',
    };
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
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: 'Connection not found' };
    }

    const trimmed = query.trim().toUpperCase();
    const isSelect =
      trimmed.startsWith('SELECT') ||
      trimmed.startsWith('SHOW') ||
      trimmed.startsWith('DESCRIBE');

    try {
      if (isSelect) {
        const [rows] = (await conn.connection.query(query)) as [
          Array<Record<string, unknown>>,
          unknown,
        ];
        if (!Array.isArray(rows) || rows.length === 0) {
          return { success: true, columns: [], rows: [] };
        }
        return {
          success: true,
          columns: Object.keys(rows[0]),
          rows: rows as Record<string, unknown>[],
        };
      } else {
        const [result] = (await conn.connection.execute(query)) as [
          { affectedRows?: number; insertId?: number },
          unknown,
        ];
        return {
          success: true,
          changes: (result as { affectedRows?: number }).affectedRows ?? 0,
          lastInsertRowid: Number(
            (result as { insertId?: number }).insertId ?? 0
          ),
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  validateQuery(_connectionId: string, _sql: string): ValidationResult {
    // MySQL doesn't have a simple way to validate without executing
    // We could use EXPLAIN but it might have side effects
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
      error: 'Use explainQueryAsync for MySQL connections',
    };
  }

  async explainQueryAsync(
    connectionId: string,
    sql: string
  ): Promise<
    | { success: true; plan: QueryPlanNode; stats: QueryPlanStats }
    | { success: false; error: string }
  > {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: 'Connection not found' };
    }

    try {
      const [rows] = (await conn.connection.query(`EXPLAIN ${sql}`)) as [
        Array<Record<string, unknown>>,
        unknown,
      ];

      const plan: QueryPlanNode = {
        id: 1,
        parent: 0,
        notUsed: 0,
        detail: JSON.stringify(rows[0] || {}),
        children: rows.slice(1).map((row, idx) => ({
          id: idx + 2,
          parent: 1,
          notUsed: 0,
          detail: JSON.stringify(row),
        })),
      };

      const stats: QueryPlanStats = {
        totalNodes: rows.length,
        depth: 2,
        hasScan: rows.some((r) => r.type === 'ALL'),
        hasSort: rows.some((r) => r.Extra?.toString().includes('filesort')),
        hasIndex: rows.some((r) => r.key !== null),
      };

      return { success: true, plan, stats };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to explain query',
      };
    }
  }

  validateChanges(_connectionId: string, changes: PendingChangeInfo[]) {
    const results: ValidationResult[] = changes.map((c) => ({
      changeId: c.id,
      isValid: true,
    }));
    return { success: true as const, results };
  }

  applyChanges(_connectionId: string, _changes: PendingChangeInfo[]) {
    return {
      success: false as const,
      error: 'Use applyChangesAsync for MySQL connections',
    };
  }

  async applyChangesAsync(
    connectionId: string,
    changes: PendingChangeInfo[]
  ): Promise<
    { success: true; appliedCount: number } | { success: false; error: string }
  > {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: 'Connection not found' };
    }

    try {
      let appliedCount = 0;
      const database = conn.config.database;

      for (const change of changes) {
        const schema = change.schema || database;

        if (change.type === 'insert' && change.newValues) {
          const columns = Object.keys(change.newValues);
          const values = Object.values(change.newValues);
          const placeholders = columns.map(() => '?').join(', ');
          const sql = `INSERT INTO \`${schema}\`.\`${change.table}\` (\`${columns.join('`, `')}\`) VALUES (${placeholders})`;
          await conn.connection.execute(sql, values);
          appliedCount++;
        } else if (
          change.type === 'update' &&
          change.newValues &&
          change.primaryKeyColumn
        ) {
          const columns = Object.keys(change.newValues);
          const setClause = columns.map((col) => `\`${col}\` = ?`).join(', ');
          const values = [...Object.values(change.newValues), change.rowId];
          const sql = `UPDATE \`${schema}\`.\`${change.table}\` SET ${setClause} WHERE \`${change.primaryKeyColumn}\` = ?`;
          await conn.connection.execute(sql, values);
          appliedCount++;
        } else if (change.type === 'delete' && change.primaryKeyColumn) {
          const sql = `DELETE FROM \`${schema}\`.\`${change.table}\` WHERE \`${change.primaryKeyColumn}\` = ?`;
          await conn.connection.execute(sql, [change.rowId]);
          appliedCount++;
        }
      }

      return { success: true, appliedCount };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to apply changes',
      };
    }
  }

  closeAll(): void {
    for (const [id] of this.connections) {
      this.close(id);
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
      error: 'Use getTableStructureAsync for MySQL connections',
    };
  }

  async getTableStructureAsync(
    connectionId: string,
    tableName: string,
    schema?: string
  ): Promise<
    { success: true; structure: TableInfo } | { success: false; error: string }
  > {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: 'Connection not found' };
    }

    const database = schema || conn.config.database;
    if (!database) {
      return { success: false, error: 'No database selected' };
    }

    try {
      const structure = await this.getTableInfoAsync(conn, database, tableName);
      return { success: true, structure };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get table structure',
      };
    }
  }

  getPendingChanges(_connectionId: string) {
    return { success: true as const, changes: [] as PendingChangeInfo[] };
  }

  async getColumnDistribution(
    connectionId: string,
    table: string,
    column: string,
    schema?: string,
    limit?: number
  ): Promise<GetColumnDistributionResponse> {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: 'Connection not found' };
    }

    const schemaName = schema || conn.config.database;

    try {
      // Get total row count
      const countSql = `SELECT COUNT(*) as total FROM \`${schemaName}\`.\`${table}\``;
      const [countRows] = await conn.connection.query(countSql);
      const totalRows = Number(
        (countRows as Array<{ total: number }>)[0]?.total ?? 0
      );

      // Get null count
      const nullSql = `SELECT COUNT(*) as nulls FROM \`${schemaName}\`.\`${table}\` WHERE \`${column}\` IS NULL`;
      const [nullRows] = await conn.connection.query(nullSql);
      const nullCount = Number(
        (nullRows as Array<{ nulls: number }>)[0]?.nulls ?? 0
      );

      // Get value distribution with GROUP BY
      let distributionSql = `
        SELECT \`${column}\` as value, COUNT(*) as count
        FROM \`${schemaName}\`.\`${table}\`
        GROUP BY \`${column}\`
        ORDER BY count DESC
      `;

      if (limit && limit > 0) {
        distributionSql += ` LIMIT ${limit}`;
      }

      const startTime = performance.now();
      const [rows] = await conn.connection.query(distributionSql);
      const durationMs = performance.now() - startTime;

      sqlLogger.logQuery({
        connectionId,
        dbPath: conn.filename,
        sql: distributionSql,
        durationMs,
        success: true,
        rowCount: (rows as unknown[]).length,
      });

      // Calculate percentages and format distribution
      const distribution = (
        rows as Array<{ value: unknown; count: number }>
      ).map((row) => ({
        value: row.value,
        count: Number(row.count),
        percentage: totalRows > 0 ? (Number(row.count) / totalRows) * 100 : 0,
      }));

      // Count distinct non-null values
      const distinctCount = distribution.filter((d) => d.value !== null).length;

      return {
        success: true,
        distribution,
        totalRows,
        distinctCount,
        nullCount,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get column distribution',
      };
    }
  }
}

// Export singleton instance
export const mysqlAdapter = new MySQLAdapter();
