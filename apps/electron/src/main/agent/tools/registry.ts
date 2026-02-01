/**
 * Tool Registry
 *
 * Centralized registry for AI agent tools.
 * Manages tool creation, registration, and lookup.
 */

import type { AgentExecutionSettings } from '@shared/types/agent';

// Re-export tool creators from the services layer
export {
  createAgentTools,
  createAnalyzeTableTool,
  createCompareDataTool,
  createExecuteSqlTool,
  createExplainQueryTool,
  createGetSchemaTool,
  createSuggestIndexTool,
} from '../../services/agent/tools';

// ============================================
// Tool Types
// ============================================

export interface ToolInfo {
  name: string;
  description: string;
  category: ToolCategory;
  requiresConnection: boolean;
  dangerous: boolean;
}

export type ToolCategory = 'sql' | 'analysis' | 'schema' | 'data' | 'utility';

// ============================================
// Known Tools Registry
// ============================================

const KNOWN_TOOLS: Record<string, ToolInfo> = {
  execute_sql: {
    name: 'execute_sql',
    description: 'Execute a SQL query against the database',
    category: 'sql',
    requiresConnection: true,
    dangerous: true, // Can modify data
  },
  get_schema: {
    name: 'get_schema',
    description:
      'Get the database schema including tables, columns, and relationships',
    category: 'schema',
    requiresConnection: true,
    dangerous: false,
  },
  explain_query: {
    name: 'explain_query',
    description: 'Get the execution plan for a SQL query',
    category: 'sql',
    requiresConnection: true,
    dangerous: false,
  },
  analyze_table: {
    name: 'analyze_table',
    description: 'Analyze a table structure and provide statistics',
    category: 'analysis',
    requiresConnection: true,
    dangerous: false,
  },
  suggest_index: {
    name: 'suggest_index',
    description: 'Suggest indexes for query optimization',
    category: 'analysis',
    requiresConnection: true,
    dangerous: false,
  },
  compare_data: {
    name: 'compare_data',
    description: 'Compare data between tables or queries',
    category: 'data',
    requiresConnection: true,
    dangerous: false,
  },
};

// ============================================
// Tool Registry Class
// ============================================

class ToolRegistry {
  private customTools: Map<string, ToolInfo> = new Map();
  private enabledTools: Set<string> = new Set(Object.keys(KNOWN_TOOLS));

  /**
   * Get info for a tool
   */
  getToolInfo(toolName: string): ToolInfo | undefined {
    if (this.customTools.has(toolName)) {
      return this.customTools.get(toolName);
    }
    return KNOWN_TOOLS[toolName];
  }

  /**
   * Register a custom tool
   */
  registerTool(info: ToolInfo): void {
    this.customTools.set(info.name, info);
    this.enabledTools.add(info.name);
  }

  /**
   * Unregister a custom tool
   */
  unregisterTool(toolName: string): boolean {
    this.enabledTools.delete(toolName);
    return this.customTools.delete(toolName);
  }

  /**
   * Get all registered tools
   */
  getAllTools(): ToolInfo[] {
    return [
      ...Object.values(KNOWN_TOOLS),
      ...Array.from(this.customTools.values()),
    ];
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: ToolCategory): ToolInfo[] {
    return this.getAllTools().filter((t) => t.category === category);
  }

  /**
   * Enable a tool
   */
  enableTool(toolName: string): void {
    this.enabledTools.add(toolName);
  }

  /**
   * Disable a tool
   */
  disableTool(toolName: string): void {
    this.enabledTools.delete(toolName);
  }

  /**
   * Check if a tool is enabled
   */
  isEnabled(toolName: string): boolean {
    return this.enabledTools.has(toolName);
  }

  /**
   * Get all enabled tools
   */
  getEnabledTools(): ToolInfo[] {
    return this.getAllTools().filter((t) => this.enabledTools.has(t.name));
  }

  /**
   * Get dangerous tools (that can modify data)
   */
  getDangerousTools(): ToolInfo[] {
    return this.getAllTools().filter((t) => t.dangerous);
  }

  /**
   * Get safe tools (read-only)
   */
  getSafeTools(): ToolInfo[] {
    return this.getAllTools().filter((t) => !t.dangerous);
  }

  /**
   * Filter tools based on execution settings
   */
  filterToolsForSettings(settings: AgentExecutionSettings): string[] {
    const enabledNames: string[] = [];

    for (const tool of this.getEnabledTools()) {
      // Skip dangerous tools based on execution settings
      if (tool.dangerous) {
        // Check if any auto-execute is enabled for modifying operations
        const canExecute =
          settings.autoExecuteInsert ||
          settings.autoExecuteUpdate ||
          settings.autoExecuteDelete;
        if (!canExecute) {
          continue;
        }
      }
      enabledNames.push(tool.name);
    }

    return enabledNames;
  }
}

// Export singleton instance
export const toolRegistry = new ToolRegistry();

// Export class for custom instances
export { ToolRegistry };
