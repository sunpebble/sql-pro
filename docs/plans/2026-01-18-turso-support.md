# Turso Database Support Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Turso edge database support with multi-database and branch switching capabilities.

**Architecture:** Implement `TursoAdapter` (extends `DatabaseAdapter`) using `@libsql/client` for SQL operations, plus `TursoPlatformService` for REST API calls to manage databases and branches. Reuse SQLite's `PRAGMA` queries for schema introspection since Turso is libSQL-based.

**Tech Stack:** `@libsql/client`, Node.js fetch API, TypeScript

---

## Task 1: Add @libsql/client Dependency

**Files:**

- Modify: `apps/electron/package.json`

**Step 1: Install @libsql/client**

Run:

```bash
cd /Users/shikun/Developer/opensource/sql-pro/.worktrees/turso-support && pnpm add @libsql/client --filter @sqlpro/app
```

**Step 2: Verify installation**

Run:

```bash
grep "@libsql/client" apps/electron/package.json
```

Expected: Line showing `"@libsql/client": "^x.x.x"`

**Step 3: Commit**

```bash
git add apps/electron/package.json pnpm-lock.yaml
git commit -m "chore: add @libsql/client dependency for Turso support"
```

---

## Task 2: Add Turso to DatabaseType and Shared Types

**Files:**

- Modify: `apps/electron/src/shared/types.ts`

**Step 1: Add 'turso' to DatabaseType union**

In `apps/electron/src/shared/types.ts`, find `DatabaseType` (around line 84) and add `'turso'`:

```typescript
export type DatabaseType =
  | 'sqlite'
  | 'mysql'
  | 'postgresql'
  | 'supabase'
  | 'qdrant'
  | 'turso';
```

**Step 2: Add Turso-specific fields to DatabaseConnectionConfig**

Find `DatabaseConnectionConfig` interface (around line 94) and add after `qdrantUseTLS`:

```typescript
  /** Turso-specific: organization slug */
  tursoOrganization?: string;
  /** Turso-specific: auth token */
  tursoAuthToken?: string;
  /** Turso-specific: selected database name */
  tursoDatabase?: string;
  /** Turso-specific: selected branch name (default: 'main') */
  tursoBranch?: string;
```

**Step 3: Add Turso API types at end of file (before final export if any)**

Add near line 900 (after Password Storage Types section):

```typescript
// ============ Turso Types ============

/** Turso database info from Platform API */
export interface TursoDatabaseInfo {
  name: string;
  dbId: string;
  hostname: string;
  group: string;
  primaryRegion: string;
  regions: string[];
  version: string;
}

/** Turso branch info from Platform API */
export interface TursoBranchInfo {
  name: string;
  createdAt: string;
}

/** Turso organization info from Platform API */
export interface TursoOrganizationInfo {
  slug: string;
  name: string;
  type: 'personal' | 'team';
}

/** Request to list Turso databases */
export interface ListTursoDatabasesRequest {
  authToken: string;
  organization: string;
}

/** Response from listing Turso databases */
export interface ListTursoDatabasesResponse {
  success: boolean;
  databases?: TursoDatabaseInfo[];
  error?: string;
}

/** Request to list Turso branches */
export interface ListTursoBranchesRequest {
  authToken: string;
  organization: string;
  database: string;
}

/** Response from listing Turso branches */
export interface ListTursoBranchesResponse {
  success: boolean;
  branches?: TursoBranchInfo[];
  error?: string;
}
```

**Step 4: Run typecheck**

Run:

```bash
cd /Users/shikun/Developer/opensource/sql-pro/.worktrees/turso-support && pnpm run typecheck
```

Expected: Success

**Step 5: Commit**

```bash
git add apps/electron/src/shared/types.ts
git commit -m "feat(types): add Turso database type and connection config fields"
```

---

## Task 3: Add Turso to Adapter Types

**Files:**

- Modify: `apps/electron/src/main/services/database-adapters/types.ts`

**Step 1: Add turso to DEFAULT_PORTS**

