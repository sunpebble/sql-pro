/**
 * Utility functions for safely escaping values in SQLite PRAGMA statements.
 *
 * PRAGMA statements in SQLite don't support parameterized queries,
 * so we must properly escape values to prevent SQL injection.
 */

import { Buffer } from 'node:buffer';

// Regex for escaping single quotes in PRAGMA values
const SINGLE_QUOTE_REGEX = /'/g;
// Regex for escaping double quotes in identifiers
const DOUBLE_QUOTE_REGEX = /"/g;

/**
 * Escapes a password/key value for use in PRAGMA key/rekey statements.
 *
 * SQLite PRAGMA key uses single-quoted string literals.
 * Single quotes within the password must be escaped by doubling them.
 *
 * @param password - The raw password string
 * @returns The escaped password safe for use in PRAGMA statements
 *
 * @example
 * escapePragmaKey("simple") // "simple"
 * escapePragmaKey("it's") // "it''s"
 * escapePragmaKey("'; DROP TABLE users; --") // "'''; DROP TABLE users; --"
 */
export function escapePragmaKey(password: string): string {
  // Escape single quotes by doubling them (SQL standard escaping)
  return password.replace(SINGLE_QUOTE_REGEX, "''");
}

/**
 * Builds a safe PRAGMA key statement.
 *
 * @param password - The raw password
 * @param options - Configuration options
 * @param options.rawKey - Treat password as already being a hex key
 * @param options.hexKey - Convert password to hex string
 * @returns The complete PRAGMA value string (without PRAGMA keyword)
 */
export function buildPragmaKeyValue(
  password: string,
  options: { rawKey?: boolean; hexKey?: boolean } = {}
): string {
  const escaped = escapePragmaKey(password);

  if (options.rawKey) {
    // Treat password as already being a hex key
    return `key = "x'${escaped}'"`;
  }

  if (options.hexKey) {
    // Convert password to hex string (already safe, only hex chars)
    const hexKey = Buffer.from(password, 'utf8').toString('hex');
    return `key = "x'${hexKey}'"`;
  }

  // Standard string key
  return `key = '${escaped}'`;
}

/**
 * Builds a safe PRAGMA rekey statement value.
 *
 * @param newPassword - The new password (empty string to remove encryption)
 * @returns The complete PRAGMA rekey value string
 */
export function buildPragmaRekeyValue(newPassword: string): string {
  if (newPassword === '') {
    return `rekey = ''`;
  }
  const escaped = escapePragmaKey(newPassword);
  return `rekey = '${escaped}'`;
}

/**
 * Escapes a table or schema name for use in PRAGMA statements.
 *
 * Uses double-quote escaping for identifiers.
 *
 * @param identifier - The table or schema name
 * @returns The escaped identifier
 */
export function escapePragmaIdentifier(identifier: string): string {
  // Escape double quotes by doubling them
  return identifier.replace(DOUBLE_QUOTE_REGEX, '""');
}
