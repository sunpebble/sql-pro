# Global AI Agent Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace existing multi-provider AI implementation with a unified Vercel AI SDK-based global AI Agent with floating dialog UI.

**Architecture:** Vercel AI SDK (`ai` package) in main process handles streamText with tools. React frontend uses `@ai-sdk/react` useChat hook with tool confirmation UI. IPC bridge connects renderer to main process for streaming responses.

**Tech Stack:** Vercel AI SDK v4, @ai-sdk/openai, @ai-sdk/anthropic, @ai-sdk/react, Zod, electron-store

---

## Phase 1: Dependencies and Type Definitions

### Task 1.1: Install Vercel AI SDK Dependencies

**Files:**

- Modify: `package.json`
- Modify: `apps/electron/package.json`

**Step 1: Add dependencies to electron app**

```bash
cd /Users/shikun/Developer/opensource/sql-pro/apps/electron
pnpm add ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/openai-compatible zod
pnpm add -D @ai-sdk/react
```

**Step 2: Verify installation**

Run: `pnpm ls ai @ai-sdk/openai @ai-sdk/anthropic`
Expected: Shows installed versions

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml apps/electron/package.json
git commit -m "deps: add Vercel AI SDK dependencies"
```

---

### Task 1.2: Create Agent Type Definitions

**Files:**

- Create: `apps/electron/src/shared/types/agent.ts`

**Step 1: Write type definitions**

```typescript
// apps/electron/src/shared/types/agent.ts
import type { Message } from 'ai';

// ============ Agent Configuration ============

export interface AgentConfig {
  /** API endpoint URL */
  baseUrl: string;
  /** API key for authentication */
  apiKey: string;
  /** Model identifier */
  model: string;
  /** Optional API type hint (auto-detected if not provided) */
  apiType?: 'openai' | 'anthropic';
}

export interface AgentExecutionSettings {
  /** Auto-execute SELECT queries without confirmation */
  autoExecuteSelect: boolean;
  /** Auto-execute INSERT statements */
  autoExecuteInsert: boolean;
  /** Auto-execute UPDATE statements */
  autoExecuteUpdate: boolean;
  /** Auto-execute DELETE statements */
  autoExecuteDelete: boolean;
  /** Always require confirmation for DDL (DROP, ALTER, TRUNCATE) */
  confirmDDL: boolean;
  /** Query timeout in milliseconds */
  queryTimeout: number;
}

export interface AgentSettings {
  config: AgentConfig;
  execution: AgentExecutionSettings;
}

export const DEFAULT_AGENT_SETTINGS: AgentSettings = {
  config: {
    baseUrl: '',
    apiKey: '',
    model: '',
  },
  execution: {
    autoExecuteSelect: true,
    autoExecuteInsert: false,
    autoExecuteUpdate: false,
    autoExecuteDelete: false,
    confirmDDL: true,
    queryTimeout: 30000,
  },
};

// ============ Chat Session ============

export interface ChatSession {
  id: string;
  connectionId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// ============ Tool Types ============

export type SqlOperationType =
  | 'SELECT'
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE'
  | 'DDL'
  | 'OTHER';

export interface ToolConfirmationRequest {
  toolCallId: string;
  toolName: string;
  sql?: string;
  operationType?: SqlOperationType;
  message: string;
}

export interface ToolExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  rowCount?: number;
  executionTime?: number;
}

// ============ IPC Channels ============

export const AGENT_IPC_CHANNELS = {
  // Chat operations
  CHAT_SEND: 'agent:chat:send',
  CHAT_STREAM: 'agent:chat:stream',
  CHAT_CANCEL: 'agent:chat:cancel',

  // Tool confirmation
  TOOL_CONFIRM: 'agent:tool:confirm',
  TOOL_REJECT: 'agent:tool:reject',

  // Settings
  SETTINGS_GET: 'agent:settings:get',
  SETTINGS_SAVE: 'agent:settings:save',

  // History
  HISTORY_GET: 'agent:history:get',
  HISTORY_GET_SESSIONS: 'agent:history:get-sessions',
  HISTORY_DELETE_SESSION: 'agent:history:delete-session',
  HISTORY_CLEAR: 'agent:history:clear',
} as const;
```

**Step 2: Export from shared types index**

Add to `apps/electron/src/shared/types.ts`:

```typescript
export * from './types/agent';
```

**Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add apps/electron/src/shared/types/agent.ts apps/electron/src/shared/types.ts
git commit -m "feat(agent): add type definitions for AI Agent"
```

