/**
 * SQL INSERT statement generator for copying rows to clipboard.
 * These utilities convert row data to SQL INSERT statements for clipboard operations.
 *
 * Note: This mirrors the escaping logic from apps/electron/src/main/lib/export-generators.ts
 * to avoid IPC overhead for simple clipboard operations in the renderer.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Options for generating SQL INSERT statements
 */
export interface SQLInsertOptions {
  /** Table name for INSERT statements (required) */
  tableName: string;
  /** Column names to include (all columns from row keys if not specified) */
  columns?: string[];
}

// ============================================================================
// SQL Escaping Utilities
// ============================================================================

/**
 * Escapes a SQL identifier (table name or column name) to prevent SQL injection
 * and handle reserved keywords.
 *
 * @param identifier - The identifier to escape
 * @returns Escaped identifier wrapped in double quotes
 */
export function escapeIdentifier(identifier: string): string {
  // Escape any double quotes by doubling them, then wrap in double quotes
  return `"${identifier.replace(/"/g, '""')}"`;
}

/**
 * Escapes a value for use in a SQL INSERT statement.
 * Handles NULL, strings (with quote escaping), booleans, numbers, dates, and Buffers/BLOBs.
 *
 * @param value - The value to escape
 * @returns SQL-safe string representation of the value
 */
export function escapeSQLValue(value: unknown): string {
  // Handle NULL and undefined
  if (value === null || value === undefined) {
    return 'NULL';
  }

  // Handle strings - escape single quotes by doubling them
  if (typeof value === 'string') {
    return `'${value.replace(/'/g, "''")}'`;
  }

  // Handle booleans - SQLite uses 1/0
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }

  // Handle numbers (including BigInt)
  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }

  // Handle Date objects - convert to ISO string
  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }

  // Handle ArrayBuffer and Uint8Array (Blob data in renderer context)
  if (value instanceof ArrayBuffer) {
    const bytes = new Uint8Array(value);
    return `X'${Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}'`;
  }

  if (value instanceof Uint8Array) {
    return `X'${Array.from(value)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}'`;
  }

  // Handle objects with type 'Buffer' (serialized Node.js Buffer)
  if (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    (value as { type: string }).type === 'Buffer' &&
    'data' in value &&
    Array.isArray((value as { data: number[] }).data)
  ) {
    const data = (value as { type: string; data: number[] }).data;
    return `X'${data.map((b) => b.toString(16).padStart(2, '0')).join('')}'`;
  }

  // Fallback for other types - convert to string and escape
  return `'${String(value).replace(/'/g, "''")}'`;
}

// ============================================================================
// SQL INSERT Generator
// ============================================================================

/**
 * Generates a SQL INSERT statement for a single row.
 *
 * @param row - The row data object
 * @param options - SQL INSERT options (tableName required)
 * @returns SQL INSERT statement as a string
 */
export function generateSQLInsertRow(
  row: Record<string, unknown>,
  options: SQLInsertOptions
): string {
  const { tableName, columns } = options;

  // Determine which columns to include
  const columnNames = columns ?? Object.keys(row);

  // Handle empty columns
  if (columnNames.length === 0) {
    return '';
  }

  // Escape table name and column names
  const escapedTableName = escapeIdentifier(tableName);
  const escapedColumnNames = columnNames.map(escapeIdentifier);
  const columnList = escapedColumnNames.join(', ');

  // Generate values
  const values = columnNames.map((col) => escapeSQLValue(row[col])).join(', ');

  return `INSERT INTO ${escapedTableName} (${columnList}) VALUES (${values});`;
}

/**
 * Generates SQL INSERT statements from multiple rows.
 *
 * @param rows - Array of data objects to convert
 * @param options - SQL INSERT options (tableName required)
 * @returns SQL INSERT statements as a string, one per line
 */
export function generateSQLInsert(
  rows: Record<string, unknown>[],
  options: SQLInsertOptions
): string {
  // Handle empty rows
  if (rows.length === 0) {
    return '';
  }

  // Generate INSERT statements for each row
  const insertStatements = rows.map((row) =>
    generateSQLInsertRow(row, options)
  );

  return insertStatements.join('\n');
}
