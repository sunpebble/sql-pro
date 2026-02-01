/**
 * Database Module Index
 *
 * Main entry point for the database system.
 * Re-exports all database-related components.
 */

// Re-export the existing database manager for backward compatibility
export { databaseManager } from '../services/database-adapters/database-manager';

// Adapters
export {
  type AdapterConnectionInfo,
  type AdapterResult,
  DATABASE_TYPE_NAMES,
  DEFAULT_PORTS,
  type ExecuteResult,
  type IDatabaseAdapter,
  MySQLAdapter,
  type OpenResult,
  PostgreSQLAdapter,
  QdrantAdapter,
  qdrantAdapter,
  type QueryResult,
  type RowRangeResult,
  SQLiteAdapter,
  TursoAdapter,
} from './adapters';

// Connection Pool
export {
  connectionPool,
  ConnectionPoolManager,
  type PoolConfig,
} from './pool/manager';

// Query Engine
export {
  queryEngine,
  QueryEngine,
  type QueryExecutionResult,
  type QueryOptions,
  type QueryTiming,
} from './query/engine';

// Schema Introspector
export {
  type DatabaseMetadata,
  type IntrospectionResult,
  type RelationshipInfo,
  schemaIntrospector,
  SchemaIntrospector,
  type TableIntrospectionResult,
} from './schema/introspector';
