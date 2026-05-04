/**
 * Database Manager
 * Coordinates between different database adapters and routes operations
 * to the appropriate adapter based on connection type
 */

import type {
  ColumnInfo,
  DatabaseConnectionConfig,
  DatabaseType,
  GetColumnDistributionResponse,
  GetTableDataResponse,
  PendingChangeInfo,
  QueryPlanNode,
  QueryPlanStats,
  SchemaInfo,
  TableInfo,
  ValidationResult,
} from '@shared/types';
import type { SSHCredential, SSHTunnelConfig } from '../ssh/types';
import type {
  AdapterConnectionInfo,
  DatabaseAdapter,
  OpenResult,
} from './types';
import {
  isMySQLCompatibleDatabaseType,
  isPostgreSQLCompatibleDatabaseType,
} from '@shared/types';
import { sshCredentialStore, tunnelManager } from '../ssh';
import { ClickHouseAdapter } from './clickhouse-adapter';
import { MongoDBAdapter } from './mongodb-adapter';
import { MySQLAdapter } from './mysql-adapter';
import { PostgreSQLAdapter } from './postgresql-adapter';
import { qdrantAdapter } from './qdrant-adapter';
import { RedisAdapter } from './redis-adapter';
import { SQLiteAdapter } from './sqlite-adapter';
import { SQLServerAdapter } from './sqlserver-adapter';
import { TursoAdapter } from './turso-adapter';

/**
 * Connection metadata stored by the manager
 */
interface ManagedConnection {
  id: string;
  type: DatabaseType;
  adapter: DatabaseAdapter;
  /** Whether this connection uses an SSH tunnel */
  hasSSHTunnel?: boolean;
}

/**
 * Database Manager - coordinates between different database adapters
 */
class DatabaseManager {
  private adapters: Map<DatabaseType, DatabaseAdapter> = new Map();
  private connections: Map<string, ManagedConnection> = new Map();

  constructor() {
    // Initialize adapters
    this.adapters.set('sqlite', new SQLiteAdapter());
    const mysqlAdapter = new MySQLAdapter();
    this.adapters.set('mysql', mysqlAdapter);
    this.adapters.set('mariadb', mysqlAdapter);
    this.adapters.set('mongodb', new MongoDBAdapter());
    this.adapters.set('postgresql', new PostgreSQLAdapter('postgresql'));
    this.adapters.set('supabase', new PostgreSQLAdapter('supabase'));
    this.adapters.set('neon', new PostgreSQLAdapter('neon'));
    this.adapters.set('planetscale', new PostgreSQLAdapter('planetscale'));
    this.adapters.set('clickhouse', new ClickHouseAdapter());
    this.adapters.set('redis', new RedisAdapter());
    this.adapters.set('sqlserver', new SQLServerAdapter());
    // Use the singleton qdrantAdapter to ensure IPC handlers use the same instance
    this.adapters.set('qdrant', qdrantAdapter);
    this.adapters.set('turso', new TursoAdapter());
  }

  /**
   * Get the appropriate adapter for a database type
   */
  private getAdapter(type: DatabaseType): DatabaseAdapter {
    const adapter = this.adapters.get(type);
    if (!adapter) {
      throw new Error(`Unsupported database type: ${type}`);
    }
    return adapter;
  }

  /**
   * Get the adapter for an existing connection
   */
  private getConnectionAdapter(connectionId: string): DatabaseAdapter | null {
    const managed = this.connections.get(connectionId);
    return managed?.adapter || null;
  }

