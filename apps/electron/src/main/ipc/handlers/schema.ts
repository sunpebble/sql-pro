/**
 * Schema IPC Handler
 *
 * Handles all schema-related IPC operations including snapshots and comparisons.
 * Uses the new handler base class for unified error handling and logging.
 */

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
  GenerateMigrationSQLRequest,
  GenerateMigrationSQLResponse,
  GenerateSyncSQLRequest,
  GenerateSyncSQLResponse,
  GetSchemaSnapshotRequest,
  GetSchemaSnapshotResponse,
  GetSchemaSnapshotsResponse,
  SaveSchemaSnapshotRequest,
  SaveSchemaSnapshotResponse,
  SchemaSnapshot,
} from '@shared/types';
import type {HandlerContext} from '../base/handler';
import { dataDiffService } from '../../services/data-diff';
import { dataDiffSyncGeneratorService } from '../../services/data-diff-sync-generator';
import { databaseService } from '../../services/database';
import { migrationGeneratorService } from '../../services/migration-generator';
import { schemaComparisonService } from '../../services/schema-comparison';
import {
  deleteSchemaSnapshot,
  getSchemaSnapshot,
  getSchemaSnapshots,
  saveSchemaSnapshot,
} from '../../services/store';
import {  IpcHandler } from '../base/handler';
import {
  schemaComparisonChannels,
  schemaSnapshotChannels,
} from '../contracts/all-channels';

export class SchemaHandler extends IpcHandler {
  constructor() {
    super({ name: 'schema' });
  }

  register(): void {
    // Schema Snapshot operations
    this.handle(
      schemaSnapshotChannels.getAll,
      this.getSchemaSnapshots.bind(this)
    );
    this.handle(schemaSnapshotChannels.get, this.getSchemaSnapshot.bind(this));
    this.handle(
      schemaSnapshotChannels.save,
      this.saveSchemaSnapshot.bind(this)
    );
    this.handle(
      schemaSnapshotChannels.delete,
      this.deleteSchemaSnapshot.bind(this)
    );

    // Schema Comparison operations
    this.handle(
      schemaComparisonChannels.compareSnapshots,
      this.compareSnapshots.bind(this)
    );
    this.handle(
      schemaComparisonChannels.compareConnections,
      this.compareConnections.bind(this)
    );
    this.handle(
      schemaComparisonChannels.compareConnectionToSnapshot,
      this.compareConnectionToSnapshot.bind(this)
    );
    this.handle(
      schemaComparisonChannels.compareTables,
      this.compareTables.bind(this)
    );
    this.handle(
      schemaComparisonChannels.generateMigrationSQL,
      this.generateMigrationSQL.bind(this)
    );
    this.handle(
      schemaComparisonChannels.generateSyncSQL,
      this.generateSyncSQL.bind(this)
    );
  }

  // ============ Schema Snapshot Operations ============

  private async getSchemaSnapshots(
    _request: void,
    _ctx: HandlerContext
  ): Promise<GetSchemaSnapshotsResponse> {
    this.log('info', 'Getting all schema snapshots');
    const snapshots = getSchemaSnapshots();
    return { success: true, snapshots };
  }

  private async getSchemaSnapshot(
    request: GetSchemaSnapshotRequest,
    _ctx: HandlerContext
  ): Promise<GetSchemaSnapshotResponse> {
    this.log('info', 'Getting schema snapshot', {
      snapshotId: request.snapshotId,
    });
    const snapshot = getSchemaSnapshot(request.snapshotId);
    return { success: true, snapshot: snapshot ?? undefined };
  }

  private async saveSchemaSnapshot(
    request: SaveSchemaSnapshotRequest,
    _ctx: HandlerContext
  ): Promise<SaveSchemaSnapshotResponse> {
    this.log('info', 'Saving schema snapshot', { name: request.name });

    const snapshotData: SchemaSnapshot = {
      id: crypto.randomUUID(),
      name: request.name || 'Unnamed Snapshot',
      schemas: request.schema || [],
      connectionPath: request.connectionPath || '',
      description: request.description,
      createdAt: new Date().toISOString(),
    };

    saveSchemaSnapshot(snapshotData);
    return { success: true, snapshot: snapshotData };
  }

  private async deleteSchemaSnapshot(
    request: DeleteSchemaSnapshotRequest,
    _ctx: HandlerContext
  ): Promise<DeleteSchemaSnapshotResponse> {
    this.log('info', 'Deleting schema snapshot', {
      snapshotId: request.snapshotId,
    });
    deleteSchemaSnapshot(request.snapshotId);
    return { success: true };
  }

  // ============ Schema Comparison Operations ============

