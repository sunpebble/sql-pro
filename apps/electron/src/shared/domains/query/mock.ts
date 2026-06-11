/**
 * Mock API definitions for the query domain.
 * Types mirror the real API interface.
 */

import type { SqlProApiDeps } from '../../lib/sql-pro-api';

export interface QueryMockApi {
  query: {
    execute: (r: unknown) => Promise<unknown>;
    analyzePlan: (r: unknown) => Promise<unknown>;
  };
  changes: {
    validate: (r: unknown) => Promise<unknown>;
    apply: (r: unknown) => Promise<unknown>;
    checkUnsaved: (r: unknown) => Promise<unknown>;
  };
  history: {
    get: (r: unknown) => Promise<unknown>;
    save: (r: unknown) => Promise<unknown>;
    delete: (r: unknown) => Promise<unknown>;
    clear: (r: unknown) => Promise<unknown>;
  };
  sqlLog: {
    get: (r: unknown) => Promise<unknown>;
    clear: (r: unknown) => Promise<unknown>;
    onEntry: (cb: (e: unknown) => void) => () => void;
  };
}

export function createQueryMock(_deps: SqlProApiDeps): QueryMockApi {
  throw new Error('Mock factory not yet implemented; use mock-api.ts directly');
}
