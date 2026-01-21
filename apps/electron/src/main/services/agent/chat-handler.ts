// Chat Handler
// Handles AI chat interactions using Vercel AI SDK streamText

import type { AnthropicProviderOptions } from '@ai-sdk/anthropic';
import type { AgentSettings } from '@shared/types/agent';
import type { UIMessage } from 'ai';
import { convertToModelMessages, stepCountIs, streamText } from 'ai';
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

IMPORTANT: After using any tool, you MUST provide a natural language response summarizing the results. Never leave the response empty after a tool call - always explain what you found or what action was taken.

Be concise but thorough. Format SQL code in markdown code blocks.`;

export interface ChatHandlerOptions {
  connectionId: string;
  messages: UIMessage[];
  settings: AgentSettings;
  signal?: AbortSignal;
}

/**
 * Handle a chat request with streaming response
 */
export async function handleChat(options: ChatHandlerOptions) {
  const { connectionId, messages, settings, signal } = options;

  console.warn('[Agent] handleChat called with:', {
    connectionId,
    messageCount: messages.length,
    config: {
      baseUrl: settings.config.baseUrl,
      model: settings.config.model,
      apiType: settings.config.apiType,
      hasApiKey: !!settings.config.apiKey,
    },
  });

  // Create model and tools
  const { model, isDirectAnthropic } = createChatModel(settings.config);
  const tools = createAgentTools(connectionId, settings.execution);

  console.warn('[Agent] Model created, isDirectAnthropic:', isDirectAnthropic);

  // Convert UI messages to model messages
  const modelMessages = await convertToModelMessages(messages);

  console.warn(
    '[Agent] Starting streamText with',
    modelMessages.length,
    'messages'
  );

  // Build streamText options
  const streamOptions: Parameters<typeof streamText>[0] = {
    model,
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(10), // Allow multi-step tool calling
    abortSignal: signal,
  };

  // Enable extended thinking for direct Anthropic API with Claude 4+ models
  if (isDirectAnthropic) {
    const modelName = settings.config.model?.toLowerCase() || '';
    // Extended thinking is supported on Claude 3.7 Sonnet and Claude 4 models
    const supportsThinking =
      modelName.includes('claude-3-7') ||
      modelName.includes('claude-sonnet-4') ||
      modelName.includes('claude-opus-4') ||
      modelName.includes('claude-4');

    if (supportsThinking) {
      console.warn(
        '[Agent] Enabling extended thinking for model:',
        settings.config.model
      );
      streamOptions.providerOptions = {
        anthropic: {
          thinking: { type: 'enabled', budgetTokens: 10000 },
        } satisfies AnthropicProviderOptions,
      };
    }
  }

  // Stream the response
  const result = streamText(streamOptions);

  return result;
}
