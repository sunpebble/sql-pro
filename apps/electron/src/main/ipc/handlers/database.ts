import type {
  AnalyzeQueryPlanRequest,
  AnalyzeQueryPlanResponse,
  ApplyChangesRequest,
  ApplyChangesResponse,
  BatchVectorSearchRequest,
  BatchVectorSearchResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  CloseDatabaseRequest,
  CloseDatabaseResponse,
  ExecuteQueryRequest,
  ExecuteQueryResponse,
  GetColumnDistributionRequest,
  GetColumnDistributionResponse,
  GetPointsWithVectorsRequest,
  GetPointsWithVectorsResponse,
  GetSchemaListRequest,
  GetSchemaListResponse,
  GetSchemaRequest,
  GetSchemaResponse,
  GetTableDataRequest,
  GetTableDataResponse,
  GetTableDetailsRequest,
  GetTableDetailsResponse,
  GetTableRowRangeRequest,
  GetTableRowRangeResponse,
  OpenDatabaseRequest,
  OpenDatabaseResponse,
  SearchSimilarRequest,
  SearchSimilarResponse,
  TestConnectionRequest,
  TestConnectionResponse,
  ValidateChangesRequest,
  ValidateChangesResponse,
  VectorSearchRequest,
  VectorSearchResponse,
} from '@shared/types';
import type { HandlerContext } from '../base/handler';
import { databaseManager, databaseService } from '../../services/database';
import { qdrantAdapter } from '../../services/database-adapters';
import { fileWatcherService } from '../../services/file-watcher';
import { pgNotifyService } from '../../services/pg-notify-service';
import { addRecentConnection } from '../../services/store';
import { IpcHandler } from '../base/handler';
import {
  changesChannels,
  databaseChannels,
  dataChannels,
  queryChannels,
  schemaChannels,
  vectorChannels,
} from '../contracts/all-channels';

// Regex to detect modifying SQL keywords
const MODIFYING_KEYWORDS_REGEX =
  /^\s*(?:INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TRUNCATE|REPLACE)/i;

export class DatabaseHandler extends IpcHandler {
  constructor() {
    super({ name: 'database' });
  }

  register(): void {
    // Database connection operations
    this.handle(
      databaseChannels.testConnection,
      this.testConnection.bind(this)
    );
    this.handle(databaseChannels.open, this.openDatabase.bind(this));
    this.handle(databaseChannels.close, this.closeDatabase.bind(this));
    this.handle(
      databaseChannels.changePassword,
      this.changePassword.bind(this)
    );

    // Schema operations
    this.handle(schemaChannels.get, this.getSchema.bind(this));
    this.handle(schemaChannels.getList, this.getSchemaList.bind(this));
    this.handle(
      schemaChannels.getTableDetails,
      this.getTableDetails.bind(this)
    );

    // Data operations
    this.handle(dataChannels.getTableData, this.getTableData.bind(this));
    this.handle(
      dataChannels.getTableRowRange,
      this.getTableRowRange.bind(this)
    );
    this.handle(
      dataChannels.getColumnDistribution,
      this.getColumnDistribution.bind(this)
    );

    // Query operations
    this.handle(queryChannels.execute, this.executeQuery.bind(this));
    this.handle(queryChannels.analyzePlan, this.analyzeQueryPlan.bind(this));

    // Change operations
    this.handle(changesChannels.validate, this.validateChanges.bind(this));
    this.handle(changesChannels.apply, this.applyChanges.bind(this));

    // Vector search operations
    this.handle(vectorChannels.search, this.vectorSearch.bind(this));
    this.handle(vectorChannels.searchSimilar, this.searchSimilar.bind(this));
    this.handle(vectorChannels.batchSearch, this.batchVectorSearch.bind(this));
    this.handle(vectorChannels.getPoints, this.getPointsWithVectors.bind(this));
  }

  // ============ Database Connection Operations ============

  private async testConnection(
    request: TestConnectionRequest,
    _ctx: HandlerContext
  ): Promise<TestConnectionResponse> {
    this.log('info', 'Testing database connection', {
      databaseType: request.config.type,
    });
    return databaseManager.testConnection(request.config);
  }

