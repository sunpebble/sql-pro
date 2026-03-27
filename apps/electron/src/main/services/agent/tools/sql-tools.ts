// SQL Tools for AI Agent
// Execute SQL, get schema, explain queries

import type {
  AgentExecutionSettings,
  SqlOperationType,
  ToolExecutionResult,
} from '@shared/types/agent';
import { tool } from 'ai';
import { z } from 'zod';
import { databaseService } from '../../database';
import { databaseManager } from '../../database-adapters/database-manager';

// Regex for DDL operations
const DDL_REGEX = /^(?:CREATE|ALTER|DROP|TRUNCATE|RENAME)/;

/**
 * Detect SQL operation type from query string
 */
export function detectSqlOperationType(sql: string): SqlOperationType {
  const trimmed = sql.trim().toUpperCase();
  if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH'))
    return 'SELECT';
  if (trimmed.startsWith('INSERT')) return 'INSERT';
  if (trimmed.startsWith('UPDATE')) return 'UPDATE';
  if (trimmed.startsWith('DELETE')) return 'DELETE';
  if (DDL_REGEX.test(trimmed)) return 'DDL';
  return 'OTHER';
}

/**
 * Check if operation requires user confirmation based on settings
 */
export function requiresConfirmation(
  operationType: SqlOperationType,
  settings: AgentExecutionSettings
): boolean {
  switch (operationType) {
    case 'SELECT':
      return !settings.autoExecuteSelect;
    case 'INSERT':
      return !settings.autoExecuteInsert;
    case 'UPDATE':
      return !settings.autoExecuteUpdate;
    case 'DELETE':
      return !settings.autoExecuteDelete;
    case 'DDL':
      return settings.confirmDDL;
    default:
      return true;
  }
}

/**
 * Create SQL execution tool
 */
export function createExecuteSqlTool(
  connectionId: string,
  settings: AgentExecutionSettings
) {
  return tool({
    description:
      'Execute a SQL query on the current database connection. Returns query results or affected row count.',
    inputSchema: z.object({
      sql: z.string().describe('The SQL query to execute'),
      params: z
        .array(z.unknown())
        .optional()
        .describe('Optional query parameters'),
    }),
    execute: async ({ sql, params }): Promise<ToolExecutionResult> => {
      const operationType = detectSqlOperationType(sql);

      if (requiresConfirmation(operationType, settings)) {
        return {
          success: false,
          error: `CONFIRMATION_REQUIRED:${operationType}:${sql}`,
        };
      }

      try {
        const startTime = Date.now();
        const isAsync = databaseManager.isAsyncConnection(connectionId);

        let result;
        if (isAsync) {
          result = await databaseManager.queryAsync(connectionId, sql, params);
        } else {
          // Try databaseManager first, fall back to databaseService for legacy SQLite
          result = databaseManager.query(connectionId, sql, params);
          if (!result.success && result.error === 'Connection not found') {
            result = databaseService.query(connectionId, sql, params);
          }
        }

        const executionTime = Date.now() - startTime;

        if (!result.success) {
          return { success: false, error: result.error };
        }

        return {
          success: true,
          data: result.rows,
          rowCount: result.rows?.length ?? 0,
          executionTime,
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Query execution failed',
        };
      }
    },
  });
}

/**
 * Create schema retrieval tool
 */
export function createGetSchemaTool(connectionId: string) {
  return tool({
    description:
      'Get the database schema including tables, columns, indexes, and relationships.',
    inputSchema: z.object({
      tableName: z
        .string()
        .optional()
        .describe('Optional: Get schema for a specific table only'),
    }),
    execute: async ({ tableName }): Promise<ToolExecutionResult> => {
      try {
        const isAsync = databaseManager.isAsyncConnection(connectionId);

        let schemaResult;
        if (isAsync) {
          schemaResult = await databaseManager.getSchemaAsync(connectionId);
        } else {
          // Try databaseManager first, fall back to databaseService for legacy SQLite
          schemaResult = databaseManager.getSchema(connectionId);
          if (
            !schemaResult.success &&
            schemaResult.error === 'Connection not found'
          ) {
            schemaResult = databaseService.getSchema(connectionId);
          }
        }

        if (!schemaResult.success) {
          return { success: false, error: schemaResult.error };
        }

        if (tableName) {
          const table = schemaResult.tables?.find(
            (t: { name: string }) => t.name === tableName
          );
          if (!table) {
            return { success: false, error: `Table '${tableName}' not found` };
          }
          return { success: true, data: table };
        }

        return {
          success: true,
          data: {
            schemas: schemaResult.schemas,
            tables: schemaResult.tables,
            views: schemaResult.views,
          },
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to get schema',
        };
      }
    },
  });
}

/**
 * Create query explain tool
 */
export function createExplainQueryTool(connectionId: string) {
  return tool({
    description:
      'Analyze the execution plan of a SQL query to understand performance characteristics.',
    inputSchema: z.object({
      sql: z.string().describe('The SQL query to analyze'),
    }),
    execute: async ({ sql }): Promise<ToolExecutionResult> => {
      try {
        const isAsync = databaseManager.isAsyncConnection(connectionId);

        let result;
        if (isAsync) {
          result = await databaseManager.explainQueryAsync(connectionId, sql);
        } else {
          // Try databaseManager first, fall back to databaseService for legacy SQLite
          result = databaseManager.explainQuery(connectionId, sql);
          if (!result.success && result.error === 'Connection not found') {
            result = databaseService.explainQuery(connectionId, sql);
          }
        }

        if (!result.success) {
          return { success: false, error: result.error };
        }

        return {
          success: true,
          data: {
            plan: result.plan,
            stats: result.stats,
          },
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to explain query',
        };
      }
    },
  });
}
