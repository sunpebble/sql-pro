import type {
  AIAgentMessage,
  AIAgentQueryRequest,
  AICancelStreamRequest,
  AIFetchAnthropicRequest,
  AIFetchAnthropicResponse,
  AIFetchOpenAIRequest,
  AIFetchOpenAIResponse,
  AIStreamAnthropicRequest,
  AIStreamChunk,
  AIStreamOpenAIRequest,
} from './types';
// Inline channel() helper — avoids @sqlpro/ipc-contracts dependency in web build
function channel<TIn = unknown, TOut = unknown>(name: string) {
  return { name, _input: undefined as unknown as TIn, _output: undefined as unknown as TOut };
}

export const aiChannels = {
  getSettings: channel<void, unknown>('ai:get-settings'),
  saveSettings: channel<unknown, unknown>('ai:save-settings'),
  fetchAnthropic: channel<AIFetchAnthropicRequest, AIFetchAnthropicResponse>(
    'ai:fetch-anthropic'
  ),
  fetchOpenAI: channel<AIFetchOpenAIRequest, AIFetchOpenAIResponse>(
    'ai:fetch-openai'
  ),
  streamAnthropic: channel<AIStreamAnthropicRequest, AIStreamChunk>(
    'ai:stream-anthropic'
  ),
  streamOpenAI: channel<AIStreamOpenAIRequest, AIStreamChunk>(
    'ai:stream-openai'
  ),
  agentQuery: channel<AIAgentQueryRequest, AIAgentMessage>('ai:agent-query'),
  cancelStream: channel<AICancelStreamRequest, void>('ai:cancel-stream'),
  getClaudeCodePaths: channel<void, unknown>('ai:get-claude-code-paths'),
} as const;
