/**
 * Tauri API Adapter Layer
 *
 * This module provides a unified API for interacting with the Tauri backend.
 * It mirrors the structure of the Electron preload API for easy migration.
 */

import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import { open as openShell } from '@tauri-apps/plugin-shell';

// ============ Type Imports ============
// These types should be imported from shared types once migrated

export interface OpenDatabaseRequest {
  path?: string;
  password?: string;
  readOnly?: boolean;
  config?: DatabaseConnectionConfig;
}

export interface DatabaseConnectionConfig {
  type: 'sqlite' | 'mysql' | 'postgresql' | 'supabase';
  name?: string;
  path?: string;
  password?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  ssl?: boolean | { rejectUnauthorized?: boolean };
  readOnly?: boolean;
}

export interface ConnectionInfo {
  id: string;
  path: string;
  filename: string;
  isEncrypted: boolean;
  isReadOnly: boolean;
  databaseType?: string;
}

export interface OpenDatabaseResponse {
  success: boolean;
  connection?: ConnectionInfo;
  error?: string;
  needsPassword?: boolean;
  errorCode?: string;
  troubleshootingSteps?: string[];
}

export interface CloseDatabaseRequest {
  connectionId: string;
}

export interface CloseDatabaseResponse {
  success: boolean;
  error?: string;
}

export interface ExecuteQueryRequest {
  connectionId: string;
  query: string;
}

export interface ExecuteQueryResponse {
  success: boolean;
  columns?: string[];
  rows?: Record<string, unknown>[];
  rowsAffected?: number;
  executionTime?: number;
  error?: string;
  errorCode?: string;
}

export interface GetTableDataRequest {
  connectionId: string;
  table: string;
  schema?: string;
  page: number;
  pageSize: number;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  filters?: Array<{
    column: string;
    operator: string;
    value: string;
  }>;
}

export interface GetTableDataResponse {
  success: boolean;
  columns?: Array<{
    name: string;
    type: string;
    nullable: boolean;
    defaultValue: string | null;
    isPrimaryKey: boolean;
  }>;
  rows?: Record<string, unknown>[];
  totalRows?: number;
  error?: string;
}

export interface Preferences {
  theme: 'light' | 'dark' | 'system';
  defaultPageSize: number;
  confirmBeforeApply: boolean;
  recentConnectionsLimit: number;
}

// ============ SQL Pro API ============

