// AI Agent Types for SQL Pro
// Unified Vercel AI SDK based global AI Agent

import type { UIMessage } from 'ai';

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
  messages: UIMessage[];
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

export type AgentIpcChannel =
  (typeof AGENT_IPC_CHANNELS)[keyof typeof AGENT_IPC_CHANNELS];

// ============ IPC Request/Response Types ============

export interface ChatSendRequest {
  connectionId: string;
  sessionId: string;
  messages: UIMessage[];
}

export interface ChatSendResponse {
  success: boolean;
  text?: string;
  toolCalls?: unknown[];
  error?: string;
}

export interface GetSettingsResponse {
  settings: AgentSettings;
  isConfigured: boolean;
}

export interface SaveSettingsRequest {
  settings: Partial<AgentSettings>;
}

export interface SaveSettingsResponse {
  settings: AgentSettings;
}

export interface GetSessionsRequest {
  connectionId: string;
}

export interface GetSessionsResponse {
  sessions: ChatSession[];
}

export interface GetHistoryRequest {
  connectionId: string;
  sessionId: string;
}

export interface GetHistoryResponse {
  session: ChatSession | undefined;
}

export interface DeleteSessionRequest {
  connectionId: string;
  sessionId: string;
}

export interface ClearHistoryRequest {
  connectionId: string;
}