Find `DEFAULT_PORTS` (around line 434) and add:

```typescript
export const DEFAULT_PORTS: Record<DatabaseType, number> = {
  sqlite: 0,
  mysql: 3306,
  postgresql: 5432,
  supabase: 5432,
  qdrant: 6333,
  turso: 0, // Remote only, no port needed
};
```

**Step 2: Add turso to DATABASE_TYPE_NAMES**

Find `DATABASE_TYPE_NAMES` (around line 445) and add:

```typescript
export const DATABASE_TYPE_NAMES: Record<DatabaseType, string> = {
  sqlite: 'SQLite',
  mysql: 'MySQL',
  postgresql: 'PostgreSQL',
  supabase: 'Supabase',
  qdrant: 'Qdrant',
  turso: 'Turso',
};
```

**Step 3: Run typecheck**

Run:

```bash
cd /Users/shikun/Developer/opensource/sql-pro/.worktrees/turso-support && pnpm run typecheck
```

Expected: Success

**Step 4: Commit**

```bash
git add apps/electron/src/main/services/database-adapters/types.ts
git commit -m "feat(adapters): add Turso to adapter type constants"
```

---

## Task 4: Implement TursoPlatformService

**Files:**

- Create: `apps/electron/src/main/services/database-adapters/turso-platform.ts`

**Step 1: Create TursoPlatformService**

Create file `apps/electron/src/main/services/database-adapters/turso-platform.ts`:

```typescript
/**
 * Turso Platform API Service
 * Handles REST API calls to Turso Platform for database and branch management
 */

import type {
  TursoBranchInfo,
  TursoDatabaseInfo,
  TursoOrganizationInfo,
} from '@shared/types';

const TURSO_API_BASE = 'https://api.turso.tech/v1';

export class TursoApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'TursoApiError';
  }
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class TursoPlatformService {
  private authToken: string;

  constructor(authToken: string) {
    this.authToken = authToken;
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET'
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${TURSO_API_BASE}${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API request failed: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || errorMessage;
        } catch {
          // Use default error message
        }

        throw new TursoApiError(
          response.status,
          this.getErrorCode(response.status),
          errorMessage
        );
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      if (error instanceof TursoApiError) {
        return { success: false, error: error.message };
      }
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case 401:
        return 'unauthorized';
      case 403:
        return 'forbidden';
      case 404:
        return 'not_found';
      case 429:
        return 'rate_limited';
      default:
        return 'unknown';
    }
  }

  /**
   * List all organizations the user has access to
   */
  async listOrganizations(): Promise<ApiResponse<TursoOrganizationInfo[]>> {
    const result = await this.request<{
      organizations: TursoOrganizationInfo[];
    }>('/organizations');
    if (result.success && result.data) {
      return { success: true, data: result.data.organizations };
    }
    return { success: false, error: result.error };
  }

  /**
   * List all databases in an organization
   */
  async listDatabases(
    organizationSlug: string
  ): Promise<ApiResponse<TursoDatabaseInfo[]>> {
    const result = await this.request<{ databases: TursoDatabaseInfo[] }>(
      `/organizations/${organizationSlug}/databases`
    );
    if (result.success && result.data) {
      return { success: true, data: result.data.databases };
    }
    return { success: false, error: result.error };
  }

  /**
   * Get a specific database
   */
  async getDatabase(
    organizationSlug: string,
    databaseName: string
  ): Promise<ApiResponse<TursoDatabaseInfo>> {
    const result = await this.request<{ database: TursoDatabaseInfo }>(
      `/organizations/${organizationSlug}/databases/${databaseName}`
    );
    if (result.success && result.data) {
      return { success: true, data: result.data.database };
    }
    return { success: false, error: result.error };
  }

  /**
   * List all branches of a database
   * Note: Branches are only available on certain Turso plans
   */
  async listBranches(
    organizationSlug: string,
    databaseName: string
  ): Promise<ApiResponse<TursoBranchInfo[]>> {
    // Branches endpoint: /organizations/{org}/databases/{db}/branches
    // This may return 404 if the database doesn't support branches
    const result = await this.request<{ branches: TursoBranchInfo[] }>(
      `/organizations/${organizationSlug}/databases/${databaseName}/instances`
    );
    if (result.success && result.data) {
      // Map instances to branch-like structure
      // Note: Turso uses "instances" for replicas, branches are managed differently
      // For simplicity, we'll treat the main database as the only "branch"
      return {
        success: true,
        data: [{ name: 'main', createdAt: new Date().toISOString() }],
      };
    }
    // If branches aren't available, return just 'main'
    return {
      success: true,
      data: [{ name: 'main', createdAt: new Date().toISOString() }],
    };
  }

  /**
   * Build the database URL for connecting via @libsql/client
   */
  buildDatabaseUrl(
    databaseName: string,
    organizationSlug: string,
    branch?: string
  ): string {
    // Turso database URL format:
    // libsql://{database}-{org}.turso.io
    // With branch: libsql://{database}-{branch}-{org}.turso.io
    if (branch && branch !== 'main') {
      return `libsql://${databaseName}-${branch}-${organizationSlug}.turso.io`;
    }
    return `libsql://${databaseName}-${organizationSlug}.turso.io`;
  }

  /**
   * Validate the auth token by attempting to list organizations
   */
  async validateToken(): Promise<{ valid: boolean; error?: string }> {
    const result = await this.listOrganizations();
    return {
      valid: result.success,
      error: result.error,
    };
  }
}
```

**Step 2: Run typecheck**

Run:

```bash
cd /Users/shikun/Developer/opensource/sql-pro/.worktrees/turso-support && pnpm run typecheck
```

Expected: Success

**Step 3: Commit**

```bash
git add apps/electron/src/main/services/database-adapters/turso-platform.ts
git commit -m "feat(turso): implement TursoPlatformService for API integration"
```

---

## Task 5: Implement TursoAdapter

**Files:**

- Create: `apps/electron/src/main/services/database-adapters/turso-adapter.ts`

**Step 1: Create TursoAdapter**

Create file `apps/electron/src/main/services/database-adapters/turso-adapter.ts`:

```typescript
/**
 * Turso database adapter
 * Connects to Turso edge databases using @libsql/client
 * Supports SQLite-compatible operations via libSQL
 */