  /**
   * Open a database connection
   * If SSH tunnel is enabled, creates tunnel before connecting
   */
  async open(
    pathOrConfig: string | DatabaseConnectionConfig,
    password?: string,
    readOnly = false
  ): Promise<OpenResult> {
    // Handle legacy call with path string (SQLite)
    let config: DatabaseConnectionConfig;
    if (typeof pathOrConfig === 'string') {
      config = {
        type: 'sqlite',
        path: pathOrConfig,
        password,
        readOnly,
      };
    } else {
      config = pathOrConfig;
    }

    const type = config.type || 'sqlite';
    const adapter = this.getAdapter(type);

    // Check if SSH tunnel is enabled (only for MySQL/PostgreSQL/Supabase)
    let hasSSHTunnel = false;
    let tunnelConnectionId: string | undefined;
    let originalHost: string | undefined;
    let originalPort: number | undefined;

    if (
      config.ssh?.enabled &&
      (isMySQLCompatibleDatabaseType(type) ||
        isPostgreSQLCompatibleDatabaseType(type))
    ) {
      try {
        // Generate a unique profile ID for credential lookup
        // Use connection name or a timestamp-based ID
        const profileId = config.name || `ssh-${Date.now()}`;
        const storedCredentials = sshCredentialStore.getCredential(profileId);

        // Build credentials from stored or inline values
        // Note: privateKey comes from stored credentials (the actual key content)
        // while config.ssh.privateKeyPath is just the path
        const credentials: SSHCredential = {
          profileId,
          password: storedCredentials?.password || config.ssh.password,
          privateKey: storedCredentials?.privateKey,
          passphrase: storedCredentials?.passphrase || config.ssh.passphrase,
          jumpHostPassword:
            storedCredentials?.jumpHostPassword || config.sshJumpHost?.password,
          jumpHostPrivateKey: storedCredentials?.jumpHostPrivateKey,
          jumpHostPassphrase:
            storedCredentials?.jumpHostPassphrase ||
            config.sshJumpHost?.passphrase,
        };

        // Store original host/port for tunnel config
        originalHost = config.host || 'localhost';
        originalPort =
          config.port || (isMySQLCompatibleDatabaseType(type) ? 3306 : 5432);

        // Build SSH tunnel configuration
        const tunnelConfig: SSHTunnelConfig = {
          ssh: {
            enabled: true,
            host: config.ssh.host,
            port: config.ssh.port || 22,
            username: config.ssh.username,
            authMethod: config.ssh.authMethod,
          },
          remoteHost: originalHost,
          remotePort: originalPort,
          localPort: 0, // Dynamic allocation
        };

        // Add jump host if configured
        if (config.sshJumpHost?.enabled) {
          tunnelConfig.jumpHost = {
            enabled: true,
            host: config.sshJumpHost.host,
            port: config.sshJumpHost.port || 22,
            username: config.sshJumpHost.username,
            authMethod: config.sshJumpHost.authMethod,
          };
        }

        // Generate a temporary connection ID for the tunnel
        tunnelConnectionId = `ssh-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // Create the SSH tunnel
        const tunnelLocalPort = await tunnelManager.createTunnel(
          tunnelConnectionId,
          tunnelConfig,
          credentials
        );

        // Modify the config to route through the tunnel
        config = {
          ...config,
          host: '127.0.0.1',
          port: tunnelLocalPort,
        };

        hasSSHTunnel = true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'SSH tunnel failed';
        return {
          success: false,
          error: `SSH tunnel failed: ${errorMessage}`,
        };
      }
    }

    const result = await adapter.open(config);

    if (result.success && result.connection) {
      const actualConnectionId = result.connection.id;

      // If we created a tunnel with a temp ID, rename it to the actual connection ID
      if (hasSSHTunnel && tunnelConnectionId) {
        // Close the temp-named tunnel and recreate with proper ID
        const tunnel = tunnelManager.getTunnel(tunnelConnectionId);
        const currentStatus = tunnel?.status;
        const currentLocalPort = currentStatus?.localPort;

        await tunnelManager.closeTunnel(tunnelConnectionId);

        // Recreate with the actual connection ID if we had a valid tunnel
        if (currentLocalPort && config.ssh) {
          const profileId = config.name || `ssh-${Date.now()}`;
          const storedCredentials = sshCredentialStore.getCredential(profileId);
          const credentials: SSHCredential = {
            profileId,
            password: storedCredentials?.password || config.ssh.password,
            privateKey: storedCredentials?.privateKey,
            passphrase: storedCredentials?.passphrase || config.ssh.passphrase,
            jumpHostPassword:
              storedCredentials?.jumpHostPassword ||
              config.sshJumpHost?.password,
            jumpHostPrivateKey: storedCredentials?.jumpHostPrivateKey,
            jumpHostPassphrase:
              storedCredentials?.jumpHostPassphrase ||
              config.sshJumpHost?.passphrase,
          };

          const tunnelConfig: SSHTunnelConfig = {
            ssh: {
              enabled: true,
              host: config.ssh.host,
              port: config.ssh.port || 22,
              username: config.ssh.username,
              authMethod: config.ssh.authMethod,
            },
            remoteHost: originalHost || 'localhost',
            remotePort:
              originalPort ||
              (isMySQLCompatibleDatabaseType(type) ? 3306 : 5432),
            localPort: currentLocalPort, // Reuse the same port
          };

          if (config.sshJumpHost?.enabled) {
            tunnelConfig.jumpHost = {
              enabled: true,
              host: config.sshJumpHost.host,
              port: config.sshJumpHost.port || 22,
              username: config.sshJumpHost.username,
              authMethod: config.sshJumpHost.authMethod,
            };
          }

          await tunnelManager.createTunnel(
            actualConnectionId,
            tunnelConfig,
            credentials
          );
        }
      }

      // Track this connection
      this.connections.set(actualConnectionId, {
        id: actualConnectionId,
        type,
        adapter,
        hasSSHTunnel,
      });
    } else if (hasSSHTunnel && tunnelConnectionId) {
      // Connection failed, clean up the tunnel
      await tunnelManager.closeTunnel(tunnelConnectionId);
    }

    return result;
  }

  /**
   * Test a database connection without establishing a persistent connection
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
        errorCode?: import('@shared/types').ErrorCode;
        troubleshootingSteps?: string[];
      }
  > {
    const type = config.type || 'sqlite';
    const adapter = this.getAdapter(type);
    return adapter.testConnection(config);
  }

  /**
   * Close a database connection
   * Also closes associated SSH tunnel if one exists
   */
  close(
    connectionId: string
  ): { success: true } | { success: false; error: string } {
    const managed = this.connections.get(connectionId);
    const adapter = this.getConnectionAdapter(connectionId);
    if (!adapter) {
      return { success: false, error: 'Connection not found' };
    }

    const result = adapter.close(connectionId);
    if (result.success) {
      this.connections.delete(connectionId);

      // Close SSH tunnel if one exists for this connection
      if (managed?.hasSSHTunnel) {
        tunnelManager.closeTunnel(connectionId).catch((error) => {
          console.error(
            `Failed to close SSH tunnel for ${connectionId}:`,
            error
          );
        });
      }
    }
    return result;
  }

  /**
   * Get connection info
   */
  getConnection(connectionId: string): AdapterConnectionInfo | null {
    const adapter = this.getConnectionAdapter(connectionId);
    if (!adapter) {
      return null;
    }
    return adapter.getConnection(connectionId);
  }

  /**
   * Get database schema
   * For async databases (MySQL, PostgreSQL), this returns an error directing to async method
   */
  getSchema(connectionId: string):
    | {
        success: true;
        schemas: SchemaInfo[];
        tables: TableInfo[];
        views: TableInfo[];
      }
    | { success: false; error: string } {
    const adapter = this.getConnectionAdapter(connectionId);
    if (!adapter) {
      return { success: false, error: 'Connection not found' };
    }
    return adapter.getSchema(connectionId);
  }

  /**
   * Get database schema (async version for MySQL/PostgreSQL)
   */
  async getSchemaAsync(connectionId: string): Promise<
    | {
        success: true;
        schemas: SchemaInfo[];
        tables: TableInfo[];
        views: TableInfo[];
      }
    | { success: false; error: string }
  > {
    const managed = this.connections.get(connectionId);
    if (!managed) {
      return { success: false, error: 'Connection not found' };
    }

    const adapter = managed.adapter;

    // Check if adapter has async method
    if (adapter.getSchemaAsync) {
      return adapter.getSchemaAsync(connectionId);
    }

    // Fall back to sync method
    return adapter.getSchema(connectionId);
  }

  /**
   * Execute a non-SELECT query
   */
  execute(connectionId: string, sql: string, params?: unknown[]) {
    const adapter = this.getConnectionAdapter(connectionId);
    if (!adapter) {
      return { success: false as const, error: 'Connection not found' };
    }
    return adapter.execute(connectionId, sql, params);
  }

  /**
   * Execute async (for MySQL/PostgreSQL)
   */
  async executeAsync(connectionId: string, sql: string, params?: unknown[]) {
    const managed = this.connections.get(connectionId);
    if (!managed) {
      return { success: false as const, error: 'Connection not found' };
    }

    const adapter = managed.adapter;

    if (adapter.executeAsync) {
      return adapter.executeAsync(connectionId, sql, params);
    }

    return adapter.execute(connectionId, sql, params);
  }

  /**
   * Execute a SELECT query
   */
  query(connectionId: string, sql: string, params?: unknown[]) {
    const adapter = this.getConnectionAdapter(connectionId);
    if (!adapter) {
      return { success: false as const, error: 'Connection not found' };
    }
    return adapter.query(connectionId, sql, params);
  }

  /**
   * Query async (for MySQL/PostgreSQL)
   */
  async queryAsync(connectionId: string, sql: string, params?: unknown[]) {
    const managed = this.connections.get(connectionId);
    if (!managed) {
      return { success: false as const, error: 'Connection not found' };
    }

    const adapter = managed.adapter;

    if (adapter.queryAsync) {
      return adapter.queryAsync(connectionId, sql, params);
    }

    return adapter.query(connectionId, sql, params);
  }

  /**
   * Get table data with pagination
   */
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
    const adapter = this.getConnectionAdapter(connectionId);
    if (!adapter) {
      return { success: false, error: 'Connection not found' };
    }
    return adapter.getTableData(
      connectionId,
      table,
      page,
      pageSize,
      sortColumn,
      sortDirection,
      filters,
      schema
    );
  }

  /**
   * Get table data async (for MySQL/PostgreSQL)
   */
  async getTableDataAsync(
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
  ): Promise<GetTableDataResponse> {
    const managed = this.connections.get(connectionId);
    if (!managed) {
      return { success: false, error: 'Connection not found' };
    }

    const adapter = managed.adapter;

    if (adapter.getTableDataAsync) {
      return adapter.getTableDataAsync(
        connectionId,
        table,
        page,
        pageSize,
        sortColumn,
        sortDirection,
        filters,
        schema
      );
    }

    return adapter.getTableData(
      connectionId,
      table,
      page,
      pageSize,
      sortColumn,
      sortDirection,
      filters,
      schema
    );
  }

  /**
   * Get a range of rows from a table using LIMIT/OFFSET pagination.
   * Designed for virtual scrolling and infinite scroll patterns.
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
    const adapter = this.getConnectionAdapter(connectionId);
    if (!adapter) {
      return { success: false, error: 'Connection not found' };
    }

    // Check if adapter has getTableRowRange method (SQLite adapter has it)
    if (adapter.getTableRowRange) {
      return adapter.getTableRowRange(
        connectionId,
        table,
        startRow,
        endRow,
        sortColumn,
        sortDirection,
        filters,
        schema
      );
    }

    // Fallback: convert row range to page/pageSize for adapters without getTableRowRange
    const pageSize = endRow - startRow;
    const page = Math.floor(startRow / pageSize) + 1;

    const result = adapter.getTableData(
      connectionId,
      table,
      page,
      pageSize,
      sortColumn,
      sortDirection,
      filters,
      schema
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      columns: result.columns,
      rows: result.rows as Record<string, unknown>[],
      totalRows: result.totalRows,
      isEstimatedTotal: false,
      actualStartRow: startRow,
      actualEndRow:
        startRow + ((result.rows as Record<string, unknown>[])?.length || 0),
    };
  }

  /**
   * Execute one or more SQL statements
   */
  executeQuery(connectionId: string, query: string, params?: unknown[]) {
    const adapter = this.getConnectionAdapter(connectionId);
    if (!adapter) {
      return { success: false as const, error: 'Connection not found' };
    }
    return adapter.executeQuery(connectionId, query, params);
  }

  /**
   * Execute query async (for MySQL/PostgreSQL)
   */
  async executeQueryAsync(
    connectionId: string,
    query: string,
    params?: unknown[]
  ) {
    const managed = this.connections.get(connectionId);
    if (!managed) {
      return { success: false as const, error: 'Connection not found' };
    }

    const adapter = managed.adapter;

    if (adapter.executeQueryAsync) {
      return adapter.executeQueryAsync(connectionId, query, params);
    }

    return adapter.executeQuery(connectionId, query, params);
  }

  /**
   * Validate a SQL query
   */
  validateQuery(connectionId: string, sql: string): ValidationResult {
    const adapter = this.getConnectionAdapter(connectionId);
    if (!adapter) {
      return { isValid: false, error: 'Connection not found' };
    }
    return adapter.validateQuery(connectionId, sql);
  }

  /**
   * Get query execution plan
   */
  explainQuery(
    connectionId: string,
    sql: string
  ):
    | { success: true; plan: QueryPlanNode; stats: QueryPlanStats }
    | { success: false; error: string } {
    const adapter = this.getConnectionAdapter(connectionId);
    if (!adapter) {
      return { success: false, error: 'Connection not found' };
    }
    return adapter.explainQuery(connectionId, sql);
  }

  /**
   * Explain query async (for MySQL/PostgreSQL)
   */
  async explainQueryAsync(
    connectionId: string,
    sql: string
  ): Promise<
    | { success: true; plan: QueryPlanNode; stats: QueryPlanStats }
    | { success: false; error: string }
  > {
    const managed = this.connections.get(connectionId);
    if (!managed) {
      return { success: false, error: 'Connection not found' };
    }

    const adapter = managed.adapter;

    if (adapter.explainQueryAsync) {
      return adapter.explainQueryAsync(connectionId, sql);
    }

    return adapter.explainQuery(connectionId, sql);
  }

  /**
   * Validate pending changes
   */
  validateChanges(connectionId: string, changes: PendingChangeInfo[]) {
    const adapter = this.getConnectionAdapter(connectionId);
    if (!adapter) {
      return { success: false as const, error: 'Connection not found' };
    }
    return adapter.validateChanges(connectionId, changes);
  }

  /**
   * Apply pending changes
   */
  applyChanges(connectionId: string, changes: PendingChangeInfo[]) {
    const adapter = this.getConnectionAdapter(connectionId);
    if (!adapter) {
      return { success: false as const, error: 'Connection not found' };
    }
    return adapter.applyChanges(connectionId, changes);
  }

  /**
   * Apply changes async (for MySQL/PostgreSQL)
   */
  async applyChangesAsync(connectionId: string, changes: PendingChangeInfo[]) {
    const managed = this.connections.get(connectionId);
    if (!managed) {
      return { success: false as const, error: 'Connection not found' };
    }

    const adapter = managed.adapter;

    if (adapter.applyChangesAsync) {
      return adapter.applyChangesAsync(connectionId, changes);
    }

    return adapter.applyChanges(connectionId, changes);
  }

  /**
   * Get table structure
   */
  getTableStructure(
    connectionId: string,
    tableName: string,
    schema?: string
  ):
    | { success: true; structure: TableInfo }
    | { success: false; error: string } {
    const adapter = this.getConnectionAdapter(connectionId);
    if (!adapter) {
      return { success: false, error: 'Connection not found' };
    }
    return adapter.getTableStructure(connectionId, tableName, schema);
  }

  /**
   * Get table structure async (for MySQL/PostgreSQL)
   */
  async getTableStructureAsync(
    connectionId: string,
    tableName: string,
    schema?: string
  ): Promise<
    { success: true; structure: TableInfo } | { success: false; error: string }
  > {
    const managed = this.connections.get(connectionId);
    if (!managed) {
      return { success: false, error: 'Connection not found' };
    }

    const adapter = managed.adapter;

    if (adapter.getTableStructureAsync) {
      return adapter.getTableStructureAsync(connectionId, tableName, schema);
    }

    return adapter.getTableStructure(connectionId, tableName, schema);
  }

  /**
   * Get pending changes
   */
  getPendingChanges(connectionId: string) {
    const adapter = this.getConnectionAdapter(connectionId);
    if (!adapter) {
      return { success: false as const, error: 'Connection not found' };
    }
    return adapter.getPendingChanges(connectionId);
  }

  /**
   * Check if connection is async (MySQL/PostgreSQL)
   */
  isAsyncConnection(connectionId: string): boolean {
    const managed = this.connections.get(connectionId);
    if (!managed) {
      return false;
    }
    return managed.type !== 'sqlite';
  }

  /**
   * Get connection type
   */
  getConnectionType(connectionId: string): DatabaseType | null {
    const managed = this.connections.get(connectionId);
    return managed?.type || null;
  }

  /**
   * Close all connections
   * Also closes all SSH tunnels
   */
  closeAll(): void {
    for (const adapter of this.adapters.values()) {
      adapter.closeAll();
    }
    this.connections.clear();

    // Close all SSH tunnels
    tunnelManager.closeAllTunnels();
  }

  /**
   * Get column value distribution (full table aggregation)
   * Routes to appropriate adapter based on connection type
   */
  async getColumnDistribution(
    connectionId: string,
    table: string,
    column: string,
    schema?: string,
    limit?: number
  ): Promise<GetColumnDistributionResponse> {
    const managed = this.connections.get(connectionId);
    if (!managed) {
      return { success: false, error: 'Connection not found' };
    }

    const adapter = managed.adapter;

    // Check if adapter has async method (Qdrant, etc.)
    if (
      'getColumnDistributionAsync' in adapter &&
      typeof adapter.getColumnDistributionAsync === 'function'
    ) {
      return adapter.getColumnDistributionAsync(
        connectionId,
        table,
        column,
        schema,
        limit
      );
    }

    return adapter.getColumnDistribution(
      connectionId,
      table,
      column,
      schema,
      limit
    );
  }
}

// Export singleton instance
export const databaseManager = new DatabaseManager();
export default databaseManager;
