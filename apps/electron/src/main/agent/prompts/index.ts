/**
 * Agent Prompts
 *
 * Re-exports prompt utilities from the services layer.
 */

export * from '../../services/agent/prompts/sql-explanation';

export {
  formatSchemaForPrompt,
  type SchemaResult,
} from '../../services/agent/prompts/sql-generation';
export * from '../../services/agent/prompts/sql-optimization';
