import type {
  ColumnInfo,
  ErrorCode,
  ErrorPosition,
  ForeignKeyInfo,
  GetTableDataResponse,
  IndexInfo,
  PendingChangeInfo,
  QueryPlanNode,
  QueryPlanStats,
  SchemaInfo,
  SchemaListInfo,
  TableInfo,
  TableListItem,
  TriggerInfo,
  ValidationResult,
} from '@shared/types';
import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import Database from 'better-sqlite3-multiple-ciphers';
import { enhanceConnectionError, enhanceQueryError } from '@/lib/error-parser';
import {
  buildPragmaKeyValue,
  buildPragmaRekeyValue,
  escapePragmaIdentifier,
} from '@/lib/pragma-escape';
import { sqlLogger } from './sql-logger';

interface ConnectionInfo {
  id: string;
  db: Database.Database;
  path: string;
  filename: string;
  isEncrypted: boolean;
  isReadOnly: boolean;
}

// Simple ID generator
let idCounter = 0;
function generateId(): string {
  idCounter += 1;
  return `conn_${idCounter}_${Math.random().toString(36).substring(2, 9)}`;
}

// Check if file appears to be encrypted (doesn't have SQLite header)
function isFileEncrypted(path: string): boolean {
  try {
    const header = readFileSync(path, { encoding: null }).subarray(0, 16);
    // SQLite header is "SQLite format 3\0"
    const sqliteHeader = Buffer.from('SQLite format 3\0');
    return !header.equals(sqliteHeader);
  } catch {
    return false;
  }
}

// Cipher configurations to try (most common SQLCipher versions)
interface CipherConfig {
  cipher: string;
  legacy?: number;
  kdfIter?: number;
  pageSize?: number;
  hexKey?: boolean; // If true, wrap key as x'...'
  rawKey?: boolean; // If true, treat password as already being hex
  plaintextHeader?: number;
}

const CIPHER_CONFIGS: CipherConfig[] = [
  // SQLCipher 4 (default, most common)
  { cipher: 'sqlcipher', legacy: 0 },
  // SQLCipher 4 with hex key
  { cipher: 'sqlcipher', legacy: 0, hexKey: true },
  // SQLCipher 4 treating password as raw hex key
  { cipher: 'sqlcipher', legacy: 0, rawKey: true },
  // SQLCipher 3 (older databases)
  { cipher: 'sqlcipher', legacy: 1 },
  // SQLCipher 3 with hex key
  { cipher: 'sqlcipher', legacy: 1, hexKey: true },
  // SQLCipher 3 treating password as raw hex key
  { cipher: 'sqlcipher', legacy: 1, rawKey: true },
  // SQLCipher 2
  { cipher: 'sqlcipher', legacy: 2 },
  // SQLCipher 1
  { cipher: 'sqlcipher', legacy: 3 },
  // ChaCha20 (used by some apps like Signal)
  { cipher: 'chacha20' },
  { cipher: 'chacha20', hexKey: true },
  { cipher: 'chacha20', rawKey: true },
  // AES-256-CBC
  { cipher: 'aes256cbc' },
  { cipher: 'aes256cbc', hexKey: true },
  { cipher: 'aes256cbc', rawKey: true },
  // RC4 (legacy)
  { cipher: 'rc4' },
  { cipher: 'rc4', rawKey: true },
  // wxSQLite3 AES-128
  { cipher: 'aes128cbc' },
  { cipher: 'aes128cbc', rawKey: true },
  // SQLCipher with different KDF iterations (some apps use lower values)
  { cipher: 'sqlcipher', legacy: 0, kdfIter: 64000 },
  { cipher: 'sqlcipher', legacy: 0, kdfIter: 4000 },
  { cipher: 'sqlcipher', legacy: 0, kdfIter: 1 },
  // SQLCipher with plaintext header (some apps use this)
  { cipher: 'sqlcipher', legacy: 0, plaintextHeader: 32 },
  // Also try SQLCipher 4 with HMAC disabled (some implementations)
  { cipher: 'sqlcipher', legacy: 4 },
];

class DatabaseService {
  private connections: Map<string, ConnectionInfo> = new Map();

