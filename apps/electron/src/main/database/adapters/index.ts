/**
 * Database Adapters Index
 *
 * Exports all database adapters from a single location.
 */

// Re-export legacy types for backward compatibility
export type { DatabaseAdapter } from '../../services/database-adapters/types';

// Adapter interface and types
export {
  type AdapterConnectionInfo,
  type AdapterResult,
  DATABASE_TYPE_NAMES,
  DEFAULT_PORTS,
  type ExecuteResult,
  type IDatabaseAdapter,
  type OpenResult,
  type QueryResult,
  type RowRangeResult,
} from './interface';
export { MySQLAdapter } from './mysql';
export { PostgreSQLAdapter } from './postgresql';
export { QdrantAdapter, qdrantAdapter } from './qdrant';
// Individual adapters
export { SQLiteAdapter } from './sqlite';

export { TursoAdapter } from './turso';
