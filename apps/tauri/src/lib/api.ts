/**
 * SQL Pro API
 *
 * This module provides a unified API for the application.
 * In Tauri, it uses the invoke system instead of Electron's IPC.
 */

// ============ Type Definitions ============
// Import from shared types
import type {
  AIAgentMessage,
  AIStreamChunk,
  AnalyzeQueryPlanRequest,
  AnalyzeQueryPlanResponse,
  ApplyChangesRequest,
  ApplyChangesResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  CloseDatabaseRequest,
  CloseDatabaseResponse,
  CompareConnectionsResponse,
  CompareConnectionToSnapshotResponse,
  CompareSnapshotsResponse,
  CompareTablesResponse,
  ConnectionProfile,
  ExecuteQueryRequest,
  ExecuteQueryResponse,
  GetSchemaListRequest,
  GetSchemaListResponse,
  GetSchemaRequest,
  GetSchemaResponse,
  GetTableDataRequest,
  GetTableDataResponse,
  GetTableDetailsRequest,
  GetTableDetailsResponse,
  ImportQueryResponse,
  ImportSchemaResponse,
  MemoryPressureChangeEvent,
  MemoryPressureLevel,
  MemoryStats,
  MemoryStatsUpdateEvent,
  OpenDatabaseRequest,
  OpenDatabaseResponse,
  ProfileFolder,
  SchemaSnapshot,
  TestConnectionRequest,
  TestConnectionResponse,
  ValidateChangesRequest,
  ValidateChangesResponse,
} from '@shared/types';
import type { UnlistenFn } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open, save } from '@tauri-apps/plugin-dialog';
import { open as openShell } from '@tauri-apps/plugin-shell';

import { isMockMode, mockSqlProAPI } from './mock-api';

// ============ Helper Functions ============

// Convert camelCase to snake_case for Rust command names
// @ts-expect-error Reserved for future use
function _toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

// ============ SQL Pro API Implementation ============

