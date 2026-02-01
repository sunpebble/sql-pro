/**
 * Schema Introspector
 *
 * Provides unified schema introspection across different database types.
 * Extracts table structures, relationships, indexes, and metadata.
 */

import type {
  ColumnInfo,
  IndexInfo,
  SchemaInfo,
  TableInfo,
} from '@shared/types';
import { connectionPool } from '../pool/manager';

// ============================================
// Introspection Types
// ============================================

export interface IntrospectionResult {
  success: boolean;
  schemas?: SchemaInfo[];
  tables?: TableInfo[];
  views?: TableInfo[];
  error?: string;
}

export interface TableIntrospectionResult {
  success: boolean;
  structure?: TableInfo;
  error?: string;
}

export interface RelationshipInfo {
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  constraintName?: string;
  onDelete?: string;
  onUpdate?: string;
}

export interface DatabaseMetadata {
  databaseName: string;
  databaseType: string;
  version?: string;
  encoding?: string;
  schemaCount: number;
  tableCount: number;
  viewCount: number;
}

// ============================================
// Schema Introspector
// ============================================

/**
 * Schema introspection service for extracting database metadata
 */
class SchemaIntrospector {
  /**
   * Get full database schema
   */
  async getSchema(connectionId: string): Promise<IntrospectionResult> {
    try {
      const entry = connectionPool.getConnection(connectionId);
      if (!entry) {
        return { success: false, error: 'Connection not found' };
      }

      const adapter = entry.adapter;

      const result = adapter.getSchemaAsync
        ? await adapter.getSchemaAsync(connectionId)
        : adapter.getSchema(connectionId);

      if (result.success) {
        return {
          success: true,
          schemas: result.schemas,
          tables: result.tables,
          views: result.views,
        };
      }

      return { success: false, error: result.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get structure for a specific table
   */
  async getTableStructure(
    connectionId: string,
    tableName: string,
    schema?: string
  ): Promise<TableIntrospectionResult> {
    try {
      const entry = connectionPool.getConnection(connectionId);
      if (!entry) {
        return { success: false, error: 'Connection not found' };
      }

      const adapter = entry.adapter;

      const result = adapter.getTableStructureAsync
        ? await adapter.getTableStructureAsync(connectionId, tableName, schema)
        : adapter.getTableStructure(connectionId, tableName, schema);

      if (result.success) {
        return {
          success: true,
          structure: result.structure,
        };
      }

      return { success: false, error: result.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Extract all relationships from the schema
   */
  extractRelationships(tables: TableInfo[]): RelationshipInfo[] {
    const relationships: RelationshipInfo[] = [];

    for (const table of tables) {
      if (table.foreignKeys) {
        for (const fk of table.foreignKeys) {
          relationships.push({
            sourceTable: table.name,
            sourceColumn: fk.column,
            targetTable: fk.referencedTable,
            targetColumn: fk.referencedColumn,
            onDelete: fk.onDelete,
            onUpdate: fk.onUpdate,
          });
        }
      }
    }

    return relationships;
  }

  /**
   * Find tables that reference a given table
   */
  findReferencingTables(tables: TableInfo[], tableName: string): TableInfo[] {
    return tables.filter((table) =>
      table.foreignKeys?.some((fk) => fk.referencedTable === tableName)
    );
  }

  /**
   * Find tables that a given table references
   */
  findReferencedTables(tables: TableInfo[], tableName: string): string[] {
    const table = tables.find((t) => t.name === tableName);
    if (!table || !table.foreignKeys) return [];

    return [...new Set(table.foreignKeys.map((fk) => fk.referencedTable))];
  }

  /**
   * Get primary key columns for a table
   */
  getPrimaryKeyColumns(table: TableInfo): string[] {
    return table.columns
      .filter((col) => col.isPrimaryKey)
      .map((col) => col.name);
  }

  /**
   * Get nullable columns for a table
   */
  getNullableColumns(table: TableInfo): ColumnInfo[] {
    return table.columns.filter((col) => col.nullable);
  }

  /**
   * Get columns with default values
   */
  getColumnsWithDefaults(table: TableInfo): ColumnInfo[] {
    return table.columns.filter((col) => col.defaultValue !== null);
  }

  /**
   * Get unique indexes for a table
   */
  getUniqueIndexes(table: TableInfo): IndexInfo[] {
    return (table.indexes || []).filter((idx) => idx.isUnique);
  }

  /**
   * Calculate database metadata summary
   */
  calculateMetadata(
    schemaResult: IntrospectionResult,
    connectionId: string
  ): DatabaseMetadata | null {
    if (!schemaResult.success) return null;

    const entry = connectionPool.getConnection(connectionId);
    if (!entry) return null;

    return {
      databaseName: entry.connectionInfo.filename,
      databaseType: entry.connectionInfo.databaseType,
      schemaCount: schemaResult.schemas?.length || 0,
      tableCount: schemaResult.tables?.length || 0,
      viewCount: schemaResult.views?.length || 0,
    };
  }

  /**
   * Search for tables/views by name pattern
   */
  searchObjects(
    schemas: SchemaInfo[],
    pattern: string,
    options: { tables?: boolean; views?: boolean } = {
      tables: true,
      views: true,
    }
  ): Array<{ type: 'table' | 'view'; schema: string; name: string }> {
    const results: Array<{
      type: 'table' | 'view';
      schema: string;
      name: string;
    }> = [];
    const lowerPattern = pattern.toLowerCase();

    for (const schema of schemas) {
      if (options.tables) {
        for (const table of schema.tables || []) {
          if (table.name.toLowerCase().includes(lowerPattern)) {
            results.push({
              type: 'table',
              schema: schema.name,
              name: table.name,
            });
          }
        }
      }

      if (options.views) {
        for (const view of schema.views || []) {
          if (view.name.toLowerCase().includes(lowerPattern)) {
            results.push({
              type: 'view',
              schema: schema.name,
              name: view.name,
            });
          }
        }
      }
    }

    return results;
  }

  /**
   * Get column type statistics for a table
   */
  getColumnTypeStats(table: TableInfo): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const column of table.columns) {
      const type = this.normalizeColumnType(column.type);
      stats[type] = (stats[type] || 0) + 1;
    }

    return stats;
  }

  /**
   * Normalize column type to a standard category
   */
  private normalizeColumnType(type: string): string {
    const upperType = type.toUpperCase();

    if (upperType.includes('INT')) return 'INTEGER';
    if (upperType.includes('CHAR') || upperType.includes('TEXT')) return 'TEXT';
    if (
      upperType.includes('REAL') ||
      upperType.includes('FLOAT') ||
      upperType.includes('DOUBLE')
    )
      return 'REAL';
    if (upperType.includes('BLOB') || upperType.includes('BINARY'))
      return 'BLOB';
    if (upperType.includes('BOOL')) return 'BOOLEAN';
    if (upperType.includes('DATE') || upperType.includes('TIME'))
      return 'DATETIME';
    if (upperType.includes('JSON')) return 'JSON';

    return 'OTHER';
  }
}

// Export singleton instance
export const schemaIntrospector = new SchemaIntrospector();

// Export class for custom instances
export { SchemaIntrospector };