  private async openDatabase(
    request: OpenDatabaseRequest,
    _ctx: HandlerContext
  ): Promise<OpenDatabaseResponse> {
    // New-style connection with config
    if (request.config) {
      this.log('info', 'Opening database', {
        databaseType: request.config.type,
        readOnly: request.config.readOnly,
      });

      const result = await databaseManager.open(request.config);

      if (result.success && result.connection) {
        this.log('info', 'Database opened successfully', {
          connectionId: result.connection.id,
          databaseType: result.connection.databaseType,
        });

        addRecentConnection(
          result.connection.path,
          result.connection.filename,
          result.connection.isEncrypted,
          result.connection.databaseType,
          request.config.name,
          request.config.readOnly,
          request.config
        );

        // Start file watching for SQLite
        if (result.connection.databaseType === 'sqlite') {
          fileWatcherService.watch(
            result.connection.id,
            result.connection.path
          );
        }

        // Register for PostgreSQL LISTEN/NOTIFY
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

    // Legacy SQLite connection
    if (!request.path) {
      return {
        success: false,
        error: 'Database path is required',
        errorCode: 'CONNECTION_ERROR',
      };
    }

    this.log('info', 'Opening legacy SQLite database', { path: request.path });

    const result = await databaseService.open(
      request.path,
      request.password,
      request.readOnly
    );

    if (result.success && result.connection) {
      addRecentConnection(
        request.path,
        result.connection.filename,
        result.connection.isEncrypted,
        'sqlite'
      );
      fileWatcherService.watch(result.connection.id, request.path);
    }

    return result;
  }

  private async closeDatabase(
    request: CloseDatabaseRequest,
    _ctx: HandlerContext
  ): Promise<CloseDatabaseResponse> {
    this.log('info', 'Closing database', {
      connectionId: request.connectionId,
    });

    // Stop file watching
    fileWatcherService.unwatch(request.connectionId);

    // Unregister from pg notify
    pgNotifyService.unregisterConnection(request.connectionId);

    // Close via manager first, fall back to service
    const managerResult = databaseManager.close(request.connectionId);
    if (managerResult.success) {
      return managerResult;
    }

    return databaseService.close(request.connectionId);
  }

  private async changePassword(
    request: ChangePasswordRequest,
    _ctx: HandlerContext
  ): Promise<ChangePasswordResponse> {
    this.log('info', 'Changing database password', {
      connectionId: request.connectionId,
    });
    // databaseService.changePassword only takes connectionId and newPassword
    // currentPassword verification should be done before calling this
    return databaseService.changePassword(
      request.connectionId,
      request.newPassword
    );
  }

  // ============ Schema Operations ============

  private async getSchema(
    request: GetSchemaRequest,
    _ctx: HandlerContext
  ): Promise<GetSchemaResponse> {
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

  private async getSchemaList(
    request: GetSchemaListRequest,
    _ctx: HandlerContext
  ): Promise<GetSchemaListResponse> {
    // Check if connection is async (MySQL/PostgreSQL)
    if (databaseManager.isAsyncConnection(request.connectionId)) {
      // For async connections, use full schema
      return databaseManager.getSchemaAsync(request.connectionId);
    }

    // Try database manager for new connections
    const conn = databaseManager.getConnection(request.connectionId);
    if (conn) {
      return databaseManager.getSchema(request.connectionId);
    }

    // Fall back to legacy database service with lightweight schema list
    return databaseService.getSchemaList(request.connectionId);
  }

  private async getTableDetails(
    request: GetTableDetailsRequest,
    _ctx: HandlerContext
  ): Promise<GetTableDetailsResponse> {
    // Check if connection is async (MySQL/PostgreSQL)
    if (databaseManager.isAsyncConnection(request.connectionId)) {
      const schemaResult = await databaseManager.getSchemaAsync(
        request.connectionId
      );
      if (!schemaResult.success) {
        return {
          success: false,
          error: schemaResult.error,
        };
      }
      if (!schemaResult.schemas) {
        return {
          success: false,
          error: 'Failed to get schema',
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

  // ============ Data Operations ============

  private async getTableData(
    request: GetTableDataRequest,
    _ctx: HandlerContext
  ): Promise<GetTableDataResponse> {
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

  private async getTableRowRange(
    request: GetTableRowRangeRequest,
    _ctx: HandlerContext
  ): Promise<GetTableRowRangeResponse> {
    // Check if connection is async (MySQL/PostgreSQL)
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
        return result as GetTableRowRangeResponse;
      }

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

    // Try database manager for new connections
    const conn = databaseManager.getConnection(request.connectionId);
    if (conn) {
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

  private async getColumnDistribution(
    request: GetColumnDistributionRequest,
    _ctx: HandlerContext
  ): Promise<GetColumnDistributionResponse> {
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

  // ============ Query Operations ============

  private async executeQuery(
    request: ExecuteQueryRequest,
    _ctx: HandlerContext
  ): Promise<ExecuteQueryResponse> {
    const isModifying = MODIFYING_KEYWORDS_REGEX.test(request.query);

    this.log('info', 'Executing query', {
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
        errorCode: 'QUERY_EXECUTION_ERROR',
        executionTime: Date.now() - startTime,
      };
    }
    let result: unknown;

    // Check if connection is async (MySQL/PostgreSQL)
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
    const r = result as Record<string, unknown>;

    if (r.success) {
      return {
        success: true,
        columns: r.columns as string[] | undefined,
        rows: r.rows as Record<string, unknown>[] | undefined,
        resultSets: r.resultSets as ExecuteQueryResponse['resultSets'],
        rowsAffected: (r.changes as number) ?? undefined,
        lastInsertRowId: (r.lastInsertRowid as number) ?? undefined,
        executionTime,
        executedStatements: r.executedStatements as number | undefined,
        totalChanges: r.totalChanges as number | undefined,
      };
    }

    return {
      success: false,
      error: r.error as string,
      errorCode: r.errorCode as ExecuteQueryResponse['errorCode'],
      errorPosition: r.errorPosition as ExecuteQueryResponse['errorPosition'],
      suggestions: r.suggestions as string[] | undefined,
      documentationUrl: r.documentationUrl as string | undefined,
      executionTime,
    };
  }

  private async analyzeQueryPlan(
    request: AnalyzeQueryPlanRequest,
    _ctx: HandlerContext
  ): Promise<AnalyzeQueryPlanResponse> {
    // Check if connection is async (MySQL/PostgreSQL)
    if (databaseManager.isAsyncConnection(request.connectionId)) {
      const result = await databaseManager.explainQueryAsync(
        request.connectionId,
        request.query
      );
      if (!result.success) {
        return { success: false, error: result.error };
      }
      // Wrap single plan node in array for response compatibility
      return {
        success: true,
        plan: [result.plan],
        stats: result.stats,
      };
    }

    // Try database manager for sync connections
    const conn = databaseManager.getConnection(request.connectionId);
    if (conn) {
      const result = databaseManager.explainQuery(
        request.connectionId,
        request.query
      );
      if (!result.success) {
        return { success: false, error: result.error };
      }
      return {
        success: true,
        plan: [result.plan],
        stats: result.stats,
      };
    }

    // Fall back to legacy database service
    const result = databaseService.analyzeQueryPlan(
      request.connectionId,
      request.query
    );
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return {
      success: true,
      plan: [result.plan],
      stats: result.stats,
    };
  }

  // ============ Change Operations ============

  private async validateChanges(
    request: ValidateChangesRequest,
    _ctx: HandlerContext
  ): Promise<ValidateChangesResponse> {
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

  private async applyChanges(
    request: ApplyChangesRequest,
    _ctx: HandlerContext
  ): Promise<ApplyChangesResponse> {
    // Get the connection to find the database path (for file watcher)
    const connection = databaseService.getConnection(request.connectionId);
    if (connection) {
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
    return databaseService.applyChanges(request.connectionId, request.changes);
  }

  // ============ Vector Search Operations ============

  private async vectorSearch(
    request: VectorSearchRequest,
    _ctx: HandlerContext
  ): Promise<VectorSearchResponse> {
    return qdrantAdapter.vectorSearch(
      request.connectionId,
      request.collection,
      {
        vector: request.vector,
        limit: request.limit,
        filter: request.filter,
        scoreThreshold: request.scoreThreshold,
      }
    );
  }

  private async searchSimilar(
    request: SearchSimilarRequest,
    _ctx: HandlerContext
  ): Promise<SearchSimilarResponse> {
    return qdrantAdapter.searchSimilar(
      request.connectionId,
      request.collection,
      request.pointId,
      request.limit,
      request.filter
    );
  }

  private async batchVectorSearch(
    request: BatchVectorSearchRequest,
    _ctx: HandlerContext
  ): Promise<BatchVectorSearchResponse> {
    // Use the adapter's batch search method
    return qdrantAdapter.batchVectorSearch(
      request.connectionId,
      request.collection,
      {
        vectors: request.vectors,
        limit: request.limit,
        filter: request.filter,
        scoreThreshold: request.scoreThreshold,
      }
    );
  }

  private async getPointsWithVectors(
    request: GetPointsWithVectorsRequest,
    _ctx: HandlerContext
  ): Promise<GetPointsWithVectorsResponse> {
    return qdrantAdapter.getPointsWithVectors(
      request.connectionId,
      request.collection,
      {
        limit: request.limit,
      }
    );
  }
}

// Export singleton instance
export const databaseHandler = new DatabaseHandler();
