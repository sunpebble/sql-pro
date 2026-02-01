/**
 * Qdrant Adapter
 *
 * Re-exports the Qdrant adapter from the services layer.
 * This file provides a migration path to the new database module structure.
 */

export {
  QdrantAdapter,
  qdrantAdapter,
} from '../../services/database-adapters/qdrant-adapter';