export const sqlProAPI = {
  // Database operations
  db: {
    open: (request: OpenDatabaseRequest) =>
      invoke<OpenDatabaseResponse>('db_open', { request }),

    close: (request: CloseDatabaseRequest) =>
      invoke<CloseDatabaseResponse>('db_close', { request }),

    getSchema: (connectionId: string) =>
      invoke('db_get_schema', { request: { connectionId } }),

    getSchemaList: (connectionId: string) =>
      invoke('db_get_schema_list', { request: { connectionId } }),

    getTableDetails: (
      connectionId: string,
      tableName: string,
      schema?: string
    ) =>
      invoke('db_get_table_details', {
        request: { connectionId, tableName, schema },
      }),

    getTableData: (request: GetTableDataRequest) =>
      invoke<GetTableDataResponse>('db_get_table_data', { request }),

    executeQuery: (request: ExecuteQueryRequest) =>
      invoke<ExecuteQueryResponse>('db_execute_query', { request }),

    validateChanges: (connectionId: string, changes: unknown[]) =>
      invoke('db_validate_changes', { request: { connectionId, changes } }),

    applyChanges: (connectionId: string, changes: unknown[]) =>
      invoke('db_apply_changes', { request: { connectionId, changes } }),

    analyzeQueryPlan: (connectionId: string, query: string) =>
      invoke('db_analyze_plan', { request: { connectionId, query } }),

    testConnection: (config: DatabaseConnectionConfig) =>
      invoke('db_test_connection', { request: { config } }),

    changePassword: (
      connectionId: string,
      currentPassword: string | undefined,
      newPassword: string
    ) =>
      invoke('db_change_password', {
        request: { connectionId, currentPassword, newPassword },
      }),
  },

  // Dialog operations
  dialog: {
    openFile: async (options?: {
      title?: string;
      filters?: Array<{ name: string; extensions: string[] }>;
      defaultPath?: string;
    }) => {
      const result = await open({
        title: options?.title,
        filters: options?.filters,
        defaultPath: options?.defaultPath,
        multiple: false,
        directory: false,
      });

      return {
        success: result !== null,
        filePath: result as string | undefined,
        canceled: result === null,
      };
    },

    saveFile: async (options?: {
      title?: string;
      filters?: Array<{ name: string; extensions: string[] }>;
      defaultPath?: string;
    }) => {
      const result = await save({
        title: options?.title,
        filters: options?.filters,
        defaultPath: options?.defaultPath,
      });

      return {
        success: result !== null,
        filePath: result as string | undefined,
        canceled: result === null,
      };
    },
  },

  // Shell operations
  shell: {
    openExternal: (url: string) => openShell(url),
  },

  // Export operations
  export: {
    data: (request: unknown) => invoke('export_data', { request }),
    schema: (request: unknown) => invoke('export_schema', { request }),
  },

  // App/Store operations
  app: {
    getPreferences: () =>
      invoke<{ success: boolean; preferences?: Preferences }>(
        'store_get_preferences'
      ),

    setPreferences: (preferences: Partial<Preferences>) =>
      invoke('store_set_preferences', { request: { preferences } }),

    getRecentConnections: () =>
      invoke<{ success: boolean; connections?: unknown[] }>(
        'store_get_recent_connections'
      ),
  },

  // Password storage operations
  password: {
    isAvailable: () =>
      invoke<{ success: boolean; available: boolean }>('password_is_available'),

    save: (identifier: string, password: string) =>
      invoke('password_save', { request: { identifier, password } }),

    get: (identifier: string) =>
      invoke<{ success: boolean; password?: string }>('password_get', {
        request: { identifier },
      }),

    has: (identifier: string) =>
      invoke<{ success: boolean; hasPassword: boolean }>('password_has', {
        request: { identifier },
      }),

    remove: (identifier: string) =>
      invoke('password_remove', { request: { identifier } }),
  },

  // Plugin operations
  plugins: {
    list: () =>
      invoke<{
        success: boolean;
        plugins: Array<{
          manifest: {
            id: string;
            name: string;
            version: string;
            description?: string;
            author?: string;
            main: string;
            permissions: string[];
          };
          path: string;
          enabled: boolean;
          installedAt: string;
          state: string;
          error?: string;
        }>;
      }>('plugins_list'),

    get: (pluginId: string) =>
      invoke<{
        success: boolean;
        plugin?: {
          manifest: {
            id: string;
            name: string;
            version: string;
            description?: string;
            author?: string;
            main: string;
            permissions: string[];
          };
          path: string;
          enabled: boolean;
          installedAt: string;
          state: string;
          error?: string;
        };
        error?: string;
      }>('plugins_get', { pluginId }),

    install: (
      manifest: {
        id: string;
        name: string;
        version: string;
        description?: string;
        author?: string;
        main: string;
        permissions?: string[];
      },
      path: string
    ) =>
      invoke<{ success: boolean; error?: string }>('plugins_install', {
        request: {
          manifest: { ...manifest, permissions: manifest.permissions || [] },
          path,
        },
      }),

    uninstall: (pluginId: string, removeData = true) =>
      invoke<{ success: boolean; error?: string }>('plugins_uninstall', {
        request: { pluginId, removeData },
      }),

    enable: (pluginId: string) =>
      invoke<{ success: boolean; error?: string }>('plugins_enable', {
        request: { pluginId },
      }),

    disable: (pluginId: string) =>
      invoke<{ success: boolean; error?: string }>('plugins_disable', {
        request: { pluginId },
      }),

    getData: (pluginId: string, key: string) =>
      invoke<{ success: boolean; value?: unknown; error?: string }>(
        'plugins_get_data',
        { request: { pluginId, key } }
      ),

    setData: (pluginId: string, key: string, value: unknown) =>
      invoke<{ success: boolean; error?: string }>('plugins_set_data', {
        request: { pluginId, key, value },
      }),

    clearData: (pluginId: string) =>
      invoke<{ success: boolean; error?: string }>('plugins_clear_data', {
        pluginId,
      }),
  },

  // Query history operations
  history: {
    get: (dbPath: string) =>
      invoke<{ success: boolean; history?: unknown[] }>('history_get', {
        request: { dbPath },
      }),

    save: (entry: unknown) => invoke('history_save', { request: { entry } }),

    delete: (dbPath: string, entryId: string) =>
      invoke('history_delete', { request: { dbPath, entryId } }),

    clear: (dbPath: string) => invoke('history_clear', { request: { dbPath } }),
  },

  // Menu operations
  menu: {
    updateShortcuts: (shortcuts: Record<string, string>) =>
      invoke<{ success: boolean; error?: string }>('menu_update_shortcuts', {
        request: { shortcuts },
      }),
  },

  // Pro license operations
  pro: {
    activate: async (request: { licenseKey: string }) => {
      const result = await invoke<{ success: boolean; error?: string }>(
        'pro_activate',
        { request }
      );
      if (result.success) {
        // Fetch the updated status after activation
        const statusResult = await invoke<{
          success: boolean;
          status?: {
            isActive: boolean;
            activationDate?: string;
            licenseKey?: string;
            expiresAt?: string;
          };
        }>('pro_get_status');
        if (statusResult.success && statusResult.status) {
          return {
            success: true,
            status: {
              isPro: statusResult.status.isActive,
              licenseKey: statusResult.status.licenseKey,
              activatedAt: statusResult.status.activationDate,
              expiresAt: statusResult.status.expiresAt,
              features: [
                'ai-nl-to-sql',
                'ai-data-analysis',
                'advanced-export',
                'plugin-system',
                'query-optimizer',
              ],
            },
          };
        }
      }
      return { success: false, error: result.error };
    },

    getStatus: async () => {
      const result = await invoke<{
        success: boolean;
        status?: {
          isActive: boolean;
          activationDate?: string;
          licenseKey?: string;
          expiresAt?: string;
        };
        error?: string;
      }>('pro_get_status');
      if (result.success && result.status) {
        return {
          success: true,
          status: {
            isPro: result.status.isActive,
            licenseKey: result.status.licenseKey,
            activatedAt: result.status.activationDate,
            expiresAt: result.status.expiresAt,
            features: result.status.isActive
              ? [
                  'ai-nl-to-sql',
                  'ai-data-analysis',
                  'advanced-export',
                  'plugin-system',
                  'query-optimizer',
                ]
              : [],
          },
        };
      }
      return { success: false, error: result.error };
    },

    deactivate: async () => {
      return invoke<{ success: boolean; error?: string }>('pro_clear_status');
    },

    clearStatus: () =>
      invoke<{ success: boolean; error?: string }>('pro_clear_status'),
  },

  // File operations
  file: {
    write: (
      filePath: string,
      content: string,
      options?: { encoding?: string; atomic?: boolean }
    ) =>
      invoke<{ success: boolean; bytesWritten?: number; error?: string }>(
        'file_write',
        {
          request: {
            filePath,
            content,
            encoding: options?.encoding || 'utf8',
            atomic: options?.atomic !== false, // Default to atomic
          },
        }
      ),

    read: (filePath: string, options?: { encoding?: string }) =>
      invoke<{ success: boolean; content?: string; error?: string }>(
        'file_read',
        {
          request: {
            filePath,
            encoding: options?.encoding || 'utf8',
          },
        }
      ),
  },

  // File watcher operations
  fileWatcher: {
    watch: (connectionId: string, dbPath: string) =>
      invoke<{ success: boolean; error?: string }>('file_watcher_watch', {
        request: { connectionId, dbPath },
      }),

    unwatch: (connectionId: string) =>
      invoke<{ success: boolean; error?: string }>('file_watcher_unwatch', {
        request: { connectionId },
      }),

    ignore: (dbPath: string, durationMs = 1000) =>
      invoke<{ success: boolean; error?: string }>('file_watcher_ignore', {
        request: { dbPath, durationMs },
      }),
  },

  // Updates operations
  updates: {
    check: () =>
      invoke<{
        success: boolean;
        updateAvailable?: boolean;
        info?: {
          version: string;
          releaseDate?: string;
          releaseNotes?: string;
        };
        error?: string;
      }>('updates_check'),

    download: () =>
      invoke<{ success: boolean; error?: string }>('updates_download'),

    install: () =>
      invoke<{ success: boolean; error?: string }>('updates_install'),

    getStatus: () =>
      invoke<{
        success: boolean;
        status: {
          status: string;
          info?: {
            version: string;
            releaseDate?: string;
            releaseNotes?: string;
          };
          progress?: {
            percent: number;
            bytesPerSecond: number;
            total: number;
            transferred: number;
          };
          error?: string;
        };
      }>('updates_get_status'),
  },
};

// Export as default for compatibility
export default sqlProAPI;
