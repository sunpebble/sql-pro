/**
 * Complete IPC Channel Type Contracts
 *
 * This file defines type-safe channel contracts for all IPC operations,
 * using the existing types from @shared/types.
 */

import type {
  AIAgentMessage,
  AIAgentQueryRequest,
  AICancelStreamRequest,
  AIFetchAnthropicRequest,
  AIFetchAnthropicResponse,
  AIFetchOpenAIRequest,
  AIFetchOpenAIResponse,
  AIStreamAnthropicRequest,
  AIStreamChunk,
  AIStreamOpenAIRequest,
  AnalyzeQueryPlanRequest,
  AnalyzeQueryPlanResponse,
  ApplyChangesRequest,
  ApplyChangesResponse,
  BatchVectorSearchRequest,
  BatchVectorSearchResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  CheckProStatusResponse,
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
  // Backup
  CreateBackupRequest,
  CreateBackupResponse,
  // Folders
  CreateFolderRequest,
  CreateFolderResponse,
  // Windows
  CreateWindowResponse,
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
  // Query operations
  ExecuteQueryRequest,
  ExecuteQueryResponse,
  ExportProfilesRequest,
  ExportProfilesResponse,
  // Export/Import
  ExportRequest,
  ExportResponse,
  FocusWindowRequest,
  FocusWindowResponse,
  GenerateMigrationSQLRequest,
  GenerateMigrationSQLResponse,
  GenerateSyncSQLRequest,
  GenerateSyncSQLResponse,
  // AI
  GetAISettingsResponse,
  GetAllWindowsResponse,
  GetClaudeCodePathsResponse,
  GetColumnDistributionRequest,
  GetColumnDistributionResponse,
  GetCurrentWindowResponse,
  GetFoldersRequest,
  GetFoldersResponse,
  GetPasswordRequest,
  GetPasswordResponse,
  GetPointsWithVectorsRequest,
  GetPointsWithVectorsResponse,
  // Preferences
  GetPreferencesResponse,
  // Pro features
  GetProFeaturesResponse,
  GetProfilesRequest,
  GetProfilesResponse,
  // Query History
  GetQueryHistoryRequest,
  GetQueryHistoryResponse,
  GetRecentConnectionsResponse,
  GetSchemaListRequest,
  GetSchemaListResponse,
  // Schema operations
  GetSchemaRequest,
  GetSchemaResponse,
  GetSchemaSnapshotRequest,
  GetSchemaSnapshotResponse,
  GetSchemaSnapshotsResponse,
  // SQL Logs
  GetSqlLogsRequest,
  GetSqlLogsResponse,
  // Data operations
  GetTableDataRequest,
  GetTableDataResponse,
  GetTableDetailsRequest,
  GetTableDetailsResponse,
  GetTableRowRangeRequest,
  GetTableRowRangeResponse,
  HasPasswordRequest,
  HasPasswordResponse,
  ImportProfilesRequest,
  ImportProfilesResponse,
  IsPasswordStorageAvailableResponse,
  ListBackupsRequest,
  ListBackupsResponse,
  // Database operations
  OpenDatabaseRequest,
  OpenDatabaseResponse,
  OpenExternalRequest,
  OpenExternalResponse,
  // Dialogs
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
  SaveAISettingsRequest,
  SaveAISettingsResponse,
  SaveFileDialogRequest,
  SaveFileDialogResponse,
  // Password storage
  SavePasswordRequest,
  SavePasswordResponse,
  // Profiles
  SaveProfileRequest,
  SaveProfileResponse,
  SaveQueryHistoryRequest,
  SaveQueryHistoryResponse,
  // Schema snapshots and comparison
  SaveSchemaSnapshotRequest,
  SaveSchemaSnapshotResponse,
  SearchSimilarRequest,
  SearchSimilarResponse,
  SetPreferencesRequest,
  SetPreferencesResponse,
  ShowItemInFolderRequest,
  ShowItemInFolderResponse,
  TestConnectionRequest,
  TestConnectionResponse,
  UpdateConnectionRequest,
  UpdateConnectionResponse,
  UpdateFolderRequest,
  UpdateFolderResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  // Updates
  UpdateStatus,
  // Change operations
  ValidateChangesRequest,
  ValidateChangesResponse,
  // Vector search
  VectorSearchRequest,
  VectorSearchResponse,
  WriteFileRequest,
  WriteFileResponse,
} from '@shared/types';
import { channel, streamChannel } from '@sqlpro/ipc-contracts';

