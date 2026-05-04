// Natural Language Query Handler
// Converts natural language to SQL using Vercel AI SDK generateObject

import type {
  AgentSettings,
  GeneratedSQL,
  QueryOptimization,
  SQLExplanation,
} from '@shared/types/agent';
import { isMySQLCompatibleDatabaseType } from '@shared/types';
import { generateObject } from 'ai';
import { z } from 'zod';
import { databaseManager } from '../database-adapters/database-manager';
import { createChatModel } from './model';
import { buildSQLExplanationPrompt } from './prompts/sql-explanation';
import { buildSQLGenerationPrompt } from './prompts/sql-generation';
import { buildSQLOptimizationPrompt } from './prompts/sql-optimization';

// Zod schemas for structured output
const GeneratedSQLSchema = z.object({
  sql: z.string().describe('The SQL query to execute'),
  explanation: z.string().describe('What this query does in plain English'),
  referencedTables: z.array(z.string()).describe('Tables used in the query'),
  isDestructive: z.boolean().describe('Whether query modifies data'),
});

const SQLExplanationSchema = z.object({
  summary: z.string().describe('Overall summary of what the query does'),
  components: z
    .array(
      z.object({
        type: z.enum([
          'select',
          'from',
          'join',
          'where',
          'group',
          'order',
          'limit',
          'other',
        ]),
        description: z.string(),
      })
    )
    .describe('Breakdown of query components'),
  tables: z
    .array(
      z.object({
        name: z.string(),
        role: z.string(),
      })
    )
    .describe('Tables involved and their roles'),
  performanceNotes: z
    .string()
    .optional()
    .describe('Performance considerations'),
});

const OptimizationSuggestionSchema = z.object({
  type: z.enum(['index', 'rewrite', 'schema', 'query-structure']),
  severity: z.enum(['info', 'warning', 'critical']),
  issue: z.string(),
  suggestion: z.string(),
  exampleSQL: z.string().optional(),
});

const QueryOptimizationSchema = z.object({
  originalQuery: z.string(),
  optimizedQuery: z.string().optional(),
  suggestions: z.array(OptimizationSuggestionSchema),
  estimatedImprovement: z.string().optional(),
});

/**
 * Get database dialect from connection
 */
function getDialect(connectionId: string): 'mysql' | 'postgresql' {
  const connType = databaseManager.getConnectionType(connectionId);
  if (isMySQLCompatibleDatabaseType(connType ?? undefined)) return 'mysql';
  return 'postgresql';
}

/**
 * Generate SQL from natural language
 */
export async function generateSQL(options: {
  connectionId: string;
  naturalLanguage: string;
  settings: AgentSettings;
}): Promise<GeneratedSQL> {
  const { connectionId, naturalLanguage, settings } = options;

  // Get schema for context
  const isAsync = databaseManager.isAsyncConnection(connectionId);
  const schemaResult = isAsync
    ? await databaseManager.getSchemaAsync(connectionId)
    : databaseManager.getSchema(connectionId);

  if (!schemaResult.success) {
    throw new Error(`Failed to retrieve schema: ${schemaResult.error}`);
  }

  const dialect = getDialect(connectionId);
  const { model } = createChatModel(settings.config);

  const result = await generateObject({
    model,
    schema: GeneratedSQLSchema,
    system: buildSQLGenerationPrompt(schemaResult, dialect),
    prompt: naturalLanguage,
  });

  return {
    ...result.object,
    dialect,
  };
}

/**
 * Explain SQL query
 */
export async function explainSQL(options: {
  connectionId: string;
  sql: string;
  settings: AgentSettings;
}): Promise<SQLExplanation> {
  const { connectionId, sql, settings } = options;

  // Get schema for context
  const isAsync = databaseManager.isAsyncConnection(connectionId);
  const schemaResult = isAsync
    ? await databaseManager.getSchemaAsync(connectionId)
    : databaseManager.getSchema(connectionId);

  if (!schemaResult.success) {
    throw new Error(`Failed to retrieve schema: ${schemaResult.error}`);
  }

  const dialect = getDialect(connectionId);
  const { model } = createChatModel(settings.config);

  const result = await generateObject({
    model,
    schema: SQLExplanationSchema,
    system: buildSQLExplanationPrompt(schemaResult, dialect),
    prompt: `Explain this SQL query:\n\n${sql}`,
  });

  return result.object;
}

/**
 * Optimize SQL query
 */
export async function optimizeSQL(options: {
  connectionId: string;
  sql: string;
  settings: AgentSettings;
}): Promise<QueryOptimization> {
  const { connectionId, sql, settings } = options;

  // Get schema for context
  const isAsync = databaseManager.isAsyncConnection(connectionId);
  const schemaResult = isAsync
    ? await databaseManager.getSchemaAsync(connectionId)
    : databaseManager.getSchema(connectionId);

  if (!schemaResult.success) {
    throw new Error(`Failed to retrieve schema: ${schemaResult.error}`);
  }

  const dialect = getDialect(connectionId);
  const { model } = createChatModel(settings.config);

  const result = await generateObject({
    model,
    schema: QueryOptimizationSchema,
    system: buildSQLOptimizationPrompt(schemaResult, dialect),
    prompt: `Analyze and optimize this SQL query:\n\n${sql}`,
  });

  return result.object;
}