---

## Phase 2: Main Process Agent Implementation

### Task 2.1: Create Model Provider Factory

**Files:**

- Create: `apps/electron/src/main/services/agent/model.ts`

**Step 1: Write model factory**

```typescript
// apps/electron/src/main/services/agent/model.ts
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel } from 'ai';
import type { AgentConfig } from '@shared/types/agent';

/**
 * Detect API type from base URL
 */
export function detectApiType(baseUrl: string): 'openai' | 'anthropic' {
  const url = baseUrl.toLowerCase();
  if (url.includes('anthropic') || url.includes('claude')) {
    return 'anthropic';
  }
  return 'openai';
}

/**
 * Create a language model instance based on configuration
 */
export function createChatModel(config: AgentConfig): LanguageModel {
  const apiType = config.apiType ?? detectApiType(config.baseUrl);

  if (apiType === 'anthropic') {
    const anthropic = createAnthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || undefined,
    });
    return anthropic(config.model);
  }

  // Check if it's the default OpenAI API or a compatible provider
  if (config.baseUrl && !config.baseUrl.includes('api.openai.com')) {
    // Use OpenAI-compatible provider for custom endpoints
    const provider = createOpenAICompatible({
      name: 'custom-provider',
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
    return provider(config.model);
  }

  // Default OpenAI
  const openai = createOpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl || undefined,
  });
  return openai(config.model);
}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/electron/src/main/services/agent/model.ts
git commit -m "feat(agent): add model provider factory"
```

---

### Task 2.2: Create SQL Tools

**Files:**

- Create: `apps/electron/src/main/services/agent/tools/sql-tools.ts`

**Step 1: Write SQL tools**