/**
 * Database IPC Channels - Full type definitions
 */
export const databaseChannels = {
  open: channel<OpenDatabaseRequest, OpenDatabaseResponse>('database:open'),
  close: channel<CloseDatabaseRequest, CloseDatabaseResponse>('database:close'),
  testConnection: channel<TestConnectionRequest, TestConnectionResponse>(
    'database:test-connection'
  ),
  changePassword: channel<ChangePasswordRequest, ChangePasswordResponse>(
    'database:change-password'
  ),
} as const;

/**
 * Schema IPC Channels
 */
export const schemaChannels = {
  get: channel<GetSchemaRequest, GetSchemaResponse>('schema:get'),
  getList: channel<GetSchemaListRequest, GetSchemaListResponse>(
    'schema:get-list'
  ),
  getTableDetails: channel<GetTableDetailsRequest, GetTableDetailsResponse>(
    'schema:get-table-details'
  ),
} as const;

/**
 * Schema Snapshot IPC Channels
 */
export const schemaSnapshotChannels = {
  getAll: channel<void, GetSchemaSnapshotsResponse>('schema-snapshot:get-all'),
  get: channel<GetSchemaSnapshotRequest, GetSchemaSnapshotResponse>(
    'schema-snapshot:get'
  ),
  save: channel<SaveSchemaSnapshotRequest, SaveSchemaSnapshotResponse>(
    'schema-snapshot:save'
  ),
  delete: channel<DeleteSchemaSnapshotRequest, DeleteSchemaSnapshotResponse>(
    'schema-snapshot:delete'
  ),
} as const;

/**
 * Schema Comparison IPC Channels
 */
export const schemaComparisonChannels = {
  compareSnapshots: channel<CompareSnapshotsRequest, CompareSnapshotsResponse>(
    'schema-comparison:compare-snapshots'
  ),
  compareConnections: channel<
    CompareConnectionsRequest,
    CompareConnectionsResponse
  >('schema-comparison:compare-connections'),
  compareConnectionToSnapshot: channel<
    CompareConnectionToSnapshotRequest,
    CompareConnectionToSnapshotResponse
  >('schema-comparison:compare-connection-to-snapshot'),
  compareTables: channel<CompareTablesRequest, CompareTablesResponse>(
    'schema-comparison:compare-tables'
  ),
  generateMigrationSQL: channel<
    GenerateMigrationSQLRequest,
    GenerateMigrationSQLResponse
  >('schema-comparison:generate-migration-sql'),
  generateSyncSQL: channel<GenerateSyncSQLRequest, GenerateSyncSQLResponse>(
    'schema-comparison:generate-sync-sql'
  ),
} as const;

/**
 * Data IPC Channels
 */
export const dataChannels = {
  getTableData: channel<GetTableDataRequest, GetTableDataResponse>(
    'data:get-table-data'
  ),
  getTableRowRange: channel<GetTableRowRangeRequest, GetTableRowRangeResponse>(
    'data:get-table-row-range'
  ),
  getColumnDistribution: channel<
    GetColumnDistributionRequest,
    GetColumnDistributionResponse
  >('data:get-column-distribution'),
} as const;

/**
 * Query IPC Channels
 */
export const queryChannels = {
  execute: channel<ExecuteQueryRequest, ExecuteQueryResponse>('query:execute'),
  analyzePlan: channel<AnalyzeQueryPlanRequest, AnalyzeQueryPlanResponse>(
    'query:analyze-plan'
  ),
} as const;

/**
 * Changes IPC Channels
 */
export const changesChannels = {
  validate: channel<ValidateChangesRequest, ValidateChangesResponse>(
    'changes:validate'
  ),
  apply: channel<ApplyChangesRequest, ApplyChangesResponse>('changes:apply'),
} as const;

/**
 * Export IPC Channels
 */
export const exportChannels = {
  export: channel<ExportRequest, ExportResponse>('export:export'),
} as const;

/**
 * Backup IPC Channels
 */
