// SQL Generation Prompts
// Schema-aware prompts for natural language to SQL conversion

import type { TableInfo } from '@shared/types';

/** Schema result from database manager */
export interface SchemaResult {
  success: boolean;
  tables?: TableInfo[];
  views?: TableInfo[];
  error?: string;
}

/**
 * Format schema for inclusion in prompts
 * Compact format to minimize token usage while preserving essential info
 */
export function formatSchemaForPrompt(schema: SchemaResult): string {
  const tables = schema.tables || [];

  return tables
    .map((table: TableInfo) => {
      // Build foreign key lookup from table's foreignKeys array
      const fkMap = new Map<string, { table: string; column: string }>();
      for (const fk of table.foreignKeys || []) {
        fkMap.set(fk.column, {
          table: fk.referencedTable,
          column: fk.referencedColumn,
        });
      }

      const columns = table.columns
        .map((col) => {
          const attrs: string[] = [];
          if (col.isPrimaryKey) attrs.push('PK');
          if (!col.nullable) attrs.push('NOT NULL');
          const fkInfo = fkMap.get(col.name);
          if (fkInfo) {
            attrs.push(`FK->${fkInfo.table}.${fkInfo.column}`);
          }
          const attrStr = attrs.length > 0 ? ` [${attrs.join(', ')}]` : '';
          return `  ${col.name}: ${col.type}${attrStr}`;
        })
        .join('\n');

      const indexes = table.indexes?.length
        ? `\n  Indexes: ${table.indexes
            .map(
              (idx) =>
                `${idx.name}(${idx.columns.join(', ')})${idx.isUnique ? ' UNIQUE' : ''}`
            )
            .join(', ')}`
        : '';

      return `TABLE ${table.name}\n${columns}${indexes}`;
    })
    .join('\n\n');
}

/**
 * Build system prompt for SQL generation
 */
export function buildSQLGenerationPrompt(
  schema: SchemaResult,
  dialect: 'mysql' | 'postgresql'
): string {
  const schemaText = formatSchemaForPrompt(schema);
  const quoteStyle = dialect === 'postgresql' ? 'double quotes' : 'backticks';

  return `You are a SQL expert for ${dialect.toUpperCase()} databases.

DATABASE SCHEMA:
${schemaText}

RULES:
1. ONLY use tables and columns that exist in the schema above
2. Use ${quoteStyle} for identifiers when needed (reserved words, special chars)
3. Prefer indexed columns in WHERE and JOIN conditions
4. Use table aliases for joins (e.g., u for users, o for orders)
5. Return valid ${dialect.toUpperCase()} syntax only
6. For date operations, use ${dialect === 'postgresql' ? 'PostgreSQL date functions (NOW(), INTERVAL)' : 'MySQL date functions (NOW(), DATE_SUB)'}
7. Always include appropriate LIMIT unless counting/aggregating

Generate a SQL query based on the user's natural language request. Be precise and only reference existing schema elements.`;
}