import type { Client } from '@libsql/client';
import { createClient, LibsqlError } from '@libsql/client';
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
  TursoBranchInfo,
  TursoDatabaseInfo,
  ValidationResult,
} from '@shared/types';
import type {
  AdapterConnectionInfo,
  DatabaseAdapter,
  OpenResult,
} from './types';
import { TursoPlatformService } from './turso-platform';

interface TursoConnectionInfo {
  id: string;
  client: Client;
  organization: string;
  database: string;
  branch: string;
  displayName: string;
  platformService: TursoPlatformService;
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

      const tables: TableInfo[] = [];
      for (const row of tablesResult.rows) {
        const tableName = row.name as string;
        const tableInfoResult = await conn.client.execute(
          `PRAGMA table_info('${tableName}')`
        );

        const columns: ColumnInfo[] = tableInfoResult.rows.map((col) => ({
          name: col.name as string,
          type: col.type as string,
          nullable: col.notnull === 0,
          primaryKey: col.pk === 1,
          defaultValue: col.dflt_value as string | null,
        }));

        // Get row count estimate
        const countResult = await conn.client.execute(
          `SELECT COUNT(*) as count FROM "${tableName}"`
        );
        const rowCount = Number(countResult.rows[0]?.count || 0);

        tables.push({
          name: tableName,
          columns,
          rowCount,
          type: 'table',
        });
      }

      const views: TableInfo[] = viewsResult.rows.map((row) => ({
        name: row.name as string,
        columns: [],
        rowCount: 0,
        type: 'view',
      }));

