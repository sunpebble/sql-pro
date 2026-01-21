// Agent Tools Index
// Exports all tools for the AI Agent

import type { AgentExecutionSettings } from '@shared/types/agent';
import {
  createAnalyzeTableTool,
  createCompareDataTool,
  createSuggestIndexTool,
} from './analysis-tools';
import {
  createExecuteSqlTool,
  createExplainQueryTool,
  createGetSchemaTool,
} from './sql-tools';

/**
 * Create all agent tools for a database connection
 */
export function createAgentTools(
  connectionId: string,
  settings: AgentExecutionSettings
) {
  return {
    execute_sql: createExecuteSqlTool(connectionId, settings),
    get_schema: createGetSchemaTool(connectionId),
    explain_query: createExplainQueryTool(connectionId),
    analyze_table: createAnalyzeTableTool(connectionId),
    suggest_index: createSuggestIndexTool(connectionId),
    compare_data: createCompareDataTool(connectionId),
  };
}

export * from './analysis-tools';
export * from './sql-tools';
