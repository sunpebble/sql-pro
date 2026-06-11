/**
 * Mock API definitions for the profile domain.
 * Types mirror the real API interface.
 */

import type { SqlProApiDeps } from '../../lib/sql-pro-api';

export interface ProfileMockApi {
  profile: {
    save: (r: unknown) => Promise<unknown>;
    update: (r: unknown) => Promise<unknown>;
    delete: (r: unknown) => Promise<unknown>;
    getAll: (r: unknown) => Promise<unknown>;
    export: () => Promise<unknown>;
    import: () => Promise<unknown>;
  };
  folder: {
    create: (r: unknown) => Promise<unknown>;
    update: (r: unknown) => Promise<unknown>;
    delete: (r: unknown) => Promise<unknown>;
    getAll: (r: unknown) => Promise<unknown>;
  };
  preferences: {
    get: () => Promise<unknown>;
    set: (r: unknown) => Promise<unknown>;
    getRecentConnections: () => Promise<unknown>;
  };
}

export function createProfileMock(_deps: SqlProApiDeps): ProfileMockApi {
  throw new Error('Mock factory not yet implemented; use mock-api.ts directly');
}
