import { channel, streamChannel } from './utils';

/**
 * Database IPC Channels
 */
export const databaseChannels = {
  connect: channel<
    { profileId: string; password?: string },
    { success: boolean; error?: string }
  >('database:connect'),

  disconnect: channel<{ profileId: string }, void>('database:disconnect'),

  query: channel<
    { sql: string; params?: unknown[] },
    { rows: unknown[]; fields: string[]; rowCount: number }
  >('database:query'),

  getSchema: channel<
    { refresh?: boolean },
    { tables: unknown[]; views: unknown[] }
  >('database:get-schema'),

  getTableData: channel<
    { table: string; limit?: number; offset?: number },
    { rows: unknown[]; total: number }
  >('database:get-table-data'),
} as const;

/**
 * Schema IPC Channels
 */
export const schemaChannels = {
  getTables: channel<void, { name: string; type: string }[]>(
    'schema:get-tables'
  ),

  getColumns: channel<
    { table: string },
    { name: string; type: string; nullable: boolean; primaryKey: boolean }[]
  >('schema:get-columns'),

  getIndexes: channel<{ table: string }, unknown[]>('schema:get-indexes'),

  getForeignKeys: channel<{ table: string }, unknown[]>(
    'schema:get-foreign-keys'
  ),

  compare: channel<
    { source: string; target: string },
    { differences: unknown[] }
  >('schema:compare'),
} as const;

/**
 * History IPC Channels
 */
export const historyChannels = {
  getAll: channel<
    { limit?: number; offset?: number },
    { items: unknown[]; total: number }
  >('history:get-all'),

  add: channel<{ sql: string; executionTime: number }, { id: string }>(
    'history:add'
  ),

  delete: channel<{ id: string }, void>('history:delete'),

  clear: channel<void, void>('history:clear'),

  search: channel<{ query: string }, unknown[]>('history:search'),
} as const;

/**
 * Backup IPC Channels
 */
export const backupChannels = {
  create: channel<
    { profileId: string; path: string },
    { success: boolean; path: string }
  >('backup:create'),

  restore: channel<{ profileId: string; path: string }, { success: boolean }>(
    'backup:restore'
  ),

  list: channel<{ profileId: string }, unknown[]>('backup:list'),
} as const;

/**
 * Export IPC Channels
 */
export const exportChannels = {
  toCSV: channel<
    { table: string; path: string; options?: unknown },
    { success: boolean; rowCount: number }
  >('export:to-csv'),

  toJSON: channel<
    { table: string; path: string; options?: unknown },
    { success: boolean; rowCount: number }
  >('export:to-json'),

  toSQL: channel<
    { table: string; path: string; options?: unknown },
    { success: boolean }
  >('export:to-sql'),

  toExcel: channel<
    { table: string; path: string; options?: unknown },
    { success: boolean; rowCount: number }
  >('export:to-excel'),
} as const;

/**
 * Import IPC Channels
 */
export const importChannels = {
  fromCSV: channel<
    { path: string; table: string; options?: unknown },
    { success: boolean; rowCount: number }
  >('import:from-csv'),

  fromJSON: channel<
    { path: string; table: string; options?: unknown },
    { success: boolean; rowCount: number }
  >('import:from-json'),

  fromSQL: channel<{ path: string }, { success: boolean }>('import:from-sql'),

  preview: channel<
    { path: string; format: string },
    { columns: string[]; rows: unknown[]; totalRows: number }
  >('import:preview'),
} as const;

/**
 * Agent IPC Channels
 */
export const agentChannels = {
  chat: streamChannel<
    { message: string; conversationId?: string },
    { type: 'text' | 'tool_call' | 'done'; content: string }
  >('agent:chat'),

  generateSQL: channel<
    { prompt: string; schema?: unknown },
    { sql: string; explanation: string }
  >('agent:generate-sql'),

  explainSQL: channel<{ sql: string }, { explanation: string }>(
    'agent:explain-sql'
  ),

  optimizeSQL: channel<
    { sql: string },
    { optimized: string; suggestions: string[] }
  >('agent:optimize-sql'),

  getHistory: channel<{ conversationId: string }, unknown[]>(
    'agent:get-history'
  ),

  clearHistory: channel<{ conversationId?: string }, void>(
    'agent:clear-history'
  ),
} as const;

/**
 * System IPC Channels
 */
export const systemChannels = {
  getAppInfo: channel<void, { version: string; platform: string }>(
    'system:get-app-info'
  ),

  openExternal: channel<{ url: string }, void>('system:open-external'),

  showItemInFolder: channel<{ path: string }, void>(
    'system:show-item-in-folder'
  ),

  getPath: channel<
    { name: 'home' | 'appData' | 'userData' | 'temp' | 'downloads' },
    string
  >('system:get-path'),
} as const;

/**
 * Preferences IPC Channels
 */
export const preferencesChannels = {
  get: channel<{ key: string }, unknown>('preferences:get'),

  set: channel<{ key: string; value: unknown }, void>('preferences:set'),

  getAll: channel<void, Record<string, unknown>>('preferences:get-all'),

  reset: channel<{ key?: string }, void>('preferences:reset'),
} as const;

/**
 * License IPC Channels
 */
export const licenseChannels = {
  validate: channel<{ key: string }, { valid: boolean; features: string[] }>(
    'license:validate'
  ),

  activate: channel<{ key: string }, { success: boolean; error?: string }>(
    'license:activate'
  ),

  deactivate: channel<void, { success: boolean }>('license:deactivate'),

  getStatus: channel<
    void,
    { active: boolean; type: string; expiresAt?: string }
  >('license:get-status'),
} as const;

/**
 * All channels grouped by namespace
 */
export const channels = {
  database: databaseChannels,
  schema: schemaChannels,
  history: historyChannels,
  backup: backupChannels,
  export: exportChannels,
  import: importChannels,
  agent: agentChannels,
  system: systemChannels,
  preferences: preferencesChannels,
  license: licenseChannels,
} as const;

export type Channels = typeof channels;
