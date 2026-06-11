import type {
  CompareConnectionsRequest,
  CompareConnectionsResponse,
  CompareConnectionToSnapshotRequest,
  CompareConnectionToSnapshotResponse,
  CompareSnapshotsRequest,
  CompareSnapshotsResponse,
  CompareTablesRequest,
  CompareTablesResponse,
  DeleteSchemaSnapshotRequest,
  DeleteSchemaSnapshotResponse,
  ExportComparisonReportRequest,
  ExportComparisonReportResponse,
  ExportSchemaRequest,
  ExportSchemaResponse,
  GenerateMigrationSQLRequest,
  GenerateMigrationSQLResponse,
  GenerateSyncSQLRequest,
  GenerateSyncSQLResponse,
  GetSchemaListRequest,
  GetSchemaListResponse,
  GetSchemaRequest,
  GetSchemaResponse,
  GetSchemaSnapshotRequest,
  GetSchemaSnapshotResponse,
  GetSchemaSnapshotsResponse,
  GetTableDetailsRequest,
  GetTableDetailsResponse,
  ImportSchemaRequest,
  ImportSchemaResponse,
  SaveSchemaSnapshotRequest,
  SaveSchemaSnapshotResponse,
} from './types';
// Inline channel() helper — avoids @sqlpro/ipc-contracts dependency in web build
function channel<TIn = unknown, TOut = unknown>(name: string) {
  return { name, _input: undefined as unknown as TIn, _output: undefined as unknown as TOut };
}

export const schemaChannels = {
  get: channel<GetSchemaRequest, GetSchemaResponse>('schema:get'),
  getList: channel<GetSchemaListRequest, GetSchemaListResponse>(
    'schema:get-list'
  ),
  getTableDetails: channel<GetTableDetailsRequest, GetTableDetailsResponse>(
    'schema:get-table-details'
  ),
  export: channel<ExportSchemaRequest, ExportSchemaResponse>('schema:export'),
  import: channel<ImportSchemaRequest, ImportSchemaResponse>('schema:import'),
} as const;

export const schemaSnapshotChannels = {
  save: channel<SaveSchemaSnapshotRequest, SaveSchemaSnapshotResponse>(
    'schema-snapshot:save'
  ),
  getAll: channel<void, GetSchemaSnapshotsResponse>('schema-snapshot:get-all'),
  get: channel<GetSchemaSnapshotRequest, GetSchemaSnapshotResponse>(
    'schema-snapshot:get'
  ),
  delete: channel<DeleteSchemaSnapshotRequest, DeleteSchemaSnapshotResponse>(
    'schema-snapshot:delete'
  ),
} as const;

export const schemaComparisonChannels = {
  compareConnections: channel<
    CompareConnectionsRequest,
    CompareConnectionsResponse
  >('schema-comparison:compare-connections'),
  compareConnectionToSnapshot: channel<
    CompareConnectionToSnapshotRequest,
    CompareConnectionToSnapshotResponse
  >('schema-comparison:compare-connection-to-snapshot'),
  compareSnapshots: channel<CompareSnapshotsRequest, CompareSnapshotsResponse>(
    'schema-comparison:compare-snapshots'
  ),
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
  exportReport: channel<
    ExportComparisonReportRequest,
    ExportComparisonReportResponse
  >('schema-comparison:export-report'),
} as const;