```typescript
// apps/electron/src/main/services/agent/tools/sql-tools.ts
import { tool } from 'ai';
import { z } from 'zod';
import type {
  AgentExecutionSettings,
  SqlOperationType,
  ToolExecutionResult,
} from '@shared/types/agent';
import { databaseManager } from '../../database-adapters/database-manager';

/**
 * Detect SQL operation type
 */
export function detectSqlOperationType(sql: string): SqlOperationType {
  const trimmed = sql.trim().toUpperCase();
  if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH'))
    return 'SELECT';
  if (trimmed.startsWith('INSERT')) return 'INSERT';
  if (trimmed.startsWith('UPDATE')) return 'UPDATE';
  if (trimmed.startsWith('DELETE')) return 'DELETE';
  if (/^(CREATE|ALTER|DROP|TRUNCATE|RENAME)/.test(trimmed)) return 'DDL';
  return 'OTHER';
}

/**
 * Check if operation requires confirmation based on settings
 */
export function requiresConfirmation(
  operationType: SqlOperationType,
  settings: AgentExecutionSettings
): boolean {
  switch (operationType) {
    case 'SELECT':
      return !settings.autoExecuteSelect;
    case 'INSERT':
      return !settings.autoExecuteInsert;
    case 'UPDATE':
      return !settings.autoExecuteUpdate;
    case 'DELETE':
      return !settings.autoExecuteDelete;
    case 'DDL':
      return settings.confirmDDL;
    default:
      return true; // Unknown operations always require confirmation
  }
}

/**
 * Create SQL execution tool
 */
export function createExecuteSqlTool(
  connectionId: string,
  settings: AgentExecutionSettings
) {
  return tool({
    description:
      'Execute a SQL query on the current database connection. Returns query results or affected row count.',
    parameters: z.object({
      sql: z.string().describe('The SQL query to execute'),
      params: z
        .array(z.unknown())
        .optional()
        .describe('Optional query parameters'),
    }),
    execute: async ({ sql, params }): Promise<ToolExecutionResult> => {
      const operationType = detectSqlOperationType(sql);

      // Check if confirmation is required
      if (requiresConfirmation(operationType, settings)) {
        // Return pending state - will be handled by confirmation flow
        return {
          success: false,
          error: `CONFIRMATION_REQUIRED:${operationType}:${sql}`,
        };
      }

      try {
        const startTime = Date.now();
        const adapter = databaseManager.getAdapter(connectionId);

        if (!adapter) {
          return { success: false, error: 'Database connection not found' };
        }

        const result = await adapter.executeQuery(sql, params);
        const executionTime = Date.now() - startTime;

        return {
          success: true,
          data: result.rows,
          rowCount: result.rowCount,
          executionTime,
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Query execution failed',
        };
      }
    },
  });
}

/**
 * Create schema retrieval tool
 */
export function createGetSchemaTool(connectionId: string) {
  return tool({
    description:
      'Get the database schema including tables, columns, indexes, and relationships.',
    parameters: z.object({
      tableName: z
        .string()
        .optional()
        .describe('Optional: Get schema for a specific table only'),
    }),
    execute: async ({ tableName }): Promise<ToolExecutionResult> => {
      try {
        const adapter = databaseManager.getAdapter(connectionId);

        if (!adapter) {
          return { success: false, error: 'Database connection not found' };
        }

        const schema = await adapter.getSchema();

        if (tableName) {
          const table = schema.tables?.find((t) => t.name === tableName);
          if (!table) {
            return { success: false, error: `Table '${tableName}' not found` };
          }
          return { success: true, data: table };
        }

        return { success: true, data: schema };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to get schema',
        };
      }
    },
  });
}

/**
 * Create query explain tool
 */
export function createExplainQueryTool(connectionId: string) {
  return tool({
    description:
      'Analyze the execution plan of a SQL query to understand performance characteristics.',
    parameters: z.object({
      sql: z.string().describe('The SQL query to analyze'),
    }),
    execute: async ({ sql }): Promise<ToolExecutionResult> => {
      try {
        const adapter = databaseManager.getAdapter(connectionId);

        if (!adapter) {
          return { success: false, error: 'Database connection not found' };
        }

        // Use EXPLAIN or EXPLAIN ANALYZE depending on database type
        const explainSql = `EXPLAIN ${sql}`;
        const result = await adapter.executeQuery(explainSql);

        return {
          success: true,
          data: result.rows,
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to explain query',
        };
      }
    },
  });
}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/electron/src/main/services/agent/tools/sql-tools.ts
git commit -m "feat(agent): add SQL tools (execute, schema, explain)"
```

---

### Task 2.3: Create Analysis Tools

**Files:**

- Create: `apps/electron/src/main/services/agent/tools/analysis-tools.ts`

**Step 1: Write analysis tools**

