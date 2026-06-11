/**
 * Mock API definitions for the plugin domain.
 * Types mirror the real API interface.
 */

import type { SqlProApiDeps } from '../../lib/sql-pro-api';
import type { InstallPluginRequest, PluginEvent } from './types';

export interface PluginMockApi {
  install: (request: InstallPluginRequest) => Promise<unknown>;
  uninstall: (pluginId: string) => Promise<unknown>;
  enable: (pluginId: string) => Promise<unknown>;
  disable: (pluginId: string) => Promise<unknown>;
  list: () => Promise<unknown>;
  onEvent: (cb: (e: PluginEvent) => void) => () => void;
}

export function createPluginMock(_deps: SqlProApiDeps): PluginMockApi {
  throw new Error('Mock factory not yet implemented; use mock-api.ts directly');
}
