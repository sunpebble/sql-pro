import type {
  AnalyzeQueryPlanRequest,
  ApplyChangesRequest,
  ChangePasswordRequest,
  CloseDatabaseRequest,
  ExecuteQueryRequest,
  GetColumnDistributionRequest,
  GetPointsWithVectorsRequest,
  GetSchemaListRequest,
  GetSchemaRequest,
  GetTableDataRequest,
  GetTableDetailsRequest,
  GetTableRowRangeRequest,
  OpenDatabaseRequest,
  SearchSimilarRequest,
  TestConnectionRequest,
  ValidateChangesRequest,
  VectorSearchRequest,
} from '@shared/types';
import { IPC_CHANNELS } from '@shared/types';
import { ipcMain } from 'electron';
import { databaseManager, databaseService } from '../database';
import { qdrantAdapter } from '../database-adapters';
import { fileWatcherService } from '../file-watcher';
import { pgNotifyService } from '../pg-notify-service';
import { addRecentConnection } from '../store';

export function setupDatabaseHandlers(): void {
  // Database: Test Connection
  ipcMain.handle(
    IPC_CHANNELS.DB_TEST_CONNECTION,
    async (_event, request: TestConnectionRequest) => {
      return databaseManager.testConnection(request.config);
    }
  );

  // Database: Open
  ipcMain.handle(
    IPC_CHANNELS.DB_OPEN,
    async (_event, request: OpenDatabaseRequest) => {
      // Check if this is a new-style connection with config
      if (request.config) {
        const result = await databaseManager.open(request.config);

        if (result.success && result.connection) {
          addRecentConnection(
            result.connection.path,
            result.connection.filename,
            result.connection.isEncrypted,
            result.connection.databaseType,
            request.config.name, // displayName
            request.config.readOnly, // readOnly
            request.config // connectionConfig - save full config for edit mode
          );

          // Start watching the database file for external changes (SQLite only)
          if (result.connection.databaseType === 'sqlite') {
            fileWatcherService.watch(
              result.connection.id,
              result.connection.path
            );
          }

          // Register for LISTEN/NOTIFY (PostgreSQL/Supabase only)
          if (
            result.connection.databaseType === 'postgresql' ||
            result.connection.databaseType === 'supabase'
          ) {
            pgNotifyService.registerConnection(
              result.connection.id,
              request.config
            );
          }
        }

        return result;
      }

      // Legacy SQLite connection (backward compatibility)
      if (!request.path) {
        return {
          success: false,
          error: 'Database path is required',
          errorCode: 'CONNECTION_ERROR',
        };
      }

      const result = await databaseService.open(
        request.path,
        request.password,
        request.readOnly
      );

      if (result.success) {
        addRecentConnection(
          request.path,
          result.connection.filename,
          result.connection.isEncrypted,
          'sqlite'
        );

        // Start watching the database file for external changes
        fileWatcherService.watch(result.connection.id, request.path);
      }

      return result;
    }
  );

  // Database: Close
  ipcMain.handle(
    IPC_CHANNELS.DB_CLOSE,
    async (_event, request: CloseDatabaseRequest) => {
      // Stop watching the file before closing the connection
      fileWatcherService.unwatch(request.connectionId);

      // Unregister from LISTEN/NOTIFY
      pgNotifyService.unregisterConnection(request.connectionId);

      // Try database manager first (for new connections)
      const managerResult = databaseManager.close(request.connectionId);
      if (managerResult.success) {
        return managerResult;
      }

      // Fall back to legacy database service
      return databaseService.close(request.connectionId);
    }
  );

  // Database: Get Schema
  ipcMain.handle(
    IPC_CHANNELS.DB_GET_SCHEMA,
    async (_event, request: GetSchemaRequest) => {
      // Check if connection is async (MySQL/PostgreSQL)
      if (databaseManager.isAsyncConnection(request.connectionId)) {
        return databaseManager.getSchemaAsync(request.connectionId);
      }

      // Try database manager for new connections
      const managerResult = databaseManager.getSchema(request.connectionId);
      if (
        managerResult.success ||
        managerResult.error !== 'Connection not found'
      ) {
        return managerResult;
      }

      // Fall back to legacy database service
      return databaseService.getSchema(request.connectionId);
    }
  );

  // Database: Get Schema List (lightweight, only table/view names)
  ipcMain.handle(
    IPC_CHANNELS.DB_GET_SCHEMA_LIST,
    async (_event, request: GetSchemaListRequest) => {
      // Check if connection is async (MySQL/PostgreSQL)
      if (databaseManager.isAsyncConnection(request.connectionId)) {
        // For async connections, use full schema (async adapters don't have lazy loading yet)
        return databaseManager.getSchemaAsync(request.connectionId);
      }

      // Try database manager for new connections
      const conn = databaseManager.getConnection(request.connectionId);
      if (conn) {
        // For now, use full schema since manager doesn't have getSchemaList yet
        return databaseManager.getSchema(request.connectionId);
      }

      // Fall back to legacy database service with lightweight schema list
      return databaseService.getSchemaList(request.connectionId);
    }
  );

  // Database: Get Table Details (on-demand loading)
  ipcMain.handle(
    IPC_CHANNELS.DB_GET_TABLE_DETAILS,
    async (_event, request: GetTableDetailsRequest) => {
      // Check if connection is async (MySQL/PostgreSQL)
      if (databaseManager.isAsyncConnection(request.connectionId)) {
        // For async connections, get table structure
        const schemaResult = await databaseManager.getSchemaAsync(
          request.connectionId
        );
        if (!schemaResult.success) {
          return {
            success: false,
            error: schemaResult.error || 'Failed to get schema',
          };
        }

        if (!schemaResult.schemas) {
          return {
            success: false,
            error: 'No schemas found',
          };
        }

        // Find the requested table
        const schema = request.schema || 'main';
        for (const schemaInfo of schemaResult.schemas) {
          if (schemaInfo.name === schema) {
            const table = [...schemaInfo.tables, ...schemaInfo.views].find(
              (t) => t.name === request.tableName
            );
            if (table) {
              return { success: true, table };
            }
          }
        }

        return {
          success: false,
          error: `Table "${request.tableName}" not found`,
        };
      }

      // Try database manager for new connections
      const conn = databaseManager.getConnection(request.connectionId);
      if (conn) {
        // Use the manager's getTableStructure for now
        return databaseManager.getTableStructure(
          request.connectionId,
          request.tableName,
          request.schema
        );
      }

      // Fall back to legacy database service
      return databaseService.getTableDetails(
        request.connectionId,
        request.tableName,
        request.schema
      );
    }
  );

  // Database: Get Table Data
  ipcMain.handle(
    IPC_CHANNELS.DB_GET_TABLE_DATA,
    async (_event, request: GetTableDataRequest) => {
      // Check if connection is async (MySQL/PostgreSQL)
      if (databaseManager.isAsyncConnection(request.connectionId)) {
        return databaseManager.getTableDataAsync(
          request.connectionId,
          request.table,
          request.page,
          request.pageSize,
          request.sortColumn,
          request.sortDirection,
          request.filters,
          request.schema
        );
      }

      // Try database manager for new connections
      const conn = databaseManager.getConnection(request.connectionId);
      if (conn) {
        return databaseManager.getTableData(
          request.connectionId,
          request.table,
          request.page,
          request.pageSize,
          request.sortColumn,
          request.sortDirection,
          request.filters,
          request.schema
        );
      }

      // Fall back to legacy database service
      return databaseService.getTableData(
        request.connectionId,
        request.table,
        request.page,
        request.pageSize,
        request.sortColumn,
        request.sortDirection,
        request.filters,
        request.schema
      );
    }
  );

  // Database: Get Table Row Range (for virtual scrolling)
  ipcMain.handle(
    IPC_CHANNELS.DB_GET_TABLE_ROW_RANGE,
    async (_event, request: GetTableRowRangeRequest) => {
      // Check if connection is async (MySQL/PostgreSQL)
      // For now, async adapters don't support row range - fall back to regular data fetch
      if (databaseManager.isAsyncConnection(request.connectionId)) {
        // Convert row range to page/pageSize for async connections
        const pageSize = request.endRow - request.startRow;
        const page = Math.floor(request.startRow / pageSize) + 1;

        const result = await databaseManager.getTableDataAsync(
          request.connectionId,
          request.table,
          page,
          pageSize,
          request.sortColumn,
          request.sortDirection,
          request.filters,
          request.schema
        );

        if (!result.success) {
          return result;
        }

        // Transform to row range response format
        return {
          success: true,
          columns: result.columns,
          rows: result.rows,
          totalRows: result.totalRows,
          isEstimatedTotal: false,
          actualStartRow: request.startRow,
          actualEndRow: request.startRow + (result.rows?.length || 0),
        };
      }

      // Try database manager for new connections (SQLite adapter)
      const conn = databaseManager.getConnection(request.connectionId);
      if (conn) {
        // Use the database manager's getTableRowRange method
        return databaseManager.getTableRowRange(
          request.connectionId,
          request.table,
          request.startRow,
          request.endRow,
          request.sortColumn,
          request.sortDirection,
          request.filters,
          request.schema
        );
      }

      // Fall back to legacy database service
      return databaseService.getTableRowRange(
        request.connectionId,
        request.table,
        request.startRow,
        request.endRow,
        request.sortColumn,
        request.sortDirection,
        request.filters,
        request.schema
      );
    }
  );

  // Database: Execute Query
  ipcMain.handle(
    IPC_CHANNELS.DB_EXECUTE_QUERY,
    async (_event, request: ExecuteQueryRequest) => {
      // Check if this is a modifying query (INSERT, UPDATE, DELETE, etc.)
      const modifyingKeywords =
        /^\s*(?:INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TRUNCATE|REPLACE)/i;
      const isModifying = modifyingKeywords.test(request.query);

      // Ignore file changes during our own writes
      if (isModifying) {
        const connection = databaseService.getConnection(request.connectionId);
        if (connection) {
          fileWatcherService.ignoreChanges(connection.path);
        }
      }

      const startTime = Date.now();

      // Check if connection is async (MySQL/PostgreSQL)
      let result;
      if (databaseManager.isAsyncConnection(request.connectionId)) {
        result = await databaseManager.executeQueryAsync(
          request.connectionId,
          request.query
        );
      } else {
        // Try database manager for new connections
        const conn = databaseManager.getConnection(request.connectionId);
        if (conn) {
          result = databaseManager.executeQuery(
            request.connectionId,
            request.query
          );
        } else {
          // Fall back to legacy database service
          result = databaseService.executeQuery(
            request.connectionId,
            request.query
          );
        }
      }

      const executionTime = Date.now() - startTime;

      // Map internal field names to API response format
      if (result.success) {
        return {
          success: true,
          columns: 'columns' in result ? result.columns : undefined,
          rows: 'rows' in result ? result.rows : undefined,
          resultSets: 'resultSets' in result ? result.resultSets : undefined,
          rowsAffected: 'changes' in result ? result.changes : undefined,
          lastInsertRowId:
            'lastInsertRowid' in result ? result.lastInsertRowid : undefined,
          executionTime,
          executedStatements:
            'executedStatements' in result
              ? result.executedStatements
              : undefined,
          totalChanges:
            'totalChanges' in result ? result.totalChanges : undefined,
        };
      }

      return {
        success: false,
        error: result.error,
        errorCode: 'errorCode' in result ? result.errorCode : undefined,
        errorPosition:
          'errorPosition' in result ? result.errorPosition : undefined,
        troubleshootingSteps:
          'troubleshootingSteps' in result
            ? result.troubleshootingSteps
            : undefined,
        documentationUrl:
          'documentationUrl' in result ? result.documentationUrl : undefined,
        executionTime,
      };
    }
  );

  // Database: Validate Changes
  ipcMain.handle(
    IPC_CHANNELS.DB_VALIDATE_CHANGES,
    async (_event, request: ValidateChangesRequest) => {
      // Try database manager first
      const conn = databaseManager.getConnection(request.connectionId);
      if (conn) {
        return databaseManager.validateChanges(
          request.connectionId,
          request.changes
        );
      }

      // Fall back to legacy database service
      return databaseService.validateChanges(
        request.connectionId,
        request.changes
      );
    }
  );

  // Database: Apply Changes
  ipcMain.handle(
    IPC_CHANNELS.DB_APPLY_CHANGES,
    async (_event, request: ApplyChangesRequest) => {
      // Get the connection to find the database path (for file watcher)
      const connection = databaseService.getConnection(request.connectionId);
      if (connection) {
        // Ignore file changes during our own writes
        fileWatcherService.ignoreChanges(connection.path);
      }

      // Check if connection is async (MySQL/PostgreSQL)
      if (databaseManager.isAsyncConnection(request.connectionId)) {
        return databaseManager.applyChangesAsync(
          request.connectionId,
          request.changes
        );
      }

      // Try database manager first
      const conn = databaseManager.getConnection(request.connectionId);
      if (conn) {
        return databaseManager.applyChanges(
          request.connectionId,
          request.changes
        );
      }

      // Fall back to legacy database service
      return databaseService.applyChanges(
        request.connectionId,
        request.changes
      );
    }
  );

  // Database: Analyze Query Plan
  ipcMain.handle(
    IPC_CHANNELS.DB_ANALYZE_PLAN,
    async (_event, request: AnalyzeQueryPlanRequest) => {
      // Check if connection is async (MySQL/PostgreSQL)
      if (databaseManager.isAsyncConnection(request.connectionId)) {
        return databaseManager.explainQueryAsync(
          request.connectionId,
          request.query
        );
      }

      // Try database manager first
      const conn = databaseManager.getConnection(request.connectionId);
      if (conn) {
        return databaseManager.explainQuery(
          request.connectionId,
          request.query
        );
      }

      // Fall back to legacy database service
      return databaseService.analyzeQueryPlan(
        request.connectionId,
        request.query
      );
    }
  );

  // Database: Change Password
  ipcMain.handle(
    IPC_CHANNELS.DB_CHANGE_PASSWORD,
    async (_event, request: ChangePasswordRequest) => {
      // Only SQLite databases support password change via PRAGMA rekey
      // Check if this is a legacy SQLite connection
      const conn = databaseService.getConnection(request.connectionId);
      if (conn) {
        return databaseService.changePassword(
          request.connectionId,
          request.newPassword
        );
      }

      // For other database types, return an error
      return {
        success: false,
        error: 'Password change is only supported for SQLite databases',
        errorCode: 'ENCRYPTION_ERROR',
      };
    }
  );

  // Database: Get Column Distribution (full table aggregation)
  ipcMain.handle(
    'table:get-column-distribution',
    async (_event, request: GetColumnDistributionRequest) => {
      // Check if connection is async (MySQL/PostgreSQL)
      if (databaseManager.isAsyncConnection(request.connectionId)) {
        return databaseManager.getColumnDistribution(
          request.connectionId,
          request.table,
          request.column,
          request.schema,
          request.limit
        );
      }

      // Try database manager for new connections
      const conn = databaseManager.getConnection(request.connectionId);
      if (conn) {
        return databaseManager.getColumnDistribution(
          request.connectionId,
          request.table,
          request.column,
          request.schema,
          request.limit
        );
      }

      // Fall back to legacy database service
      return databaseService.getColumnDistribution(
        request.connectionId,
        request.table,
        request.column,
        request.schema,
        request.limit
      );
    }
  );

  // Qdrant Vector Search: Search by vector
  ipcMain.handle(
    IPC_CHANNELS.DB_VECTOR_SEARCH,
    async (_event, request: VectorSearchRequest) => {
      return qdrantAdapter.vectorSearch(
        request.connectionId,
        request.collection,
        {
          vector: request.vector,
          limit: request.limit,
          scoreThreshold: request.scoreThreshold,
          filter: request.filter,
          withPayload: request.withPayload,
          withVector: request.withVector,
        }
      );
    }
  );

  // Qdrant Vector Search: Search similar points by ID
  ipcMain.handle(
    IPC_CHANNELS.DB_SEARCH_SIMILAR,
    async (_event, request: SearchSimilarRequest) => {
      return qdrantAdapter.searchSimilar(
        request.connectionId,
        request.collection,
        request.pointId,
        request.limit,
        request.filter
      );
    }
  );

  // Qdrant Vector Search: Get points with vectors (for visualization)
  ipcMain.handle(
    IPC_CHANNELS.DB_GET_POINTS_WITH_VECTORS,
    async (_event, request: GetPointsWithVectorsRequest) => {
      return qdrantAdapter.getPointsWithVectors(
        request.connectionId,
        request.collection,
        {
          limit: request.limit,
          ids: request.ids,
        }
      );
    }
  );
}