const tauriAPI = {
  // Database operations
  db: {
    open: (request: OpenDatabaseRequest): Promise<OpenDatabaseResponse> =>
      invoke('db_open', { request }),

    close: (request: CloseDatabaseRequest): Promise<CloseDatabaseResponse> =>
      invoke('db_close', { request }),

    getSchema: (request: GetSchemaRequest): Promise<GetSchemaResponse> =>
      invoke('db_get_schema', { request }),

    getSchemaList: (
      request: GetSchemaListRequest
    ): Promise<GetSchemaListResponse> =>
      invoke('db_get_schema_list', { request }),

    getTableDetails: (
      request: GetTableDetailsRequest
    ): Promise<GetTableDetailsResponse> =>
      invoke('db_get_table_details', { request }),

    getTableData: (
      request: GetTableDataRequest
    ): Promise<GetTableDataResponse> =>
      invoke('db_get_table_data', { request }),

    executeQuery: (
      request: ExecuteQueryRequest
    ): Promise<ExecuteQueryResponse> => invoke('db_execute_query', { request }),

    validateChanges: (
      request: ValidateChangesRequest
    ): Promise<ValidateChangesResponse> =>
      invoke('db_validate_changes', { request }),

    applyChanges: (
      request: ApplyChangesRequest
    ): Promise<ApplyChangesResponse> => invoke('db_apply_changes', { request }),

    analyzeQueryPlan: (
      request: AnalyzeQueryPlanRequest
    ): Promise<AnalyzeQueryPlanResponse> =>
      invoke('db_analyze_plan', { request }),

    testConnection: (
      request: TestConnectionRequest
    ): Promise<TestConnectionResponse> =>
      invoke('db_test_connection', { request }),

    changePassword: (
      request: ChangePasswordRequest
    ): Promise<ChangePasswordResponse> =>
      invoke('db_change_password', { request }),

    // File change event listener
    onFileChanged: (
      callback: (event: { connectionId: string; path: string }) => void
    ): (() => void) => {
      let unlisten: UnlistenFn | undefined;
      let isCleanedUp = false;

      listen<{ connectionId: string; path: string }>(
        'db-file-changed',
        (event) => {
          callback(event.payload);
        }
      ).then((fn) => {
        if (isCleanedUp) {
          fn();
        } else {
          unlisten = fn;
        }
      });

      return () => {
        isCleanedUp = true;
        unlisten?.();
      };
    },
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

    showMessage: async (options: {
      type?: 'info' | 'warning' | 'error';
      title?: string;
      message: string;
      detail?: string;
    }) => {
      // Tauri uses the dialog plugin for messages
      // For now, just log - can implement proper dialog later
      console.warn(
        `[${options.type || 'info'}] ${options.title}: ${options.message}`
      );
      return { success: true };
    },

    writeFile: async (options: {
      filePath: string;
      content: string;
      atomic?: boolean;
    }) => {
      try {
        const { writeTextFile } = await import('@tauri-apps/plugin-fs');
        await writeTextFile(options.filePath, options.content);
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
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
      invoke<{ success: boolean; preferences?: unknown }>(
        'store_get_preferences'
      ),

    setPreferences: (preferences: unknown) =>
      invoke('store_set_preferences', { request: { preferences } }),

    getRecentConnections: () =>
      invoke<{ success: boolean; connections?: unknown[]; error?: string }>(
        'store_get_recent_connections'
      ),

    saveRecentConnection: (connection: unknown) =>
      invoke('store_save_recent_connection', { request: { connection } }),

    removeRecentConnection: (path: string) =>
      invoke<{ success: boolean; error?: string }>(
        'store_remove_recent_connection',
        { request: { path } }
      ),

    // Quit handling for Tauri
    onBeforeQuit: (callback: () => void): (() => void) => {
      let unlisten: UnlistenFn | undefined;
      let isCleanedUp = false;

      listen('before-quit', () => {
        callback();
      }).then((fn) => {
        if (isCleanedUp) {
          fn();
        } else {
          unlisten = fn;
        }
      });

      return () => {
        isCleanedUp = true;
        unlisten?.();
      };
    },

    confirmQuit: async (shouldQuit: boolean) => {
      if (shouldQuit) {
        // In Tauri, we close all windows to quit
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().close();
      }
      return { success: true };
    },
  },

  // Password storage operations
  password: {
    isAvailable: () =>
      invoke<{ success: boolean; available: boolean }>('password_is_available'),

    save: (request: {
      identifier?: string;
      dbPath?: string;
      password: string;
    }) =>
      invoke<{ success: boolean; error?: string }>('password_save', {
        request: {
          identifier: request.identifier || request.dbPath,
          password: request.password,
        },
      }),

    get: (request: { identifier?: string; dbPath?: string }) =>
      invoke<{ success: boolean; password?: string; error?: string }>(
        'password_get',
        {
          request: { identifier: request.identifier || request.dbPath },
        }
      ),

    has: (request: { identifier?: string; dbPath?: string }) =>
      invoke<{ success: boolean; hasPassword: boolean }>('password_has', {
        request: { identifier: request.identifier || request.dbPath },
      }),

    remove: (request: { identifier?: string; dbPath?: string }) =>
      invoke<{ success: boolean; error?: string }>('password_remove', {
        request: { identifier: request.identifier || request.dbPath },
      }),
  },

  // Query history operations
  history: {
    get: (request: string | { dbPath: string }) =>
      invoke<{ success: boolean; history?: unknown[] }>('history_get', {
        request: typeof request === 'string' ? { dbPath: request } : request,
      }),

    save: (request: { entry: unknown }) => invoke('history_save', { request }),

    delete: (
      request: string | { dbPath: string; entryId?: string },
      entryId?: string
    ) => {
      if (typeof request === 'string') {
        return invoke('history_delete', {
          request: { dbPath: request, entryId },
        });
      }
      return invoke('history_delete', { request });
    },

    clear: (request: string | { dbPath: string }) =>
      invoke('history_clear', {
        request: typeof request === 'string' ? { dbPath: request } : request,
      }),
  },

  // AI operations
  ai: {
    getSettings: () =>
      invoke<{
        success: boolean;
        settings?: {
          provider?: string;
          model?: string;
          apiKey?: string;
          baseUrl?: string;
          claudeCodeEnabled?: boolean;
          claudeCodePaths?: string[];
        };
        provider?: string;
        model?: string;
        apiKey?: string;
        baseUrl?: string;
        claudeCodeEnabled?: boolean;
        claudeCodePaths?: string[];
      }>('ai_get_settings'),

    saveSettings: (settings: unknown) =>
      invoke<{ success: boolean }>('ai_save_settings', {
        request: { settings },
      }),

    fetchCompletion: (request: unknown) =>
      invoke<{ success: boolean; completion?: string; error?: string }>(
        'ai_fetch_completion',
        { request }
      ),

    fetchAnthropic: (request: unknown) =>
      invoke<{
        success: boolean;
        completion?: string;
        content?: string;
        error?: string;
      }>('ai_fetch_anthropic', { request }),

    fetchOpenAI: (request: unknown) =>
      invoke<{
        success: boolean;
        completion?: string;
        content?: string;
        error?: string;
      }>('ai_fetch_openai', { request }),

    streamOpenAI: (request: unknown) =>
      invoke<{ success: boolean; streamId?: string; error?: string }>(
        'ai_stream_openai',
        { request }
      ),

    streamAnthropic: (request: unknown) =>
      invoke<{ success: boolean; streamId?: string; error?: string }>(
        'ai_stream_anthropic',
        { request }
      ),

    onStreamChunk: (callback: (chunk: AIStreamChunk) => void): (() => void) => {
      let unlisten: UnlistenFn | undefined;
      let isCleanedUp = false;

      listen<AIStreamChunk>('ai-stream-chunk', (event) => {
        callback(event.payload);
      }).then((fn) => {
        if (isCleanedUp) {
          fn();
        } else {
          unlisten = fn;
        }
      });

      return () => {
        isCleanedUp = true;
        unlisten?.();
      };
    },

    onAgentMessage: (
      callback: (message: AIAgentMessage) => void
    ): (() => void) => {
      let unlisten: UnlistenFn | undefined;
      let isCleanedUp = false;

      listen<AIAgentMessage>('ai-agent-message', (event) => {
        callback(event.payload);
      }).then((fn) => {
        if (isCleanedUp) {
          fn();
        } else {
          unlisten = fn;
        }
      });

      return () => {
        isCleanedUp = true;
        unlisten?.();
      };
    },

    agentQuery: (request: unknown) =>
      invoke<{ success: boolean; response?: string; error?: string }>(
        'ai_agent_query',
        { request }
      ),

    // Claude Code paths - returns empty array for now (can be extended later)
    getClaudeCodePaths: async () => ({
      success: true,
      paths: [] as string[],
    }),

    // Streaming support
    cancelStream: async (
      _request?: string | { requestId?: string; streamId?: string }
    ) => ({ success: true }),
    agentCancel: async (
      _request?: string | { requestId?: string; agentId?: string }
    ) => ({ success: true }),
  },

  // Window operations
  window: {
    create: () => invoke('window_create'),

    close: (windowId?: string) =>
      invoke('window_close', { request: windowId ? { windowId } : null }),

    getAll: () => invoke('window_get_all'),

    getCurrent: () => invoke('window_get_current'),
  },

  // Shortcuts (placeholder - can be extended)
  shortcuts: {
    getAll: async () => ({ success: true, shortcuts: {} }),
    register: async () => ({ success: true }),
    unregister: async () => ({ success: true }),
    update: async (_options: { shortcuts: Record<string, unknown> }) => ({
      success: true,
    }),
  },

  // SQL Log operations
  sqlLog: {
    get: (request?: {
      limit?: number;
      connectionId?: string;
      level?: string;
    }) =>
      invoke<{ success: boolean; logs?: unknown[] }>('sql_log_get', {
        request: request || {},
      }),
    clear: (request?: { connectionId?: string }) =>
      invoke<{ success: boolean }>('sql_log_clear', { request: request || {} }),
    onEntry: (callback: (entry: unknown) => void): (() => void) => {
      let unlisten: UnlistenFn | undefined;
      let isCleanedUp = false;

      listen<unknown>('sql-log-entry', (event) => {
        callback(event.payload);
      }).then((fn) => {
        // If cleanup was already requested before listen resolved, unlisten immediately
        if (isCleanedUp) {
          fn();
        } else {
          unlisten = fn;
        }
      });

      return () => {
        isCleanedUp = true;
        unlisten?.();
      };
    },
  },

  // Schema snapshot operations
  schemaSnapshot: {
    list: () =>
      invoke<{ success: boolean; snapshots?: SchemaSnapshot[] }>(
        'schema_get_snapshots'
      ),
    getAll: () =>
      invoke<{ success: boolean; snapshots?: SchemaSnapshot[] }>(
        'schema_get_snapshots'
      ),
    get: (snapshotId: string) =>
      invoke<{ success: boolean; snapshot?: SchemaSnapshot }>(
        'schema_get_snapshot',
        {
          request: { snapshotId },
        }
      ),
    create: (request: {
      name: string;
      description?: string;
      connectionPath?: string;
      connectionId?: string;
      schema?: unknown;
    }) =>
      invoke<{ success: boolean; snapshot?: SchemaSnapshot; error?: string }>(
        'schema_save_snapshot',
        {
          request,
        }
      ),
    save: (request: {
      name: string;
      description?: string;
      connectionPath?: string;
      connectionId?: string;
      schema?: unknown;
    }) =>
      invoke<{ success: boolean; snapshot?: SchemaSnapshot; error?: string }>(
        'schema_save_snapshot',
        {
          request,
        }
      ),
    delete: (snapshotId: string) =>
      invoke<{ success: boolean }>('schema_delete_snapshot', {
        request: { snapshotId },
      }),
  },

  // Schema comparison
  comparison: {
    compareSnapshots: (
      sourceSnapshotIdOrRequest:
        | string
        | { sourceSnapshotId: string; targetSnapshotId: string },
      targetSnapshotId?: string
    ) => {
      const request =
        typeof sourceSnapshotIdOrRequest === 'string'
          ? {
              sourceSnapshotId: sourceSnapshotIdOrRequest,
              targetSnapshotId: targetSnapshotId!,
            }
          : sourceSnapshotIdOrRequest;
      return invoke<CompareSnapshotsResponse>('schema_compare_snapshots', {
        request,
      });
    },
    compareConnections: (
      sourceConnectionIdOrRequest:
        | string
        | { sourceConnectionId: string; targetConnectionId: string },
      targetConnectionId?: string
    ) => {
      const request =
        typeof sourceConnectionIdOrRequest === 'string'
          ? {
              sourceConnectionId: sourceConnectionIdOrRequest,
              targetConnectionId: targetConnectionId!,
            }
          : sourceConnectionIdOrRequest;
      return invoke<CompareConnectionsResponse>('schema_compare_connections', {
        request,
      });
    },
    compareConnectionToSnapshot: (
      connectionIdOrRequest:
        | string
        | { connectionId: string; snapshotId: string; reverse?: boolean },
      snapshotId?: string
    ) => {
      const request =
        typeof connectionIdOrRequest === 'string'
          ? { connectionId: connectionIdOrRequest, snapshotId: snapshotId! }
          : connectionIdOrRequest;
      return invoke<CompareConnectionToSnapshotResponse>(
        'schema_compare_connection_to_snapshot',
        { request }
      );
    },
    compareTables: (request: unknown) =>
      invoke<CompareTablesResponse>('table_compare', {
        request,
      }),
    compare: (
      sourceIdOrRequest: string | { sourceId: string; targetId: string },
      targetId?: string
    ) => {
      const request =
        typeof sourceIdOrRequest === 'string'
          ? { sourceId: sourceIdOrRequest, targetId: targetId! }
          : sourceIdOrRequest;
      return invoke<{
        success: boolean;
        comparison?: unknown;
        result?: unknown;
        error?: string;
      }>('schema_compare', { request });
    },
  },

  // Migration
  migration: {
    generateSql: (request: unknown) =>
      invoke<{ success: boolean; sql?: string }>('migration_generate_sql', {
        request,
      }),
    generateSyncSql: (request: unknown) =>
      invoke<{ success: boolean; sql?: string }>(
        'migration_generate_sync_sql',
        {
          request,
        }
      ),
  },

  // Bundle/file operations
  bundle: {
    exportBundle: (request: unknown) =>
      invoke<{ success: boolean; data?: string }>('export_bundle', { request }),
    importBundle: (data: string) =>
      invoke<{ success: boolean; queries?: unknown[]; schemas?: unknown[] }>(
        'import_bundle',
        { request: { data } }
      ),
    importSchema: (data: string) =>
      invoke<{ success: boolean; schemas?: unknown[] }>('import_schema', {
        request: { data },
      }),
  },

  // Sharing operations
  sharing: {
    exportQuery: (request: unknown) =>
      invoke<{
        success: boolean;
        data?: string;
        filePath?: string;
        error?: string;
      }>('sharing_export_query', { request }),
    importQuery: (request: unknown) =>
      invoke<ImportQueryResponse>('sharing_import_query', { request }),
    exportQueryBundle: (request: unknown) =>
      invoke<{
        success: boolean;
        data?: string;
        filePath?: string;
        error?: string;
      }>('sharing_export_query_bundle', { request }),
    exportBundle: (request: unknown) =>
      invoke<{
        success: boolean;
        data?: string;
        filePath?: string;
        error?: string;
      }>('sharing_export_bundle', { request }),
    exportSchema: (request: unknown) =>
      invoke<{
        success: boolean;
        data?: string;
        filePath?: string;
        error?: string;
      }>('sharing_export_schema', { request }),
    importSchema: (request: unknown) =>
      invoke<ImportSchemaResponse>('sharing_import_schema', { request }),
  },

  // Schema comparison operations
  schemaComparison: {
    compare: (request: unknown) =>
      invoke<{ success: boolean; comparison?: unknown; error?: string }>(
        'schema_compare',
        { request }
      ),
    generateMigration: (request: unknown) =>
      invoke<{ success: boolean; sql?: string; error?: string }>(
        'schema_generate_migration',
        { request }
      ),
    generateMigrationSQL: (request: unknown) =>
      invoke<{ success: boolean; sql?: string; error?: string }>(
        'schema_generate_migration',
        { request }
      ),
    exportReport: (request: unknown) =>
      invoke<{
        success: boolean;
        data?: string;
        filePath?: string;
        error?: string;
      }>('schema_export_report', { request }),
  },

  // Data diff operations
  dataDiff: {
    compare: (request: unknown) =>
      invoke<{ success: boolean; diffs?: unknown[]; error?: string }>(
        'data_diff_compare',
        { request }
      ),
    generateSyncSQL: (request: unknown) =>
      invoke<{ success: boolean; sql?: string; error?: string }>(
        'data_diff_generate_sync_sql',
        { request }
      ),
  },

  // Pro features
  pro: {
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
        const features = result.status.isActive
          ? [
              'ai-nl-to-sql',
              'ai-data-analysis',
              'advanced-export',
              'plugin-system',
              'query-optimizer',
            ]
          : [];
        return {
          success: true,
          isProUser: result.status.isActive,
          isPro: result.status.isActive,
          features,
          status: {
            isPro: result.status.isActive,
            licenseKey: result.status.licenseKey,
            activatedAt: result.status.activationDate,
            expiresAt: result.status.expiresAt,
            features,
          },
          licenseKey: result.status.licenseKey,
          activatedAt: result.status.activationDate,
          expiresAt: result.status.expiresAt,
        };
      }
      return {
        success: result.success,
        isProUser: false,
        isPro: false,
        features: [] as string[],
        status: {
          isPro: false,
          licenseKey: undefined as string | undefined,
          activatedAt: undefined as string | undefined,
          expiresAt: undefined as string | undefined,
          features: [] as string[],
        },
        licenseKey: undefined as string | undefined,
        activatedAt: undefined as string | undefined,
        expiresAt: undefined as string | undefined,
      };
    },
    activate: async (request: string | { licenseKey: string }) => {
      const licenseKey =
        typeof request === 'string' ? request : request.licenseKey;
      const result = await invoke<{ success: boolean; error?: string }>(
        'pro_activate',
        { request: { licenseKey } }
      );

      if (result.success) {
        // Fetch the updated status
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
          const features = [
            'ai-nl-to-sql',
            'ai-data-analysis',
            'advanced-export',
            'plugin-system',
            'query-optimizer',
          ];
          return {
            success: true,
            status: {
              isPro: statusResult.status.isActive,
              licenseKey: statusResult.status.licenseKey,
              activatedAt: statusResult.status.activationDate,
              expiresAt: statusResult.status.expiresAt,
              features,
            },
            error: undefined as string | undefined,
          };
        }
      }
      return {
        success: false,
        status: {
          isPro: false,
          licenseKey: undefined as string | undefined,
          activatedAt: undefined as string | undefined,
          expiresAt: undefined as string | undefined,
          features: [] as string[],
        },
        error: result.error,
      };
    },
    deactivate: async () => {
      return invoke<{ success: boolean; error?: string }>('pro_clear_status');
    },
  },

  // Memory monitoring
  memory: {
    getStats: () =>
      invoke<{
        success: boolean;
        stats: MemoryStats;
        pressureLevel?: MemoryPressureLevel;
        error?: string;
      }>('memory_get_stats'),
    subscribe: (request?: { intervalMs?: number }) =>
      invoke<{ success: boolean; subscriptionId?: string; error?: string }>(
        'memory_subscribe',
        { request: request ?? {} }
      ),
    unsubscribe: (request: { subscriptionId: string }) =>
      invoke<{ success: boolean; error?: string }>('memory_unsubscribe', {
        request,
      }),
    triggerGC: (request?: { aggressive?: boolean; force?: boolean }) =>
      invoke<{
        success: boolean;
        error?: string;
        statsAfterGC?: MemoryStats;
        gcTriggered?: boolean;
      }>('memory_trigger_gc', {
        request: request ?? {},
      }),
    onStatsUpdate: (
      callback: (event: MemoryStatsUpdateEvent) => void
    ): (() => void) => {
      let unlisten: UnlistenFn | undefined;
      let isCleanedUp = false;

      listen<MemoryStatsUpdateEvent>('memory-stats-update', (event) => {
        callback(event.payload);
      }).then((fn) => {
        if (isCleanedUp) {
          fn();
        } else {
          unlisten = fn;
        }
      });

      return () => {
        isCleanedUp = true;
        unlisten?.();
      };
    },
    onPressureChange: (
      callback: (event: MemoryPressureChangeEvent) => void
    ): (() => void) => {
      let unlisten: UnlistenFn | undefined;
      let isCleanedUp = false;

      listen<MemoryPressureChangeEvent>('memory-pressure-change', (event) => {
        callback(event.payload);
      }).then((fn) => {
        if (isCleanedUp) {
          fn();
        } else {
          unlisten = fn;
        }
      });

      return () => {
        isCleanedUp = true;
        unlisten?.();
      };
    },
  },

  // Unsaved changes tracking (handled via check_unsaved_changes)
  unsavedChanges: {
    check: (connectionId?: string) =>
      invoke<{ success: boolean; hasChanges: boolean }>(
        'check_unsaved_changes',
        {
          request: { connectionId },
        }
      ),
    // Frontend-managed state
    set: async () => ({ success: true }),
    get: async () => ({ success: true, hasChanges: false }),
    clear: async () => ({ success: true }),
  },

  // System operations
  system: {
    focusWindow: (windowId?: string) =>
      invoke<{ success: boolean }>('system_focus_window', {
        request: { windowId },
      }),
  },

  // Connection profiles
  profile: {
    getAll: (request?: { folderId?: string }) =>
      invoke<{
        success: boolean;
        profiles?: ConnectionProfile[];
        error?: string;
      }>('profiles_get', { request: request ?? {} }),
    save: (request: unknown) =>
      invoke<{
        success: boolean;
        profile?: ConnectionProfile;
        error?: string;
      }>('profiles_save', {
        request,
      }),
    update: (request: {
      id: string;
      name?: string;
      readOnly?: boolean;
      config?: unknown;
      updates?: unknown;
    }) =>
      invoke<{
        success: boolean;
        profile?: ConnectionProfile;
        error?: string;
      }>('profiles_update', {
        request,
      }),
    delete: (request: string | { id: string; removePassword?: boolean }) =>
      invoke<{ success: boolean; error?: string }>('profiles_delete', {
        request: typeof request === 'string' ? { id: request } : request,
      }),
    export: (request: { profileIds?: string[]; folderIds?: string[] }) =>
      invoke<{ success: boolean; data?: string; error?: string }>(
        'profiles_export',
        {
          request,
        }
      ),
    import: (request: { data?: string; filePath?: string; merge?: boolean }) =>
      invoke<{
        success: boolean;
        profiles?: ConnectionProfile[];
        error?: string;
      }>('profiles_import', {
        request,
      }),
  },

  // Connection operations
  connection: {
    update: (request: unknown) =>
      invoke<{ success: boolean; error?: string }>('connection_update', {
        request,
      }),
    remove: (request: { path: string; removePassword?: boolean }) =>
      invoke<{ success: boolean; error?: string }>('connection_remove', {
        request,
      }),
  },

  // Folder operations
  folder: {
    getAll: (request?: { parentId?: string }) =>
      invoke<{ success: boolean; folders?: ProfileFolder[]; error?: string }>(
        'folders_get',
        {
          request: request ?? {},
        }
      ),
    create: (request: { name?: string; alias?: string; parentId?: string }) =>
      invoke<{ success: boolean; folder?: ProfileFolder; error?: string }>(
        'folders_save',
        {
          request,
        }
      ),
    update: (request: {
      id?: string;
      path?: string;
      name?: string;
      alias?: string;
      updates?: unknown;
    }) =>
      invoke<{ success: boolean; folder?: ProfileFolder; error?: string }>(
        'folders_update',
        {
          request,
        }
      ),
    delete: (request: string | { id: string }) =>
      invoke<{ success: boolean; error?: string }>('folders_delete', {
        request: typeof request === 'string' ? { id: request } : request,
      }),
  },

  // File operations
  file: {
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
            atomic: options?.atomic !== false,
          },
        }
      ),
    watch: async () => ({ success: true }),
    unwatch: async () => ({ success: true }),
    exists: async (request: string | { path: string }) => {
      const path = typeof request === 'string' ? request : request.path;
      return invoke<{ success: boolean; exists: boolean }>('file_exists', {
        request: { path },
      }).catch(() => ({ success: true, exists: false }));
    },
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

  // Plugin operations
  plugin: {
    list: async () => {
      const result = await invoke<{
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
      }>('plugins_list');
      return {
        success: result.success,
        plugins: result.plugins || [],
        registry: result.plugins || [],
        error: undefined as string | undefined,
      };
    },
    install: async (request?: unknown) => {
      const req = request as {
        manifest?: { id: string; name: string; version: string; main: string };
        path?: string;
      };
      if (!req?.manifest || !req?.path) {
        return { success: false, error: 'Missing manifest or path' };
      }
      return invoke<{ success: boolean; error?: string }>('plugins_install', {
        request: { manifest: req.manifest, path: req.path },
      });
    },
    uninstall: async (request?: unknown) => {
      const pluginId =
        typeof request === 'string'
          ? request
          : (request as { pluginId?: string })?.pluginId;
      if (!pluginId) {
        return { success: false, error: 'Missing plugin ID' };
      }
      return invoke<{ success: boolean; error?: string }>('plugins_uninstall', {
        request: { pluginId },
      });
    },
    enable: async (request?: unknown) => {
      const pluginId =
        typeof request === 'string'
          ? request
          : (request as { pluginId?: string })?.pluginId;
      if (!pluginId) {
        return { success: false, error: 'Missing plugin ID' };
      }
      return invoke<{ success: boolean; error?: string }>('plugins_enable', {
        request: { pluginId },
      });
    },
    disable: async (request?: unknown) => {
      const pluginId =
        typeof request === 'string'
          ? request
          : (request as { pluginId?: string })?.pluginId;
      if (!pluginId) {
        return { success: false, error: 'Missing plugin ID' };
      }
      return invoke<{ success: boolean; error?: string }>('plugins_disable', {
        request: { pluginId },
      });
    },
    fetchMarketplace: async () => ({
      success: true,
      plugins: [] as unknown[],
      registry: { plugins: [] as unknown[] },
      error: undefined as string | undefined,
    }),
    onEvent: (_callback: (event: unknown) => void) => () => {},
  },

  // Plugin API (direct access to plugin commands)
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

  // Menu operations
  menu: {
    onAction: (callback: (action: string) => void): (() => void) => {
      let unlisten: UnlistenFn | undefined;
      let isCleanedUp = false;

      listen<string>('menu-action', (event) => {
        callback(event.payload);
      }).then((fn) => {
        if (isCleanedUp) {
          fn();
        } else {
          unlisten = fn;
        }
      });

      return () => {
        isCleanedUp = true;
        unlisten?.();
      };
    },
    updateShortcuts: (shortcuts: Record<string, string>) =>
      invoke<{ success: boolean; error?: string }>('menu_update_shortcuts', {
        request: { shortcuts },
      }),
  },

  // Renderer store (for persistence)
  rendererStore: {
    get: (request: { key: string }) =>
      invoke<{ success: boolean; data?: unknown }>('renderer_store_get', {
        request,
      }),
    set: (request: { key: string; value: unknown }) =>
      invoke<{ success: boolean }>('renderer_store_set', { request }),
    update: (request: { key: string; updates: unknown }) =>
      invoke<{ success: boolean }>('renderer_store_update', { request }),
    delete: (request: { key: string }) =>
      invoke<{ success: boolean }>('renderer_store_delete', { request }),
    reset: (request: { key: string }) =>
      invoke<{ success: boolean }>('renderer_store_reset', { request }),
  },

  // Schema operations
  schema: {
    get: (connectionId: string) =>
      invoke('db_get_schema', { request: { connectionId } }),

    getList: (connectionId: string) =>
      invoke('db_get_schema_list', { request: { connectionId } }),
  },

  // Update operations
  update: {
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
          error?: string;
        };
      }>('updates_get_status'),
  },

  // Update operations (alias for compatibility)
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
          error?: string;
        };
      }>('updates_get_status'),
  },

  // Font operations
  fonts: {
    getSystemFonts: () =>
      invoke<{
        success: boolean;
        fonts: Array<{ name: string; category: string }>;
      }>('get_system_fonts'),
  },
};

// Get the appropriate API based on mode
const getAPI = (): typeof tauriAPI => {
  if (isMockMode()) {
    return mockSqlProAPI as typeof tauriAPI;
  }
  return tauriAPI;
};

// Create a lazy proxy that defers API resolution
export const sqlPro: typeof tauriAPI = new Proxy({} as typeof tauriAPI, {
  get(_target, prop: string) {
    const api = getAPI();
    const value = api[prop as keyof typeof tauriAPI];
    // If the property is an object (like db, dialog, etc.), wrap it in a proxy too
    if (typeof value === 'object' && value !== null) {
      return new Proxy(value, {
        get(_t, p: string) {
          return (
            getAPI()[prop as keyof typeof tauriAPI] as Record<string, unknown>
          )[p];
        },
      });
    }
    return value;
  },
});

// Export for direct access when needed
export { tauriAPI };