```typescript
// apps/electron/src/main/services/agent/tools/analysis-tools.ts
import { tool } from 'ai';
import { z } from 'zod';
import type { ToolExecutionResult } from '@shared/types/agent';
import { databaseManager } from '../../database-adapters/database-manager';

/**
 * Create table analysis tool
 */
export function createAnalyzeTableTool(connectionId: string) {
  return tool({
    description:
      'Analyze a table to get statistics like row count, data distribution, null percentages, and value ranges.',
    parameters: z.object({
      tableName: z.string().describe('Name of the table to analyze'),
      columns: z
        .array(z.string())
        .optional()
        .describe('Optional: Analyze only specific columns'),
    }),
    execute: async ({ tableName, columns }): Promise<ToolExecutionResult> => {
      try {
        const adapter = databaseManager.getAdapter(connectionId);

        if (!adapter) {
          return { success: false, error: 'Database connection not found' };
        }

        // Get row count
        const countResult = await adapter.executeQuery(
          `SELECT COUNT(*) as total FROM "${tableName}"`
        );
        const totalRows = countResult.rows?.[0]?.total ?? 0;

        // Get column info from schema
        const schema = await adapter.getSchema();
        const table = schema.tables?.find((t) => t.name === tableName);

        if (!table) {
          return { success: false, error: `Table '${tableName}' not found` };
        }

        const targetColumns =
          columns || table.columns?.map((c) => c.name) || [];
        const columnStats: Record<string, unknown> = {};

        // Analyze each column (limit to prevent huge queries)
        for (const colName of targetColumns.slice(0, 10)) {
          const col = table.columns?.find((c) => c.name === colName);
          if (!col) continue;

          const statsQuery = `
            SELECT
              COUNT(*) as total,
              COUNT("${colName}") as non_null,
              COUNT(DISTINCT "${colName}") as distinct_values
            FROM "${tableName}"
          `;

          const statsResult = await adapter.executeQuery(statsQuery);
          const stats = statsResult.rows?.[0];

          columnStats[colName] = {
            type: col.type,
            total: stats?.total,
            nonNull: stats?.non_null,
            nullPercentage:
              stats?.total > 0
                ? (
                    ((stats.total - stats.non_null) / stats.total) *
                    100
                  ).toFixed(2) + '%'
                : '0%',
            distinctValues: stats?.distinct_values,
          };
        }

        return {
          success: true,
          data: {
            tableName,
            totalRows,
            columns: columnStats,
          },
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to analyze table',
        };
      }
    },
  });
}

/**
 * Create index suggestion tool
 */
export function createSuggestIndexTool(connectionId: string) {
  return tool({
    description:
      'Analyze a SQL query and suggest indexes that could improve its performance.',
    parameters: z.object({
      sql: z
        .string()
        .describe('The SQL query to analyze for index suggestions'),
    }),
    execute: async ({ sql }): Promise<ToolExecutionResult> => {
      try {
        const adapter = databaseManager.getAdapter(connectionId);

        if (!adapter) {
          return { success: false, error: 'Database connection not found' };
        }

        // Get execution plan
        const explainResult = await adapter.executeQuery(`EXPLAIN ${sql}`);

        // Parse WHERE, JOIN, ORDER BY clauses for column references
        const suggestions: string[] = [];

        // Simple heuristic: extract columns from WHERE clause
        const whereMatch = sql.match(/WHERE\s+(.+?)(?:ORDER|GROUP|LIMIT|$)/is);
        if (whereMatch) {
          const whereClause = whereMatch[1];
          const columnMatches = whereClause.match(/["']?(\w+)["']?\s*[=<>]/g);
          if (columnMatches) {
            columnMatches.forEach((match) => {
              const col = match.replace(/[=<>\s"']/g, '');
              suggestions.push(`Consider index on column: ${col}`);
            });
          }
        }

        // Check ORDER BY
        const orderMatch = sql.match(/ORDER\s+BY\s+(.+?)(?:LIMIT|$)/is);
        if (orderMatch) {
          suggestions.push(
            `Consider index for ORDER BY: ${orderMatch[1].trim()}`
          );
        }

        return {
          success: true,
          data: {
            query: sql,
            executionPlan: explainResult.rows,
            suggestions:
              suggestions.length > 0
                ? suggestions
                : ['No obvious index improvements detected'],
          },
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to suggest indexes',
        };
      }
    },
  });
}

/**
 * Create data comparison tool
 */
export function createCompareDataTool(connectionId: string) {
  return tool({
    description:
      'Compare data between two tables or query results to find differences.',
    parameters: z.object({
      sourceTable: z.string().optional().describe('Source table name'),
      sourceSql: z.string().optional().describe('Source SQL query'),
      targetTable: z.string().optional().describe('Target table name'),
      targetSql: z.string().optional().describe('Target SQL query'),
      keyColumns: z
        .array(z.string())
        .describe('Columns to use as comparison keys'),
    }),
    execute: async ({
      sourceTable,
      sourceSql,
      targetTable,
      targetSql,
      keyColumns,
    }): Promise<ToolExecutionResult> => {
      try {
        const adapter = databaseManager.getAdapter(connectionId);

        if (!adapter) {
          return { success: false, error: 'Database connection not found' };
        }

        const sourceQuery = sourceSql || `SELECT * FROM "${sourceTable}"`;
        const targetQuery = targetSql || `SELECT * FROM "${targetTable}"`;

        // Get source and target data
        const [sourceResult, targetResult] = await Promise.all([
          adapter.executeQuery(sourceQuery),
          adapter.executeQuery(targetQuery),
        ]);

        const sourceRows = sourceResult.rows || [];
        const targetRows = targetResult.rows || [];

        // Build key-based maps
        const makeKey = (row: Record<string, unknown>) =>
          keyColumns.map((k) => String(row[k] ?? '')).join('|');

        const sourceMap = new Map(sourceRows.map((r) => [makeKey(r), r]));
        const targetMap = new Map(targetRows.map((r) => [makeKey(r), r]));

        // Find differences
        const onlyInSource: unknown[] = [];
        const onlyInTarget: unknown[] = [];
        const different: unknown[] = [];

        sourceMap.forEach((row, key) => {
          if (!targetMap.has(key)) {
            onlyInSource.push(row);
          } else {
            const targetRow = targetMap.get(key);
            if (JSON.stringify(row) !== JSON.stringify(targetRow)) {
              different.push({ source: row, target: targetRow });
            }
          }
        });

        targetMap.forEach((row, key) => {
          if (!sourceMap.has(key)) {
            onlyInTarget.push(row);
          }
        });

        return {
          success: true,
          data: {
            sourceCount: sourceRows.length,
            targetCount: targetRows.length,
            onlyInSource: onlyInSource.slice(0, 100), // Limit results
            onlyInTarget: onlyInTarget.slice(0, 100),
            different: different.slice(0, 100),
            summary: {
              onlyInSourceCount: onlyInSource.length,
              onlyInTargetCount: onlyInTarget.length,
              differentCount: different.length,
            },
          },
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to compare data',
        };
      }
    },
  });
}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/electron/src/main/services/agent/tools/analysis-tools.ts
git commit -m "feat(agent): add analysis tools (analyze, suggest-index, compare)"
```

