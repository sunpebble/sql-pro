/**
 * Mock API definitions for the data domain.
 * Types mirror the real API interface.
 */

import type { SqlProApiDeps } from '../../lib/sql-pro-api';

export interface DataMockApi {
  getTableData: (r: unknown) => Promise<unknown>;
  getTableRowRange: (r: unknown) => Promise<unknown>;
  getColumnDistribution: (r: unknown) => Promise<unknown>;
}

export function createDataMock(_deps: SqlProApiDeps): DataMockApi {
  throw new Error('Mock factory not yet implemented; use mock-api.ts directly');
}
