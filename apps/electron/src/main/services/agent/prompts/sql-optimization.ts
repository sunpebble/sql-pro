// SQL Optimization Prompts
// Prompts for analyzing and optimizing SQL queries

import type { SchemaResult } from './sql-generation';
import { formatSchemaForPrompt } from './sql-generation';

/**
 * Build system prompt for SQL optimization
 */
export function buildSQLOptimizationPrompt(
  schema: SchemaResult,
  dialect: 'mysql' | 'postgresql'
): string {
  const schemaText = formatSchemaForPrompt(schema);

  return `You are a database performance expert optimizing ${dialect.toUpperCase()} queries.

DATABASE SCHEMA:
${schemaText}

Analyze the provided SQL query for performance issues and suggest optimizations.

Consider:
1. Missing indexes that would improve performance
2. Query rewrites that could be more efficient
3. N+1 query patterns or unnecessary subqueries
4. Proper use of LIMIT, EXISTS vs IN, JOIN order
5. Schema improvements if applicable

For each suggestion:
- Explain the issue clearly
- Provide specific actionable fix
- Include example SQL when helpful
- Rate severity: info (nice-to-have), warning (should fix), critical (major issue)

Be practical - focus on impactful improvements, not micro-optimizations.`;
}
