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
import { dataChannels as domainDataChannels } from '@shared/domains/data/channels';
// Domain channel imports (migration: replaces legacy IPC_CHANNELS)
import {
  connectionChannels,
  imageChannels,
  vectorChannels,
  videoChannels,
} from '@shared/domains/database/channels';
import {
  backupChannels,
  exportChannels,
} from '@shared/domains/export/channels';
import { licenseChannels, proChannels } from '@shared/domains/license/channels';
import { pluginChannels } from '@shared/domains/plugin/channels';
import {
  folderChannels,
  preferencesChannels,
  profileChannels,
} from '@shared/domains/profile/channels';
import {
  changesChannels,
  historyChannels,
  queryChannels,
  sqlLogChannels,
} from '@shared/domains/query/channels';
import {
  schemaChannels as domainSchemaChannels,
  schemaComparisonChannels,
  schemaSnapshotChannels,
} from '@shared/domains/schema/channels';
import { sshChannels } from '@shared/domains/ssh/channels';
import {
  memoryChannels,
  rendererStoreChannels,
} from '@shared/domains/storage/channels';
import {
  dialogChannels,
  systemChannels as domainSystemChannels,
  menuChannels,
  passwordChannels,
  updateChannels,
  windowChannels,
} from '@shared/domains/system/channels';

/** IPC bridge injected by Electron preload or web mocks. */
export interface QuarryApiDeps {
  /** Returns channel-typed payloads; typed in each method body via ipcRenderer in preload. */
  invoke: (channel: string, ...args: unknown[]) => any;
  /** Matches Electron `IpcRenderer.on` listener arity. */
  on: (channel: string, listener: (...args: any[]) => void) => void;
  off: (channel: string, listener: (...args: any[]) => void) => void;
  getPathForFile: (file: File) => string;
}