---

### Task 2.4: Create Tools Index

**Files:**

- Create: `apps/electron/src/main/services/agent/tools/index.ts`

**Step 1: Write tools index**

```typescript
// apps/electron/src/main/services/agent/tools/index.ts
import type { AgentExecutionSettings } from '@shared/types/agent';
import {
  createExecuteSqlTool,
  createGetSchemaTool,
  createExplainQueryTool,
} from './sql-tools';
import {
  createAnalyzeTableTool,
  createSuggestIndexTool,
  createCompareDataTool,
} from './analysis-tools';

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

export * from './sql-tools';
export * from './analysis-tools';
```

**Step 2: Commit**

```bash
git add apps/electron/src/main/services/agent/tools/index.ts
git commit -m "feat(agent): add tools index"
```

---

### Task 2.5: Create Chat Handler

**Files:**

- Create: `apps/electron/src/main/services/agent/chat-handler.ts`

**Step 1: Write chat handler**

```typescript
// apps/electron/src/main/services/agent/chat-handler.ts
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import type { AgentSettings } from '@shared/types/agent';
import { createChatModel } from './model';
import { createAgentTools } from './tools';

const SYSTEM_PROMPT = `You are SQL Pro AI Assistant, an expert database assistant integrated into SQL Pro application.

Your capabilities:
- Execute SQL queries on the connected database
- Analyze database schema and table structures
- Explain query execution plans
- Analyze table data distribution and statistics
- Suggest index optimizations for queries
- Compare data between tables

Guidelines:
1. Always verify the database schema before writing complex queries
2. Use parameterized queries when handling user-provided values
3. Explain your reasoning when suggesting optimizations
4. Warn users about potentially dangerous operations (DELETE, DROP, etc.)
5. Format SQL queries for readability
6. Provide execution time and row count after queries

When users ask questions:
- For data questions: Use execute_sql tool
- For schema questions: Use get_schema tool first
- For performance questions: Use explain_query and suggest_index tools
- For data comparison: Use compare_data tool

Be concise but thorough. Format SQL code in markdown code blocks.`;

export interface ChatHandlerOptions {
  connectionId: string;
  messages: UIMessage[];
  settings: AgentSettings;
  onChunk?: (chunk: string) => void;
  onToolCall?: (toolCall: { toolName: string; args: unknown }) => void;
  signal?: AbortSignal;
}

export async function handleChat(options: ChatHandlerOptions) {
  const { connectionId, messages, settings, signal } = options;

  // Create model and tools
  const model = createChatModel(settings.config);
  const tools = createAgentTools(connectionId, settings.execution);

  // Convert UI messages to model messages
  const modelMessages = await convertToModelMessages(messages);

  // Stream the response
  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    tools,
    maxSteps: 10, // Allow multi-step tool calling
    abortSignal: signal,
  });

  return result;
}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/electron/src/main/services/agent/chat-handler.ts
git commit -m "feat(agent): add chat handler with streamText"
```