  async open(
    path: string,
    password?: string,
    readOnly = false
  ): Promise<
    | { success: true; connection: Omit<ConnectionInfo, 'db'> }
    | {
        success: false;
        error: string;
        needsPassword?: boolean;
        errorCode?: ErrorCode;
        troubleshootingSteps?: string[];
        documentationUrl?: string;
      }
  > {
    try {
      // Check if file appears encrypted before trying to open
      const fileIsEncrypted = isFileEncrypted(path);

      // If no password provided and file appears encrypted, ask for password
      if (!password && fileIsEncrypted) {
        const encryptedError =
          'Database appears to be encrypted. Please provide a password.';
        const enhanced = enhanceConnectionError(encryptedError);
        return {
          success: false,
          error: encryptedError,
          needsPassword: true,
          errorCode: enhanced.errorCode,
          troubleshootingSteps: enhanced.troubleshootingSteps,
          documentationUrl: enhanced.documentationUrl,
        };
      }

      // If password provided, try different cipher configurations
      if (password) {
        for (const config of CIPHER_CONFIGS) {
          let db: Database.Database | null = null;
          try {
            db = new Database(path, { readonly: readOnly });

            // Set cipher configuration
            db.pragma(`cipher = '${config.cipher}'`);
            if (config.legacy !== undefined) {
              db.pragma(`legacy = ${config.legacy}`);
            }
            if (config.kdfIter !== undefined) {
              db.pragma(`kdf_iter = ${config.kdfIter}`);
            }
            if (config.pageSize !== undefined) {
              db.pragma(`cipher_page_size = ${config.pageSize}`);
            }
            if (config.plaintextHeader !== undefined) {
              db.pragma(
                `cipher_plaintext_header_size = ${config.plaintextHeader}`
              );
            }

            // Set the key (hex format if specified)
            if (config.rawKey) {
              // Treat password as already being a hex key
              db.pragma(buildPragmaKeyValue(password, { rawKey: true }));
            } else if (config.hexKey) {
              // Convert password to hex string
              db.pragma(buildPragmaKeyValue(password, { hexKey: true }));
            } else {
              db.pragma(buildPragmaKeyValue(password));
            }

            // Test if we can read from the database
            db.prepare('SELECT count(*) FROM sqlite_master').get();

            // Success! Return connection
            const id = generateId();
            const filename = path.split('/').pop() || path;

            const connectionInfo: ConnectionInfo = {
              id,
              db,
              path,
              filename,
              isEncrypted: true,
              isReadOnly: readOnly,
            };

            this.connections.set(id, connectionInfo);

            // Log successful open
            sqlLogger.logOpen({
              connectionId: id,
              dbPath: path,
              success: true,
            });

            return {
              success: true,
              connection: {
                id,
                path,
                filename,
                isEncrypted: true,
                isReadOnly: readOnly,
              },
            };
          } catch {
            // This cipher config didn't work, close and try the next one
            if (db) {
              try {
                db.close();
              } catch {
                // Ignore close errors
              }
            }
            continue;
          }
        }

        // All cipher configs failed
        const invalidPasswordError =
          'Invalid password or unsupported encryption format. Supported formats: SQLCipher 1-4, ChaCha20, AES-256-CBC, RC4.';
        const encryptionEnhanced = enhanceConnectionError(invalidPasswordError);
        return {
          success: false,
          error: invalidPasswordError,
          errorCode: 'ENCRYPTION_ERROR',
          troubleshootingSteps: [
            'Verify the encryption password is correct',
            'Try different cipher configurations (SQLCipher 3 vs 4)',
            'Check if the database was created with a different encryption tool',
            'Verify the file is actually an encrypted SQLite database',
            'Contact the database creator for the correct password/cipher settings',
          ],
          documentationUrl: encryptionEnhanced.documentationUrl,
        };
      }

      // No password, try opening normally
      const db = new Database(path, { readonly: readOnly });

      // Test connection
      db.prepare('SELECT 1').get();

      const id = generateId();
      const filename = path.split('/').pop() || path;

      const connectionInfo: ConnectionInfo = {
        id,
        db,
        path,
        filename,
        isEncrypted: false,
        isReadOnly: readOnly,
      };

      this.connections.set(id, connectionInfo);

      // Log successful open
      sqlLogger.logOpen({
        connectionId: id,
        dbPath: path,
        success: true,
      });

      return {
        success: true,
        connection: {
          id,
          path,
          filename,
          isEncrypted: false,
          isReadOnly: readOnly,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to open database';

      // Log failed open
      sqlLogger.logOpen({
        connectionId: 'unknown',
        dbPath: path,
        success: false,
        error: errorMessage,
      });

      // Check if error suggests encryption
      if (
        errorMessage.includes('file is not a database') ||
        errorMessage.includes('encrypted')
      ) {
        const encryptedError =
          'Database appears to be encrypted. Please provide a password.';
        const enhanced = enhanceConnectionError(encryptedError);
        return {
          success: false,
          error: encryptedError,
          needsPassword: true,
          errorCode: enhanced.errorCode,
          troubleshootingSteps: enhanced.troubleshootingSteps,
          documentationUrl: enhanced.documentationUrl,
        };
      }

      // Enhance other connection errors with troubleshooting steps
      const enhanced = enhanceConnectionError(errorMessage);
      return {
        success: false,
        error: enhanced.error,
        errorCode: enhanced.errorCode,
        troubleshootingSteps: enhanced.troubleshootingSteps,
        documentationUrl: enhanced.documentationUrl,
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
      conn.db.close();
      this.connections.delete(connectionId);

      // Log successful close
      sqlLogger.logClose({
        connectionId,
        dbPath: conn.path,
        success: true,
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to close database';

      // Log failed close
      sqlLogger.logClose({
        connectionId,
        dbPath: conn.path,
        success: false,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Change the encryption password of a database.
   * Uses PRAGMA rekey to change the password.
   * @param connectionId - The ID of the connection
   * @param newPassword - The new password (empty string to remove encryption)
   * @returns Success status or error information
   */
  changePassword(
    connectionId: string,
    newPassword: string
  ):
    | { success: true }
    | { success: false; error: string; errorCode?: ErrorCode } {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: 'Connection not found' };
    }

    if (conn.isReadOnly) {
      return {
        success: false,
        error: 'Cannot change password on a read-only connection',
        errorCode: 'PERMISSION_ERROR',
      };
    }

    try {
      // Use PRAGMA rekey to change the password
      // Empty string removes encryption
      conn.db.pragma(buildPragmaRekeyValue(newPassword));

      // Verify the change by testing a simple query
      conn.db.prepare('SELECT count(*) FROM sqlite_master').get();

      // Update connection info
      conn.isEncrypted = newPassword !== '';

      // Log the password change operation
      sqlLogger.logQuery({
        connectionId,
        dbPath: conn.path,
        sql: 'PRAGMA rekey = [REDACTED]',
        durationMs: 0,
        success: true,
        rowCount: 0,
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to change database password';

      // Log the failure
      sqlLogger.logQuery({
        connectionId,
        dbPath: conn.path,
        sql: 'PRAGMA rekey = [REDACTED]',
        durationMs: 0,
        success: false,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
        errorCode: 'ENCRYPTION_ERROR',
      };
    }
  }

  /**
   * Get connection information by connection ID.
   * Used for retrieving connection metadata without database operations.
   */
  getConnection(connectionId: string): Omit<ConnectionInfo, 'db'> | null {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return null;
    }

    return {
      id: conn.id,
      path: conn.path,
      filename: conn.filename,
      isEncrypted: conn.isEncrypted,
      isReadOnly: conn.isReadOnly,
    };
  }

  getSchema(connectionId: string):
    | {
        success: true;
        schemas: SchemaInfo[];
        tables: TableInfo[];
        views: TableInfo[];
      }
    | { success: false; error: string } {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: 'Connection not found' };
    }

    try {
      // Get all attached databases/schemas using PRAGMA database_list
      // Returns: seq, name, file (e.g., 0, main, /path/to/db.sqlite)
      const startTime = performance.now();
      const databaseList = conn.db
        .prepare('PRAGMA database_list')
        .all() as Array<{ seq: number; name: string; file: string }>;
      const durationMs = performance.now() - startTime;

      // Log schema query
      sqlLogger.logQuery({
        connectionId,
        dbPath: conn.path,
        sql: 'PRAGMA database_list',
        durationMs,
        success: true,
        rowCount: databaseList.length,
      });

      const schemas: SchemaInfo[] = [];
      const allTables: TableInfo[] = [];
      const allViews: TableInfo[] = [];

      for (const dbInfo of databaseList) {
        const schemaName = dbInfo.name;

        // Get tables and views for this schema
        const tables = this.getTablesAndViews(
          conn.db,
          'table',
          schemaName,
          connectionId,
          conn.path
        );
        const views = this.getTablesAndViews(
          conn.db,
          'view',
          schemaName,
          connectionId,
          conn.path
        );

        // Only add schema if it has tables or views (skip empty temp schema)
        if (tables.length > 0 || views.length > 0 || schemaName === 'main') {
          schemas.push({
            name: schemaName,
            tables,
            views,
          });
        }

        allTables.push(...tables);
        allViews.push(...views);
      }

      return { success: true, schemas, tables: allTables, views: allViews };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get schema',
      };
    }
  }

  /**
   * Get a lightweight schema list containing only table/view names.
   * This is more memory-efficient than getSchema() for initial loading.
   * Column and index details should be fetched on-demand using getTableDetails().
   */
  getSchemaList(connectionId: string):
    | {
        success: true;
        schemas: SchemaListInfo[];
      }
    | { success: false; error: string } {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: 'Connection not found' };
    }

    try {
      const startTime = performance.now();
      const databaseList = conn.db
        .prepare('PRAGMA database_list')
        .all() as Array<{ seq: number; name: string; file: string }>;
      const durationMs = performance.now() - startTime;

      sqlLogger.logQuery({
        connectionId,
        dbPath: conn.path,
        sql: 'PRAGMA database_list',
        durationMs,
        success: true,
        rowCount: databaseList.length,
      });

      const schemas: SchemaListInfo[] = [];

      for (const dbInfo of databaseList) {
        const schemaName = dbInfo.name;

        const tables = this.getTableList(
          conn.db,
          'table',
          schemaName,
          connectionId,
          conn.path
        );
        const views = this.getTableList(
          conn.db,
          'view',
          schemaName,
          connectionId,
          conn.path
        );

        if (tables.length > 0 || views.length > 0 || schemaName === 'main') {
          schemas.push({
            name: schemaName,
            tables,
            views,
          });
        }
      }

      return { success: true, schemas };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to get schema list',
      };
    }
  }

  /**
   * Get lightweight table/view list for a schema (without column/index details).
   */
  private getTableList(
    db: Database.Database,
    type: 'table' | 'view',
    schema: string = 'main',
    connectionId?: string,
    dbPath?: string
  ): TableListItem[] {
    const sqliteType = type === 'table' ? 'table' : 'view';
    const sql = `SELECT name, sql FROM "${schema}".sqlite_master WHERE type = ? AND name NOT LIKE 'sqlite_%' ORDER BY name`;
    const startTime = performance.now();
    const items = db.prepare(sql).all(sqliteType) as Array<{
      name: string;
      sql: string;
    }>;
    const durationMs = performance.now() - startTime;

    if (connectionId) {
      sqlLogger.logQuery({
        connectionId,
        dbPath,
        sql: sql.replace('?', `'${sqliteType}'`),
        durationMs,
        success: true,
        rowCount: items.length,
      });
    }

    return items.map((item) => {
      // Only get row count for tables (not views), and skip expensive count for very large tables
      let rowCount: number | undefined;
      if (type === 'table') {
        rowCount = this.getRowCount(db, item.name, schema);
      }

      return {
        name: item.name,
        schema,
        type,
        rowCount,
        sql: item.sql || '',
      };
    });
  }

  /**
   * Get detailed information for a specific table (columns, indexes, triggers, foreign keys).
   * Use this for on-demand loading when a table is selected.
   */
  getTableDetails(
    connectionId: string,
    tableName: string,
    schema: string = 'main'
  ): { success: true; table: TableInfo } | { success: false; error: string } {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: 'Connection not found' };
    }

    try {
      // Check if table/view exists
      const typeResult = conn.db
        .prepare(
          `SELECT type, sql FROM "${schema}".sqlite_master WHERE name = ? AND type IN ('table', 'view')`
        )
        .get(tableName) as { type: string; sql: string } | undefined;

      if (!typeResult) {
        return {
          success: false,
          error: `Table or view "${tableName}" not found in schema "${schema}"`,
        };
      }

      const tableType = typeResult.type as 'table' | 'view';
      const tableSql = typeResult.sql || '';

      const columns = this.getColumns(conn.db, tableName, schema);
      const primaryKey = columns
        .filter((c) => c.isPrimaryKey)
        .map((c) => c.name);
      const foreignKeys = this.getForeignKeys(conn.db, tableName, schema);
      const indexes =
        tableType === 'table'
          ? this.getIndexes(conn.db, tableName, schema)
          : [];
      const triggers =
        tableType === 'table'
          ? this.getTriggers(conn.db, tableName, schema)
          : [];
      const rowCount =
        tableType === 'table'
          ? this.getRowCount(conn.db, tableName, schema)
          : undefined;

      const table: TableInfo = {
        name: tableName,
        schema,
        type: tableType,
        columns,
        primaryKey,
        foreignKeys,
        indexes,
        triggers,
        rowCount,
        sql: tableSql,
      };

      return { success: true, table };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get table details',
      };
    }
  }