/** Platform-agnostic factory: Electron preload passes ipcRenderer + webUtils. */
export function createQuarryAPI(deps: QuarryApiDeps) {
  const { invoke, on, off, getPathForFile } = deps;

  const updateNamespace = {
    check: (silent = true): Promise<{ success: boolean; error?: string }> =>
      invoke(updateChannels.check.name, silent),
    download: (): Promise<{ success: boolean; error?: string }> =>
      invoke(updateChannels.download.name),
    install: (): Promise<{ success: boolean; error?: string }> =>
      invoke(updateChannels.install.name),
  };

  const systemNamespace = {
    showItemInFolder: (
      request: ShowItemInFolderRequest
    ): Promise<ShowItemInFolderResponse> =>
      invoke(domainSystemChannels.showItemInFolder.name, request),
    openExternal: (
      request: OpenExternalRequest
    ): Promise<OpenExternalResponse> =>
      invoke(domainSystemChannels.openExternal.name, request),
  };

  const pluginNamespace = {
    list: (request?: ListPluginsRequest): Promise<ListPluginsResponse> =>
      invoke(pluginChannels.list.name, request || {}),
    get: (request: GetPluginRequest): Promise<GetPluginResponse> =>
      invoke(pluginChannels.list.name, request),
    install: (request: InstallPluginRequest): Promise<InstallPluginResponse> =>
      invoke(pluginChannels.install.name, request),
    uninstall: (
      request: UninstallPluginRequest
    ): Promise<UninstallPluginResponse> =>
      invoke(pluginChannels.uninstall.name, request),
    enable: (request: EnablePluginRequest): Promise<EnablePluginResponse> =>
      invoke(pluginChannels.enable.name, request),
    disable: (request: DisablePluginRequest): Promise<DisablePluginResponse> =>
      invoke(pluginChannels.disable.name, request),
    update: (request: UpdatePluginRequest): Promise<UpdatePluginResponse> =>
      invoke(pluginChannels.list.name, request),
    fetchMarketplace: (
      request?: FetchMarketplaceRequest
    ): Promise<FetchMarketplaceResponse> =>
      invoke(pluginChannels.list.name, request || {}),
    checkUpdates: (
      request: CheckUpdatesRequest
    ): Promise<CheckUpdatesResponse> =>
      invoke(pluginChannels.list.name, request),
    onEvent: (callback: (event: PluginEvent) => void): (() => void) => {
      const handler = (_event: unknown, pluginEvent: PluginEvent) =>
        callback(pluginEvent);
      on(pluginChannels.onEvent.name, handler);
      return () => off(pluginChannels.onEvent.name, handler);
    },
  };

  return {
    // Database operations (migrated to new IpcHandler-based system via domain channels)
    db: {
      open: (request: OpenDatabaseRequest): Promise<OpenDatabaseResponse> =>
        invoke(connectionChannels.open.name, request),
      close: (request: CloseDatabaseRequest): Promise<CloseDatabaseResponse> =>
        invoke(connectionChannels.close.name, request),
      getSchema: (request: GetSchemaRequest): Promise<GetSchemaResponse> =>
        invoke(domainSchemaChannels.get.name, request),
      getSchemaList: (
        request: GetSchemaListRequest
      ): Promise<GetSchemaListResponse> =>
        invoke(domainSchemaChannels.getList.name, request),
      getTableDetails: (
        request: GetTableDetailsRequest
      ): Promise<GetTableDetailsResponse> =>
        invoke(domainSchemaChannels.getTableDetails.name, request),
      getTableData: (
        request: GetTableDataRequest
      ): Promise<GetTableDataResponse> =>
        invoke(domainDataChannels.getTableData.name, request),
      getTableRowRange: (
        request: GetTableRowRangeRequest
      ): Promise<GetTableRowRangeResponse> =>
        invoke(domainDataChannels.getTableRowRange.name, request),
      executeQuery: (
        request: ExecuteQueryRequest
      ): Promise<ExecuteQueryResponse> =>
        invoke(queryChannels.execute.name, request),
      validateChanges: (
        request: ValidateChangesRequest
      ): Promise<ValidateChangesResponse> =>
        invoke(changesChannels.validate.name, request),
      applyChanges: (
        request: ApplyChangesRequest
      ): Promise<ApplyChangesResponse> =>
        invoke(changesChannels.apply.name, request),
      analyzeQueryPlan: (
        request: AnalyzeQueryPlanRequest
      ): Promise<AnalyzeQueryPlanResponse> =>
        invoke(queryChannels.analyzePlan.name, request),
      testConnection: (
        request: TestConnectionRequest
      ): Promise<TestConnectionResponse> =>
        invoke(connectionChannels.testConnection.name, request),
      changePassword: (
        request: ChangePasswordRequest
      ): Promise<ChangePasswordResponse> =>
        invoke(connectionChannels.changePassword.name, request),
      getColumnDistribution: (
        request: GetColumnDistributionRequest
      ): Promise<GetColumnDistributionResponse> =>
        invoke(domainDataChannels.getColumnDistribution.name, request),
      // Qdrant Vector Search operations
      vectorSearch: (
        request: VectorSearchRequest
      ): Promise<VectorSearchResponse> =>
        invoke(vectorChannels.search.name, request),
      batchVectorSearch: (
        request: BatchVectorSearchRequest
      ): Promise<BatchVectorSearchResponse> =>
        invoke(vectorChannels.batchSearch.name, request),
      searchSimilar: (
        request: SearchSimilarRequest
      ): Promise<SearchSimilarResponse> =>
        invoke(vectorChannels.searchSimilar.name, request),
      getPointsWithVectors: (
        request: GetPointsWithVectorsRequest
      ): Promise<GetPointsWithVectorsResponse> =>
        invoke(vectorChannels.getPointsWithVectors.name, request),
      onFileChanged: (
        callback: (event: FileChangeEvent) => void
      ): (() => void) => {
        const handler = (_event: unknown, fileChangeEvent: FileChangeEvent) =>
          callback(fileChangeEvent);
        on(connectionChannels.fileChanged.name, handler);
        return () => off(connectionChannels.fileChanged.name, handler);
      },
    },

    // Dialog operations
    dialog: {
      openFile: (
        request?: OpenFileDialogRequest
      ): Promise<OpenFileDialogResponse> =>
        invoke(dialogChannels.openFile.name, request || {}),
      saveFile: (
        request?: SaveFileDialogRequest
      ): Promise<SaveFileDialogResponse> =>
        invoke(dialogChannels.saveFile.name, request || {}),
      writeFile: (request: WriteFileRequest): Promise<WriteFileResponse> =>
        invoke(dialogChannels.writeFile.name, request),
    },

    // Export operations
    export: {
      data: (request: ExportRequest): Promise<ExportResponse> =>
        invoke(exportChannels.data.name, request),
    },

    // Backup operations
    backup: {
      create: (request: CreateBackupRequest): Promise<CreateBackupResponse> =>
        invoke(backupChannels.create.name, request),
      restore: (
        request: RestoreBackupRequest
      ): Promise<RestoreBackupResponse> =>
        invoke(backupChannels.restore.name, request),
      list: (request: ListBackupsRequest): Promise<ListBackupsResponse> =>
        invoke(backupChannels.list.name, request),
      delete: (request: DeleteBackupRequest): Promise<DeleteBackupResponse> =>
        invoke(backupChannels.delete.name, request),
    },

    // App operations
    app: {
      getRecentConnections: (): Promise<GetRecentConnectionsResponse> =>
        invoke(preferencesChannels.getRecentConnections.name),
      getPreferences: (): Promise<GetPreferencesResponse> =>
        invoke(preferencesChannels.get.name),
      setPreferences: (
        request: SetPreferencesRequest
      ): Promise<SetPreferencesResponse> =>
        invoke(preferencesChannels.set.name, request),
      onBeforeQuit: (callback: () => void): (() => void) => {
        const handler = (_event: unknown) => callback();
        on('app:prevent-quit', handler);
        return () => off('app:prevent-quit', handler);
      },
      confirmQuit: (shouldQuit: boolean): Promise<{ success: boolean }> =>
        invoke('app:confirm-quit', { shouldQuit }),
      removeRecentConnection: (request: {
        connectionId: string;
      }): Promise<{ success: boolean }> =>
        invoke(preferencesChannels.removeConnection.name, request),
    },

    // Unsaved changes operations
    unsavedChanges: {
      check: (
        request: CheckUnsavedChangesRequest
      ): Promise<CheckUnsavedChangesResponse> =>
        invoke(changesChannels.checkUnsaved.name, request),
    },

    // Password storage operations
    password: {
      isAvailable: (): Promise<IsPasswordStorageAvailableResponse> =>
        invoke(passwordChannels.isAvailable.name),
      save: (request: SavePasswordRequest): Promise<SavePasswordResponse> =>
        invoke(passwordChannels.save.name, request),
      get: (request: GetPasswordRequest): Promise<GetPasswordResponse> =>
        invoke(passwordChannels.get.name, request),
      has: (request: HasPasswordRequest): Promise<HasPasswordResponse> =>
        invoke(passwordChannels.has.name, request),
      remove: (
        request: RemovePasswordRequest
      ): Promise<RemovePasswordResponse> =>
        invoke(passwordChannels.remove.name, request),
    },

    // Connection profile operations (T010)
    connection: {
      update: (
        request: UpdateConnectionRequest
      ): Promise<UpdateConnectionResponse> =>
        invoke(preferencesChannels.updateConnection.name, request),
      remove: (
        request: RemoveConnectionRequest
      ): Promise<RemoveConnectionResponse> =>
        invoke(preferencesChannels.removeConnection.name, request),
    },

    // Profile operations
    profile: {
      save: (request: SaveProfileRequest): Promise<SaveProfileResponse> =>
        invoke(profileChannels.save.name, request),
      update: (request: UpdateProfileRequest): Promise<UpdateProfileResponse> =>
        invoke(profileChannels.update.name, request),
      delete: (request: DeleteProfileRequest): Promise<DeleteProfileResponse> =>
        invoke(profileChannels.delete.name, request),
      getAll: (request: GetProfilesRequest): Promise<GetProfilesResponse> =>
        invoke(profileChannels.getAll.name, request),
      export: (
        request: ExportProfilesRequest
      ): Promise<ExportProfilesResponse> =>
        invoke(profileChannels.export.name, request),
      import: (
        request: ImportProfilesRequest
      ): Promise<ImportProfilesResponse> =>
        invoke(profileChannels.import.name, request),
    },

    // Folder operations
    folder: {
      create: (request: CreateFolderRequest): Promise<CreateFolderResponse> =>
        invoke(folderChannels.create.name, request),
      update: (request: UpdateFolderRequest): Promise<UpdateFolderResponse> =>
        invoke(folderChannels.update.name, request),
      delete: (request: DeleteFolderRequest): Promise<DeleteFolderResponse> =>
        invoke(folderChannels.delete.name, request),
      getAll: (request: GetFoldersRequest): Promise<GetFoldersResponse> =>
        invoke(folderChannels.getAll.name, request),
    },

    // File utilities
    file: {
      getPathForFile: (file: File): string => getPathForFile(file),
      // file.exists was removed: it invoked the writeFile channel by mistake,
      // had no main-process handler, and no renderer callers
      write: (request: WriteFileRequest): Promise<WriteFileResponse> =>
        invoke(dialogChannels.writeFile.name, request),
    },

    // Query history operations
    history: {
      get: (
        request: GetQueryHistoryRequest
      ): Promise<GetQueryHistoryResponse> =>
        invoke(historyChannels.get.name, request),
      save: (
        request: SaveQueryHistoryRequest
      ): Promise<SaveQueryHistoryResponse> =>
        invoke(historyChannels.save.name, request),
      delete: (
        request: DeleteQueryHistoryRequest
      ): Promise<DeleteQueryHistoryResponse> =>
        invoke(historyChannels.delete.name, request),
      clear: (
        request: ClearQueryHistoryRequest
      ): Promise<ClearQueryHistoryResponse> =>
        invoke(historyChannels.clear.name, request),
    },

    // SQL log operations
    sqlLog: {
      get: (request: GetSqlLogsRequest): Promise<GetSqlLogsResponse> =>
        invoke(sqlLogChannels.get.name, request),
      clear: (request: ClearSqlLogsRequest): Promise<ClearSqlLogsResponse> =>
        invoke(sqlLogChannels.clear.name, request),
      onEntry: (callback: (entry: SqlLogEntry) => void): (() => void) => {
        const handler = (_event: unknown, entry: SqlLogEntry) =>
          callback(entry);
        on(sqlLogChannels.onEntry.name, handler);
        return () => off(sqlLogChannels.onEntry.name, handler);
      },
    },

    // Menu action listener
    menu: {
      onAction: (callback: (action: MenuAction) => void): (() => void) => {
        const handler = (_event: unknown, action: MenuAction) =>
          callback(action);
        on(menuChannels.onAction.name, handler);
        return () => off(menuChannels.onAction.name, handler);
      },
      updateShortcuts: (
        request: ShortcutsUpdatePayload
      ): Promise<{ success: boolean }> => invoke('shortcuts:update', request),
    },

    // Keyboard shortcuts
    shortcuts: {
      update: (
        request: ShortcutsUpdatePayload
      ): Promise<{ success: boolean }> => invoke('shortcuts:update', request),
    },

    // Language
    language: {
      update: (request: {
        language: 'en' | 'zh';
      }): Promise<{ success: boolean }> => invoke('language:update', request),
    },

    // AI Agent operations (new unified agent)
    agent: {
      // Settings
      getSettings: (): Promise<GetSettingsResponse> =>
        invoke('agent:settings:get'),
      saveSettings: (request: {
        settings: Partial<AgentSettings>;
      }): Promise<SaveSettingsResponse> =>
        invoke('agent:settings:save', request),

      // Chat
      sendChat: (request: {
        connectionId: string;
        sessionId: string;
        messages: UIMessage[];
      }): Promise<ChatSendResponse> => invoke('agent:chat:send', request),
      cancelChat: (request: {
        connectionId: string;
        sessionId: string;
      }): Promise<Record<string, never>> =>
        invoke('agent:chat:cancel', request),
      onChatStream: (
        streamId: string,
        callback: (chunk: unknown) => void
      ): (() => void) => {
        const channel = `agent:chat:stream:${streamId}`;
        const handler = (_event: unknown, chunk: unknown) => callback(chunk);
        on(channel, handler);
        return () => off(channel, handler);
      },

      // History
      getSessions: (request: {
        connectionId: string;
      }): Promise<GetSessionsResponse> =>
        invoke('agent:history:get-sessions', request),
      getSession: (request: {
        connectionId: string;
        sessionId: string;
      }): Promise<GetHistoryResponse> => invoke('agent:history:get', request),
      deleteSession: (request: {
        connectionId: string;
        sessionId: string;
      }): Promise<Record<string, never>> =>
        invoke('agent:history:delete-session', request),
      clearHistory: (request: {
        connectionId: string;
      }): Promise<Record<string, never>> =>
        invoke('agent:history:clear', request),

      // Natural Language Query
      nlGenerateSQL: (
        connectionId: string,
        naturalLanguage: string
      ): Promise<NLGenerateSQLResponse> =>
        invoke('agent:nl:generate-sql', {
          connectionId,
          naturalLanguage,
        }),
      nlExplainSQL: (
        connectionId: string,
        sql: string
      ): Promise<NLExplainSQLResponse> =>
        invoke('agent:nl:explain-sql', {
          connectionId,
          sql,
        }),
      nlOptimizeSQL: (
        connectionId: string,
        sql: string
      ): Promise<NLOptimizeSQLResponse> =>
        invoke('agent:nl:optimize-sql', {
          connectionId,
          sql,
        }),
    },

    // Pro tier operations
    pro: {
      getStatus: (): Promise<ProGetStatusResponse> =>
        invoke(proChannels.getStatus.name),
      activate: (request: ProActivateRequest): Promise<ProActivateResponse> =>
        invoke(proChannels.activate.name, request),
      deactivate: (): Promise<ProDeactivateResponse> =>
        invoke(proChannels.deactivate.name),
    },

    // License operations (Stripe subscription)
    license: {
      getMachineId: (): Promise<{
        success: boolean;
        machineId?: string;
        platform?: string;
        hostname?: string;
        error?: string;
      }> => invoke(licenseChannels.getMachineId.name),

      createCheckout: (request: {
        email: string;
        plan: 'monthly' | 'yearly' | 'lifetime';
      }): Promise<{
        success: boolean;
        sessionId?: string;
        error?: string;
      }> => invoke(licenseChannels.createCheckout.name, request),

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
      }> => invoke(licenseChannels.activate.name, request),

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
      }> => invoke(licenseChannels.verify.name),

      deactivate: (): Promise<{
        success: boolean;
        warning?: string;
      }> => invoke(licenseChannels.deactivate.name),

      getPortalUrl: (): Promise<{
        success: boolean;
        error?: string;
      }> => invoke(licenseChannels.getPortalUrl.name),
    },

    // Memory monitoring operations
    memory: {
      getStats: (
        request?: GetMemoryStatsRequest
      ): Promise<GetMemoryStatsResponse> =>
        invoke(memoryChannels.getStats.name, request),
      subscribe: (
        request?: MemorySubscribeRequest
      ): Promise<MemorySubscribeResponse> =>
        invoke(memoryChannels.subscribe.name, request),
      unsubscribe: (
        request: MemoryUnsubscribeRequest
      ): Promise<MemoryUnsubscribeResponse> =>
        invoke(memoryChannels.unsubscribe.name, request),
      triggerGC: (
        request?: MemoryTriggerGCRequest
      ): Promise<MemoryTriggerGCResponse> =>
        invoke(memoryChannels.triggerGC.name, request),
      onStatsUpdate: (
        callback: (event: MemoryStatsUpdateEvent) => void
      ): (() => void) => {
        const handler = (_event: unknown, statsEvent: MemoryStatsUpdateEvent) =>
          callback(statsEvent);
        on(memoryChannels.statsUpdate.name, handler);
        return () => off(memoryChannels.statsUpdate.name, handler);
      },
      onPressureChange: (
        callback: (event: MemoryPressureChangeEvent) => void
      ): (() => void) => {
        const handler = (
          _event: unknown,
          pressureEvent: MemoryPressureChangeEvent
        ) => callback(pressureEvent);
        on(memoryChannels.pressureChange.name, handler);
        return () => off(memoryChannels.pressureChange.name, handler);
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
      > => invoke('pg-notify:subscribe', request),
      unsubscribe: (request: {
        subscriptionId: string;
      }): Promise<{ success: true } | { success: false; error: string }> =>
        invoke('pg-notify:unsubscribe', request),
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
      }> => invoke('pg-notify:get-subscriptions', request),
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
        on('pg-notify:event', handler);
        return () => off('pg-notify:event', handler);
      },
    },

    // Window operations
    window: {
      create: (): Promise<CreateWindowResponse> =>
        invoke(windowChannels.create.name),
      close: (request?: CloseWindowRequest): Promise<CloseWindowResponse> =>
        invoke(windowChannels.close.name, request || {}),
      focus: (request: FocusWindowRequest): Promise<FocusWindowResponse> =>
        invoke(windowChannels.focus.name, request),
      getAll: (): Promise<GetAllWindowsResponse> =>
        invoke(windowChannels.getAll.name),
      getCurrent: (): Promise<GetCurrentWindowResponse> =>
        invoke(windowChannels.getCurrent.name),
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
        invoke(schemaSnapshotChannels.save.name, request),
      get: (
        request: GetSchemaSnapshotRequest
      ): Promise<GetSchemaSnapshotResponse> =>
        invoke(schemaSnapshotChannels.get.name, request),
      getAll: (): Promise<GetSchemaSnapshotsResponse> =>
        invoke(schemaSnapshotChannels.getAll.name),
      delete: (
        request: DeleteSchemaSnapshotRequest
      ): Promise<DeleteSchemaSnapshotResponse> =>
        invoke(schemaSnapshotChannels.delete.name, request),
    },

    // Comparison operations
    comparison: {
      compareConnections: (
        request: CompareConnectionsRequest
      ): Promise<CompareConnectionsResponse> =>
        invoke(schemaComparisonChannels.compareConnections.name, request),
      compareConnectionToSnapshot: (
        request: CompareConnectionToSnapshotRequest
      ): Promise<CompareConnectionToSnapshotResponse> =>
        invoke(
          schemaComparisonChannels.compareConnectionToSnapshot.name,
          request
        ),
      compareSnapshots: (
        request: CompareSnapshotsRequest
      ): Promise<CompareSnapshotsResponse> =>
        invoke(schemaComparisonChannels.compareSnapshots.name, request),
      compareTables: (
        request: CompareTablesRequest
      ): Promise<CompareTablesResponse> =>
        invoke(schemaComparisonChannels.compareTables.name, request),
      exportComparisonReport: (
        request: ExportComparisonReportRequest
      ): Promise<ExportComparisonReportResponse> =>
        invoke(schemaComparisonChannels.exportReport.name, request),
    },

    // Migration operations
    migration: {
      generateSQL: (
        request: GenerateMigrationSQLRequest
      ): Promise<GenerateMigrationSQLResponse> =>
        invoke(schemaComparisonChannels.generateMigrationSQL.name, request),
      generateSyncSQL: (
        request: GenerateSyncSQLRequest
      ): Promise<GenerateSyncSQLResponse> =>
        invoke(schemaComparisonChannels.generateSyncSQL.name, request),
    },

    // Import/export bundle operations
    bundle: {
      export: (request: ExportBundleRequest): Promise<ExportBundleResponse> =>
        invoke('bundle:export', request),
      import: (request: ImportBundleRequest): Promise<ImportBundleResponse> =>
        invoke('bundle:import', request),
    },

    // Schema operations
    schema: {
      export: (request: ExportSchemaRequest): Promise<ExportSchemaResponse> =>
        invoke(domainSchemaChannels.export.name, request),
      import: (request: ImportSchemaRequest): Promise<ImportSchemaResponse> =>
        invoke(domainSchemaChannels.import.name, request),
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
        invoke(rendererStoreChannels.get.name, request),
      set: <K extends keyof RendererStoreSchema>(
        request: SetRendererStateRequest<K>
      ): Promise<SetRendererStateResponse> =>
        invoke(rendererStoreChannels.set.name, request),
      update: <K extends keyof RendererStoreSchema>(
        request: UpdateRendererStateRequest<K>
      ): Promise<UpdateRendererStateResponse> =>
        invoke(rendererStoreChannels.update.name, request),
      reset: <K extends keyof RendererStoreSchema>(
        request: ResetRendererStateRequest<K>
      ): Promise<SetRendererStateResponse> =>
        invoke(rendererStoreChannels.reset.name, request),
    },

    // Image operations (proxy and metadata)
    image: {
      getMetadata: (request: {
        url: string;
      }): Promise<ImageGetMetadataResponse> =>
        invoke(imageChannels.getMetadata.name, request),
      getFileMetadata: (request: {
        path: string;
      }): Promise<ImageGetFileMetadataResponse> =>
        invoke(imageChannels.getFileMetadata.name, request),
      getCacheStats: (): Promise<ImageGetCacheStatsResponse> =>
        invoke(imageChannels.getCacheStats.name),
      clearCache: (): Promise<{ success: boolean }> =>
        invoke(imageChannels.clearCache.name),
      /** Check if URL is media (image or video) using HEAD request preflight */
      checkUrl: (request: { url: string }): Promise<ImageCheckUrlResponse> =>
        invoke(imageChannels.checkUrl.name, request),
      /** Full validation: HEAD check + Sharp metadata extraction */
      validateUrl: (request: {
        url: string;
      }): Promise<ImageValidateUrlResponse> =>
        invoke(imageChannels.validateUrl.name, request),
      /** Check if local file exists */
      checkFile: (request: { path: string }): Promise<ImageCheckFileResponse> =>
        invoke(imageChannels.checkFile.name, request),
    },

    // Video operations (ffprobe-based detection)
    video: {
      /** Get video metadata using ffprobe */
      getMetadata: (request: {
        url: string;
      }): Promise<VideoGetMetadataResponse> =>
        invoke(videoChannels.getMetadata.name, request),
      /** Check if URL is a video using HEAD request + magic bytes */
      checkUrl: (request: { url: string }): Promise<VideoCheckUrlResponse> =>
        invoke(videoChannels.checkUrl.name, request),
      /** Full video validation using ffprobe */
      validateUrl: (request: {
        url: string;
      }): Promise<VideoValidateUrlResponse> =>
        invoke(videoChannels.validateUrl.name, request),
      /** Check if local file is a video */
      checkFile: (request: { path: string }): Promise<VideoCheckFileResponse> =>
        invoke(videoChannels.checkFile.name, request),
    },

    // Database operations (extended)
    database: {
      getDatabaseStats: (
        request: DatabaseConnectionIdRequest
      ): Promise<GetDatabaseStatsResponse> =>
        invoke(connectionChannels.getStats.name, request),
      vacuum: (
        request: DatabaseConnectionIdRequest
      ): Promise<DatabaseMaintenanceResponse> =>
        invoke(connectionChannels.vacuum.name, request),
      analyze: (
        request: DatabaseConnectionIdRequest
      ): Promise<DatabaseMaintenanceResponse> =>
        invoke(connectionChannels.analyze.name, request),
      // Aliases for schema and query to match component usage
      getSchema: (connectionId: string): Promise<GetSchemaResponse> =>
        invoke(domainSchemaChannels.get.name, { connectionId }),
      query: (
        connectionId: string,
        sql: string,
        params?: unknown[]
      ): Promise<ExecuteQueryResponse> =>
        invoke(queryChannels.execute.name, {
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
        invoke('sharing:export-bundle', request),
      importBundle: (
        request: ImportBundleRequest
      ): Promise<ImportBundleResponse> =>
        invoke('sharing:import-bundle', request),
      exportQuery: (
        request: ExportQueryRequest
      ): Promise<ExportQueryResponse> =>
        invoke('sharing:export-query', request),
      importQuery: (
        request: ImportQueryRequest
      ): Promise<ImportQueryResponse> =>
        invoke('sharing:import-query', request),
      exportSchema: (
        request: ExportSchemaRequest
      ): Promise<ExportSchemaResponse> =>
        invoke(domainSchemaChannels.export.name, request),
      importSchema: (
        request: ImportSchemaRequest
      ): Promise<ImportSchemaResponse> =>
        invoke(domainSchemaChannels.import.name, request),
    },

    // Data diff operations
    dataDiff: {
      generateSyncSQL: (
        request: GenerateSyncSQLRequest
      ): Promise<GenerateSyncSQLResponse> =>
        invoke('data-diff:generate-sync-sql', request),
      compareTables: (
        request: CompareTablesRequest
      ): Promise<CompareTablesResponse> =>
        invoke('data-diff:compare-tables', request),
    },

    // Schema comparison operations
    schemaComparison: {
      exportReport: (
        request: ExportComparisonReportRequest
      ): Promise<ExportComparisonReportResponse> =>
        invoke(schemaComparisonChannels.exportReport.name, request),
      generateMigration: (
        request: GenerateMigrationSQLRequest
      ): Promise<GenerateMigrationSQLResponse> =>
        invoke(schemaComparisonChannels.generateMigrationSQL.name, request),
    },

    // SSH tunnel operations
    ssh: {
      saveCredentials: (
        profileId: string,
        credentials: SSHCredentialsInput
      ): Promise<SSHSaveCredentialsResponse> =>
        invoke(sshChannels.saveCredentials.name, { profileId, credentials }),
      hasCredentials: (profileId: string): Promise<SSHHasCredentialsResponse> =>
        invoke(sshChannels.hasCredentials.name, { profileId }),
      getCredentials: (profileId: string): Promise<SSHGetCredentialsResponse> =>
        invoke(sshChannels.getCredentials.name, { profileId }),
      removeCredentials: (
        profileId: string
      ): Promise<SSHRemoveCredentialsResponse> =>
        invoke(sshChannels.removeCredentials.name, { profileId }),
      getTunnelStatus: (
        connectionId: string
      ): Promise<SSHGetTunnelStatusResponse> =>
        invoke(sshChannels.getTunnelStatus.name, { connectionId }),
      closeTunnel: (connectionId: string): Promise<SSHCloseTunnelResponse> =>
        invoke(sshChannels.closeTunnel.name, { connectionId }),
      testConnection: (
        config: SSHTunnelIpcConfig,
        credentials: SSHCredentialsInput
      ): Promise<SSHTestConnectionResponse> =>
        invoke(sshChannels.testConnection.name, { config, credentials }),
      hasTunnel: (connectionId: string): Promise<SSHHasTunnelResponse> =>
        invoke(sshChannels.hasTunnel.name, { connectionId }),
    },
  };
}

export type QuarryAPI = ReturnType<typeof createQuarryAPI>;
