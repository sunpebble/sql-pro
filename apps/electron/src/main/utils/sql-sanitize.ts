/**
 * SQL Sanitization Utilities
 *
 * Provides functions to safely handle SQL identifiers (table names, column names,
 * schema names) and prevent SQL injection attacks.
 *
 * These utilities should be used whenever dynamically constructing SQL queries
 * with user-provided identifiers.
 */

/**
 * Validates that a SQL identifier (table name, column name, etc.) contains
 * only safe characters. Rejects identifiers with characters that could be
 * used for SQL injection.
 *
 * Allowed characters: letters, digits, underscores, hyphens, dots (for schema.table),
 * and spaces (some databases allow quoted identifiers with spaces).
 *
 * @param identifier - The identifier to validate
 * @returns true if the identifier is safe
 */
export function isValidSqlIdentifier(identifier: string): boolean {
  if (!identifier || identifier.length === 0) return false;
  if (identifier.length > 128) return false;
  // Allow alphanumeric, underscores, hyphens, dots, spaces, and unicode letters
  // Reject quotes, semicolons, comments, and other dangerous characters
  return /^[\p{L}\p{N}_\- .]+$/u.test(identifier);
}

/**
 * Escapes a SQL identifier by doubling any embedded double-quote characters
 * and wrapping the result in double quotes. This is the ANSI SQL standard
 * for quoted identifiers and works with PostgreSQL, SQLite, and others.
 *
 * @example
 * quoteIdentifier('my_table') => '"my_table"'
 * quoteIdentifier('my"table') => '"my""table"'
 *
 * @param identifier - The identifier to quote
 * @returns The safely quoted identifier
 */
export function quoteIdentifier(identifier: string): string {
  if (!identifier) {
    throw new Error('SQL identifier cannot be empty');
  }
  // Double any existing double-quotes and wrap in double-quotes
  return `"${identifier.replace(/"/g, '""')}"`;
}

/**
 * Escapes a SQL identifier for MySQL by doubling backtick characters
 * and wrapping in backticks. MySQL uses backticks for quoted identifiers.
 *
 * @example
 * quoteIdentifierMySQL('my_table') => '`my_table`'
 * quoteIdentifierMySQL('my`table') => '`my``table`'
 *
 * @param identifier - The identifier to quote
 * @returns The safely quoted identifier for MySQL
 */
export function quoteIdentifierMySQL(identifier: string): string {
  if (!identifier) {
    throw new Error('SQL identifier cannot be empty');
  }
  // Double any existing backticks and wrap in backticks
  return `\`${identifier.replace(/`/g, '``')}\``;
}

/**
 * Sanitizes a SQL identifier by validating it and returning the quoted version.
 * Throws an error if the identifier contains suspicious characters.
 *
 * Use this as a safe drop-in replacement for template literal interpolation
 * of identifiers in SQL queries.
 *
 * @param identifier - The identifier to sanitize
 * @param dialect - The SQL dialect ('standard' | 'mysql')
 * @returns The safely quoted identifier
 * @throws Error if the identifier is invalid
 */
export function sanitizeIdentifier(
  identifier: string,
  dialect: 'standard' | 'mysql' = 'standard'
): string {
  if (!isValidSqlIdentifier(identifier)) {
    throw new Error(
      `Invalid SQL identifier: "${identifier}". Identifiers must contain only letters, digits, underscores, hyphens, dots, and spaces.`
    );
  }
  return dialect === 'mysql'
    ? quoteIdentifierMySQL(identifier)
    : quoteIdentifier(identifier);
}