  private getTablesAndViews(
    db: Database.Database,
    type: 'table' | 'view',
    schema: string = 'main',
    connectionId?: string,
    dbPath?: string
  ): TableInfo[] {
    const sqliteType = type === 'table' ? 'table' : 'view';
    // Query the schema-specific sqlite_master table
    const sql = `SELECT name, sql FROM "${schema}".sqlite_master WHERE type = ? AND name NOT LIKE 'sqlite_%' ORDER BY name`;
    const startTime = performance.now();
    const items = db.prepare(sql).all(sqliteType) as Array<{
      name: string;
      sql: string;
    }>;
    const durationMs = performance.now() - startTime;

    // Log the query if connectionId is provided
    if (connectionId) {
      sqlLogger.logQuery({
        connectionId,
        dbPath,
        sql: sql.replace('?', `'${sqliteType}'`),
        durationMs,
        success: true,
        rowCount: items.length,
      });
    }

    return items.map((item) => {
      const columns = this.getColumns(db, item.name, schema);
      const primaryKey = columns
        .filter((c) => c.isPrimaryKey)
        .map((c) => c.name);
      const foreignKeys = this.getForeignKeys(db, item.name, schema);
      const indexes =
        type === 'table' ? this.getIndexes(db, item.name, schema) : [];
      const triggers =
        type === 'table' ? this.getTriggers(db, item.name, schema) : [];
      const rowCount =
        type === 'table' ? this.getRowCount(db, item.name, schema) : undefined;

      return {
        name: item.name,
        schema,
        type,
        columns,
        primaryKey,
        foreignKeys,
        indexes,
        triggers,
        rowCount,
        sql: item.sql || '',
      };
    });
  }