  private async compareSnapshots(
    request: CompareSnapshotsRequest,
    _ctx: HandlerContext
  ): Promise<CompareSnapshotsResponse> {
    const snapshotId1 = request.snapshotId1 || request.sourceSnapshotId || '';
    const snapshotId2 = request.snapshotId2 || request.targetSnapshotId || '';

    this.log('info', 'Comparing snapshots', { snapshotId1, snapshotId2 });

    const snapshot1 = getSchemaSnapshot(snapshotId1);
    const snapshot2 = getSchemaSnapshot(snapshotId2);

    if (!snapshot1 || !snapshot2) {
      return {
        success: false,
        error: 'One or both snapshots not found',
      };
    }

    const comparison = schemaComparisonService.compareSchemas(
      snapshot1.schemas || snapshot1.schema || [],
      snapshot2.schemas || snapshot2.schema || [],
      snapshot1.id,
      snapshot1.name,
      'snapshot',
      snapshot2.id,
      snapshot2.name,
      'snapshot'
    );

    return { success: true, comparison };
  }

  private async compareConnections(
    request: CompareConnectionsRequest,
    _ctx: HandlerContext
  ): Promise<CompareConnectionsResponse> {
    const connectionId1 =
      request.connectionId1 || request.sourceConnectionId || '';
    const connectionId2 =
      request.connectionId2 || request.targetConnectionId || '';

    this.log('info', 'Comparing connections', { connectionId1, connectionId2 });

    const schema1 = databaseService.getSchema(connectionId1);
    const schema2 = databaseService.getSchema(connectionId2);

    if (!schema1.success || !schema2.success) {
      return {
        success: false,
        error: 'Failed to fetch schemas',
      };
    }

    const comparison = schemaComparisonService.compareSchemas(
      schema1.schemas || [],
      schema2.schemas || [],
      connectionId1,
      connectionId1,
      'connection',
      connectionId2,
      connectionId2,
      'connection'
    );

    return { success: true, comparison };
  }

  private async compareConnectionToSnapshot(
    request: CompareConnectionToSnapshotRequest,
    _ctx: HandlerContext
  ): Promise<CompareConnectionToSnapshotResponse> {
    const connectionId = request.connectionId || '';
    const snapshotId = request.snapshotId || '';

    this.log('info', 'Comparing connection to snapshot', {
      connectionId,
      snapshotId,
    });

    const liveSchema = databaseService.getSchema(connectionId);
    const snapshot = getSchemaSnapshot(snapshotId);

    if (!liveSchema.success) {
      return {
        success: false,
        error: 'Failed to fetch schema',
      };
    }

    if (!snapshot) {
      return {
        success: false,
        error: 'Snapshot not found',
      };
    }

    const comparison = schemaComparisonService.compareSchemas(
      liveSchema.schemas || [],
      snapshot.schemas || snapshot.schema || [],
      connectionId,
      connectionId,
      'connection',
      snapshot.id,
      snapshot.name,
      'snapshot'
    );

    return { success: true, comparison };
  }

  private async compareTables(
    request: CompareTablesRequest,
    _ctx: HandlerContext
  ): Promise<CompareTablesResponse> {
    const connectionId1 =
      request.connectionId1 || request.sourceConnectionId || '';
    const connectionId2 =
      request.connectionId2 || request.targetConnectionId || '';
    const table1 = request.table1 || request.sourceTable || '';
    const table2 = request.table2 || request.targetTable || '';
    const schema1 = request.schema1 || request.sourceSchema || '';
    const schema2 = request.schema2 || request.targetSchema || '';

    this.log('info', 'Comparing tables', {
      connectionId1,
      table1,
      connectionId2,
      table2,
    });

    const comparison = await dataDiffService.compareTableData(
      connectionId1,
      table1,
      schema1,
      connectionId2,
      table2,
      schema2,
      request.primaryKeys || []
    );

    return { success: true, comparison };
  }

  private async generateMigrationSQL(
    request: GenerateMigrationSQLRequest,
    _ctx: HandlerContext
  ): Promise<GenerateMigrationSQLResponse> {
    this.log('info', 'Generating migration SQL');
    const result = migrationGeneratorService.generateMigrationSQL(request);
    return result;
  }

  private async generateSyncSQL(
    request: GenerateSyncSQLRequest,
    _ctx: HandlerContext
  ): Promise<GenerateSyncSQLResponse> {
    this.log('info', 'Generating sync SQL');
    const result = dataDiffSyncGeneratorService.generateSyncSQL(request);
    return result;
  }
}

// Export singleton instance
export const schemaHandler = new SchemaHandler();
