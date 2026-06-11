/**
 * Mock API definitions for the database domain.
 * Types mirror the real API interface.
 */

import type { SqlProApiDeps } from '../../lib/sql-pro-api';
import type { FileChangeEvent } from './types';

export interface DatabaseMockApi {
  connection: {
    open: (r: unknown) => Promise<unknown>;
    close: (r: unknown) => Promise<unknown>;
    testConnection: (r: unknown) => Promise<unknown>;
    changePassword: (r: unknown) => Promise<unknown>;
    getStats: (r: unknown) => Promise<unknown>;
    vacuum: (r: unknown) => Promise<unknown>;
    analyze: (r: unknown) => Promise<unknown>;
    onFileChanged: (cb: (e: FileChangeEvent) => void) => () => void;
  };
  vector: {
    search: (r: unknown) => Promise<unknown>;
    searchSimilar: (r: unknown) => Promise<unknown>;
    batchSearch: (r: unknown) => Promise<unknown>;
    getPointsWithVectors: (r: unknown) => Promise<unknown>;
  };
  image: {
    getMetadata: (r: unknown) => Promise<unknown>;
    getFileMetadata: (r: unknown) => Promise<unknown>;
    getCacheStats: () => Promise<unknown>;
    clearCache: () => Promise<unknown>;
    checkUrl: (r: unknown) => Promise<unknown>;
    validateUrl: (r: unknown) => Promise<unknown>;
    checkFile: (r: unknown) => Promise<unknown>;
  };
  video: {
    getMetadata: (r: unknown) => Promise<unknown>;
    checkUrl: (r: unknown) => Promise<unknown>;
    validateUrl: (r: unknown) => Promise<unknown>;
    checkFile: (r: unknown) => Promise<unknown>;
  };
}

export function createDatabaseMock(_deps: SqlProApiDeps): DatabaseMockApi {
  throw new Error('Mock factory not yet implemented; use mock-api.ts directly');
}
