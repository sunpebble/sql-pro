/**
 * Agent Module Index
 *
 * Main entry point for the AI Agent system.
 * Provides unified access to models, tools, prompts, and handlers.
 */

// Re-export IPC setup functions
export { cleanupAgentHandlers, setupAgentHandlers } from '../services/agent';

export { agentHistoryStore } from '../services/agent/history-store';

// Re-export stores for backward compatibility
export { agentSettingsStore } from '../services/agent/settings-store';

// Handlers
export { explainSQL, generateSQL, handleChat, optimizeSQL } from './handlers';

// Model Registry
export {
  type ChatModelResult,
  createChatModel,
  detectApiType,
  type ModelInfo,
  type ModelProvider,
  modelRegistry,
  ModelRegistry,
} from './models/registry';
// Prompts
export { formatSchemaForPrompt, type SchemaResult } from './prompts';

// Tool Registry
export {
  createAgentTools,
  createAnalyzeTableTool,
  createCompareDataTool,
  createExecuteSqlTool,
  createExplainQueryTool,
  createGetSchemaTool,
  createSuggestIndexTool,
  type ToolCategory,
  type ToolInfo,
  toolRegistry,
  ToolRegistry,
} from './tools/registry';