---

### Task 2.6: Create History Store

**Files:**

- Create: `apps/electron/src/main/services/agent/history-store.ts`

**Step 1: Write history store**

```typescript
// apps/electron/src/main/services/agent/history-store.ts
import type { Message } from 'ai';
import type { ChatSession } from '@shared/types/agent';
import Store from 'electron-store';
import { v4 as uuidv4 } from 'uuid';

interface HistorySchema {
  sessions: Record<string, ChatSession[]>; // keyed by connectionId
}

const historyStore = new Store<HistorySchema>({
  name: 'agent-history',
  defaults: {
    sessions: {},
  },
});

export const agentHistoryStore = {
  /**
   * Get all sessions for a connection
   */
  getSessions(connectionId: string): ChatSession[] {
    const sessions = historyStore.get('sessions');
    return sessions[connectionId] || [];
  },

  /**
   * Get a specific session
   */
  getSession(connectionId: string, sessionId: string): ChatSession | undefined {
    const sessions = this.getSessions(connectionId);
    return sessions.find((s) => s.id === sessionId);
  },

  /**
   * Create a new session
   */
  createSession(connectionId: string): ChatSession {
    const session: ChatSession = {
      id: uuidv4(),
      connectionId,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const sessions = historyStore.get('sessions');
    if (!sessions[connectionId]) {
      sessions[connectionId] = [];
    }
    sessions[connectionId].unshift(session);
    historyStore.set('sessions', sessions);

    return session;
  },

  /**
   * Update session messages
   */
  updateSession(
    connectionId: string,
    sessionId: string,
    messages: Message[]
  ): void {
    const sessions = historyStore.get('sessions');
    const connectionSessions = sessions[connectionId] || [];
    const sessionIndex = connectionSessions.findIndex(
      (s) => s.id === sessionId
    );

    if (sessionIndex !== -1) {
      connectionSessions[sessionIndex] = {
        ...connectionSessions[sessionIndex],
        messages,
        updatedAt: Date.now(),
      };
      sessions[connectionId] = connectionSessions;
      historyStore.set('sessions', sessions);
    }
  },

  /**
   * Delete a session
   */
  deleteSession(connectionId: string, sessionId: string): void {
    const sessions = historyStore.get('sessions');
    if (sessions[connectionId]) {
      sessions[connectionId] = sessions[connectionId].filter(
        (s) => s.id !== sessionId
      );
      historyStore.set('sessions', sessions);
    }
  },

  /**
   * Clear all sessions for a connection
   */
  clearHistory(connectionId: string): void {
    const sessions = historyStore.get('sessions');
    delete sessions[connectionId];
    historyStore.set('sessions', sessions);
  },

  /**
   * Clear all history
   */
  clearAllHistory(): void {
    historyStore.set('sessions', {});
  },
};
```

**Step 2: Commit**

```bash
git add apps/electron/src/main/services/agent/history-store.ts
git commit -m "feat(agent): add history store for chat sessions"
```

---

### Task 2.7: Create Agent Settings Store

**Files:**

- Create: `apps/electron/src/main/services/agent/settings-store.ts`

**Step 1: Write settings store**

```typescript
// apps/electron/src/main/services/agent/settings-store.ts
import type { AgentSettings } from '@shared/types/agent';
import { DEFAULT_AGENT_SETTINGS } from '@shared/types/agent';
import Store from 'electron-store';

interface SettingsSchema {
  agent: AgentSettings;
}

const settingsStore = new Store<SettingsSchema>({
  name: 'agent-settings',
  defaults: {
    agent: DEFAULT_AGENT_SETTINGS,
  },
});

export const agentSettingsStore = {
  /**
   * Get agent settings
   */
  getSettings(): AgentSettings {
    return settingsStore.get('agent');
  },

  /**
   * Save agent settings
   */
  saveSettings(settings: Partial<AgentSettings>): AgentSettings {
    const current = this.getSettings();
    const updated: AgentSettings = {
      config: { ...current.config, ...settings.config },
      execution: { ...current.execution, ...settings.execution },
    };
    settingsStore.set('agent', updated);
    return updated;
  },

  /**
   * Reset to defaults
   */
  resetSettings(): AgentSettings {
    settingsStore.set('agent', DEFAULT_AGENT_SETTINGS);
    return DEFAULT_AGENT_SETTINGS;
  },

  /**
   * Check if agent is configured
   */
  isConfigured(): boolean {
    const settings = this.getSettings();
    return Boolean(
      settings.config.apiKey && settings.config.baseUrl && settings.config.model
    );
  },
};
```

