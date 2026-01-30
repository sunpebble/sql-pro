// SQL Explanation Prompts
// Prompts for explaining SQL queries in plain language

import type { SchemaResult } from './sql-generation';
import { formatSchemaForPrompt } from './sql-generation';

/**
 * Build system prompt for SQL explanation
 */
export function buildSQLExplanationPrompt(
  schema: SchemaResult,
  dialect: 'mysql' | 'postgresql'
): string {
  const schemaText = formatSchemaForPrompt(schema);

  return `You are a SQL expert explaining queries to developers.

DATABASE SCHEMA (for context):
${schemaText}

DATABASE: ${dialect.toUpperCase()}

Explain the provided SQL query clearly and concisely. Focus on:
1. What data the query retrieves or modifies
2. How tables are joined and why
3. What filters/conditions are applied and their purpose
4. Any aggregations or groupings
5. Performance implications if notable

Break down the query into logical components. Be precise but accessible.`;
}
