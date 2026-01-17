# Qdrant Phase 1 MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement basic Qdrant vector database support with connection, collection browsing, and point CRUD operations.

**Architecture:** Full adapter integration following existing patterns (SQLiteAdapter, PostgreSQLAdapter). Qdrant collections map to tables, points map to rows, payload fields map to columns.

**Tech Stack:** `@qdrant/js-client-rest` for Qdrant API, TypeScript, existing adapter interfaces.

---

## Task 1: Add Qdrant Type Definitions

**Files:**

- Modify: `apps/electron/src/shared/types.ts`

**Step 1: Add 'qdrant' to DatabaseType union**

```typescript
// In apps/electron/src/shared/types.ts, find the DatabaseType definition and add 'qdrant'
export type DatabaseType =
  | 'sqlite'
  | 'mysql'
  | 'postgresql'
  | 'supabase'
  | 'qdrant';
```

**Step 2: Add QdrantConnectionConfig to DatabaseConnectionConfig**

Add Qdrant-specific fields to the config interface:

```typescript
// Add to DatabaseConnectionConfig interface
export interface DatabaseConnectionConfig {
  type: DatabaseType;
  // ... existing fields ...

  // Qdrant specific
  qdrantHost?: string; // e.g., 'localhost' or 'cloud.qdrant.io'
  qdrantPort?: number; // REST API port (default 6333)
  qdrantApiKey?: string; // API key for authentication
  qdrantUseTLS?: boolean; // Use HTTPS
}
```

**Step 3: Run typecheck to verify no breaks**

Run: `cd apps/electron && pnpm typecheck`
Expected: No new errors related to DatabaseType

**Step 4: Commit**

```bash
git add apps/electron/src/shared/types.ts
git commit -m "feat(qdrant): add qdrant type definitions

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Install Qdrant Client Package

**Files:**

- Modify: `apps/electron/package.json`

**Step 1: Add qdrant client dependency**

Run: `cd apps/electron && pnpm add @qdrant/js-client-rest`

**Step 2: Verify installation**

Run: `cd apps/electron && pnpm list @qdrant/js-client-rest`
Expected: Shows installed version

**Step 3: Commit**

```bash
git add apps/electron/package.json pnpm-lock.yaml
git commit -m "chore(qdrant): add @qdrant/js-client-rest dependency

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Create QdrantAdapter Skeleton

**Files:**

- Create: `apps/electron/src/main/services/database-adapters/qdrant-adapter.ts`

**Step 1: Create adapter file with basic structure**

```typescript
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
}

// Simple ID generator
let idCounter = 0;
function generateId(): string {
  idCounter += 1;
  return `qdrant_${idCounter}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Qdrant database adapter implementation
 */
export class QdrantAdapter implements DatabaseAdapter {
  readonly type = 'qdrant' as const;
  private connections: Map<string, QdrantConnectionInfo> = new Map();