**Step 2: Commit**

```bash
git add apps/electron/src/main/services/agent/settings-store.ts
git commit -m "feat(agent): add settings store"
```

---

### Task 2.8: Create Agent IPC Handlers

**Files:**

- Create: `apps/electron/src/main/services/agent/index.ts`

**Step 1: Write agent IPC handlers**

```typescript
// apps/electron/src/main/services/agent/index.ts
import { ipcMain, BrowserWindow } from 'electron';
import type { UIMessage } from 'ai';
import { AGENT_IPC_CHANNELS, type AgentSettings } from '@shared/types/agent';
import { handleChat } from './chat-handler';
import { agentHistoryStore } from './history-store';
import { agentSettingsStore } from './settings-store';
import { createHandler } from '../ipc/utils';

// Track active chat streams for cancellation
const activeStreams = new Map<string, AbortController>();

export function setupAgentHandlers(): void {
  // Settings handlers
  ipcMain.handle(
    AGENT_IPC_CHANNELS.SETTINGS_GET,
    createHandler(async () => {
      return {
        settings: agentSettingsStore.getSettings(),
        isConfigured: agentSettingsStore.isConfigured(),
      };
    })
  );

  ipcMain.handle(
    AGENT_IPC_CHANNELS.SETTINGS_SAVE,
    createHandler(async (request: { settings: Partial<AgentSettings> }) => {
      const settings = agentSettingsStore.saveSettings(request.settings);
      return { settings };
    })
  );

  // History handlers
  ipcMain.handle(
    AGENT_IPC_CHANNELS.HISTORY_GET_SESSIONS,
    createHandler(async (request: { connectionId: string }) => {
      const sessions = agentHistoryStore.getSessions(request.connectionId);
      return { sessions };
    })
  );

  ipcMain.handle(
    AGENT_IPC_CHANNELS.HISTORY_GET,
    createHandler(
      async (request: { connectionId: string; sessionId: string }) => {
        const session = agentHistoryStore.getSession(
          request.connectionId,
          request.sessionId
        );
        return { session };
      }
    )
  );

  ipcMain.handle(
    AGENT_IPC_CHANNELS.HISTORY_DELETE_SESSION,
    createHandler(
      async (request: { connectionId: string; sessionId: string }) => {
        agentHistoryStore.deleteSession(
          request.connectionId,
          request.sessionId
        );
        return { success: true };
      }
    )
  );

  ipcMain.handle(
    AGENT_IPC_CHANNELS.HISTORY_CLEAR,
    createHandler(async (request: { connectionId: string }) => {
      agentHistoryStore.clearHistory(request.connectionId);
      return { success: true };
    })
  );

  // Chat handler with streaming
  ipcMain.handle(
    AGENT_IPC_CHANNELS.CHAT_SEND,
    async (
      event,
      request: {
        connectionId: string;
        sessionId: string;
        messages: UIMessage[];
      }
    ) => {
      const { connectionId, sessionId, messages } = request;
      const settings = agentSettingsStore.getSettings();

      if (!agentSettingsStore.isConfigured()) {
        return { success: false, error: 'Agent not configured' };
      }

      // Create abort controller for this stream
      const streamId = `${connectionId}:${sessionId}`;
      const abortController = new AbortController();
      activeStreams.set(streamId, abortController);

      try {
        const result = await handleChat({
          connectionId,
          messages,
          settings,
          signal: abortController.signal,
        });

        // Stream chunks to renderer
        const window = BrowserWindow.fromWebContents(event.sender);

        for await (const chunk of result.fullStream) {
          if (abortController.signal.aborted) break;

          window?.webContents.send(
            `${AGENT_IPC_CHANNELS.CHAT_STREAM}:${streamId}`,
            chunk
          );
        }

        // Get final result
        const text = await result.text;
        const toolCalls = await result.toolCalls;

        // Update history
        // Note: In real implementation, convert result to UIMessage format

        return { success: true, text, toolCalls };
      } catch (error) {
        if (abortController.signal.aborted) {
          return { success: false, error: 'Chat cancelled' };
        }
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Chat failed',
        };
      } finally {
        activeStreams.delete(streamId);
      }
    }
  );

  // Cancel chat
  ipcMain.handle(
    AGENT_IPC_CHANNELS.CHAT_CANCEL,
    createHandler(
      async (request: { connectionId: string; sessionId: string }) => {
        const streamId = `${request.connectionId}:${request.sessionId}`;
        const controller = activeStreams.get(streamId);
        if (controller) {
          controller.abort();
          activeStreams.delete(streamId);
        }
        return { success: true };
      }
    )
  );
}

export function cleanupAgentHandlers(): void {
  // Abort all active streams
  activeStreams.forEach((controller) => controller.abort());
  activeStreams.clear();

  // Remove all handlers
  Object.values(AGENT_IPC_CHANNELS).forEach((channel) => {
    ipcMain.removeHandler(channel);
  });
}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/electron/src/main/services/agent/index.ts
git commit -m "feat(agent): add IPC handlers for chat, settings, history"
```