export const backupChannels = {
  create: channel<CreateBackupRequest, CreateBackupResponse>('backup:create'),
  restore: channel<RestoreBackupRequest, RestoreBackupResponse>(
    'backup:restore'
  ),
  list: channel<ListBackupsRequest, ListBackupsResponse>('backup:list'),
  delete: channel<DeleteBackupRequest, DeleteBackupResponse>('backup:delete'),
} as const;

/**
 * Dialog IPC Channels
 */
export const dialogChannels = {
  openFile: channel<OpenFileDialogRequest, OpenFileDialogResponse>(
    'dialog:open-file'
  ),
  saveFile: channel<SaveFileDialogRequest, SaveFileDialogResponse>(
    'dialog:save-file'
  ),
  writeFile: channel<WriteFileRequest, WriteFileResponse>('dialog:write-file'),
} as const;

/**
 * Password IPC Channels
 */
export const passwordChannels = {
  save: channel<SavePasswordRequest, SavePasswordResponse>('password:save'),
  get: channel<GetPasswordRequest, GetPasswordResponse>('password:get'),
  has: channel<HasPasswordRequest, HasPasswordResponse>('password:has'),
  remove: channel<RemovePasswordRequest, RemovePasswordResponse>(
    'password:remove'
  ),
  isAvailable: channel<void, IsPasswordStorageAvailableResponse>(
    'password:is-available'
  ),
} as const;

/**
 * Profile IPC Channels
 */
export const profileChannels = {
  save: channel<SaveProfileRequest, SaveProfileResponse>('profile:save'),
  update: channel<UpdateProfileRequest, UpdateProfileResponse>(
    'profile:update'
  ),
  delete: channel<DeleteProfileRequest, DeleteProfileResponse>(
    'profile:delete'
  ),
  getAll: channel<GetProfilesRequest, GetProfilesResponse>('profile:get-all'),
  export: channel<ExportProfilesRequest, ExportProfilesResponse>(
    'profile:export'
  ),
  import: channel<ImportProfilesRequest, ImportProfilesResponse>(
    'profile:import'
  ),
} as const;

/**
 * Folder IPC Channels
 */
export const folderChannels = {
  create: channel<CreateFolderRequest, CreateFolderResponse>('folder:create'),
  update: channel<UpdateFolderRequest, UpdateFolderResponse>('folder:update'),
  delete: channel<DeleteFolderRequest, DeleteFolderResponse>('folder:delete'),
  getAll: channel<GetFoldersRequest, GetFoldersResponse>('folder:get-all'),
} as const;

/**
 * History IPC Channels
 */
export const historyChannels = {
  get: channel<GetQueryHistoryRequest, GetQueryHistoryResponse>('history:get'),
  save: channel<SaveQueryHistoryRequest, SaveQueryHistoryResponse>(
    'history:save'
  ),
  delete: channel<DeleteQueryHistoryRequest, DeleteQueryHistoryResponse>(
    'history:delete'
  ),
  clear: channel<ClearQueryHistoryRequest, ClearQueryHistoryResponse>(
    'history:clear'
  ),
} as const;

/**
 * SQL Log IPC Channels
 */
export const sqlLogChannels = {
  get: channel<GetSqlLogsRequest, GetSqlLogsResponse>('sql-log:get'),
  clear: channel<ClearSqlLogsRequest, ClearSqlLogsResponse>('sql-log:clear'),
} as const;

/**
 * Preferences IPC Channels
 */
export const preferencesChannels = {
  get: channel<void, GetPreferencesResponse>('preferences:get'),
  set: channel<SetPreferencesRequest, SetPreferencesResponse>(
    'preferences:set'
  ),
  getRecentConnections: channel<void, GetRecentConnectionsResponse>(
    'preferences:get-recent-connections'
  ),
  updateConnection: channel<UpdateConnectionRequest, UpdateConnectionResponse>(
    'preferences:update-connection'
  ),
  removeConnection: channel<RemoveConnectionRequest, RemoveConnectionResponse>(
    'preferences:remove-connection'
  ),
} as const;

/**
 * AI IPC Channels
 */