  private getColumns(
    db: Database.Database,
    tableName: string,
    schema: string = 'main'
  ): ColumnInfo[] {
    // Use schema-qualified PRAGMA for table_info
    const columns = db
      .prepare(`PRAGMA "${schema}".table_info("${tableName}")`)
      .all() as Array<{
      cid: number;
      name: string;
      type: string;
      notnull: number;
      dflt_value: string | null;
      pk: number;
    }>;

    return columns.map((col) => ({
      name: col.name,
      type: col.type,
      nullable: col.notnull === 0,
      defaultValue: col.dflt_value,
      isPrimaryKey: col.pk > 0,
    }));
  }

  private getForeignKeys(
    db: Database.Database,
    tableName: string,
    schema: string = 'main'
  ): ForeignKeyInfo[] {
    const escapedSchema = escapePragmaIdentifier(schema);
    const escapedTable = escapePragmaIdentifier(tableName);
    const fks = db
      .prepare(`PRAGMA "${escapedSchema}".foreign_key_list("${escapedTable}")`)
      .all() as Array<{
      id: number;
      seq: number;
      table: string;
      from: string;
      to: string;
      on_update: string;
      on_delete: string;
    }>;

    return fks.map((fk) => ({
      column: fk.from,
      referencedTable: fk.table,
      referencedColumn: fk.to,
      onDelete: fk.on_delete,
      onUpdate: fk.on_update,
    }));
  }

  private getIndexes(
    db: Database.Database,
    tableName: string,
    schema: string = 'main'
  ): IndexInfo[] {
    const indexList = db
      .prepare(`PRAGMA "${schema}".index_list("${tableName}")`)
      .all() as Array<{
      seq: number;
      name: string;
      unique: number;
      origin: string;
      partial: number;
    }>;

    return indexList
      .filter((idx) => !idx.name.startsWith('sqlite_'))
      .map((idx) => {
        const indexInfo = db
          .prepare(`PRAGMA "${schema}".index_info("${idx.name}")`)
          .all() as Array<{
          seqno: number;
          cid: number;
          name: string;
        }>;

        const sqlResult = db
          .prepare(
            `SELECT sql FROM "${schema}".sqlite_master WHERE type = 'index' AND name = ?`
          )
          .get(idx.name) as { sql: string } | undefined;

        return {
          name: idx.name,
          columns: indexInfo.map((i) => i.name),
          isUnique: idx.unique === 1,
          sql: sqlResult?.sql || '',
        };
      });
  }

  private getTriggers(
    db: Database.Database,
    tableName: string,
    schema: string = 'main'
  ): TriggerInfo[] {
    const triggers = db
      .prepare(
        `SELECT name, sql FROM "${schema}".sqlite_master WHERE type = 'trigger' AND tbl_name = ? ORDER BY name`
      )
      .all(tableName) as Array<{ name: string; sql: string }>;

    return triggers.map((trigger) => {
      // Parse timing and event from SQL
      const sql = trigger.sql || '';
      let timing: 'BEFORE' | 'AFTER' | 'INSTEAD OF' = 'BEFORE';
      let event: 'INSERT' | 'UPDATE' | 'DELETE' = 'INSERT';

      const upperSql = sql.toUpperCase();
      if (upperSql.includes('AFTER')) {
        timing = 'AFTER';
      } else if (upperSql.includes('INSTEAD OF')) {
        timing = 'INSTEAD OF';
      }

      if (upperSql.includes('UPDATE')) {
        event = 'UPDATE';
      } else if (upperSql.includes('DELETE')) {
        event = 'DELETE';
      }

      return {
        name: trigger.name,
        tableName,
        timing,
        event,
        sql,
      };
    });
  }

  /**
   * Threshold for using estimated row counts vs exact COUNT(*)
   * For tables larger than this, we use estimation to avoid long query times
   */
  private static readonly FAST_COUNT_THRESHOLD = 100000;

  /**
   * Get row count for a table, using estimation for large tables.
   *
   * For performance, we use a tiered approach:
   * 1. Try sqlite_stat1 first (if ANALYZE has been run)
   * 2. Fall back to MAX(rowid) estimation for tables without deletes
   * 3. Use COUNT(*) only for small tables or as last resort
   *
   * The returned count may be approximate for large tables, indicated
   * by the isEstimated flag when using getRowCountWithMetadata().
   */
  private getRowCount(
    db: Database.Database,
    tableName: string,
    schema: string = 'main'
  ): number {
    const result = this.getRowCountWithMetadata(db, tableName, schema);
    return result.count;
  }

  /**
   * Get row count with metadata about whether it's an estimate.
   * Useful for displaying to users when count is approximate.
   */
  private getRowCountWithMetadata(
    db: Database.Database,
    tableName: string,
    schema: string = 'main'
  ): { count: number; isEstimated: boolean } {
    try {
      // First, try to get an estimate from sqlite_stat1
      // This is populated when ANALYZE has been run on the database
      const statResult = this.getEstimatedCountFromStat1(db, tableName, schema);
      if (
        statResult !== null &&
        statResult >= DatabaseService.FAST_COUNT_THRESHOLD
      ) {
        return { count: statResult, isEstimated: true };
      }

      // Try MAX(rowid) estimation - fast for tables with rowid
      // This works well for tables without many deletions
      const rowidEstimate = this.getEstimatedCountFromRowid(
        db,
        tableName,
        schema
      );
      if (
        rowidEstimate !== null &&
        rowidEstimate >= DatabaseService.FAST_COUNT_THRESHOLD
      ) {
        return { count: rowidEstimate, isEstimated: true };
      }

      // For smaller tables or when estimation fails, use exact COUNT(*)
      const result = db
        .prepare(`SELECT COUNT(*) as count FROM "${schema}"."${tableName}"`)
        .get() as { count: number };
      return { count: result.count, isEstimated: false };
    } catch {
      return { count: 0, isEstimated: false };
    }
  }

