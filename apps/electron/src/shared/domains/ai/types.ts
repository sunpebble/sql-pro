/**
 * AI domain types — AI agent, LLM streaming, settings
 * Re-exports from legacy shared/types.ts and shared/types/agent.ts
 */

export type {
  AIAgentMessage,
  AIAgentQueryRequest,
  AICancelStreamRequest,
  AIFetchAnthropicRequest,
  AIFetchAnthropicResponse,
  AIFetchOpenAIRequest,
  AIFetchOpenAIResponse,
  AIProvider,
  AISettings,
  AIStreamAnthropicRequest,
  AIStreamChunk,
  AIStreamOpenAIRequest,
  GetAISettingsResponse,
  GetClaudeCodePathsResponse,
  SaveAISettingsRequest,
  SaveAISettingsResponse,
} from '../../types';

export { DEFAULT_AI_BASE_URLS } from '../../types';
