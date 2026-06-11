/**
 * Mock API definitions for the schema domain.
 * Types mirror the real API interface.
 */

import type { SqlProApiDeps } from '../../lib/sql-pro-api';

export interface SchemaMockApi {
  schema: {
    get: (r: unknown) => Promise<unknown>;
    getList: (r: unknown) => Promise<unknown>;
    getTableDetails: (r: unknown) => Promise<unknown>;
    export: (r: unknown) => Promise<unknown>;
    import: (r: unknown) => Promise<unknown>;
  };
  snapshot: {
    save: (r: unknown) => Promise<unknown>;
    getAll: () => Promise<unknown>;
    get: (r: unknown) => Promise<unknown>;
    delete: (r: unknown) => Promise<unknown>;
  };
  comparison: {
    compareConnections: (r: unknown) => Promise<unknown>;
    compareConnectionToSnapshot: (r: unknown) => Promise<unknown>;
    compareSnapshots: (r: unknown) => Promise<unknown>;
    compareTables: (r: unknown) => Promise<unknown>;
    generateMigrationSQL: (r: unknown) => Promise<unknown>;
    generateSyncSQL: (r: unknown) => Promise<unknown>;
    exportReport: (r: unknown) => Promise<unknown>;
  };
}

export function createSchemaMock(_deps: SqlProApiDeps): SchemaMockApi {
  throw new Error('Mock factory not yet implemented; use mock-api.ts directly');
}