  /**
   * Get estimated row count from sqlite_stat1 table.
   * Returns null if the table doesn't exist or has no statistics.
   *
   * sqlite_stat1 format: tbl, idx, stat
   * - For the table itself (when idx is null or the PK), stat starts with row count
   * - stat format is "rowcount col1_avg col2_avg ..."
   */
  private getEstimatedCountFromStat1(
    db: Database.Database,
    tableName: string,
    schema: string = 'main'
  ): number | null {
    try {
      // Check if sqlite_stat1 exists
      const statTableExists = db
        .prepare(
          `SELECT name FROM "${schema}".sqlite_master WHERE type='table' AND name='sqlite_stat1'`
        )
        .get() as { name: string } | undefined;

      if (!statTableExists) {
        return null;
      }

      // Query sqlite_stat1 for this table
      // The stat column contains space-separated values, first is row count
      const statResult = db
        .prepare(
          `SELECT stat FROM "${schema}".sqlite_stat1 WHERE tbl = ? ORDER BY idx NULLS FIRST LIMIT 1`
        )
        .get(tableName) as { stat: string } | undefined;

      if (!statResult || !statResult.stat) {
        return null;
      }

      // Parse the first number from stat (row count)
      const rowCount = Number.parseInt(statResult.stat.split(' ')[0], 10);
      if (Number.isNaN(rowCount)) {
        return null;
      }

      return rowCount;
    } catch {
      return null;
    }
  }

  /**
   * Get estimated row count using MAX(rowid).
   * This is fast but may overestimate if rows have been deleted.
   * Returns null for tables without rowid (WITHOUT ROWID tables).
   */
  private getEstimatedCountFromRowid(
    db: Database.Database,
    tableName: string,
    schema: string = 'main'
  ): number | null {
    try {
      // Try to get MAX(rowid) - this is O(1) with an index
      const result = db
        .prepare(
          `SELECT MAX(rowid) as max_rowid FROM "${schema}"."${tableName}"`
        )
        .get() as { max_rowid: number | null } | undefined;

      if (!result || result.max_rowid === null) {
        return null;
      }

      return result.max_rowid;
    } catch {
      // Table might be WITHOUT ROWID or have other issues
      return null;
    }
  }