export const aiChannels = {
  getSettings: channel<void, GetAISettingsResponse>('ai:get-settings'),
  saveSettings: channel<SaveAISettingsRequest, SaveAISettingsResponse>(
    'ai:save-settings'
  ),
  fetchAnthropic: channel<AIFetchAnthropicRequest, AIFetchAnthropicResponse>(
    'ai:fetch-anthropic'
  ),
  fetchOpenAI: channel<AIFetchOpenAIRequest, AIFetchOpenAIResponse>(
    'ai:fetch-openai'
  ),
  streamAnthropic: streamChannel<AIStreamAnthropicRequest, AIStreamChunk>(
    'ai:stream-anthropic'
  ),
  streamOpenAI: streamChannel<AIStreamOpenAIRequest, AIStreamChunk>(
    'ai:stream-openai'
  ),
  agentQuery: streamChannel<AIAgentQueryRequest, AIAgentMessage>(
    'ai:agent-query'
  ),
  cancelStream: channel<AICancelStreamRequest, void>('ai:cancel-stream'),
  getClaudeCodePaths: channel<void, GetClaudeCodePathsResponse>(
    'ai:get-claude-code-paths'
  ),
} as const;

/**
 * Pro Features IPC Channels
 */
export const proChannels = {
  getFeatures: channel<void, GetProFeaturesResponse>('pro:get-features'),
  activate: channel<ProActivateRequest, ProActivateResponse>('pro:activate'),
  deactivate: channel<void, ProDeactivateResponse>('pro:deactivate'),
  getStatus: channel<void, ProGetStatusResponse>('pro:get-status'),
  checkStatus: channel<void, CheckProStatusResponse>('pro:check-status'),
} as const;

/**
 * Vector Search IPC Channels
 */
export const vectorChannels = {
  search: channel<VectorSearchRequest, VectorSearchResponse>('vector:search'),
  searchSimilar: channel<SearchSimilarRequest, SearchSimilarResponse>(
    'vector:search-similar'
  ),
  batchSearch: channel<BatchVectorSearchRequest, BatchVectorSearchResponse>(
    'vector:batch-search'
  ),
  getPoints: channel<GetPointsWithVectorsRequest, GetPointsWithVectorsResponse>(
    'vector:get-points'
  ),
} as const;

/**
 * Window IPC Channels
 */
export const windowChannels = {
  create: channel<void, CreateWindowResponse>('window:create'),
  close: channel<CloseWindowRequest, CloseWindowResponse>('window:close'),
  focus: channel<FocusWindowRequest, FocusWindowResponse>('window:focus'),
  getAll: channel<void, GetAllWindowsResponse>('window:get-all'),
  getCurrent: channel<void, GetCurrentWindowResponse>('window:get-current'),
} as const;

/**
 * System IPC Channels
 */
export const systemChannels = {
  showItemInFolder: channel<ShowItemInFolderRequest, ShowItemInFolderResponse>(
    'system:show-item-in-folder'
  ),
  openExternal: channel<OpenExternalRequest, OpenExternalResponse>(
    'system:open-external'
  ),
  getAppVersion: channel<void, { version: string }>('system:get-app-version'),
  getPlatform: channel<void, { platform: string }>('system:get-platform'),
} as const;

/**
 * Update IPC Channels
 */
export const updateChannels = {
  check: channel<void, UpdateStatus>('update:check'),
  download: channel<void, void>('update:download'),
  install: channel<void, void>('update:install'),
  getStatus: channel<void, UpdateStatus>('update:get-status'),
} as const;

/**
 * All channels grouped by namespace
 */
export const allChannels = {
  database: databaseChannels,
  schema: schemaChannels,
  schemaSnapshot: schemaSnapshotChannels,
  schemaComparison: schemaComparisonChannels,
  data: dataChannels,
  query: queryChannels,
  changes: changesChannels,
  export: exportChannels,
  backup: backupChannels,
  dialog: dialogChannels,
  password: passwordChannels,
  profile: profileChannels,
  folder: folderChannels,
  history: historyChannels,
  sqlLog: sqlLogChannels,
  preferences: preferencesChannels,
  ai: aiChannels,
  pro: proChannels,
  vector: vectorChannels,
  window: windowChannels,
  system: systemChannels,
  update: updateChannels,
} as const;

export type AllChannels = typeof allChannels;
