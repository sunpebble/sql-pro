import type {
  AnalyzeQueryPlanRequest,
  AnalyzeQueryPlanResponse,
  ApplyChangesRequest,
  ApplyChangesResponse,
  BatchVectorSearchRequest,
  BatchVectorSearchResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  CheckUnsavedChangesRequest,
  CheckUnsavedChangesResponse,
  ClearQueryHistoryRequest,
  ClearQueryHistoryResponse,
  ClearSqlLogsRequest,
  ClearSqlLogsResponse,
  CloseDatabaseRequest,
  CloseDatabaseResponse,
  CloseWindowRequest,
  CloseWindowResponse,
  CompareConnectionsRequest,
  CompareConnectionsResponse,
  CompareConnectionToSnapshotRequest,
  CompareConnectionToSnapshotResponse,
  CompareSnapshotsRequest,
  CompareSnapshotsResponse,
  CompareTablesRequest,
  CompareTablesResponse,
  CreateBackupRequest,
  CreateBackupResponse,
  CreateFolderRequest,
  CreateFolderResponse,
  CreateWindowResponse,
  DatabaseConnectionIdRequest,
  DatabaseMaintenanceResponse,
  DeleteBackupRequest,
  DeleteBackupResponse,
  DeleteFolderRequest,
  DeleteFolderResponse,
  DeleteProfileRequest,
  DeleteProfileResponse,
  DeleteQueryHistoryRequest,
  DeleteQueryHistoryResponse,
  DeleteSchemaSnapshotRequest,
  DeleteSchemaSnapshotResponse,
  ExecuteQueryRequest,
  ExecuteQueryResponse,
  ExportBundleRequest,
  ExportBundleResponse,
  ExportComparisonReportRequest,
  ExportComparisonReportResponse,
  ExportProfilesRequest,
  ExportProfilesResponse,
  ExportQueryRequest,
  ExportQueryResponse,
  ExportRequest,
  ExportResponse,
  ExportSchemaRequest,
  ExportSchemaResponse,
  FileChangeEvent,
  FileExistsRequest,
  FileExistsResponse,
  FocusWindowRequest,
  FocusWindowResponse,
  GenerateMigrationSQLRequest,
  GenerateMigrationSQLResponse,
  GenerateSyncSQLRequest,
  GenerateSyncSQLResponse,
  GetAllWindowsResponse,
  GetColumnDistributionRequest,
  GetColumnDistributionResponse,
  GetCurrentWindowResponse,
  GetDatabaseStatsResponse,
  GetFoldersRequest,
  GetFoldersResponse,
  GetMemoryStatsRequest,
  GetMemoryStatsResponse,
  GetPasswordRequest,
  GetPasswordResponse,
  GetPointsWithVectorsRequest,
  GetPointsWithVectorsResponse,
  GetPreferencesResponse,
  GetProfilesRequest,
  GetProfilesResponse,
  GetQueryHistoryRequest,
  GetQueryHistoryResponse,
  GetRecentConnectionsResponse,
  GetSchemaListRequest,
  GetSchemaListResponse,
  GetSchemaRequest,
  GetSchemaResponse,
  GetSchemaSnapshotRequest,
  GetSchemaSnapshotResponse,
  GetSchemaSnapshotsResponse,
  GetSqlLogsRequest,
  GetSqlLogsResponse,
  GetTableDataRequest,
  GetTableDataResponse,
  GetTableDetailsRequest,
  GetTableDetailsResponse,
  GetTableRowRangeRequest,
  GetTableRowRangeResponse,
  HasPasswordRequest,
  HasPasswordResponse,
  ImageCheckFileResponse,
  ImageCheckUrlResponse,
  ImageGetCacheStatsResponse,
  ImageGetFileMetadataResponse,
  ImageGetMetadataResponse,
  ImageValidateUrlResponse,
  ImportBundleRequest,
  ImportBundleResponse,
  ImportProfilesRequest,
  ImportProfilesResponse,
  ImportQueryRequest,
  ImportQueryResponse,
  ImportSchemaRequest,
  ImportSchemaResponse,
  IsPasswordStorageAvailableResponse,
  ListBackupsRequest,
  ListBackupsResponse,
  MemoryPressureChangeEvent,
  MemoryStatsUpdateEvent,
  MemorySubscribeRequest,
  MemorySubscribeResponse,
  MemoryTriggerGCRequest,
  MemoryTriggerGCResponse,
  MemoryUnsubscribeRequest,
  MemoryUnsubscribeResponse,
  MenuAction,
  OpenDatabaseRequest,
  OpenDatabaseResponse,
  OpenExternalRequest,
  OpenExternalResponse,
  OpenFileDialogRequest,
  OpenFileDialogResponse,
  ProActivateRequest,
  ProActivateResponse,
  ProDeactivateResponse,
  ProGetStatusResponse,
  RemoveConnectionRequest,
  RemoveConnectionResponse,
  RemovePasswordRequest,
  RemovePasswordResponse,
  RestoreBackupRequest,
  RestoreBackupResponse,
  SaveFileDialogRequest,
  SaveFileDialogResponse,
  SavePasswordRequest,
  SavePasswordResponse,
  SaveProfileRequest,
  SaveProfileResponse,
  SaveQueryHistoryRequest,
  SaveQueryHistoryResponse,
  SaveSchemaSnapshotRequest,
  SaveSchemaSnapshotResponse,
  SearchSimilarRequest,
  SearchSimilarResponse,
  SetPreferencesRequest,
  SetPreferencesResponse,
  ShortcutsUpdatePayload,
  ShowItemInFolderRequest,
  ShowItemInFolderResponse,
  SqlLogEntry,
  SSHCloseTunnelResponse,
  SSHCredentialsInput,
  SSHGetCredentialsResponse,
  SSHGetTunnelStatusResponse,
  SSHHasCredentialsResponse,
  SSHHasTunnelResponse,
  SSHRemoveCredentialsResponse,
  SSHSaveCredentialsResponse,
  SSHTestConnectionResponse,
  SSHTunnelIpcConfig,
  TestConnectionRequest,
  TestConnectionResponse,
  UpdateConnectionRequest,
  UpdateConnectionResponse,
  UpdateFolderRequest,
  UpdateFolderResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  ValidateChangesRequest,
  ValidateChangesResponse,
  VectorSearchRequest,
  VectorSearchResponse,
  VideoCheckFileResponse,
  VideoCheckUrlResponse,
  VideoGetMetadataResponse,
  VideoValidateUrlResponse,
  WriteFileRequest,
  WriteFileResponse,
} from '@shared/types';
import type {
  AgentSettings,
  ChatSendResponse,
  GetHistoryResponse,
  GetSessionsResponse,
  GetSettingsResponse,
  NLExplainSQLResponse,
  NLGenerateSQLResponse,
  NLOptimizeSQLResponse,
  SaveSettingsResponse,
} from '@shared/types/agent';
import type {
  CheckUpdatesRequest,
  CheckUpdatesResponse,
  DisablePluginRequest,
  DisablePluginResponse,
  EnablePluginRequest,
  EnablePluginResponse,
  FetchMarketplaceRequest,
  FetchMarketplaceResponse,
  GetPluginRequest,
  GetPluginResponse,
  InstallPluginRequest,
  InstallPluginResponse,
  ListPluginsRequest,
  ListPluginsResponse,
  PluginEvent,
  UninstallPluginRequest,
  UninstallPluginResponse,
  UpdatePluginRequest,
  UpdatePluginResponse,
} from '@shared/types/plugin.d';
import type {
  GetRendererStateRequest,
  GetRendererStateResponse,
  RendererStoreSchema,
  ResetRendererStateRequest,
  SetRendererStateRequest,
  SetRendererStateResponse,
  UpdateRendererStateRequest,
  UpdateRendererStateResponse,
} from '@shared/types/renderer-store';
import type { UIMessage } from 'ai';
import { IPC_CHANNELS } from '@shared/types';
import { AGENT_IPC_CHANNELS } from '@shared/types/agent';
import { RENDERER_STORE_CHANNELS } from '@shared/types/renderer-store';

