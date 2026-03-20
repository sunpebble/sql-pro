/**
 * Turso database adapter
 * Connects to Turso edge databases using @libsql/client
 * Supports SQLite-compatible operations via libSQL
 */

import type { Client } from '@libsql/client';
import type {
  ColumnInfo,
  DatabaseConnectionConfig,
  ForeignKeyInfo,
  GetColumnDistributionResponse,
  GetTableDataResponse,
  IndexInfo,
  PendingChangeInfo,
  SchemaInfo,
  TableInfo,
  TriggerInfo,
  TursoBranchInfo,
  TursoDatabaseInfo,
  ValidationResult,
} from '@shared/types';
import type {
  AdapterConnectionInfo,
  DatabaseAdapter,
  OpenResult,
} from './types';
import { createClient } from '@libsql/client';
import { TursoPlatformService } from './turso-platform';

interface TursoConnectionInfo {
  id: string;
  client: Client;
  organization: string;
  database: string;
  branch: string;
  displayName: string;
  platformService: TursoPlatformService;
  authToken: string; // Store auth token for reconnection
}

// ID generator following existing pattern
let idCounter = 0;
function generateId(): string {
  idCounter += 1;
  return `turso_${idCounter}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Turso database adapter implementation
 */
export class TursoAdapter implements DatabaseAdapter {
  readonly type = 'turso' as const;
  private connections: Map<string, TursoConnectionInfo> = new Map();

  async open(config: DatabaseConnectionConfig): Promise<OpenResult> {
    const {
      tursoOrganization,
      tursoAuthToken,
      tursoDatabase,
      tursoBranch = 'main',
      name,
    } = config;

    if (!tursoOrganization || !tursoAuthToken || !tursoDatabase) {
      return {
        success: false,
        error:
          'Missing required Turso configuration: organization, authToken, and database are required',
        errorCode: 'CONNECTION_ERROR',
        troubleshootingSteps: [
          'Ensure you have provided your Turso organization slug',
          'Ensure you have provided a valid auth token',
          'Ensure you have selected a database',
        ],
      };
    }

    try {
      const platformService = new TursoPlatformService(tursoAuthToken);
      const databaseUrl = platformService.buildDatabaseUrl(
        tursoDatabase,
        tursoOrganization,
        tursoBranch
      );

      const client = createClient({
        url: databaseUrl,
        authToken: tursoAuthToken,
      });

      // Test connection by running a simple query
      await client.execute('SELECT 1');

      const id = generateId();
      const displayName = name || `${tursoDatabase} (${tursoOrganization})`;
      const connectionInfo: TursoConnectionInfo = {
        id,
        client,
        organization: tursoOrganization,
        database: tursoDatabase,
        branch: tursoBranch,
        displayName,
        platformService,
        authToken: tursoAuthToken,
      };

      this.connections.set(id, connectionInfo);

      return {
        success: true,
        connection: {
          id,
          path: databaseUrl,
          filename: displayName,
          isEncrypted: true, // Auth token required
          isReadOnly: config.readOnly || false,
          databaseType: 'turso',
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to connect to Turso: ${errorMessage}`,
        errorCode: 'CONNECTION_ERROR',
        troubleshootingSteps: [
          'Verify your auth token is valid and not expired',
          'Check that the database name and organization are correct',
          'Ensure network connectivity to Turso servers',
          'Verify the database exists in your Turso dashboard',
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
    const {
      tursoOrganization,
      tursoAuthToken,
      tursoDatabase,
      tursoBranch = 'main',
    } = config;

    if (!tursoOrganization || !tursoAuthToken) {
      return {
        success: false,
        error: 'Organization and auth token are required',
        errorCode: 'CONNECTION_ERROR',
      };
    }

    try {
      const platformService = new TursoPlatformService(tursoAuthToken);

      // First validate token
      const tokenCheck = await platformService.validateToken();
      if (!tokenCheck.valid) {
        return {
          success: false,
          error: `Invalid auth token: ${tokenCheck.error}`,
          errorCode: 'CONNECTION_ERROR',
          troubleshootingSteps: [
            'Check that your auth token is valid',
            'Generate a new token from Turso dashboard if expired',
          ],
        };
      }

      // If database is specified, test actual connection
      if (tursoDatabase) {
        const databaseUrl = platformService.buildDatabaseUrl(
          tursoDatabase,
          tursoOrganization,
          tursoBranch
        );

        const client = createClient({
          url: databaseUrl,
          authToken: tursoAuthToken,
        });

        const startTime = performance.now();
        await client.execute('SELECT sqlite_version()');
        const latencyMs = Math.round(performance.now() - startTime);

        client.close();

        return {
          success: true,
          latencyMs,
          serverVersion: 'libSQL (Turso)',
        };
      }

      // Just token validation succeeded
      return {
        success: true,
        latencyMs: 0,
        serverVersion: 'Turso Platform API',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Connection test failed: ${errorMessage}`,
        errorCode: 'CONNECTION_ERROR',
        troubleshootingSteps: [
          'Verify your auth token is valid',
          'Check network connectivity',
          'Ensure the database exists',
        ],
      };
    }
  }

  close(
    connectionId: string
  ): { success: true } | { success: false; error: string } {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: `Connection ${connectionId} not found` };
    }

    try {
      conn.client.close();
      this.connections.delete(connectionId);
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  getConnection(connectionId: string): AdapterConnectionInfo | null {
    const conn = this.connections.get(connectionId);
    if (!conn) return null;

    return {
      id: conn.id,
      path: conn.platformService.buildDatabaseUrl(
        conn.database,
        conn.organization,
        conn.branch
      ),
      filename: conn.displayName,
      isEncrypted: true,
      isReadOnly: false,
      databaseType: 'turso',
    };
  }

  // ============ Async Query Methods ============

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
      return { success: false, error: `Connection ${connectionId} not found` };
    }

    try {
      const result = await conn.client.execute({
        sql,
        args: (params as any[]) || [],
      });

      const columns = result.columns;
      const rows = result.rows.map((row) => columns.map((col) => row[col]));

      return { success: true, columns, rows };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  async executeAsync(
    connectionId: string,
    sql: string,
    params?: unknown[]
  ): Promise<
    | { success: true; changes: number; lastInsertRowid: number }
    | { success: false; error: string }
  > {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: `Connection ${connectionId} not found` };
    }

    try {
      const result = await conn.client.execute({
        sql,
        args: (params as any[]) || [],
      });

      return {
        success: true,
        changes: result.rowsAffected,
        lastInsertRowid: Number(result.lastInsertRowid || 0),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
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
      return { success: false, error: `Connection ${connectionId} not found` };
    }

    try {
      // Get tables
      const tablesResult = await conn.client.execute(
        "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream_%' ORDER BY name"
      );

      // Get views
      const viewsResult = await conn.client.execute(
        "SELECT name, sql FROM sqlite_master WHERE type='view' ORDER BY name"
      );

      const tables: TableInfo[] = await Promise.all(
        tablesResult.rows.map(async (row) => {
          const tableName = row.name as string;
          const tableSql = (row.sql as string) || '';

          // Execute parallel requests for table metadata
          const [
            tableInfoResult,
            fkResult,
            indexResult,
            triggerResult,
            countResult,
          ] = await Promise.all([
            conn.client.execute(`PRAGMA table_info('${tableName}')`),
            conn.client.execute(`PRAGMA foreign_key_list('${tableName}')`),
            conn.client.execute(`PRAGMA index_list('${tableName}')`),
            conn.client.execute(
              `SELECT name, sql FROM sqlite_master WHERE type='trigger' AND tbl_name='${tableName}'`
            ),
            conn.client.execute(`SELECT COUNT(*) as count FROM "${tableName}"`),
          ]);

          const columns: ColumnInfo[] = tableInfoResult.rows.map((col) => ({
            name: col.name as string,
            type: col.type as string,
            nullable: col.notnull === 0,
            defaultValue: col.dflt_value as string | null,
            isPrimaryKey: (col.pk as number) > 0,
          }));

          // Get primary key columns
          const primaryKey = columns
            .filter((c) => c.isPrimaryKey)
            .map((c) => c.name);

          const foreignKeys: ForeignKeyInfo[] = fkResult.rows.map((fk) => ({
            column: fk.from as string,
            referencedTable: fk.table as string,
            referencedColumn: fk.to as string,
            onDelete: fk.on_delete as string,
            onUpdate: fk.on_update as string,
          }));

          // Process indexes in parallel
          const indexes: IndexInfo[] = await Promise.all(
            indexResult.rows.map(async (idx) => {
              const indexName = idx.name as string;
              const [indexInfoResult, indexSqlResult] = await Promise.all([
                conn.client.execute(`PRAGMA index_info('${indexName}')`),
                conn.client.execute(
                  `SELECT sql FROM sqlite_master WHERE type='index' AND name='${indexName}'`
                ),
              ]);

              const indexColumns = indexInfoResult.rows.map(
                (col) => col.name as string
              );

              // Get index SQL
              const indexSql =
                (indexSqlResult.rows[0]?.sql as string) ||
                `CREATE INDEX "${indexName}" ON "${tableName}" (${indexColumns.map((c) => `"${c}"`).join(', ')})`;

              return {
                name: indexName,
                columns: indexColumns,
                isUnique: idx.unique === 1,
                sql: indexSql,
              };
            })
          );

          const triggers: TriggerInfo[] = triggerResult.rows.map((trig) => {
            const trigSql = (trig.sql as string) || '';
            // Parse timing and event from SQL
            const upperSql = trigSql.toUpperCase();
            let timing: 'BEFORE' | 'AFTER' | 'INSTEAD OF' = 'AFTER';
            if (upperSql.includes('BEFORE')) timing = 'BEFORE';
            else if (upperSql.includes('INSTEAD OF')) timing = 'INSTEAD OF';

            let event: 'INSERT' | 'UPDATE' | 'DELETE' = 'INSERT';
            if (upperSql.includes('UPDATE')) event = 'UPDATE';
            else if (upperSql.includes('DELETE')) event = 'DELETE';

            return {
              name: trig.name as string,
              tableName,
              timing,
              event,
              sql: trigSql,
            };
          });

          const rowCount = Number(countResult.rows[0]?.count || 0);

          return {
            name: tableName,
            schema: 'main',
            type: 'table',
            columns,
            primaryKey,
            foreignKeys,
            indexes,
            triggers,
            rowCount,
            sql: tableSql,
          };
        })
      );

      const views: TableInfo[] = viewsResult.rows.map((row) => ({
        name: row.name as string,
        schema: 'main',
        type: 'view',
        columns: [],
        primaryKey: [],
        foreignKeys: [],
        indexes: [],
        triggers: [],
        rowCount: 0,
        sql: (row.sql as string) || '',
      }));

      return {
        success: true,
        schemas: [{ name: 'main', tables, views }],
        tables,
        views,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  async getTableDataAsync(
    connectionId: string,
    table: string,
    page: number,
    pageSize: number,
    sortColumn?: string,
    sortDirection?: 'asc' | 'desc',
    filters?: Array<{ column: string; operator: string; value: string }>,
    _schema?: string
  ): Promise<GetTableDataResponse> {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: `Connection ${connectionId} not found` };
    }

    try {
      // Build query
      let sql = `SELECT * FROM "${table}"`;
      const args: unknown[] = [];

      // Add filters
      if (filters && filters.length > 0) {
        const whereClauses = filters.map((f) => {
          args.push(f.value);
          return `"${f.column}" ${f.operator} ?`;
        });
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
      }

      // Add sorting
      if (sortColumn) {
        sql += ` ORDER BY "${sortColumn}" ${sortDirection || 'asc'}`;
      }

      // Add pagination
      const offset = page * pageSize;
      sql += ` LIMIT ? OFFSET ?`;
      args.push(pageSize, offset);

      const result = await conn.client.execute({ sql, args: args as any[] });

      // Get total count
      let countSql = `SELECT COUNT(*) as count FROM "${table}"`;
      if (filters && filters.length > 0) {
        const whereClauses = filters.map(
          (f) => `"${f.column}" ${f.operator} ?`
        );
        countSql += ` WHERE ${whereClauses.join(' AND ')}`;
      }
      const countResult = await conn.client.execute({
        sql: countSql,
        args: filters ? filters.map((f) => f.value as any) : [],
      });
      const totalRows = Number(countResult.rows[0]?.count || 0);

      // Get column info
      const tableInfoResult = await conn.client.execute(
        `PRAGMA table_info('${table}')`
      );
      const columns: ColumnInfo[] = tableInfoResult.rows.map((col) => ({
        name: col.name as string,
        type: col.type as string,
        nullable: col.notnull === 0,
        defaultValue: col.dflt_value as string | null,
        isPrimaryKey: (col.pk as number) > 0,
      }));

      // Convert rows to records
      const rows = result.rows.map((row) => {
        const record: Record<string, unknown> = {};
        for (const col of result.columns) {
          record[col] = row[col];
        }
        return record;
      });

      return {
        success: true,
        columns,
        rows,
        totalRows,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  async executeQueryAsync(
    connectionId: string,
    query: string,
    params?: unknown[]
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
      return { success: false, error: `Connection ${connectionId} not found` };
    }

    try {
      const result =
        params && params.length > 0
          ? await conn.client.execute({ sql: query, args: params as any[] })
          : await conn.client.execute(query);

      // Convert rows to records
      const rows = result.rows.map((row) => {
        const record: Record<string, unknown> = {};
        for (const col of result.columns) {
          record[col] = row[col];
        }
        return record;
      });

      return {
        success: true,
        columns: result.columns,
        rows,
        changes: result.rowsAffected,
        lastInsertRowid: Number(result.lastInsertRowid || 0),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  async getTableStructureAsync(
    connectionId: string,
    tableName: string,
    _schema?: string
  ): Promise<
    { success: true; structure: TableInfo } | { success: false; error: string }
  > {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: `Connection ${connectionId} not found` };
    }

    try {
      // Get table SQL
      const tableSqlResult = await conn.client.execute(
        `SELECT sql FROM sqlite_master WHERE type='table' AND name='${tableName}'`
      );
      const tableSql = (tableSqlResult.rows[0]?.sql as string) || '';

      // Get column info
      const tableInfoResult = await conn.client.execute(
        `PRAGMA table_info('${tableName}')`
      );

      const columns: ColumnInfo[] = tableInfoResult.rows.map((col) => ({
        name: col.name as string,
        type: col.type as string,
        nullable: col.notnull === 0,
        defaultValue: col.dflt_value as string | null,
        isPrimaryKey: (col.pk as number) > 0,
      }));

      // Get primary key columns
      const primaryKey = columns
        .filter((c) => c.isPrimaryKey)
        .map((c) => c.name);

      // Get foreign keys
      const fkResult = await conn.client.execute(
        `PRAGMA foreign_key_list('${tableName}')`
      );
      const foreignKeys: ForeignKeyInfo[] = fkResult.rows.map((fk) => ({
        column: fk.from as string,
        referencedTable: fk.table as string,
        referencedColumn: fk.to as string,
        onDelete: fk.on_delete as string,
        onUpdate: fk.on_update as string,
      }));

      // Get indexes
      const indexResult = await conn.client.execute(
        `PRAGMA index_list('${tableName}')`
      );
      const indexes: IndexInfo[] = [];
      for (const idx of indexResult.rows) {
        const indexName = idx.name as string;
        const indexInfoResult = await conn.client.execute(
          `PRAGMA index_info('${indexName}')`
        );
        const indexColumns = indexInfoResult.rows.map(
          (col) => col.name as string
        );

        const indexSqlResult = await conn.client.execute(
          `SELECT sql FROM sqlite_master WHERE type='index' AND name='${indexName}'`
        );
        const indexSql =
          (indexSqlResult.rows[0]?.sql as string) ||
          `CREATE INDEX "${indexName}" ON "${tableName}" (${indexColumns.map((c) => `"${c}"`).join(', ')})`;

        indexes.push({
          name: indexName,
          columns: indexColumns,
          isUnique: idx.unique === 1,
          sql: indexSql,
        });
      }

      // Get triggers
      const triggerResult = await conn.client.execute(
        `SELECT name, sql FROM sqlite_master WHERE type='trigger' AND tbl_name='${tableName}'`
      );
      const triggers: TriggerInfo[] = triggerResult.rows.map((trig) => {
        const trigSql = (trig.sql as string) || '';
        const upperSql = trigSql.toUpperCase();
        let timing: 'BEFORE' | 'AFTER' | 'INSTEAD OF' = 'AFTER';
        if (upperSql.includes('BEFORE')) timing = 'BEFORE';
        else if (upperSql.includes('INSTEAD OF')) timing = 'INSTEAD OF';

        let event: 'INSERT' | 'UPDATE' | 'DELETE' = 'INSERT';
        if (upperSql.includes('UPDATE')) event = 'UPDATE';
        else if (upperSql.includes('DELETE')) event = 'DELETE';

        return {
          name: trig.name as string,
          tableName,
          timing,
          event,
          sql: trigSql,
        };
      });

      // Get row count
      const countResult = await conn.client.execute(
        `SELECT COUNT(*) as count FROM "${tableName}"`
      );
      const rowCount = Number(countResult.rows[0]?.count || 0);

      return {
        success: true,
        structure: {
          name: tableName,
          schema: 'main',
          type: 'table',
          columns,
          primaryKey,
          foreignKeys,
          indexes,
          triggers,
          rowCount,
          sql: tableSql,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  // ============ Turso-specific Methods ============

  async listDatabases(
    connectionId: string
  ): Promise<
    | { success: true; databases: TursoDatabaseInfo[] }
    | { success: false; error: string }
  > {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: `Connection ${connectionId} not found` };
    }

    const result = await conn.platformService.listDatabases(conn.organization);
    if (result.success && result.data) {
      return { success: true, databases: result.data };
    }
    return {
      success: false,
      error: result.error || 'Failed to list databases',
    };
  }

  async listBranches(
    connectionId: string
  ): Promise<
    | { success: true; branches: TursoBranchInfo[] }
    | { success: false; error: string }
  > {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: `Connection ${connectionId} not found` };
    }

    const result = await conn.platformService.listBranches(
      conn.organization,
      conn.database
    );
    if (result.success && result.data) {
      return { success: true, branches: result.data };
    }
    return { success: false, error: result.error || 'Failed to list branches' };
  }

  async switchDatabase(
    connectionId: string,
    database: string,
    branch = 'main'
  ): Promise<{ success: true } | { success: false; error: string }> {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: `Connection ${connectionId} not found` };
    }

    try {
      // Close existing client
      conn.client.close();

      // Create new client with new database
      const databaseUrl = conn.platformService.buildDatabaseUrl(
        database,
        conn.organization,
        branch
      );

      const newClient = createClient({
        url: databaseUrl,
        authToken: conn.authToken,
      });

      // Test connection
      await newClient.execute('SELECT 1');

      // Update connection info
      conn.client = newClient;
      conn.database = database;
      conn.branch = branch;
      conn.displayName = `${database} (${conn.organization})`;

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  // ============ Synchronous Methods (delegate to async) ============

  getSchema(_connectionId: string) {
    // Return empty result, use getSchemaAsync instead
    return {
      success: false as const,
      error: 'Use getSchemaAsync for Turso connections',
    };
  }

  execute(_connectionId: string, _sql: string, _params?: unknown[]) {
    return {
      success: false as const,
      error: 'Use executeAsync for Turso connections',
    };
  }

  query(_connectionId: string, _sql: string, _params?: unknown[]) {
    return {
      success: false as const,
      error: 'Use queryAsync for Turso connections',
    };
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
      error: 'Use getTableDataAsync for Turso connections',
    };
  }

  executeQuery(
    _connectionId: string,
    _query: string,
    _params?: unknown[]
  ) {
    return {
      success: false as const,
      error: 'Use executeQueryAsync for Turso connections',
    };
  }

  validateQuery(_connectionId: string, sql: string): ValidationResult {
    // Basic SQL validation
    const trimmed = sql.trim();
    if (!trimmed) {
      return { valid: false, error: 'Empty query' };
    }
    return { valid: true };
  }

  explainQuery(_connectionId: string, _sql: string) {
    return {
      success: false as const,
      error: 'EXPLAIN not implemented for Turso',
    };
  }

  validateChanges(_connectionId: string, changes: PendingChangeInfo[]) {
    return {
      success: true as const,
      results: changes.map(() => ({ valid: true })),
    };
  }

  applyChanges(_connectionId: string, _changes: PendingChangeInfo[]) {
    return {
      success: false as const,
      error: 'Use applyChangesAsync for Turso connections',
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
      return { success: false, error: `Connection ${connectionId} not found` };
    }

    try {
      if (changes.length === 0) {
        return { success: true, appliedCount: 0 };
      }

      const statements: { sql: string; args: any[] }[] = [];

      for (const change of changes) {
        const schema = change.schema || 'main';

        if (change.type === 'insert' && change.newValues) {
          const columns = Object.keys(change.newValues);
          const values = Object.values(change.newValues);
          const placeholders = columns.map(() => '?').join(', ');
          const sql = `INSERT INTO "${schema}"."${change.table}" ("${columns.join('", "')}") VALUES (${placeholders})`;
          statements.push({ sql, args: values as any[] });
        } else if (
          change.type === 'update' &&
          change.newValues &&
          change.primaryKeyColumn
        ) {
          const columns = Object.keys(change.newValues);
          const setClause = columns.map((col) => `"${col}" = ?`).join(', ');
          const values = [...Object.values(change.newValues), change.rowId];
          const sql = `UPDATE "${schema}"."${change.table}" SET ${setClause} WHERE "${change.primaryKeyColumn}" = ?`;
          statements.push({ sql, args: values as any[] });
        } else if (change.type === 'delete' && change.primaryKeyColumn) {
          const sql = `DELETE FROM "${schema}"."${change.table}" WHERE "${change.primaryKeyColumn}" = ?`;
          statements.push({ sql, args: [change.rowId as any] });
        }
      }

      if (statements.length > 0) {
        await conn.client.batch(statements, 'write');
      }

      return { success: true, appliedCount: statements.length };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  closeAll(): void {
    for (const conn of this.connections.values()) {
      try {
        conn.client.close();
      } catch {
        // Ignore close errors
      }
    }
    this.connections.clear();
  }

  getTableStructure(
    _connectionId: string,
    _tableName: string,
    _schema?: string
  ) {
    return {
      success: false as const,
      error: 'Use getTableStructureAsync for Turso connections',
    };
  }

  getPendingChanges(_connectionId: string) {
    return {
      success: true as const,
      changes: [] as PendingChangeInfo[],
    };
  }

  getColumnDistribution(
    connectionId: string,
    table: string,
    column: string,
    schema?: string,
    limit = 100
  ): Promise<GetColumnDistributionResponse> {
    return this.getColumnDistributionAsync(
      connectionId,
      table,
      column,
      schema,
      limit
    );
  }

  private async getColumnDistributionAsync(
    connectionId: string,
    table: string,
    column: string,
    _schema?: string,
    limit = 100
  ): Promise<GetColumnDistributionResponse> {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: `Connection ${connectionId} not found` };
    }

    try {
      // Get total row count
      const countSql = `SELECT COUNT(*) as total FROM "${table}"`;
      const countResult = await conn.client.execute(countSql);
      const totalRows = Number(countResult.rows[0]?.total || 0);

      // Get null count
      const nullSql = `SELECT COUNT(*) as nulls FROM "${table}" WHERE "${column}" IS NULL`;
      const nullResult = await conn.client.execute(nullSql);
      const nullCount = Number(nullResult.rows[0]?.nulls || 0);

      // Get value distribution
      const sql = `
        SELECT "${column}" as value, COUNT(*) as count
        FROM "${table}"
        GROUP BY "${column}"
        ORDER BY count DESC
        LIMIT ?
      `;
      const result = await conn.client.execute({ sql, args: [limit] });

      // Calculate percentages
      const distribution = result.rows.map((row) => ({
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
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }
}

// Export singleton instance
export const tursoAdapter = new TursoAdapter();