  async open(config: DatabaseConnectionConfig): Promise<OpenResult> {
    const host = config.qdrantHost || 'localhost';
    const port = config.qdrantPort || 6333;
    const apiKey = config.qdrantApiKey;
    const useTLS = config.qdrantUseTLS ?? false;

    try {
      const client = new QdrantClient({
        host,
        port,
        apiKey,
        https: useTLS,
      });

      // Test connection by getting collections
      await client.getCollections();

      const id = generateId();
      this.connections.set(id, {
        id,
        client,
        host,
        port,
        useTLS,
      });

      return {
        success: true,
        connection: {
          id,
          filename: `${host}:${port}`,
          path: `${useTLS ? 'https' : 'http'}://${host}:${port}`,
          isEncrypted: !!apiKey,
          isReadOnly: false,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to connect to Qdrant: ${message}`,
        errorCode: 'CONNECTION_ERROR',
      };
    }
  }

  async testConnection(
    config: DatabaseConnectionConfig
  ): Promise<
    | { success: true; latencyMs: number; serverVersion?: string }
    | { success: false; error: string }
  > {
    const host = config.qdrantHost || 'localhost';
    const port = config.qdrantPort || 6333;
    const apiKey = config.qdrantApiKey;
    const useTLS = config.qdrantUseTLS ?? false;

    try {
      const start = Date.now();
      const client = new QdrantClient({
        host,
        port,
        apiKey,
        https: useTLS,
      });

      await client.getCollections();
      const latencyMs = Date.now() - start;

      return { success: true, latencyMs };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  close(
    connectionId: string
  ): { success: true } | { success: false; error: string } {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, error: 'Connection not found' };
    }
    // QdrantClient doesn't need explicit close
    this.connections.delete(connectionId);
    return { success: true };
  }

  closeAll(): void {
    this.connections.clear();
  }

  getConnection(connectionId: string): AdapterConnectionInfo | null {
    const conn = this.connections.get(connectionId);
    if (!conn) return null;
    return {
      id: conn.id,
      filename: `${conn.host}:${conn.port}`,
      path: `${conn.useTLS ? 'https' : 'http'}://${conn.host}:${conn.port}`,
      isEncrypted: false,
      isReadOnly: false,
    };
  }

  // Placeholder implementations - will be filled in subsequent tasks
  getSchema(_connectionId: string) {
    return { success: false as const, error: 'Not implemented yet' };
  }

  getTableStructure(
    _connectionId: string,
    _tableName: string,
    _schema?: string
  ) {
    return { success: false as const, error: 'Not implemented yet' };
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
    return { success: false, error: 'Not implemented yet' };
  }

  query(_connectionId: string, _sql: string, _params?: unknown[]) {
    return {
      success: false as const,
      error: 'SQL queries not supported for Qdrant',
    };
  }

  execute(_connectionId: string, _sql: string, _params?: unknown[]) {
    return {
      success: false as const,
      error: 'SQL execution not supported for Qdrant',
    };
  }

  executeQuery(_connectionId: string, _query: string) {
    return {
      success: false as const,
      error: 'SQL queries not supported for Qdrant',
    };
  }

  validateQuery(_connectionId: string, _sql: string): ValidationResult {
    return { isValid: false, error: 'SQL validation not supported for Qdrant' };
  }

  explainQuery(_connectionId: string, _sql: string) {
    return {
      success: false as const,
      error: 'Query explain not supported for Qdrant',
    };
  }

  validateChanges(_connectionId: string, _changes: PendingChangeInfo[]) {
    return { success: true as const, validationResults: [] };
  }

  applyChanges(_connectionId: string, _changes: PendingChangeInfo[]) {
    return { success: false as const, error: 'Not implemented yet' };
  }

  getPendingChanges(_connectionId: string) {
    return { success: true as const, changes: [] };
  }

  async getColumnDistribution(
    _connectionId: string,
    _table: string,
    _column: string,
    _schema?: string,
    _limit?: number
  ) {
    return { success: false as const, error: 'Not implemented yet' };
  }
}

// Export singleton instance
export const qdrantAdapter = new QdrantAdapter();
```

**Step 2: Run typecheck**

Run: `cd apps/electron && pnpm typecheck`
Expected: PASS (no errors)

**Step 3: Commit**

```bash
git add apps/electron/src/main/services/database-adapters/qdrant-adapter.ts
git commit -m "feat(qdrant): create QdrantAdapter skeleton with connection methods

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Register QdrantAdapter in DatabaseManager

**Files:**

- Modify: `apps/electron/src/main/services/database-adapters/database-manager.ts`
- Modify: `apps/electron/src/main/services/database-adapters/index.ts`

**Step 1: Export QdrantAdapter from index**

Add to `apps/electron/src/main/services/database-adapters/index.ts`:

```typescript
export { QdrantAdapter, qdrantAdapter } from './qdrant-adapter';
```

**Step 2: Register adapter in DatabaseManager constructor**

In `database-manager.ts`, add import and registration:

```typescript
// Add import
import { QdrantAdapter } from './qdrant-adapter';

// In constructor, add:
this.adapters.set('qdrant', new QdrantAdapter());
```

**Step 3: Update isAsyncConnection for Qdrant**

Qdrant is async, so update the check:

```typescript
isAsyncConnection(connectionId: string): boolean {
  const managed = this.connections.get(connectionId);
  if (!managed) {
    return false;
  }
  // SQLite is sync, everything else is async
  return managed.type !== 'sqlite';
}
```

**Step 4: Run typecheck**

Run: `cd apps/electron && pnpm typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/electron/src/main/services/database-adapters/index.ts apps/electron/src/main/services/database-adapters/database-manager.ts
git commit -m "feat(qdrant): register QdrantAdapter in DatabaseManager

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Implement getSchema for Collections

**Files:**

- Modify: `apps/electron/src/main/services/database-adapters/qdrant-adapter.ts`

**Step 1: Implement getSchemaAsync method**

Add async version that lists collections:

```typescript
async getSchemaAsync(connectionId: string): Promise<
  | { success: true; schemas: SchemaInfo[]; tables: TableInfo[]; views: TableInfo[] }
  | { success: false; error: string }
> {
  const conn = this.connections.get(connectionId);
  if (!conn) {
    return { success: false, error: 'Connection not found' };
  }

  try {
    const result = await conn.client.getCollections();

    // Map collections to tables
    const tables: TableInfo[] = result.collections.map((collection) => ({
      name: collection.name,
      type: 'table' as const,
      schema: 'default',
      rowCount: 0, // Will be populated on demand
      columns: [], // Will be populated by getTableStructure
      indexes: [],
      foreignKeys: [],
      triggers: [],
    }));

    return {
      success: true,
      schemas: [{ name: 'default', isDefault: true }],
      tables,
      views: [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}
```

**Step 2: Update sync getSchema to return async error**

```typescript
getSchema(connectionId: string) {
  return {
    success: false as const,
    error: 'Use getSchemaAsync for Qdrant connections'
  };
}
```

**Step 3: Run typecheck**

Run: `cd apps/electron && pnpm typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add apps/electron/src/main/services/database-adapters/qdrant-adapter.ts
git commit -m "feat(qdrant): implement getSchemaAsync to list collections

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Implement getTableStructure for Collection Info

**Files:**

- Modify: `apps/electron/src/main/services/database-adapters/qdrant-adapter.ts`

**Step 1: Implement getTableStructureAsync**

Get collection info and infer payload schema from sample points:

```typescript
async getTableStructureAsync(
  connectionId: string,
  tableName: string,
  _schema?: string
): Promise<{ success: true; structure: TableInfo } | { success: false; error: string }> {
  const conn = this.connections.get(connectionId);
  if (!conn) {
    return { success: false, error: 'Connection not found' };
  }

  try {
    // Get collection info
    const collectionInfo = await conn.client.getCollection(tableName);

    // Get sample points to infer payload schema
    const samplePoints = await conn.client.scroll(tableName, {
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

    // Build columns array
    const columns: ColumnInfo[] = [
      // Point ID column
      {
        name: '__id',
        type: 'TEXT',
        nullable: false,
        isPrimaryKey: true,
        defaultValue: null,
        position: 0,
      },
      // Vector column (display only, shows dimension info)
      {
        name: '__vector',
        type: `VECTOR[${collectionInfo.config.params.vectors?.size || '?'}]`,
        nullable: false,
        isPrimaryKey: false,
        defaultValue: null,
        position: 1,
      },
    ];

    // Add payload columns
    let position = 2;
    for (const [name, type] of payloadFields) {
      columns.push({
        name,
        type,
        nullable: true,
        isPrimaryKey: false,
        defaultValue: null,
        position: position++,
      });
    }

    const structure: TableInfo = {
      name: tableName,
      type: 'table',
      schema: 'default',
      rowCount: collectionInfo.points_count || 0,
      columns,
      indexes: [],
      foreignKeys: [],
      triggers: [],
    };

    return { success: true, structure };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

// Helper to infer type from value
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
```

**Step 2: Run typecheck**

Run: `cd apps/electron && pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/electron/src/main/services/database-adapters/qdrant-adapter.ts
git commit -m "feat(qdrant): implement getTableStructureAsync for collection info

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Implement getTableData with Scroll Pagination

**Files:**

- Modify: `apps/electron/src/main/services/database-adapters/qdrant-adapter.ts`

**Step 1: Implement getTableDataAsync**

Use scroll API for pagination:

```typescript
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
  const conn = this.connections.get(connectionId);
  if (!conn) {
    return { success: false, error: 'Connection not found' };
  }

  try {
    // Get collection info for total count
    const collectionInfo = await conn.client.getCollection(table);
    const totalRows = collectionInfo.points_count || 0;

    // Build filter if provided
    const qdrantFilter = this.buildQdrantFilter(filters);

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Use scroll with offset simulation
    // Note: Qdrant scroll doesn't support offset, so we need to scroll through
    // For MVP, we'll use a simple approach with limit
    const result = await conn.client.scroll(table, {
      limit: pageSize,
      offset: offset > 0 ? offset : undefined,
      with_payload: true,
      with_vector: false, // Don't fetch full vectors for table view
      filter: qdrantFilter,
    });

    // Get structure for columns
    const structureResult = await this.getTableStructureAsync(connectionId, table);
    if (!structureResult.success) {
      return { success: false, error: structureResult.error };
    }

    // Transform points to rows
    const rows = result.points.map((point) => {
      const row: Record<string, unknown> = {
        __id: String(point.id),
        __vector: `[${collectionInfo.config.params.vectors?.size || '?'} dims]`,
      };

      // Add payload fields
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

// Build Qdrant filter from generic filter array
private buildQdrantFilter(
  filters?: Array<{ column: string; operator: string; value: string }>
): Record<string, unknown> | undefined {
  if (!filters || filters.length === 0) return undefined;

  const must: Array<Record<string, unknown>> = [];

  for (const filter of filters) {
    // Skip special columns
    if (filter.column.startsWith('__')) continue;

    switch (filter.operator) {
      case '=':
      case 'equals':
        must.push({
          key: filter.column,
          match: { value: this.parseFilterValue(filter.value) },
        });
        break;
      case '>':
        must.push({
          key: filter.column,
          range: { gt: Number(filter.value) },
        });
        break;
      case '>=':
        must.push({
          key: filter.column,
          range: { gte: Number(filter.value) },
        });
        break;
      case '<':
        must.push({
          key: filter.column,
          range: { lt: Number(filter.value) },
        });
        break;
      case '<=':
        must.push({
          key: filter.column,
          range: { lte: Number(filter.value) },
        });
        break;
      case 'contains':
      case 'like':
        must.push({
          key: filter.column,
          match: { text: filter.value },
        });
        break;
    }
  }

  return must.length > 0 ? { must } : undefined;
}

private parseFilterValue(value: string): unknown {
  // Try to parse as number
  const num = Number(value);
  if (!isNaN(num)) return num;

  // Try to parse as boolean
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;

  // Return as string
  return value;
}
```

**Step 2: Run typecheck**

Run: `cd apps/electron && pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/electron/src/main/services/database-adapters/qdrant-adapter.ts
git commit -m "feat(qdrant): implement getTableDataAsync with scroll pagination

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Implement applyChanges for CRUD Operations

**Files:**

- Modify: `apps/electron/src/main/services/database-adapters/qdrant-adapter.ts`

**Step 1: Implement applyChangesAsync**

Handle insert, update, delete operations on points:

```typescript
async applyChangesAsync(
  connectionId: string,
  changes: PendingChangeInfo[]
): Promise<
  | { success: true; appliedCount: number }
  | { success: false; error: string }
> {
  const conn = this.connections.get(connectionId);
  if (!conn) {
    return { success: false, error: 'Connection not found' };
  }

  try {
    let appliedCount = 0;

    for (const change of changes) {
      const collectionName = change.table;

      switch (change.type) {
        case 'insert': {
          if (!change.newValues) continue;

          // Extract vector and payload from newValues
          const { __vector, __id, ...payload } = change.newValues as Record<string, unknown>;

          // Parse vector if provided as string
          let vector: number[] | undefined;
          if (__vector && typeof __vector === 'string') {
            try {
              vector = JSON.parse(__vector);
            } catch {
              return { success: false, error: 'Invalid vector format' };
            }
          } else if (Array.isArray(__vector)) {
            vector = __vector as number[];
          }

          if (!vector) {
            return { success: false, error: 'Vector is required for insert' };
          }

          // Generate ID if not provided
          const pointId = __id ? String(__id) : crypto.randomUUID();

          await conn.client.upsert(collectionName, {
            wait: true,
            points: [
              {
                id: pointId,
                vector,
                payload,
              },
            ],
          });
          appliedCount++;
          break;
        }

        case 'update': {
          if (!change.newValues) continue;

          const pointId = String(change.rowId);
          const { __vector, __id, ...payload } = change.newValues as Record<string, unknown>;

          // Update payload only (vector updates require full upsert)
          await conn.client.setPayload(collectionName, {
            wait: true,
            points: [pointId],
            payload,
          });
          appliedCount++;
          break;
        }

        case 'delete': {
          const pointId = String(change.rowId);
          await conn.client.delete(collectionName, {
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
```

**Step 2: Run typecheck**

Run: `cd apps/electron && pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/electron/src/main/services/database-adapters/qdrant-adapter.ts
git commit -m "feat(qdrant): implement applyChangesAsync for CRUD operations

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Add Qdrant Connection Form UI

**Files:**

- Modify: `apps/electron/src/renderer/src/components/connection-dialog/ConnectionForm.tsx`

**Step 1: Locate the connection form component**

Read the file to understand the current structure.

**Step 2: Add Qdrant connection type option**

Add 'qdrant' to the database type selector and add corresponding form fields.

**Step 3: Add Qdrant-specific form fields**

Add fields for:

- Host (text input, default: localhost)
- Port (number input, default: 6333)
- API Key (password input, optional)
- Use TLS (checkbox)

**Step 4: Run typecheck and lint**

Run: `cd apps/electron && pnpm typecheck && pnpm lint`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/electron/src/renderer/src/components/connection-dialog/
git commit -m "feat(qdrant): add Qdrant connection form UI

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Add Qdrant Icon

**Files:**

- Create or modify icon components for Qdrant

**Step 1: Find existing database icon components**

Search for how other database icons are implemented.

**Step 2: Add Qdrant icon**

Create or add a Qdrant-specific icon (could be a simple vector/graph icon or the Qdrant logo).

**Step 3: Update icon mapping**

Ensure the icon is used in connection list and other relevant places.

**Step 4: Commit**

```bash
git add apps/electron/src/renderer/src/components/icons/
git commit -m "feat(qdrant): add Qdrant database icon

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Manual Integration Testing

**Prerequisites:**

- Running Qdrant instance (Docker: `docker run -p 6333:6333 qdrant/qdrant`)

**Step 1: Start the app in development mode**

Run: `cd apps/electron && pnpm dev`

**Step 2: Test connection**

1. Click "New Connection"
2. Select "Qdrant" as database type
3. Enter connection details (localhost:6333 for local Docker)
4. Click "Test Connection"
5. Verify success message

**Step 3: Test browsing**

1. Connect to the Qdrant instance
2. Verify collections appear in sidebar
3. Click on a collection
4. Verify points are displayed in table view

**Step 4: Test CRUD (if collection exists)**

1. Try editing a payload field
2. Try deleting a point
3. Verify changes apply correctly

**Step 5: Document any issues**

Create issues for any bugs found during testing.

---

## Summary

This plan implements Phase 1 MVP with:

1. ✅ Type definitions for Qdrant
2. ✅ Qdrant client dependency
3. ✅ QdrantAdapter skeleton
4. ✅ Adapter registration
5. ✅ Collection listing (getSchemaAsync)
6. ✅ Collection structure (getTableStructureAsync)
7. ✅ Points table view (getTableDataAsync)
8. ✅ CRUD operations (applyChangesAsync)
9. ✅ Connection form UI
10. ✅ Icon integration
11. ✅ Manual testing

Phase 2 will add: Vector search panel, text-to-embedding, similarity search.
