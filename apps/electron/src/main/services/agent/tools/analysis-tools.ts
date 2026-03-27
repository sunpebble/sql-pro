// Analysis Tools for AI Agent
// Analyze tables, suggest indexes, compare data

import type { ToolExecutionResult } from '@shared/types/agent';
import { tool } from 'ai';
import { z } from 'zod';
import { isValidSqlIdentifier, sanitizeIdentifier } from '@/utils/sql-sanitize';
import { databaseService } from '../../database';
import { databaseManager } from '../../database-adapters/database-manager';

// Regex patterns for SQL analysis
const SQL_KEYWORDS_REGEX = /\b(?:ORDER|GROUP|LIMIT)\b/i;
const COLUMN_MATCH_REGEX = /["']?\w+["']?\s*[=<>]/g;
const COLUMN_CLEAN_REGEX = /[=<>'\s"]/g;
const JOIN_END_REGEX = /\b(?:WHERE|ORDER|JOIN|LEFT|RIGHT|INNER|OUTER|LIMIT)\b/i;

function getSqlDialect(connectionId: string): 'standard' | 'mysql' {
  const conn = databaseManager.getConnection(connectionId);
  return conn?.databaseType === 'mysql' ? 'mysql' : 'standard';
}

/**
 * Create table analysis tool
 */
export function createAnalyzeTableTool(connectionId: string) {
  return tool({
    description:
      'Analyze a table to get statistics like row count, data distribution, null percentages, and value ranges.',
    inputSchema: z.object({
      tableName: z.string().describe('Name of the table to analyze'),
      columns: z
        .array(z.string())
        .optional()
        .describe('Optional: Analyze only specific columns'),
      schema: z.string().optional().describe('Optional: Schema name'),
    }),
    execute: async ({
      tableName,
      columns,
      schema,
    }): Promise<ToolExecutionResult> => {
      try {
        const isAsync = databaseManager.isAsyncConnection(connectionId);
        const dialect = getSqlDialect(connectionId);

        if (!isValidSqlIdentifier(tableName)) {
          return { success: false, error: 'Invalid table name' };
        }
        if (
          schema !== undefined &&
          schema !== '' &&
          !isValidSqlIdentifier(schema)
        ) {
          return { success: false, error: 'Invalid schema name' };
        }

        const quotedTable = sanitizeIdentifier(tableName, dialect);
        const quotedSchema = schema
          ? sanitizeIdentifier(schema, dialect)
          : undefined;

        // Get row count
        const countSql = quotedSchema
          ? `SELECT COUNT(*) as total FROM ${quotedSchema}.${quotedTable}`
          : `SELECT COUNT(*) as total FROM ${quotedTable}`;

        let countResult;
        if (isAsync) {
          countResult = await databaseManager.queryAsync(
            connectionId,
            countSql
          );
        } else {
          // Try databaseManager first, fall back to databaseService for legacy SQLite
          countResult = databaseManager.query(connectionId, countSql);
          if (
            !countResult.success &&
            countResult.error === 'Connection not found'
          ) {
            countResult = databaseService.query(connectionId, countSql);
          }
        }

        if (!countResult.success) {
          return { success: false, error: countResult.error };
        }

        const firstRow = countResult.rows?.[0];
        const totalRows =
          firstRow && typeof firstRow === 'object' && 'total' in firstRow
            ? (firstRow as { total: number }).total
            : 0;

        // Get table structure
        let structureResult;
        if (isAsync) {
          structureResult = await databaseManager.getTableStructureAsync(
            connectionId,
            tableName,
            schema
          );
        } else {
          // Try databaseManager first, fall back to databaseService for legacy SQLite
          structureResult = databaseManager.getTableStructure(
            connectionId,
            tableName,
            schema
          );
          if (
            !structureResult.success &&
            structureResult.error === 'Connection not found'
          ) {
            structureResult = databaseService.getTableStructure(
              connectionId,
              tableName,
              schema
            );
          }
        }

        if (!structureResult.success) {
          return { success: false, error: structureResult.error };
        }

        const table = structureResult.structure;
        const targetColumns =
          columns || table.columns?.map((c: { name: string }) => c.name) || [];
        const columnStats: Record<string, unknown> = {};

        // Analyze each column (limit to prevent huge queries)
        for (const colName of targetColumns.slice(0, 10)) {
          if (!isValidSqlIdentifier(colName)) continue;

          const col = table.columns?.find(
            (c: { name: string }) => c.name === colName
          );
          if (!col) continue;

          const quotedFrom = quotedSchema
            ? `${quotedSchema}.${quotedTable}`
            : quotedTable;
          const quotedCol = sanitizeIdentifier(colName, dialect);
          const statsQuery = `
            SELECT
              COUNT(*) as total,
              COUNT(${quotedCol}) as non_null,
              COUNT(DISTINCT ${quotedCol}) as distinct_values
            FROM ${quotedFrom}
          `;

          let statsResult;
          if (isAsync) {
            statsResult = await databaseManager.queryAsync(
              connectionId,
              statsQuery
            );
          } else {
            // Try databaseManager first, fall back to databaseService for legacy SQLite
            statsResult = databaseManager.query(connectionId, statsQuery);
            if (
              !statsResult.success &&
              statsResult.error === 'Connection not found'
            ) {
              statsResult = databaseService.query(connectionId, statsQuery);
            }
          }

          if (statsResult.success && statsResult.rows?.[0]) {
            const statsRow = statsResult.rows[0] as unknown;
            if (
              statsRow &&
              typeof statsRow === 'object' &&
              !Array.isArray(statsRow)
            ) {
              const stats = statsRow as {
                total: number;
                non_null: number;
                distinct_values: number;
              };
              columnStats[colName] = {
                type: (col as { type: string }).type,
                total: stats.total,
                nonNull: stats.non_null,
                nullPercentage:
                  stats.total > 0
                    ? `${(
                        ((stats.total - stats.non_null) / stats.total) *
                        100
                      ).toFixed(2)}%`
                    : '0%',
                distinctValues: stats.distinct_values,
              };
            }
          }
        }

        return {
          success: true,
          data: {
            tableName,
            schema,
            totalRows,
            columns: columnStats,
          },
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to analyze table',
        };
      }
    },
  });
}

/**
 * Create index suggestion tool
 */
export function createSuggestIndexTool(connectionId: string) {
  return tool({
    description:
      'Analyze a SQL query and suggest indexes that could improve its performance.',
    inputSchema: z.object({
      sql: z
        .string()
        .describe('The SQL query to analyze for index suggestions'),
    }),
    execute: async ({ sql }): Promise<ToolExecutionResult> => {
      try {
        const isAsync = databaseManager.isAsyncConnection(connectionId);

        // Get execution plan
        let explainResult;
        if (isAsync) {
          explainResult = await databaseManager.explainQueryAsync(
            connectionId,
            sql
          );
        } else {
          // Try databaseManager first, fall back to databaseService for legacy SQLite
          explainResult = databaseManager.explainQuery(connectionId, sql);
          if (
            !explainResult.success &&
            explainResult.error === 'Connection not found'
          ) {
            explainResult = databaseService.explainQuery(connectionId, sql);
          }
        }

        // Parse WHERE, JOIN, ORDER BY clauses for column references
        const suggestions: string[] = [];

        // Simple heuristic: extract columns from WHERE clause
        const whereIdx = sql.toUpperCase().indexOf('WHERE');
        if (whereIdx !== -1) {
          const afterWhere = sql.slice(whereIdx + 5);
          // Find end of WHERE clause
          const endMatch = afterWhere.match(SQL_KEYWORDS_REGEX);
          const whereClause = endMatch
            ? afterWhere.slice(0, endMatch.index)
            : afterWhere;
          const columnMatches = whereClause.match(COLUMN_MATCH_REGEX);
          if (columnMatches) {
            columnMatches.forEach((match: string) => {
              const col = match.replace(COLUMN_CLEAN_REGEX, '');
              suggestions.push(`Consider index on column: ${col}`);
            });
          }
        }

        // Check ORDER BY
        const orderIdx = sql.toUpperCase().indexOf('ORDER BY');
        if (orderIdx !== -1) {
          const afterOrder = sql.slice(orderIdx + 8);
          const limitIdx = afterOrder.toUpperCase().indexOf('LIMIT');
          const orderClause =
            limitIdx !== -1 ? afterOrder.slice(0, limitIdx) : afterOrder;
          suggestions.push(
            `Consider index for ORDER BY: ${orderClause.trim()}`
          );
        }

        // Check JOIN conditions
        for (const joinExec of sql.matchAll(/\bJOIN\b/gi)) {
          const afterJoin = sql.slice(joinExec.index! + 4);
          const onIdx = afterJoin.toUpperCase().indexOf(' ON ');
          if (onIdx !== -1) {
            const afterOn = afterJoin.slice(onIdx + 4);
            const endIdx = afterOn.search(JOIN_END_REGEX);
            const onClause = endIdx !== -1 ? afterOn.slice(0, endIdx) : afterOn;
            if (onClause.trim()) {
              suggestions.push(`Consider index for JOIN: ${onClause.trim()}`);
            }
          }
        }

        return {
          success: true,
          data: {
            query: sql,
            executionPlan: explainResult?.success ? explainResult.plan : null,
            suggestions:
              suggestions.length > 0
                ? suggestions
                : ['No obvious index improvements detected'],
          },
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to suggest indexes',
        };
      }
    },
  });
}

/**
 * Create data comparison tool
 */
export function createCompareDataTool(connectionId: string) {
  return tool({
    description:
      'Compare data between two tables or query results to find differences.',
    inputSchema: z.object({
      sourceTable: z.string().optional().describe('Source table name'),
      sourceSql: z.string().optional().describe('Source SQL query'),
      targetTable: z.string().optional().describe('Target table name'),
      targetSql: z.string().optional().describe('Target SQL query'),
      keyColumns: z
        .array(z.string())
        .describe('Columns to use as comparison keys'),
    }),
    execute: async ({
      sourceTable,
      sourceSql,
      targetTable,
      targetSql,
      keyColumns,
    }): Promise<ToolExecutionResult> => {
      try {
        const isAsync = databaseManager.isAsyncConnection(connectionId);
        const dialect = getSqlDialect(connectionId);

        if (!sourceSql && !sourceTable) {
          return {
            success: false,
            error: 'Provide sourceTable or sourceSql',
          };
        }
        if (!targetSql && !targetTable) {
          return {
            success: false,
            error: 'Provide targetTable or targetSql',
          };
        }

        if (!sourceSql && sourceTable) {
          if (!isValidSqlIdentifier(sourceTable)) {
            return { success: false, error: 'Invalid source table name' };
          }
        }
        if (!targetSql && targetTable) {
          if (!isValidSqlIdentifier(targetTable)) {
            return { success: false, error: 'Invalid target table name' };
          }
        }
        for (const k of keyColumns) {
          if (!isValidSqlIdentifier(k)) {
            return {
              success: false,
              error: `Invalid key column name: ${k}`,
            };
          }
        }

        const sourceQuery =
          sourceSql ||
          `SELECT * FROM ${sanitizeIdentifier(sourceTable!, dialect)}`;
        const targetQuery =
          targetSql ||
          `SELECT * FROM ${sanitizeIdentifier(targetTable!, dialect)}`;

        // Get source and target data
        let sourceResult, targetResult;
        if (isAsync) {
          [sourceResult, targetResult] = await Promise.all([
            databaseManager.queryAsync(connectionId, sourceQuery),
            databaseManager.queryAsync(connectionId, targetQuery),
          ]);
        } else {
          // Try databaseManager first, fall back to databaseService for legacy SQLite
          sourceResult = databaseManager.query(connectionId, sourceQuery);
          if (
            !sourceResult.success &&
            sourceResult.error === 'Connection not found'
          ) {
            sourceResult = databaseService.query(connectionId, sourceQuery);
          }
          targetResult = databaseManager.query(connectionId, targetQuery);
          if (
            !targetResult.success &&
            targetResult.error === 'Connection not found'
          ) {
            targetResult = databaseService.query(connectionId, targetQuery);
          }
        }

        if (!sourceResult.success) {
          return {
            success: false,
            error: `Source query failed: ${sourceResult.error}`,
          };
        }
        if (!targetResult.success) {
          return {
            success: false,
            error: `Target query failed: ${targetResult.error}`,
          };
        }

        const sourceRows = ((sourceResult.rows || []) as unknown[]).filter(
          (row): row is Record<string, unknown> =>
            row !== null && typeof row === 'object' && !Array.isArray(row)
        );
        const targetRows = ((targetResult.rows || []) as unknown[]).filter(
          (row): row is Record<string, unknown> =>
            row !== null && typeof row === 'object' && !Array.isArray(row)
        );

        // Build key-based maps
        const makeKey = (row: Record<string, unknown>) =>
          keyColumns.map((k) => String(row[k] ?? '')).join('|');

        const sourceMap = new Map(sourceRows.map((r) => [makeKey(r), r]));
        const targetMap = new Map(targetRows.map((r) => [makeKey(r), r]));

        // Find differences
        const onlyInSource: unknown[] = [];
        const onlyInTarget: unknown[] = [];
        const different: unknown[] = [];

        sourceMap.forEach((row, key) => {
          if (!targetMap.has(key)) {
            onlyInSource.push(row);
          } else {
            const targetRow = targetMap.get(key);
            if (JSON.stringify(row) !== JSON.stringify(targetRow)) {
              different.push({ source: row, target: targetRow });
            }
          }
        });

        targetMap.forEach((row, key) => {
          if (!sourceMap.has(key)) {
            onlyInTarget.push(row);
          }
        });

        return {
          success: true,
          data: {
            sourceCount: sourceRows.length,
            targetCount: targetRows.length,
            onlyInSource: onlyInSource.slice(0, 100),
            onlyInTarget: onlyInTarget.slice(0, 100),
            different: different.slice(0, 100),
            summary: {
              onlyInSourceCount: onlyInSource.length,
              onlyInTargetCount: onlyInTarget.length,
              differentCount: different.length,
            },
          },
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to compare data',
        };
      }
    },
  });
}
