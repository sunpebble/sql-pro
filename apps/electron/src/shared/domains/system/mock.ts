/**
 * Mock API definitions for the system domain.
 * Types mirror the real API interface.
 */

import type { SqlProApiDeps } from '../../lib/sql-pro-api';
import type { MenuAction } from './types';

export interface SystemMockApi {
  window: {
    create: () => Promise<unknown>;
    close: (r?: unknown) => Promise<unknown>;
    focus: (r: unknown) => Promise<unknown>;
    getAll: () => Promise<unknown>;
    getCurrent: () => Promise<unknown>;
  };
  dialog: {
    openFile: (r?: unknown) => Promise<unknown>;
    saveFile: (r?: unknown) => Promise<unknown>;
    writeFile: (r: unknown) => Promise<unknown>;
  };
  password: {
    save: (r: unknown) => Promise<unknown>;
    get: (r: unknown) => Promise<unknown>;
    has: (r: unknown) => Promise<unknown>;
    remove: (r: unknown) => Promise<unknown>;
    isAvailable: () => Promise<unknown>;
  };
  system: {
    showItemInFolder: (r: unknown) => Promise<unknown>;
    openExternal: (r: unknown) => Promise<unknown>;
    getAppVersion: () => Promise<unknown>;
    getPlatform: () => Promise<unknown>;
  };
  update: {
    check: (silent?: boolean) => Promise<unknown>;
    download: () => Promise<unknown>;
    install: () => Promise<unknown>;
    onStatusChange: (cb: (e: unknown) => void) => () => void;
  };
  menu: {
    onAction: (cb: (action: MenuAction) => void) => () => void;
  };
  shortcuts: {
    update: (r: unknown) => Promise<unknown>;
  };
}

export function createSystemMock(_deps: SqlProApiDeps): SystemMockApi {
  throw new Error('Mock factory not yet implemented; use mock-api.ts directly');
}
