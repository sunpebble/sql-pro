import type {
  AnalyzeQueryPlanRequest,
  ApplyChangesRequest,
  BatchVectorSearchRequest,
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
import {
  IPC_CHANNELS,
  isPostgreSQLCompatibleDatabaseType,
} from '@shared/types';
import { ipcMain } from 'electron';
import { logger } from '../../lib/logger';
import { databaseManager, databaseService } from '../database';
import { qdrantAdapter } from '../database-adapters';
import { fileWatcherService } from '../file-watcher';
import { pgNotifyService } from '../pg-notify-service';
import { addRecentConnection } from '../store';

// Regex for detecting modifying SQL operations
const MODIFYING_KEYWORDS_REGEX =
  /^\s*(?:INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TRUNCATE|REPLACE)/i;

export function setupDatabaseHandlers(): void {
  // Database: Test Connection
  ipcMain.handle(
    IPC_CHANNELS.DB_TEST_CONNECTION,
    async (_event, request: TestConnectionRequest) => {
      logger.info('Testing database connection', {
        databaseType: request.config.type,
        hasPassword: !!request.config.password,
      });
      const result = await databaseManager.testConnection(request.config);
      if (result.success) {
        logger.info('Database connection test successful', {
          databaseType: request.config.type,
        });
      } else {
        logger.error('Database connection test failed', undefined, {
          databaseType: request.config.type,
          error: result.error,
        });
      }
      return result;
    }
  );

  // Database: Open
  ipcMain.handle(
    IPC_CHANNELS.DB_OPEN,
    async (_event, request: OpenDatabaseRequest) => {
      // Check if this is a new-style connection with config
      if (request.config) {
        logger.info('Opening database', {
          databaseType: request.config.type,
          hasPassword: !!request.config.password,
          readOnly: request.config.readOnly,
        });
        const result = await databaseManager.open(request.config);

        if (result.success && result.connection) {
          logger.info('Database opened successfully', {
            connectionId: result.connection.id,
            databaseType: result.connection.databaseType,
            isEncrypted: result.connection.isEncrypted,
          });
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
            isPostgreSQLCompatibleDatabaseType(result.connection.databaseType)
          ) {
            pgNotifyService.registerConnection(
              result.connection.id,
              request.config
            );
          }
        } else if (!result.success) {
          logger.error('Failed to open database', undefined, {
            databaseType: request.config.type,
            error: result.error,
          });
        }

        return result;
      }

      // Legacy SQLite connection (backward compatibility)
      if (!request.path) {
        logger.error('Database path is required for legacy connection');
        return {
          success: false,
          error: 'Database path is required',
          errorCode: 'CONNECTION_ERROR',
        };
      }

      logger.info('Opening legacy SQLite database', {
        path: request.path,
        hasPassword: !!request.password,
        readOnly: request.readOnly,
      });

      const result = await databaseService.open(
        request.path,
        request.password,
        request.readOnly
      );

      if (result.success) {
        logger.info('Legacy database opened successfully', {
          connectionId: result.connection.id,
          path: request.path,
        });
        addRecentConnection(
          request.path,
          result.connection.filename,
          result.connection.isEncrypted,
          'sqlite'
        );

        // Start watching the database file for external changes
        fileWatcherService.watch(result.connection.id, request.path);
      } else {
        logger.error('Failed to open legacy database', undefined, {
          path: request.path,
          error: result.error,
        });
      }

      return result;
    }
  );

  // Database: Close
  ipcMain.handle(
    IPC_CHANNELS.DB_CLOSE,
    async (_event, request: CloseDatabaseRequest) => {
      logger.info('Closing database', { connectionId: request.connectionId });

      // Stop watching the file before closing the connection
      fileWatcherService.unwatch(request.connectionId);

      // Unregister from LISTEN/NOTIFY
      pgNotifyService.unregisterConnection(request.connectionId);

      // Try database manager first (for new connections)
      const managerResult = databaseManager.close(request.connectionId);
      if (managerResult.success) {
        logger.info('Database closed successfully', {
          connectionId: request.connectionId,
        });
        return managerResult;
      }

      // Fall back to legacy database service
      const result = databaseService.close(request.connectionId);
      if (result.success) {
        logger.info('Legacy database closed successfully', {
          connectionId: request.connectionId,
        });
      } else {
        logger.error('Failed to close database', undefined, {
          connectionId: request.connectionId,
          error: result.error,
        });
      }
      return result;
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
      const isModifying = MODIFYING_KEYWORDS_REGEX.test(request.query);

      logger.info('Executing query', {
        connectionId: request.connectionId,
        queryLength: request.query.length,
        isModifying,
      });

      // Ignore file changes during our own writes
      if (isModifying) {
        const connection = databaseService.getConnection(request.connectionId);
        if (connection) {
          fileWatcherService.ignoreChanges(connection.path);
        }
      }

      const startTime = Date.now();
      if (request.params !== undefined && !Array.isArray(request.params)) {
        return {
          success: false,
          error: 'Query params must be an array when provided',
          errorCode: 'QUERY_EXECUTION_ERROR' as const,
          executionTime: Date.now() - startTime,
        };
      }

      // Check if connection is async (MySQL/PostgreSQL)
      let result: any;
      if (databaseManager.isAsyncConnection(request.connectionId)) {
        result = await databaseManager.executeQueryAsync(
          request.connectionId,
          request.query,
          request.params
        );
      } else {
        // Try database manager for new connections
        const conn = databaseManager.getConnection(request.connectionId);
        if (conn) {
          result = databaseManager.executeQuery(
            request.connectionId,
            request.query,
            request.params
          );
        } else {
          // Fall back to legacy database service
          result = databaseService.executeQuery(
            request.connectionId,
            request.query,
            request.params
          );
        }
      }

      const executionTime = Date.now() - startTime;

      // Map internal field names to API response format
      if (result.success) {
        logger.info('Query executed successfully', {
          connectionId: request.connectionId,
          executionTime,
          rowsAffected: 'changes' in result ? result.changes : undefined,
        });
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

      logger.error('Query execution failed', undefined, {
        connectionId: request.connectionId,
        executionTime,
        error: result.error,
        errorCode: 'errorCode' in result ? result.errorCode : undefined,
      });

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
    IPC_CHANNELS.TABLE_GET_COLUMN_DISTRIBUTION,
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

  // Qdrant Vector Search: Batch search with multiple vectors
  ipcMain.handle(
    IPC_CHANNELS.DB_BATCH_VECTOR_SEARCH,
    async (_event, request: BatchVectorSearchRequest) => {
      return qdrantAdapter.batchVectorSearch(
        request.connectionId,
        request.collection,
        {
          vectors: request.vectors,
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