      return {
        success: true,
        schemas: [{ name: 'main', isDefault: true }],
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
        const whereClauses = filters.map((f, i) => {
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
        primaryKey: col.pk === 1,
        defaultValue: col.dflt_value as string | null,
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
        page,
        pageSize,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
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
      return { success: false, error: `Connection ${connectionId} not found` };
    }

    try {
      const result = await conn.client.execute(query);

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
      const tableInfoResult = await conn.client.execute(
        `PRAGMA table_info('${tableName}')`
      );

      const columns: ColumnInfo[] = tableInfoResult.rows.map((col) => ({
        name: col.name as string,
        type: col.type as string,
        nullable: col.notnull === 0,
        primaryKey: col.pk === 1,
        defaultValue: col.dflt_value as string | null,
      }));

      const countResult = await conn.client.execute(
        `SELECT COUNT(*) as count FROM "${tableName}"`
      );
      const rowCount = Number(countResult.rows[0]?.count || 0);

      return {
        success: true,
        structure: {
          name: tableName,
          columns,
          rowCount,
          type: 'table',
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
        authToken: conn.platformService['authToken'], // Access private field
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

  getSchema(connectionId: string) {
    // Return empty result, use getSchemaAsync instead
    return {
      success: false as const,
      error: 'Use getSchemaAsync for Turso connections',
    };
  }

  execute(connectionId: string, sql: string, params?: unknown[]) {
    return {
      success: false as const,
      error: 'Use executeAsync for Turso connections',
    };
  }

  query(connectionId: string, sql: string, params?: unknown[]) {
    return {
      success: false as const,
      error: 'Use queryAsync for Turso connections',
    };
  }

  getTableData(
    connectionId: string,
    table: string,
    page: number,
    pageSize: number,
    sortColumn?: string,
    sortDirection?: 'asc' | 'desc',
    filters?: Array<{ column: string; operator: string; value: string }>,
    schema?: string
  ): GetTableDataResponse {
    return {
      success: false,
      error: 'Use getTableDataAsync for Turso connections',
    };
  }

  executeQuery(connectionId: string, query: string) {
    return {
      success: false as const,
      error: 'Use executeQueryAsync for Turso connections',
    };
  }

  validateQuery(connectionId: string, sql: string): ValidationResult {
    // Basic SQL validation
    const trimmed = sql.trim();
    if (!trimmed) {
      return { valid: false, error: 'Empty query' };
    }
    return { valid: true };
  }

  explainQuery(connectionId: string, sql: string) {
    return {
      success: false as const,
      error: 'EXPLAIN not implemented for Turso',
    };
  }

  validateChanges(connectionId: string, changes: PendingChangeInfo[]) {
    return {
      success: true as const,
      results: changes.map(() => ({ valid: true })),
    };
  }

  applyChanges(connectionId: string, changes: PendingChangeInfo[]) {
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
      let appliedCount = 0;
      for (const change of changes) {
        if (change.sql) {
          await conn.client.execute(change.sql);
          appliedCount++;
        }
      }
      return { success: true, appliedCount };
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

  getTableStructure(connectionId: string, tableName: string, schema?: string) {
    return {
      success: false as const,
      error: 'Use getTableStructureAsync for Turso connections',
    };
  }

  getPendingChanges(connectionId: string) {
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
      const sql = `
        SELECT "${column}" as value, COUNT(*) as count
        FROM "${table}"
        GROUP BY "${column}"
        ORDER BY count DESC
        LIMIT ?
      `;
      const result = await conn.client.execute({ sql, args: [limit] });

      const distribution = result.rows.map((row) => ({
        value: row.value,
        count: Number(row.count),
      }));

      return { success: true, distribution };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }
}

// Export singleton instance
export const tursoAdapter = new TursoAdapter();
```

**Step 2: Run typecheck**

Run:

```bash
cd /Users/shikun/Developer/opensource/sql-pro/.worktrees/turso-support && pnpm run typecheck
```

Expected: Success (may have minor type errors to fix)

**Step 3: Fix any type errors**

If there are type errors, adjust the code accordingly. Common fixes:

- Add missing type imports
- Adjust return types to match interface

**Step 4: Commit**

```bash
git add apps/electron/src/main/services/database-adapters/turso-adapter.ts
git commit -m "feat(turso): implement TursoAdapter with libsql client"
```

---

## Task 6: Register TursoAdapter in DatabaseManager

**Files:**

- Modify: `apps/electron/src/main/services/database-adapters/database-manager.ts`

**Step 1: Import TursoAdapter**

Add import at top of file (after line 28):

```typescript
import { tursoAdapter } from './turso-adapter';
```

**Step 2: Register adapter in constructor**

In the constructor (around line 54), add after qdrant registration:

```typescript
// Use the singleton tursoAdapter to ensure IPC handlers use the same instance
this.adapters.set('turso', tursoAdapter);
```

**Step 3: Run typecheck**

Run:

```bash
cd /Users/shikun/Developer/opensource/sql-pro/.worktrees/turso-support && pnpm run typecheck
```

Expected: Success

**Step 4: Commit**

```bash
git add apps/electron/src/main/services/database-adapters/database-manager.ts
git commit -m "feat(turso): register TursoAdapter in DatabaseManager"
```

---

## Task 7: Update DatabaseTypeSelector UI

**Files:**

- Modify: `apps/electron/src/renderer/src/components/DatabaseTypeSelector.tsx`

**Step 1: Import Zap icon for Turso**

Update import (line 8) to include `Zap`:

```typescript
import { Box, Cloud, Database, Server, Zap } from 'lucide-react';
```

**Step 2: Add Turso to DATABASE_TYPES array**

Add after qdrant entry (around line 50):

```typescript
  {
    type: 'turso',
    icon: Zap,
    color: 'text-cyan-500',
  },
```

**Step 3: Run typecheck**

Run:

```bash
cd /Users/shikun/Developer/opensource/sql-pro/.worktrees/turso-support && pnpm run typecheck
```

Expected: Success

**Step 4: Commit**

```bash
git add apps/electron/src/renderer/src/components/DatabaseTypeSelector.tsx
git commit -m "feat(ui): add Turso option to DatabaseTypeSelector"
```

---

## Task 8: Update ServerConnectionDialog for Turso

**Files:**

- Modify: `apps/electron/src/renderer/src/components/ServerConnectionDialog.tsx`

**Step 1: Add Turso to DEFAULT_PORTS and DATABASE_LABELS**

Update DEFAULT_PORTS (around line 33):

```typescript
  turso: 0,
```

Update DATABASE_LABELS (around line 41):

```typescript
  turso: 'Turso',
```

**Step 2: Add Turso state variables**

After qdrantUseTLS state (around line 145), add:

```typescript
// Turso-specific
const [tursoOrganization, setTursoOrganization] = useState('');
const [tursoAuthToken, setTursoAuthToken] = useState('');
```

**Step 3: Add isTurso check**

After isQdrant (around line 124), add:

```typescript
const isTurso = databaseType === 'turso';
```

**Step 4: Reset Turso fields on dialog open**

In the useEffect reset section (around line 215), add after Qdrant reset:

```typescript
// Turso-specific - reset to defaults
setTursoOrganization('');
setTursoAuthToken('');
```

Also add in the edit mode section (around line 197):

```typescript
// Turso-specific
setTursoOrganization(initialConfig.tursoOrganization || '');
setTursoAuthToken(initialConfig.tursoAuthToken || '');
```

**Step 5: Update handleSubmit for Turso**

In handleSubmit, after isQdrant block (around line 246), add:

```typescript
    } else if (isTurso) {
      config.tursoOrganization = tursoOrganization;
      config.tursoAuthToken = tursoAuthToken;
```

**Step 6: Update isFormValid**

Update isFormValid (around line 275):

```typescript
const isFormValid = isSupabase
  ? supabaseUrl && supabaseKey
  : isQdrant
    ? qdrantHost
    : isTurso
      ? tursoOrganization && tursoAuthToken
      : host && database;
```

**Step 7: Add Turso form fields in render**

After the isQdrant form section (around line 438), add a new condition:

```typescript
              ) : isTurso ? (
                <>
                  {/* Turso Organization */}
                  <div className="space-y-2">
                    <Label htmlFor="tursoOrganization">
                      Organization Slug{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="tursoOrganization"
                      placeholder="my-org"
                      value={tursoOrganization}
                      onChange={(e) => setTursoOrganization(e.target.value)}
                      required
                    />
                    <p className="text-muted-foreground text-xs">
                      Your Turso organization slug (found in dashboard URL)
                    </p>
                  </div>

                  {/* Turso Auth Token */}
                  <div className="space-y-2">
                    <Label htmlFor="tursoAuthToken">
                      Auth Token <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="tursoAuthToken"
                      type="password"
                      placeholder="Your Turso auth token"
                      value={tursoAuthToken}
                      onChange={(e) => setTursoAuthToken(e.target.value)}
                      required
                    />
                    <p className="text-muted-foreground text-xs">
                      Create a token with Platform API access in Turso dashboard
                    </p>
                  </div>
                </>
```

**Step 8: Run typecheck**

Run:

```bash
cd /Users/shikun/Developer/opensource/sql-pro/.worktrees/turso-support && pnpm run typecheck
```

Expected: Success

**Step 9: Commit**

```bash
git add apps/electron/src/renderer/src/components/ServerConnectionDialog.tsx
git commit -m "feat(ui): add Turso connection form to ServerConnectionDialog"
```

---

## Task 9: Add Turso Localization

**Files:**

- Modify: `apps/electron/src/renderer/src/locales/en/dialog.json`
- Modify: `apps/electron/src/renderer/src/locales/zh/dialog.json`

**Step 1: Add English locale**

In `en/dialog.json`, add after qdrant section (around line 24):

```json
    "turso": {
      "name": "Turso",
      "description": "Edge Database"
    }
```

**Step 2: Add Chinese locale**

In `zh/dialog.json`, add after qdrant section:

```json
    "turso": {
      "name": "Turso",
      "description": "边缘数据库"
    }
```

**Step 3: Commit**

```bash
git add apps/electron/src/renderer/src/locales/*/dialog.json
git commit -m "feat(i18n): add Turso localization for EN and ZH"
```

---

## Task 10: Final Verification

**Step 1: Run full typecheck**

Run:

```bash
cd /Users/shikun/Developer/opensource/sql-pro/.worktrees/turso-support && pnpm run typecheck
```

Expected: Success

**Step 2: Run lint**

Run:

```bash
cd /Users/shikun/Developer/opensource/sql-pro/.worktrees/turso-support && pnpm run lint
```

Expected: Success (or minor fixable warnings)

**Step 3: Build the app**

Run:

```bash
cd /Users/shikun/Developer/opensource/sql-pro/.worktrees/turso-support && pnpm run build
```

Expected: Success

**Step 4: Test manually**

1. Start the dev server: `pnpm run dev`
2. Open the app
3. Click "Add Connection"
4. Verify Turso appears in database type selector
5. Select Turso and verify the form shows organization and token fields

---

## Summary

| Task | Description                         | Files                      |
| ---- | ----------------------------------- | -------------------------- |
| 1    | Add @libsql/client dependency       | package.json               |
| 2    | Add Turso to shared types           | shared/types.ts            |
| 3    | Add Turso to adapter types          | adapters/types.ts          |
| 4    | Implement TursoPlatformService      | turso-platform.ts          |
| 5    | Implement TursoAdapter              | turso-adapter.ts           |
| 6    | Register adapter in DatabaseManager | database-manager.ts        |
| 7    | Update DatabaseTypeSelector         | DatabaseTypeSelector.tsx   |
| 8    | Update ServerConnectionDialog       | ServerConnectionDialog.tsx |
| 9    | Add localization                    | locales/\*/dialog.json     |
| 10   | Final verification                  | -                          |
