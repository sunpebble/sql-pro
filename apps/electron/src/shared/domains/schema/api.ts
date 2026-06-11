import type { SqlProApiDeps } from '../../lib/sql-pro-api';
import {
  schemaChannels,
  schemaComparisonChannels,
  schemaSnapshotChannels,
} from './channels';

export function createSchemaApi({ invoke }: SqlProApiDeps) {
  return {
    schema: {
      get: (r: unknown) => invoke(schemaChannels.get.name, r),
      getList: (r: unknown) => invoke(schemaChannels.getList.name, r),
      getTableDetails: (r: unknown) =>
        invoke(schemaChannels.getTableDetails.name, r),
      export: (r: unknown) => invoke(schemaChannels.export.name, r),
      import: (r: unknown) => invoke(schemaChannels.import.name, r),
    },
    snapshot: {
      save: (r: unknown) => invoke(schemaSnapshotChannels.save.name, r),
      getAll: () => invoke(schemaSnapshotChannels.getAll.name),
      get: (r: unknown) => invoke(schemaSnapshotChannels.get.name, r),
      delete: (r: unknown) => invoke(schemaSnapshotChannels.delete.name, r),
    },
    comparison: {
      compareConnections: (r: unknown) =>
        invoke(schemaComparisonChannels.compareConnections.name, r),
      compareConnectionToSnapshot: (r: unknown) =>
        invoke(schemaComparisonChannels.compareConnectionToSnapshot.name, r),
      compareSnapshots: (r: unknown) =>
        invoke(schemaComparisonChannels.compareSnapshots.name, r),
      compareTables: (r: unknown) =>
        invoke(schemaComparisonChannels.compareTables.name, r),
      generateMigrationSQL: (r: unknown) =>
        invoke(schemaComparisonChannels.generateMigrationSQL.name, r),
      generateSyncSQL: (r: unknown) =>
        invoke(schemaComparisonChannels.generateSyncSQL.name, r),
      exportReport: (r: unknown) =>
        invoke(schemaComparisonChannels.exportReport.name, r),
    },
  };
}

export type SchemaApi = ReturnType<typeof createSchemaApi>;