  execute(
    connectionId: string,
    sql: string,
    params?: unknown[]
  ):
    | {
        success: true;
        changes: number;
        lastInsertRowid: number;
      }
    | {
        success: false;
        error: string;
        errorCode?: ErrorCode;
        errorPosition?: ErrorPosition;
        troubleshootingSteps?: string[];
        documentationUrl?: string;
      } {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: 'Connection not found' };
    }

    const startTime = performance.now();
    try {
      const stmt = conn.db.prepare(sql);
      const result = stmt.run(...(params || []));
      const durationMs = performance.now() - startTime;

      // Log successful execute
      sqlLogger.logExecute({
        connectionId,
        dbPath: conn.path,
        sql,
        durationMs,
        success: true,
        rowCount: result.changes,
      });

      return {
        success: true,
        changes: result.changes,
        lastInsertRowid:
          typeof result.lastInsertRowid === 'bigint'
            ? Number(result.lastInsertRowid)
            : result.lastInsertRowid,
      };
    } catch (error) {
      const durationMs = performance.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const enhanced = enhanceQueryError(errorMessage, sql);

      // Log failed execute
      sqlLogger.logExecute({
        connectionId,
        dbPath: conn.path,
        sql,
        durationMs,
        success: false,
        error: enhanced.error,
      });

      return {
        success: false,
        error: enhanced.error,
        errorCode: enhanced.errorCode,
        errorPosition: enhanced.errorPosition,
        troubleshootingSteps: enhanced.troubleshootingSteps,
        documentationUrl: enhanced.documentationUrl,
      };
    }
  }

  query(
    connectionId: string,
    sql: string,
    params?: unknown[]
  ):
    | {
        success: true;
        columns: string[];
        rows: unknown[][];
      }
    | {
        success: false;
        error: string;
        errorCode?: ErrorCode;
        errorPosition?: ErrorPosition;
        troubleshootingSteps?: string[];
        documentationUrl?: string;
      } {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: 'Connection not found' };
    }

    const startTime = performance.now();
    try {
      const stmt = conn.db.prepare(sql);
      const rows = stmt.all(...(params || [])) as Array<
        Record<string, unknown>
      >;
      const durationMs = performance.now() - startTime;

      if (rows.length === 0) {
        // Log successful query with no results
        sqlLogger.logQuery({
          connectionId,
          dbPath: conn.path,
          sql,
          durationMs,
          success: true,
          rowCount: 0,
        });

        return {
          success: true,
          columns: [],
          rows: [],
        };
      }

      const columns = Object.keys(rows[0]);
      const rowsArray = rows.map((row) => columns.map((col) => row[col]));

      // Log successful query
      sqlLogger.logQuery({
        connectionId,
        dbPath: conn.path,
        sql,
        durationMs,
        success: true,
        rowCount: rows.length,
      });

      return {
        success: true,
        columns,
        rows: rowsArray,
      };
    } catch (error) {
      const durationMs = performance.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const enhanced = enhanceQueryError(errorMessage, sql);

      // Log failed query
      sqlLogger.logQuery({
        connectionId,
        dbPath: conn.path,
        sql,
        durationMs,
        success: false,
        error: enhanced.error,
      });

      return {
        success: false,
        error: enhanced.error,
        errorCode: enhanced.errorCode,
        errorPosition: enhanced.errorPosition,
        troubleshootingSteps: enhanced.troubleshootingSteps,
        documentationUrl: enhanced.documentationUrl,
      };
    }
  }

  getTableStructure(
    connectionId: string,
    tableName: string,
    schema: string = 'main'
  ):
    | { success: true; structure: TableInfo }
    | { success: false; error: string } {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: 'Connection not found' };
    }

    try {
      const tables = this.getTablesAndViews(conn.db, 'table', schema);
      const table = tables.find((t) => t.name === tableName);

      if (!table) {
        return { success: false, error: `Table "${tableName}" not found` };
      }

      return { success: true, structure: table };
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

  explainQuery(
    connectionId: string,
    sql: string
  ):
    | { success: true; plan: QueryPlanNode; stats: QueryPlanStats }
    | { success: false; error: string } {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: 'Connection not found' };
    }

    try {
      // Get the query plan
      const planRows = conn.db
        .prepare(`EXPLAIN QUERY PLAN ${sql}`)
        .all() as Array<{
        id: number;
        parent: number;
        notused: number;
        detail: string;
      }>;

      // Parse the plan into a tree structure
      const planMap = new Map<number, QueryPlanNode>();
      const roots: QueryPlanNode[] = [];

      for (const row of planRows) {
        const node: QueryPlanNode = {
          id: row.id,
          parent: row.parent,
          notUsed: row.notused,
          detail: row.detail,
          children: [] as QueryPlanNode[],
        };

        planMap.set(row.id, node);

        if (row.parent === 0) {
          roots.push(node);
        } else {
          const parent = planMap.get(row.parent);
          if (parent && parent.children) {
            parent.children.push(node);
          }
        }
      }

      // Calculate statistics
      const stats: QueryPlanStats = {
        totalNodes: planRows.length,
        depth: calculateDepth(roots),
        hasScan: planRows.some((r) => r.detail.includes('SCAN')),
        hasSort: planRows.some((r) => r.detail.includes('SORT')),
        hasIndex: planRows.some((r) => r.detail.includes('INDEX')),
      };

      return {
        success: true,
        plan: roots[0] || {
          id: 0,
          parent: 0,
          notUsed: 0,
          detail: 'UNKNOWN',
          children: [],
        },
        stats,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to explain query',
      };
    }
  }

  validateQuery(connectionId: string, sql: string): ValidationResult {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { isValid: false, error: 'Connection not found' };
    }

    try {
      conn.db.prepare(sql);
      return { isValid: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        isValid: false,
        error: errorMessage,
      };
    }
  }

  getTableData(
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
  ): GetTableDataResponse {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: 'Connection not found' };
    }

    const schemaPrefix = schema ? `"${schema}".` : '';
    let sql = `SELECT * FROM ${schemaPrefix}"${table}"`;
    const params: unknown[] = [];

    try {
      // Apply filters
      if (filters && filters.length > 0) {
        const conditions = filters.map((f) => {
          switch (f.operator) {
            case 'eq':
              params.push(f.value);
              return `"${f.column}" = ?`;
            case 'neq':
              params.push(f.value);
              return `"${f.column}" != ?`;
            case 'gt':
              params.push(f.value);
              return `"${f.column}" > ?`;
            case 'lt':
              params.push(f.value);
              return `"${f.column}" < ?`;
            case 'gte':
              params.push(f.value);
              return `"${f.column}" >= ?`;
            case 'lte':
              params.push(f.value);
              return `"${f.column}" <= ?`;
            case 'like':
              params.push(`%${f.value}%`);
              return `"${f.column}" LIKE ?`;
            case 'isnull':
              return `"${f.column}" IS NULL`;
            case 'notnull':
              return `"${f.column}" IS NOT NULL`;
            default:
              params.push(f.value);
              return `"${f.column}" = ?`;
          }
        });
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }

      // Apply sorting
      if (sortColumn) {
        sql += ` ORDER BY "${sortColumn}" ${sortDirection === 'desc' ? 'DESC' : 'ASC'}`;
      }

      // Get total count
      const countSql = sql.replace(/SELECT \*/, 'SELECT COUNT(*) as count');
      const countStartTime = performance.now();
      const countResult = conn.db.prepare(countSql).get(...params) as {
        count: number;
      };
      const countDurationMs = performance.now() - countStartTime;
      const totalRows = countResult.count;

      // Log count query
      sqlLogger.logQuery({
        connectionId,
        dbPath: conn.path,
        sql: countSql,
        durationMs: countDurationMs,
        success: true,
        rowCount: 1,
      });

      // Apply pagination
      const offset = (page - 1) * pageSize;
      sql += ` LIMIT ? OFFSET ?`;
      params.push(pageSize, offset);

      const dataStartTime = performance.now();
      const rows = conn.db.prepare(sql).all(...params) as Array<
        Record<string, unknown>
      >;
      const dataDurationMs = performance.now() - dataStartTime;

      // Log data query
      sqlLogger.logQuery({
        connectionId,
        dbPath: conn.path,
        sql,
        durationMs: dataDurationMs,
        success: true,
        rowCount: rows.length,
      });

      // Get column info
      const columns = this.getColumns(conn.db, table, schema || 'main');

      return {
        success: true,
        columns,
        rows,
        totalRows,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to get table data';

      // Log failed query
      sqlLogger.logQuery({
        connectionId,
        dbPath: conn.path,
        sql,
        durationMs: 0,
        success: false,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get a range of rows from a table using LIMIT/OFFSET pagination.
   * Designed for virtual scrolling and infinite scroll patterns.
   *
   * This method is optimized for large tables:
   * - Uses LIMIT/OFFSET for efficient chunked loading
   * - Returns estimated total count for large tables (>100k rows)
   * - Supports sorting and filtering
   *
   * @param connectionId - The database connection ID
   * @param table - The table name to fetch from
   * @param startRow - Starting row index (0-based)
   * @param endRow - Ending row index (exclusive)
   * @param sortColumn - Optional column to sort by
   * @param sortDirection - Sort direction (defaults to 'asc')
   * @param filters - Optional filters to apply
   * @param schema - Database schema (defaults to 'main')
   */
  getTableRowRange(
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
  ): {
    success: boolean;
    columns?: ColumnInfo[];
    rows?: Record<string, unknown>[];
    totalRows?: number;
    isEstimatedTotal?: boolean;
    actualStartRow?: number;
    actualEndRow?: number;
    error?: string;
  } {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: 'Connection not found' };
    }

    // Validate row range
    if (startRow < 0) {
      startRow = 0;
    }
    if (endRow <= startRow) {
      return {
        success: true,
        columns: [],
        rows: [],
        totalRows: 0,
        isEstimatedTotal: false,
        actualStartRow: startRow,
        actualEndRow: startRow,
      };
    }

    const schemaPrefix = schema ? `"${schema}".` : '';
    const schemaName = schema || 'main';
    let sql = `SELECT * FROM ${schemaPrefix}"${table}"`;
    const params: unknown[] = [];

    try {
      // Build WHERE clause from filters
      if (filters && filters.length > 0) {
        const conditions = filters.map((f) => {
          switch (f.operator) {
            case 'eq':
              params.push(f.value);
              return `"${f.column}" = ?`;
            case 'neq':
              params.push(f.value);
              return `"${f.column}" != ?`;
            case 'gt':
              params.push(f.value);
              return `"${f.column}" > ?`;
            case 'lt':
              params.push(f.value);
              return `"${f.column}" < ?`;
            case 'gte':
              params.push(f.value);
              return `"${f.column}" >= ?`;
            case 'lte':
              params.push(f.value);
              return `"${f.column}" <= ?`;
            case 'like':
              params.push(`%${f.value}%`);
              return `"${f.column}" LIKE ?`;
            case 'isnull':
              return `"${f.column}" IS NULL`;
            case 'notnull':
              return `"${f.column}" IS NOT NULL`;
            default:
              params.push(f.value);
              return `"${f.column}" = ?`;
          }
        });
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }

      // Apply ORDER BY
      if (sortColumn) {
        sql += ` ORDER BY "${sortColumn}" ${sortDirection === 'desc' ? 'DESC' : 'ASC'}`;
      }

      // Get total row count (with estimation for large tables)
      // For filtered queries, we need exact count; for unfiltered, we can estimate
      let totalRows: number;
      let isEstimatedTotal = false;

      if (filters && filters.length > 0) {
        // For filtered queries, get exact count
        const countSql = sql.replace(/SELECT \*/, 'SELECT COUNT(*) as count');
        const countStartTime = performance.now();
        const countResult = conn.db.prepare(countSql).get(...params) as {
          count: number;
        };
        const countDurationMs = performance.now() - countStartTime;
        totalRows = countResult.count;

        sqlLogger.logQuery({
          connectionId,
          dbPath: conn.path,
          sql: countSql,
          durationMs: countDurationMs,
          success: true,
          rowCount: 1,
        });
      } else {
        // For unfiltered queries, use fast estimation for large tables
        const countMeta = this.getRowCountWithMetadata(
          conn.db,
          table,
          schemaName
        );
        totalRows = countMeta.count;
        isEstimatedTotal = countMeta.isEstimated;
      }

      // Calculate the actual range to fetch
      const actualStartRow = Math.min(startRow, totalRows);
      const limit = endRow - startRow;
      const offset = actualStartRow;

      // Apply LIMIT/OFFSET for the row range
      sql += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      // Execute the query
      const dataStartTime = performance.now();
      const rows = conn.db.prepare(sql).all(...params) as Array<
        Record<string, unknown>
      >;
      const dataDurationMs = performance.now() - dataStartTime;

      sqlLogger.logQuery({
        connectionId,
        dbPath: conn.path,
        sql,
        durationMs: dataDurationMs,
        success: true,
        rowCount: rows.length,
      });

      // Get column information
      const columns = this.getColumns(conn.db, table, schemaName);

      // Calculate actual end row
      const actualEndRow = actualStartRow + rows.length;

      return {
        success: true,
        columns,
        rows,
        totalRows,
        isEstimatedTotal,
        actualStartRow,
        actualEndRow,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to get table row range';

      sqlLogger.logQuery({
        connectionId,
        dbPath: conn.path,
        sql,
        durationMs: 0,
        success: false,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Split SQL string into individual statements.
   * Handles semicolons inside strings and comments.
   */
  private splitStatements(sql: string): string[] {
    const statements: string[] = [];
    let current = '';
    let inString: string | null = null;
    let inLineComment = false;
    let inBlockComment = false;

    for (let i = 0; i < sql.length; i++) {
      const char = sql[i];
      const nextChar = sql[i + 1];

      // Handle line comments
      if (!inString && !inBlockComment && char === '-' && nextChar === '-') {
        inLineComment = true;
        current += char;
        continue;
      }

      if (inLineComment && char === '\n') {
        inLineComment = false;
        current += char;
        continue;
      }

      // Handle block comments
      if (!inString && !inLineComment && char === '/' && nextChar === '*') {
        inBlockComment = true;
        current += char;
        continue;
      }

      if (inBlockComment && char === '*' && nextChar === '/') {
        inBlockComment = false;
        current += char + nextChar;
        i++;
        continue;
      }

      // Handle strings
      if (!inLineComment && !inBlockComment) {
        if (!inString && (char === "'" || char === '"')) {
          inString = char;
        } else if (inString === char) {
          // Check for escaped quote
          if (nextChar === char) {
            current += char + nextChar;
            i++;
            continue;
          }
          inString = null;
        }
      }

      // Handle statement separator
      if (!inString && !inLineComment && !inBlockComment && char === ';') {
        const stmt = current.trim();
        if (stmt) {
          statements.push(stmt);
        }
        current = '';
        continue;
      }

      current += char;
    }

    // Add the last statement if it doesn't end with semicolon
    const lastStmt = current.trim();
    if (lastStmt) {
      statements.push(lastStmt);
    }

    return statements;
  }

  executeQuery(connectionId: string, query: string) {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: 'Connection not found' };
    }

    // Split into individual statements
    const statements = this.splitStatements(query);

    if (statements.length === 0) {
      return { success: false, error: 'No SQL statements to execute' };
    }

    // For single statement, use the original logic
    if (statements.length === 1) {
      return this.executeSingleStatement(connectionId, statements[0]);
    }

    // For multiple statements, execute them sequentially
    // Collect all results (SELECT results as separate result sets)
    const resultSets: Array<{
      columns: string[];
      rows: Record<string, unknown>[];
    }> = [];
    let totalChanges = 0;
    let lastInsertRowid = 0;
    let executedCount = 0;

    // Check if user is managing their own transaction
    const hasUserTransaction = statements.some((stmt) => {
      const upper = stmt.trim().toUpperCase();
      return (
        upper.startsWith('BEGIN') ||
        upper.startsWith('COMMIT') ||
        upper.startsWith('ROLLBACK') ||
        upper.startsWith('END')
      );
    });

    // Only wrap in transaction if user isn't managing their own
    const useAutoTransaction = !hasUserTransaction;

    try {
      if (useAutoTransaction) {
        conn.db.exec('BEGIN TRANSACTION');
      }

      for (const stmt of statements) {
        const result = this.executeSingleStatement(connectionId, stmt);

        if (!result.success) {
          if (useAutoTransaction) {
            try {
              conn.db.exec('ROLLBACK');
            } catch {
              // Ignore rollback errors
            }
          }
          return {
            success: false as const,
            error: `Error in statement ${executedCount + 1}: ${result.error}`,
            errorCode: 'errorCode' in result ? result.errorCode : undefined,
            errorPosition:
              'errorPosition' in result ? result.errorPosition : undefined,
            troubleshootingSteps:
              'troubleshootingSteps' in result
                ? result.troubleshootingSteps
                : undefined,
            documentationUrl:
              'documentationUrl' in result
                ? result.documentationUrl
                : undefined,
          };
        }

        executedCount++;

        // Track results
        if ('rows' in result && result.success) {
          resultSets.push({
            columns: result.columns,
            rows: result.rows,
          });
        } else if ('changes' in result && result.success) {
          totalChanges += result.changes;
          lastInsertRowid = result.lastInsertRowid;
        }
      }

      if (useAutoTransaction) {
        conn.db.exec('COMMIT');
      }

      // Return results based on what was executed
      if (resultSets.length > 0) {
        // Return all result sets for multiple SELECTs
        // For single result set, return in flat format for backward compatibility
        if (resultSets.length === 1) {
          return {
            success: true as const,
            columns: resultSets[0].columns,
            rows: resultSets[0].rows,
            executedStatements: executedCount,
            totalChanges,
          };
        }

        // Multiple result sets - return as array
        return {
          success: true as const,
          resultSets,
          executedStatements: executedCount,
          totalChanges,
        };
      }

      return {
        success: true,
        changes: totalChanges,
        lastInsertRowid,
        executedStatements: executedCount,
      };
    } catch (error) {
      if (useAutoTransaction) {
        try {
          conn.db.exec('ROLLBACK');
        } catch {
          // Ignore rollback errors
        }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute a single SQL statement
   */
  private executeSingleStatement(
    connectionId: string,
    query: string
  ):
    | {
        success: true;
        columns: string[];
        rows: Record<string, unknown>[];
      }
    | {
        success: true;
        changes: number;
        lastInsertRowid: number;
      }
    | {
        success: false;
        error: string;
        errorCode?: ErrorCode;
        errorPosition?: ErrorPosition;
        troubleshootingSteps?: string[];
        documentationUrl?: string;
      } {
    // Determine if it's a SELECT or a modification query
    const trimmed = query.trim().toUpperCase();
    if (
      trimmed.startsWith('SELECT') ||
      trimmed.startsWith('PRAGMA') ||
      trimmed.startsWith('EXPLAIN') ||
      trimmed.startsWith('WITH')
    ) {
      const result = this.query(connectionId, query);
      if (result.success) {
        // Convert array format to record format
        const rows = result.rows.map((row) => {
          const record: Record<string, unknown> = {};
          result.columns.forEach((col, i) => {
            record[col] = (row as unknown[])[i];
          });
          return record;
        });
        return {
          success: true as const,
          columns: result.columns,
          rows,
        };
      }
      return result;
    } else {
      return this.execute(connectionId, query);
    }
  }

  validateChanges(connectionId: string, changes: PendingChangeInfo[]) {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: 'Connection not found' };
    }

    const results: ValidationResult[] = [];
    for (const change of changes) {
      results.push({ changeId: change.id, isValid: true });
    }
    return { success: true, results };
  }

  applyChanges(connectionId: string, changes: PendingChangeInfo[]) {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: 'Connection not found' };
    }

    try {
      let appliedCount = 0;
      const schemaPrefix = (s?: string) => (s ? `"${s}".` : '');

      for (const change of changes) {
        const prefix = schemaPrefix(change.schema);

        if (change.type === 'insert' && change.newValues) {
          const columns = Object.keys(change.newValues);
          const values = Object.values(change.newValues);
          const placeholders = columns.map(() => '?').join(', ');
          const sql = `INSERT INTO ${prefix}"${change.table}" ("${columns.join('", "')}") VALUES (${placeholders})`;
          conn.db.prepare(sql).run(...values);
          appliedCount++;
        } else if (
          change.type === 'update' &&
          change.newValues &&
          change.primaryKeyColumn
        ) {
          const columns = Object.keys(change.newValues);
          const setClause = columns.map((col) => `"${col}" = ?`).join(', ');
          const values = [...Object.values(change.newValues), change.rowId];
          const sql = `UPDATE ${prefix}"${change.table}" SET ${setClause} WHERE "${change.primaryKeyColumn}" = ?`;
          conn.db.prepare(sql).run(...values);
          appliedCount++;
        } else if (change.type === 'delete' && change.primaryKeyColumn) {
          const sql = `DELETE FROM ${prefix}"${change.table}" WHERE "${change.primaryKeyColumn}" = ?`;
          conn.db.prepare(sql).run(change.rowId);
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

  analyzeQueryPlan(connectionId: string, query: string) {
    return this.explainQuery(connectionId, query);
  }

  closeAll() {
    for (const [id] of this.connections) {
      this.close(id);
    }
  }

  getPendingChanges(
    connectionId: string
  ):
    | { success: true; changes: PendingChangeInfo[] }
    | { success: false; error: string } {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: 'Connection not found' };
    }

    try {
      // Check if there are pending transactions
      // This is a simplified implementation - just check if we're in a transaction
      // Actual implementation would track schema changes, table modifications, etc.

      return { success: true, changes: [] };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get pending changes',
      };
    }
  }
}

// Helper functions
function calculateDepth(nodes: QueryPlanNode[], currentDepth = 0): number {
  if (nodes.length === 0) return currentDepth;

  let maxDepth = currentDepth;
  for (const node of nodes) {
    const childDepth = calculateDepth(node.children || [], currentDepth + 1);
    maxDepth = Math.max(maxDepth, childDepth);
  }

  return maxDepth;
}

const databaseService = new DatabaseService();
export { databaseService };
export default databaseService;

// Re-export the new database manager for multi-database support
export { databaseManager } from './database-adapters';
export type { DatabaseConnectionConfig, DatabaseType } from '@shared/types';