/** IPC bridge injected by Electron preload or web mocks. */
export interface SqlProApiDeps {
  /** Returns channel-typed payloads; typed in each method body via ipcRenderer in preload. */
  invoke: (channel: string, ...args: unknown[]) => any;
  /** Matches Electron `IpcRenderer.on` listener arity. */
  on: (channel: string, listener: (...args: any[]) => void) => void;
  off: (channel: string, listener: (...args: any[]) => void) => void;
  getPathForFile: (file: File) => string;
}

/** Platform-agnostic factory: Electron preload passes ipcRenderer + webUtils. */
export function createSqlProAPI(deps: SqlProApiDeps) {
  const { invoke, on, off, getPathForFile } = deps;

  const updateNamespace = {
    check: (silent = true): Promise<{ success: boolean; error?: string }> =>
      invoke(IPC_CHANNELS.UPDATE_CHECK, silent),
    download: (): Promise<{ success: boolean; error?: string }> =>
      invoke(IPC_CHANNELS.UPDATE_DOWNLOAD),
    install: (): Promise<{ success: boolean; error?: string }> =>
      invoke(IPC_CHANNELS.UPDATE_INSTALL),
  };

  const systemNamespace = {
    showItemInFolder: (
      request: ShowItemInFolderRequest
    ): Promise<ShowItemInFolderResponse> =>
      invoke(IPC_CHANNELS.SYSTEM_SHOW_ITEM_IN_FOLDER, request),
    openExternal: (
      request: OpenExternalRequest
    ): Promise<OpenExternalResponse> =>
      invoke(IPC_CHANNELS.SYSTEM_OPEN_EXTERNAL, request),
  };

  const pluginNamespace = {
    list: (request?: ListPluginsRequest): Promise<ListPluginsResponse> =>
      invoke(IPC_CHANNELS.PLUGIN_LIST, request || {}),
    get: (request: GetPluginRequest): Promise<GetPluginResponse> =>
      invoke(IPC_CHANNELS.PLUGIN_GET, request),
    install: (request: InstallPluginRequest): Promise<InstallPluginResponse> =>
      invoke(IPC_CHANNELS.PLUGIN_INSTALL, request),
    uninstall: (
      request: UninstallPluginRequest
    ): Promise<UninstallPluginResponse> =>
      invoke(IPC_CHANNELS.PLUGIN_UNINSTALL, request),
    enable: (request: EnablePluginRequest): Promise<EnablePluginResponse> =>
      invoke(IPC_CHANNELS.PLUGIN_ENABLE, request),
    disable: (request: DisablePluginRequest): Promise<DisablePluginResponse> =>
      invoke(IPC_CHANNELS.PLUGIN_DISABLE, request),
    update: (request: UpdatePluginRequest): Promise<UpdatePluginResponse> =>
      invoke(IPC_CHANNELS.PLUGIN_UPDATE, request),
    fetchMarketplace: (
      request?: FetchMarketplaceRequest
    ): Promise<FetchMarketplaceResponse> =>
      invoke(IPC_CHANNELS.PLUGIN_FETCH_MARKETPLACE, request || {}),
    checkUpdates: (
      request: CheckUpdatesRequest
    ): Promise<CheckUpdatesResponse> =>
      invoke(IPC_CHANNELS.PLUGIN_CHECK_UPDATES, request),
    onEvent: (callback: (event: PluginEvent) => void): (() => void) => {
      const handler = (_event: unknown, pluginEvent: PluginEvent) =>
        callback(pluginEvent);
      on(IPC_CHANNELS.PLUGIN_EVENT, handler);
      return () => off(IPC_CHANNELS.PLUGIN_EVENT, handler);
    },
  };

  return {
    // Database operations
    db: {
      open: (request: OpenDatabaseRequest): Promise<OpenDatabaseResponse> =>
        invoke(IPC_CHANNELS.DB_OPEN, request),
      close: (request: CloseDatabaseRequest): Promise<CloseDatabaseResponse> =>
        invoke(IPC_CHANNELS.DB_CLOSE, request),
      getSchema: (request: GetSchemaRequest): Promise<GetSchemaResponse> =>
        invoke(IPC_CHANNELS.DB_GET_SCHEMA, request),
      getSchemaList: (
        request: GetSchemaListRequest
      ): Promise<GetSchemaListResponse> =>
        invoke(IPC_CHANNELS.DB_GET_SCHEMA_LIST, request),
      getTableDetails: (
        request: GetTableDetailsRequest
      ): Promise<GetTableDetailsResponse> =>
        invoke(IPC_CHANNELS.DB_GET_TABLE_DETAILS, request),
      getTableData: (
        request: GetTableDataRequest
      ): Promise<GetTableDataResponse> =>
        invoke(IPC_CHANNELS.DB_GET_TABLE_DATA, request),
      getTableRowRange: (
        request: GetTableRowRangeRequest
      ): Promise<GetTableRowRangeResponse> =>
        invoke(IPC_CHANNELS.DB_GET_TABLE_ROW_RANGE, request),
      executeQuery: (
        request: ExecuteQueryRequest
      ): Promise<ExecuteQueryResponse> =>
        invoke(IPC_CHANNELS.DB_EXECUTE_QUERY, request),
      validateChanges: (
        request: ValidateChangesRequest
      ): Promise<ValidateChangesResponse> =>
        invoke(IPC_CHANNELS.DB_VALIDATE_CHANGES, request),
      applyChanges: (
        request: ApplyChangesRequest
      ): Promise<ApplyChangesResponse> =>
        invoke(IPC_CHANNELS.DB_APPLY_CHANGES, request),
      analyzeQueryPlan: (
        request: AnalyzeQueryPlanRequest
      ): Promise<AnalyzeQueryPlanResponse> =>
        invoke(IPC_CHANNELS.DB_ANALYZE_PLAN, request),
      testConnection: (
        request: TestConnectionRequest
      ): Promise<TestConnectionResponse> =>
        invoke(IPC_CHANNELS.DB_TEST_CONNECTION, request),
      changePassword: (
        request: ChangePasswordRequest
      ): Promise<ChangePasswordResponse> =>
        invoke(IPC_CHANNELS.DB_CHANGE_PASSWORD, request),
      getColumnDistribution: (
        request: GetColumnDistributionRequest
      ): Promise<GetColumnDistributionResponse> =>
        invoke(IPC_CHANNELS.TABLE_GET_COLUMN_DISTRIBUTION, request),
      // Qdrant Vector Search operations
      vectorSearch: (
        request: VectorSearchRequest
      ): Promise<VectorSearchResponse> =>
        invoke(IPC_CHANNELS.DB_VECTOR_SEARCH, request),
      batchVectorSearch: (
        request: BatchVectorSearchRequest
      ): Promise<BatchVectorSearchResponse> =>
        invoke(IPC_CHANNELS.DB_BATCH_VECTOR_SEARCH, request),
      searchSimilar: (
        request: SearchSimilarRequest
      ): Promise<SearchSimilarResponse> =>
        invoke(IPC_CHANNELS.DB_SEARCH_SIMILAR, request),
      getPointsWithVectors: (
        request: GetPointsWithVectorsRequest
      ): Promise<GetPointsWithVectorsResponse> =>
        invoke(IPC_CHANNELS.DB_GET_POINTS_WITH_VECTORS, request),
      onFileChanged: (
        callback: (event: FileChangeEvent) => void
      ): (() => void) => {
        const handler = (_event: unknown, fileChangeEvent: FileChangeEvent) =>
          callback(fileChangeEvent);
        on(IPC_CHANNELS.DB_FILE_CHANGED, handler);
        return () => off(IPC_CHANNELS.DB_FILE_CHANGED, handler);
      },
    },

    // Dialog operations
    dialog: {
      openFile: (
        request?: OpenFileDialogRequest
      ): Promise<OpenFileDialogResponse> =>
        invoke(IPC_CHANNELS.DIALOG_OPEN_FILE, request || {}),
      saveFile: (
        request?: SaveFileDialogRequest
      ): Promise<SaveFileDialogResponse> =>
        invoke(IPC_CHANNELS.DIALOG_SAVE_FILE, request || {}),
      writeFile: (request: WriteFileRequest): Promise<WriteFileResponse> =>
        invoke(IPC_CHANNELS.FILE_WRITE, request),
    },

    // Export operations
    export: {
      data: (request: ExportRequest): Promise<ExportResponse> =>
        invoke(IPC_CHANNELS.EXPORT_DATA, request),
    },

    // Backup operations
    backup: {
      create: (request: CreateBackupRequest): Promise<CreateBackupResponse> =>
        invoke(IPC_CHANNELS.BACKUP_CREATE, request),
      restore: (
        request: RestoreBackupRequest
      ): Promise<RestoreBackupResponse> =>
        invoke(IPC_CHANNELS.BACKUP_RESTORE, request),
      list: (request: ListBackupsRequest): Promise<ListBackupsResponse> =>
        invoke(IPC_CHANNELS.BACKUP_LIST, request),
      delete: (request: DeleteBackupRequest): Promise<DeleteBackupResponse> =>
        invoke(IPC_CHANNELS.BACKUP_DELETE, request),
    },

    // App operations
    app: {
      getRecentConnections: (): Promise<GetRecentConnectionsResponse> =>
        invoke(IPC_CHANNELS.APP_GET_RECENT_CONNECTIONS),
      getPreferences: (): Promise<GetPreferencesResponse> =>
        invoke(IPC_CHANNELS.APP_GET_PREFERENCES),
      setPreferences: (
        request: SetPreferencesRequest
      ): Promise<SetPreferencesResponse> =>
        invoke(IPC_CHANNELS.APP_SET_PREFERENCES, request),
      onBeforeQuit: (callback: () => void): (() => void) => {
        const handler = (_event: unknown) => callback();
        on(IPC_CHANNELS.PREVENT_QUIT, handler);
        return () => off(IPC_CHANNELS.PREVENT_QUIT, handler);
      },
      confirmQuit: (shouldQuit: boolean): Promise<{ success: boolean }> =>
        invoke(IPC_CHANNELS.APP_CONFIRM_QUIT, { shouldQuit }),
      removeRecentConnection: (request: {
        connectionId: string;
      }): Promise<{ success: boolean }> =>
        invoke(IPC_CHANNELS.APP_REMOVE_RECENT_CONNECTION, request),
    },

    // Unsaved changes operations
    unsavedChanges: {
      check: (
        request: CheckUnsavedChangesRequest
      ): Promise<CheckUnsavedChangesResponse> =>
        invoke(IPC_CHANNELS.UNSAVED_CHANGES_CHECK, request),
    },

    // Password storage operations
    password: {
      isAvailable: (): Promise<IsPasswordStorageAvailableResponse> =>
        invoke(IPC_CHANNELS.PASSWORD_IS_AVAILABLE),
      save: (request: SavePasswordRequest): Promise<SavePasswordResponse> =>
        invoke(IPC_CHANNELS.PASSWORD_SAVE, request),
      get: (request: GetPasswordRequest): Promise<GetPasswordResponse> =>
        invoke(IPC_CHANNELS.PASSWORD_GET, request),
      has: (request: HasPasswordRequest): Promise<HasPasswordResponse> =>
        invoke(IPC_CHANNELS.PASSWORD_HAS, request),
      remove: (
        request: RemovePasswordRequest
      ): Promise<RemovePasswordResponse> =>
        invoke(IPC_CHANNELS.PASSWORD_REMOVE, request),
    },

    // Connection profile operations (T010)
    connection: {
      update: (
        request: UpdateConnectionRequest
      ): Promise<UpdateConnectionResponse> =>
        invoke(IPC_CHANNELS.CONNECTION_UPDATE, request),
      remove: (
        request: RemoveConnectionRequest
      ): Promise<RemoveConnectionResponse> =>
        invoke(IPC_CHANNELS.CONNECTION_REMOVE, request),
    },

    // Profile operations
    profile: {
      save: (request: SaveProfileRequest): Promise<SaveProfileResponse> =>
        invoke(IPC_CHANNELS.PROFILE_SAVE, request),
      update: (request: UpdateProfileRequest): Promise<UpdateProfileResponse> =>
        invoke(IPC_CHANNELS.PROFILE_UPDATE, request),
      delete: (request: DeleteProfileRequest): Promise<DeleteProfileResponse> =>
        invoke(IPC_CHANNELS.PROFILE_DELETE, request),
      getAll: (request: GetProfilesRequest): Promise<GetProfilesResponse> =>
        invoke(IPC_CHANNELS.PROFILE_GET_ALL, request),
      export: (
        request: ExportProfilesRequest
      ): Promise<ExportProfilesResponse> =>
        invoke(IPC_CHANNELS.PROFILE_EXPORT, request),
      import: (
        request: ImportProfilesRequest
      ): Promise<ImportProfilesResponse> =>
        invoke(IPC_CHANNELS.PROFILE_IMPORT, request),
    },

    // Folder operations
    folder: {
      create: (request: CreateFolderRequest): Promise<CreateFolderResponse> =>
        invoke(IPC_CHANNELS.FOLDER_CREATE, request),
      update: (request: UpdateFolderRequest): Promise<UpdateFolderResponse> =>
        invoke(IPC_CHANNELS.FOLDER_UPDATE, request),
      delete: (request: DeleteFolderRequest): Promise<DeleteFolderResponse> =>
        invoke(IPC_CHANNELS.FOLDER_DELETE, request),
      getAll: (request: GetFoldersRequest): Promise<GetFoldersResponse> =>
        invoke(IPC_CHANNELS.FOLDER_GET_ALL, request),
    },

    // File utilities
    file: {
      getPathForFile: (file: File): string => getPathForFile(file),
      exists: (request: FileExistsRequest): Promise<FileExistsResponse> =>
        invoke(IPC_CHANNELS.FILE_EXISTS, request),
      write: (request: WriteFileRequest): Promise<WriteFileResponse> =>
        invoke(IPC_CHANNELS.FILE_WRITE, request),
    },

    // Query history operations
    history: {
      get: (
        request: GetQueryHistoryRequest
      ): Promise<GetQueryHistoryResponse> =>
        invoke(IPC_CHANNELS.HISTORY_GET, request),
      save: (
        request: SaveQueryHistoryRequest
      ): Promise<SaveQueryHistoryResponse> =>
        invoke(IPC_CHANNELS.HISTORY_SAVE, request),
      delete: (
        request: DeleteQueryHistoryRequest
      ): Promise<DeleteQueryHistoryResponse> =>
        invoke(IPC_CHANNELS.HISTORY_DELETE, request),
      clear: (
        request: ClearQueryHistoryRequest
      ): Promise<ClearQueryHistoryResponse> =>
        invoke(IPC_CHANNELS.HISTORY_CLEAR, request),
    },

    // SQL log operations
    sqlLog: {
      get: (request: GetSqlLogsRequest): Promise<GetSqlLogsResponse> =>
        invoke(IPC_CHANNELS.SQL_LOG_GET, request),
      clear: (request: ClearSqlLogsRequest): Promise<ClearSqlLogsResponse> =>
        invoke(IPC_CHANNELS.SQL_LOG_CLEAR, request),
      onEntry: (callback: (entry: SqlLogEntry) => void): (() => void) => {
        const handler = (_event: unknown, entry: SqlLogEntry) =>
          callback(entry);
        on(IPC_CHANNELS.SQL_LOG_ENTRY, handler);
        return () => off(IPC_CHANNELS.SQL_LOG_ENTRY, handler);
      },
    },

    // Menu action listener
    menu: {
      onAction: (callback: (action: MenuAction) => void): (() => void) => {
        const handler = (_event: unknown, action: MenuAction) =>
          callback(action);
        on(IPC_CHANNELS.MENU_ACTION, handler);
        return () => off(IPC_CHANNELS.MENU_ACTION, handler);
      },
      updateShortcuts: (
        request: ShortcutsUpdatePayload
      ): Promise<{ success: boolean }> =>
        invoke(IPC_CHANNELS.SHORTCUTS_UPDATE, request),
    },

    // Keyboard shortcuts
    shortcuts: {
      update: (
        request: ShortcutsUpdatePayload
      ): Promise<{ success: boolean }> =>
        invoke(IPC_CHANNELS.SHORTCUTS_UPDATE, request),
    },

    // Language
    language: {
      update: (request: {
        language: 'en' | 'zh';
      }): Promise<{ success: boolean }> =>
        invoke(IPC_CHANNELS.LANGUAGE_UPDATE, request),
    },

    // AI Agent operations (new unified agent)
    agent: {
      // Settings
      getSettings: (): Promise<GetSettingsResponse> =>
        invoke(AGENT_IPC_CHANNELS.SETTINGS_GET),
      saveSettings: (request: {
        settings: Partial<AgentSettings>;
      }): Promise<SaveSettingsResponse> =>
        invoke(AGENT_IPC_CHANNELS.SETTINGS_SAVE, request),

      // Chat
      sendChat: (request: {
        connectionId: string;
        sessionId: string;
        messages: UIMessage[];
      }): Promise<ChatSendResponse> =>
        invoke(AGENT_IPC_CHANNELS.CHAT_SEND, request),
      cancelChat: (request: {
        connectionId: string;
        sessionId: string;
      }): Promise<Record<string, never>> =>
        invoke(AGENT_IPC_CHANNELS.CHAT_CANCEL, request),
      onChatStream: (
        streamId: string,
        callback: (chunk: unknown) => void
      ): (() => void) => {
        const channel = `${AGENT_IPC_CHANNELS.CHAT_STREAM}:${streamId}`;
        const handler = (_event: unknown, chunk: unknown) => callback(chunk);
        on(channel, handler);
        return () => off(channel, handler);
      },

      // History
      getSessions: (request: {
        connectionId: string;
      }): Promise<GetSessionsResponse> =>
        invoke(AGENT_IPC_CHANNELS.HISTORY_GET_SESSIONS, request),
      getSession: (request: {
        connectionId: string;
        sessionId: string;
      }): Promise<GetHistoryResponse> =>
        invoke(AGENT_IPC_CHANNELS.HISTORY_GET, request),
      deleteSession: (request: {
        connectionId: string;
        sessionId: string;
      }): Promise<Record<string, never>> =>
        invoke(AGENT_IPC_CHANNELS.HISTORY_DELETE_SESSION, request),
      clearHistory: (request: {
        connectionId: string;
      }): Promise<Record<string, never>> =>
        invoke(AGENT_IPC_CHANNELS.HISTORY_CLEAR, request),

      // Natural Language Query
      nlGenerateSQL: (
        connectionId: string,
        naturalLanguage: string
      ): Promise<NLGenerateSQLResponse> =>
        invoke(AGENT_IPC_CHANNELS.NL_GENERATE_SQL, {
          connectionId,
          naturalLanguage,
        }),
      nlExplainSQL: (
        connectionId: string,
        sql: string
      ): Promise<NLExplainSQLResponse> =>
        invoke(AGENT_IPC_CHANNELS.NL_EXPLAIN_SQL, {
          connectionId,
          sql,
        }),
      nlOptimizeSQL: (
        connectionId: string,
        sql: string
      ): Promise<NLOptimizeSQLResponse> =>
        invoke(AGENT_IPC_CHANNELS.NL_OPTIMIZE_SQL, {
          connectionId,
          sql,
        }),
    },

    // Pro tier operations
    pro: {
      getStatus: (): Promise<ProGetStatusResponse> =>
        invoke(IPC_CHANNELS.PRO_GET_STATUS),
      activate: (request: ProActivateRequest): Promise<ProActivateResponse> =>
        invoke(IPC_CHANNELS.PRO_ACTIVATE, request),
      deactivate: (): Promise<ProDeactivateResponse> =>
        invoke(IPC_CHANNELS.PRO_DEACTIVATE),
    },

    // License operations (Stripe subscription)
    license: {
      getMachineId: (): Promise<{
        success: boolean;
        machineId?: string;
        platform?: string;
        hostname?: string;
        error?: string;
      }> => invoke(IPC_CHANNELS.LICENSE_GET_MACHINE_ID),

      createCheckout: (request: {
        email: string;
        plan: 'monthly' | 'yearly' | 'lifetime';
      }): Promise<{
        success: boolean;
        sessionId?: string;
        error?: string;
      }> => invoke(IPC_CHANNELS.LICENSE_CREATE_CHECKOUT, request),

      activate: (request: {
        email: string;
        licenseKey: string;
      }): Promise<{
        success: boolean;
        license?: {
          email: string;
          plan: string;
          status: string;
          expiresAt: string;
        };
        error?: string;
        activations?: Array<{
          machineId: string;
          platform: string;
          hostname: string;
          activatedAt: string;
        }>;
      }> => invoke(IPC_CHANNELS.LICENSE_ACTIVATE, request),

      verify: (): Promise<{
        valid: boolean;
        license?: {
          email: string;
          plan: string;
          status: string;
          expiresAt: string;
        };
        cached?: boolean;
        offline?: boolean;
        error?: string;
      }> => invoke(IPC_CHANNELS.LICENSE_VERIFY),

      deactivate: (): Promise<{
        success: boolean;
        warning?: string;
      }> => invoke(IPC_CHANNELS.LICENSE_DEACTIVATE),

      getPortalUrl: (): Promise<{
        success: boolean;
        error?: string;
      }> => invoke(IPC_CHANNELS.LICENSE_GET_PORTAL_URL),
    },

    // Memory monitoring operations
    memory: {
      getStats: (
        request?: GetMemoryStatsRequest
      ): Promise<GetMemoryStatsResponse> =>
        invoke(IPC_CHANNELS.MEMORY_GET_STATS, request),
      subscribe: (
        request?: MemorySubscribeRequest
      ): Promise<MemorySubscribeResponse> =>
        invoke(IPC_CHANNELS.MEMORY_SUBSCRIBE, request),
      unsubscribe: (
        request: MemoryUnsubscribeRequest
      ): Promise<MemoryUnsubscribeResponse> =>
        invoke(IPC_CHANNELS.MEMORY_UNSUBSCRIBE, request),
      triggerGC: (
        request?: MemoryTriggerGCRequest
      ): Promise<MemoryTriggerGCResponse> =>
        invoke(IPC_CHANNELS.MEMORY_TRIGGER_GC, request),
      onStatsUpdate: (
        callback: (event: MemoryStatsUpdateEvent) => void
      ): (() => void) => {
        const handler = (_event: unknown, statsEvent: MemoryStatsUpdateEvent) =>
          callback(statsEvent);
        on(IPC_CHANNELS.MEMORY_STATS_UPDATE, handler);
        return () => off(IPC_CHANNELS.MEMORY_STATS_UPDATE, handler);
      },
      onPressureChange: (
        callback: (event: MemoryPressureChangeEvent) => void
      ): (() => void) => {
        const handler = (
          _event: unknown,
          pressureEvent: MemoryPressureChangeEvent
        ) => callback(pressureEvent);
        on(IPC_CHANNELS.MEMORY_PRESSURE_CHANGE, handler);
        return () => off(IPC_CHANNELS.MEMORY_PRESSURE_CHANGE, handler);
      },
    },

    // PostgreSQL LISTEN/NOTIFY operations
    pgNotify: {
      subscribe: (request: {
        connectionId: string;
        channel: string;
        table?: string;
      }): Promise<
        | { success: true; subscriptionId: string }
        | { success: false; error: string }
      > => invoke(IPC_CHANNELS.PG_NOTIFY_SUBSCRIBE, request),
      unsubscribe: (request: {
        subscriptionId: string;
      }): Promise<{ success: true } | { success: false; error: string }> =>
        invoke(IPC_CHANNELS.PG_NOTIFY_UNSUBSCRIBE, request),
      getSubscriptions: (request: {
        connectionId: string;
      }): Promise<{
        success: boolean;
        subscriptions: Array<{
          id: string;
          connectionId: string;
          channel: string;
          table?: string;
          createdAt: number;
        }>;
      }> => invoke(IPC_CHANNELS.PG_NOTIFY_GET_SUBSCRIPTIONS, request),
      onEvent: (
        callback: (event: {
          subscriptionId: string;
          connectionId: string;
          channel: string;
          payload: string;
          table?: string;
          timestamp: number;
        }) => void
      ): (() => void) => {
        const handler = (
          _event: unknown,
          notifyEvent: {
            subscriptionId: string;
            connectionId: string;
            channel: string;
            payload: string;
            table?: string;
            timestamp: number;
          }
        ) => callback(notifyEvent);
        on(IPC_CHANNELS.PG_NOTIFY_EVENT, handler);
        return () => off(IPC_CHANNELS.PG_NOTIFY_EVENT, handler);
      },
    },

    // Window operations
    window: {
      create: (): Promise<CreateWindowResponse> =>
        invoke(IPC_CHANNELS.WINDOW_CREATE),
      close: (request?: CloseWindowRequest): Promise<CloseWindowResponse> =>
        invoke(IPC_CHANNELS.WINDOW_CLOSE, request || {}),
      focus: (request: FocusWindowRequest): Promise<FocusWindowResponse> =>
        invoke(IPC_CHANNELS.WINDOW_FOCUS, request),
      getAll: (): Promise<GetAllWindowsResponse> =>
        invoke(IPC_CHANNELS.WINDOW_GET_ALL),
      getCurrent: (): Promise<GetCurrentWindowResponse> =>
        invoke(IPC_CHANNELS.WINDOW_GET_CURRENT),
    },

    // System operations
    system: systemNamespace,

    /**
     * @deprecated Use `system` instead. Same implementation as `system` (single IPC surface).
     */
    shell: systemNamespace,

    // Auto-update operations
    update: updateNamespace,

    /**
     * @deprecated Use `update` instead. Same implementation as `update`.
     */
    updates: updateNamespace,

    // Schema snapshot operations
    schemaSnapshot: {
      save: (
        request: SaveSchemaSnapshotRequest
      ): Promise<SaveSchemaSnapshotResponse> =>
        invoke(IPC_CHANNELS.SCHEMA_SNAPSHOT_SAVE, request),
      get: (
        request: GetSchemaSnapshotRequest
      ): Promise<GetSchemaSnapshotResponse> =>
        invoke(IPC_CHANNELS.SCHEMA_SNAPSHOT_GET, request),
      getAll: (): Promise<GetSchemaSnapshotsResponse> =>
        invoke(IPC_CHANNELS.SCHEMA_SNAPSHOT_GET_ALL),
      delete: (
        request: DeleteSchemaSnapshotRequest
      ): Promise<DeleteSchemaSnapshotResponse> =>
        invoke(IPC_CHANNELS.SCHEMA_SNAPSHOT_DELETE, request),
    },

    // Comparison operations
    comparison: {
      compareConnections: (
        request: CompareConnectionsRequest
      ): Promise<CompareConnectionsResponse> =>
        invoke(IPC_CHANNELS.COMPARISON_COMPARE_CONNECTIONS, request),
      compareConnectionToSnapshot: (
        request: CompareConnectionToSnapshotRequest
      ): Promise<CompareConnectionToSnapshotResponse> =>
        invoke(IPC_CHANNELS.COMPARISON_COMPARE_CONNECTION_TO_SNAPSHOT, request),
      compareSnapshots: (
        request: CompareSnapshotsRequest
      ): Promise<CompareSnapshotsResponse> =>
        invoke(IPC_CHANNELS.COMPARISON_COMPARE_SNAPSHOTS, request),
      compareTables: (
        request: CompareTablesRequest
      ): Promise<CompareTablesResponse> =>
        invoke(IPC_CHANNELS.COMPARISON_COMPARE_TABLES, request),
      exportComparisonReport: (
        request: ExportComparisonReportRequest
      ): Promise<ExportComparisonReportResponse> =>
        invoke(IPC_CHANNELS.COMPARISON_EXPORT_REPORT, request),
    },

    // Migration operations
    migration: {
      generateSQL: (
        request: GenerateMigrationSQLRequest
      ): Promise<GenerateMigrationSQLResponse> =>
        invoke(IPC_CHANNELS.MIGRATION_GENERATE_SQL, request),
      generateSyncSQL: (
        request: GenerateSyncSQLRequest
      ): Promise<GenerateSyncSQLResponse> =>
        invoke(IPC_CHANNELS.MIGRATION_GENERATE_SYNC_SQL, request),
    },

    // Import/export bundle operations
    bundle: {
      export: (request: ExportBundleRequest): Promise<ExportBundleResponse> =>
        invoke(IPC_CHANNELS.BUNDLE_EXPORT, request),
      import: (request: ImportBundleRequest): Promise<ImportBundleResponse> =>
        invoke(IPC_CHANNELS.BUNDLE_IMPORT, request),
    },

    // Schema operations
    schema: {
      export: (request: ExportSchemaRequest): Promise<ExportSchemaResponse> =>
        invoke(IPC_CHANNELS.SCHEMA_EXPORT, request),
      import: (request: ImportSchemaRequest): Promise<ImportSchemaResponse> =>
        invoke(IPC_CHANNELS.SCHEMA_IMPORT, request),
    },

    // Plugin operations
    plugin: pluginNamespace,

    /**
     * @deprecated Use `plugin` instead. Same implementation as `plugin`.
     */
    plugins: pluginNamespace,

    // Renderer store persistence operations
    rendererStore: {
      get: <K extends keyof RendererStoreSchema>(
        request: GetRendererStateRequest<K>
      ): Promise<GetRendererStateResponse<RendererStoreSchema[K]>> =>
        invoke(RENDERER_STORE_CHANNELS.GET, request),
      set: <K extends keyof RendererStoreSchema>(
        request: SetRendererStateRequest<K>
      ): Promise<SetRendererStateResponse> =>
        invoke(RENDERER_STORE_CHANNELS.SET, request),
      update: <K extends keyof RendererStoreSchema>(
        request: UpdateRendererStateRequest<K>
      ): Promise<UpdateRendererStateResponse> =>
        invoke(RENDERER_STORE_CHANNELS.UPDATE, request),
      reset: <K extends keyof RendererStoreSchema>(
        request: ResetRendererStateRequest<K>
      ): Promise<SetRendererStateResponse> =>
        invoke(RENDERER_STORE_CHANNELS.RESET, request),
    },

    // Image operations (proxy and metadata)
    image: {
      getMetadata: (request: {
        url: string;
      }): Promise<ImageGetMetadataResponse> =>
        invoke(IPC_CHANNELS.IMAGE_GET_METADATA, request),
      getFileMetadata: (request: {
        path: string;
      }): Promise<ImageGetFileMetadataResponse> =>
        invoke(IPC_CHANNELS.IMAGE_GET_FILE_METADATA, request),
      getCacheStats: (): Promise<ImageGetCacheStatsResponse> =>
        invoke(IPC_CHANNELS.IMAGE_GET_CACHE_STATS),
      clearCache: (): Promise<{ success: boolean }> =>
        invoke(IPC_CHANNELS.IMAGE_CLEAR_CACHE),
      /** Check if URL is media (image or video) using HEAD request preflight */
      checkUrl: (request: { url: string }): Promise<ImageCheckUrlResponse> =>
        invoke(IPC_CHANNELS.IMAGE_CHECK_URL, request),
      /** Full validation: HEAD check + Sharp metadata extraction */
      validateUrl: (request: {
        url: string;
      }): Promise<ImageValidateUrlResponse> =>
        invoke(IPC_CHANNELS.IMAGE_VALIDATE_URL, request),
      /** Check if local file exists */
      checkFile: (request: { path: string }): Promise<ImageCheckFileResponse> =>
        invoke(IPC_CHANNELS.IMAGE_CHECK_FILE, request),
    },

    // Video operations (ffprobe-based detection)
    video: {
      /** Get video metadata using ffprobe */
      getMetadata: (request: {
        url: string;
      }): Promise<VideoGetMetadataResponse> =>
        invoke(IPC_CHANNELS.VIDEO_GET_METADATA, request),
      /** Check if URL is a video using HEAD request + magic bytes */
      checkUrl: (request: { url: string }): Promise<VideoCheckUrlResponse> =>
        invoke(IPC_CHANNELS.VIDEO_CHECK_URL, request),
      /** Full video validation using ffprobe */
      validateUrl: (request: {
        url: string;
      }): Promise<VideoValidateUrlResponse> =>
        invoke(IPC_CHANNELS.VIDEO_VALIDATE_URL, request),
      /** Check if local file is a video */
      checkFile: (request: { path: string }): Promise<VideoCheckFileResponse> =>
        invoke(IPC_CHANNELS.VIDEO_CHECK_FILE, request),
    },

    // Database operations (extended)
    database: {
      getDatabaseStats: (
        request: DatabaseConnectionIdRequest
      ): Promise<GetDatabaseStatsResponse> =>
        invoke(IPC_CHANNELS.DATABASE_GET_STATS, request),
      vacuum: (
        request: DatabaseConnectionIdRequest
      ): Promise<DatabaseMaintenanceResponse> =>
        invoke(IPC_CHANNELS.DATABASE_VACUUM, request),
      analyze: (
        request: DatabaseConnectionIdRequest
      ): Promise<DatabaseMaintenanceResponse> =>
        invoke(IPC_CHANNELS.DATABASE_ANALYZE, request),
      // Aliases for schema and query to match component usage
      getSchema: (connectionId: string): Promise<GetSchemaResponse> =>
        invoke(IPC_CHANNELS.DB_GET_SCHEMA, { connectionId }),
      query: (
        connectionId: string,
        sql: string,
        params?: unknown[]
      ): Promise<ExecuteQueryResponse> =>
        invoke(IPC_CHANNELS.DB_EXECUTE_QUERY, {
          connectionId,
          query: sql,
          params,
        }),
    },

    // Sharing operations (query/schema export/import)
    sharing: {
      exportBundle: (
        request: ExportBundleRequest
      ): Promise<ExportBundleResponse> =>
        invoke(IPC_CHANNELS.SHARING_EXPORT_BUNDLE, request),
      importBundle: (
        request: ImportBundleRequest
      ): Promise<ImportBundleResponse> =>
        invoke(IPC_CHANNELS.SHARING_IMPORT_BUNDLE, request),
      exportQuery: (
        request: ExportQueryRequest
      ): Promise<ExportQueryResponse> =>
        invoke(IPC_CHANNELS.SHARING_EXPORT_QUERY, request),
      importQuery: (
        request: ImportQueryRequest
      ): Promise<ImportQueryResponse> =>
        invoke(IPC_CHANNELS.SHARING_IMPORT_QUERY, request),
      exportSchema: (
        request: ExportSchemaRequest
      ): Promise<ExportSchemaResponse> =>
        invoke(IPC_CHANNELS.SCHEMA_EXPORT, request),
      importSchema: (
        request: ImportSchemaRequest
      ): Promise<ImportSchemaResponse> =>
        invoke(IPC_CHANNELS.SCHEMA_IMPORT, request),
    },

    // Data diff operations
    dataDiff: {
      generateSyncSQL: (
        request: GenerateSyncSQLRequest
      ): Promise<GenerateSyncSQLResponse> =>
        invoke(IPC_CHANNELS.DATA_DIFF_GENERATE_SYNC_SQL, request),
      compareTables: (
        request: CompareTablesRequest
      ): Promise<CompareTablesResponse> =>
        invoke(IPC_CHANNELS.DATA_DIFF_COMPARE_TABLES, request),
    },

    // Schema comparison operations
    schemaComparison: {
      exportReport: (
        request: ExportComparisonReportRequest
      ): Promise<ExportComparisonReportResponse> =>
        invoke(IPC_CHANNELS.COMPARISON_EXPORT_REPORT, request),
      generateMigration: (
        request: GenerateMigrationSQLRequest
      ): Promise<GenerateMigrationSQLResponse> =>
        invoke(IPC_CHANNELS.GENERATE_MIGRATION_SQL, request),
    },

    // SSH tunnel operations
    ssh: {
      saveCredentials: (
        profileId: string,
        credentials: SSHCredentialsInput
      ): Promise<SSHSaveCredentialsResponse> =>
        invoke(IPC_CHANNELS.SSH_SAVE_CREDENTIALS, { profileId, credentials }),
      hasCredentials: (
        profileId: string
      ): Promise<SSHHasCredentialsResponse> =>
        invoke(IPC_CHANNELS.SSH_HAS_CREDENTIALS, { profileId }),
      getCredentials: (
        profileId: string
      ): Promise<SSHGetCredentialsResponse> =>
        invoke(IPC_CHANNELS.SSH_GET_CREDENTIALS, { profileId }),
      removeCredentials: (
        profileId: string
      ): Promise<SSHRemoveCredentialsResponse> =>
        invoke(IPC_CHANNELS.SSH_REMOVE_CREDENTIALS, { profileId }),
      getTunnelStatus: (
        connectionId: string
      ): Promise<SSHGetTunnelStatusResponse> =>
        invoke(IPC_CHANNELS.SSH_GET_TUNNEL_STATUS, { connectionId }),
      closeTunnel: (
        connectionId: string
      ): Promise<SSHCloseTunnelResponse> =>
        invoke(IPC_CHANNELS.SSH_CLOSE_TUNNEL, { connectionId }),
      testConnection: (
        config: SSHTunnelIpcConfig,
        credentials: SSHCredentialsInput
      ): Promise<SSHTestConnectionResponse> =>
        invoke(IPC_CHANNELS.SSH_TEST_CONNECTION, { config, credentials }),
      hasTunnel: (connectionId: string): Promise<SSHHasTunnelResponse> =>
        invoke(IPC_CHANNELS.SSH_HAS_TUNNEL, { connectionId }),
    },
  };
}

export type SqlProAPI = ReturnType<typeof createSqlProAPI>;
