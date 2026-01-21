// Chat Handler
// Handles AI chat interactions using Vercel AI SDK streamText

import type { AgentSettings } from '@shared/types/agent';
import type {UIMessage} from 'ai';
import {
  convertToModelMessages,
  stepCountIs,
  streamText
  
} from 'ai';
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
  signal?: AbortSignal;
}

/**
 * Handle a chat request with streaming response
 */
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
    stopWhen: stepCountIs(10), // Allow multi-step tool calling
    abortSignal: signal,
  });

  return result;
}