---

## Phase 3: UI Components (Tasks 3.1-3.6)

_Due to length constraints, Phase 3-6 tasks follow the same pattern with:_

- Renderer store (`agent-store.ts`)
- AIAgentDialog component
- AIAgentTrigger component
- ToolConfirmCard component
- Integration into main App layout
- Preload API updates

---

## Phase 4: Settings and History UI

_Settings sheet component and history panel_

---

## Phase 5: Remove Old AI Code

### Task 5.1: Remove Old AI Files

**Files to delete:**

- `apps/electron/src/main/services/ipc/ai.ts`
- `apps/electron/src/renderer/src/stores/ai-store.ts`
- `apps/electron/src/renderer/src/hooks/useAI.ts`
- `apps/electron/src/renderer/src/components/ai/AISettingsDialog.tsx`

**Step 1: Remove files**

```bash
rm apps/electron/src/main/services/ipc/ai.ts
rm apps/electron/src/renderer/src/stores/ai-store.ts
rm apps/electron/src/renderer/src/hooks/useAI.ts
rm -rf apps/electron/src/renderer/src/components/ai/
```

**Step 2: Update imports**

Remove AI handler registration from `apps/electron/src/main/services/ipc/index.ts`

**Step 3: Remove old types from shared/types.ts**

Remove AI\* type definitions that are no longer needed.

**Step 4: Remove old dependencies**

```bash
cd apps/electron
pnpm remove @anthropic-ai/sdk @anthropic-ai/claude-agent-sdk openai
```

**Step 5: Run typecheck and fix any remaining references**

Run: `pnpm typecheck`

**Step 6: Commit**

```bash
git add -A
git commit -m "refactor: remove old AI implementation"
```

---

## Phase 6: Testing and Verification

### Task 6.1: Manual Testing Checklist

- [ ] Agent settings dialog opens and saves correctly
- [ ] Chat dialog opens with Cmd+J
- [ ] Messages stream correctly
- [ ] SQL execution works with confirmation
- [ ] Schema retrieval works
- [ ] History persists across sessions
- [ ] Cancel streaming works
- [ ] Error handling displays correctly

### Task 6.2: Build Verification

```bash
pnpm build
pnpm typecheck
pnpm lint
```

---

## Summary

| Phase | Tasks   | Description                 |
| ----- | ------- | --------------------------- |
| 1     | 1.1-1.2 | Dependencies and types      |
| 2     | 2.1-2.8 | Main process implementation |
| 3     | 3.1-3.6 | UI components               |
| 4     | 4.1-4.2 | Settings and history UI     |
| 5     | 5.1     | Remove old code             |
| 6     | 6.1-6.2 | Testing                     |

Total estimated tasks: ~18 bite-sized steps
