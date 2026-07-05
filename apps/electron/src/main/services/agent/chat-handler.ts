// Chat Handler
// Handles AI chat interactions using Vercel AI SDK streamText

import type { AnthropicProviderOptions } from '@ai-sdk/anthropic';
import type { AgentSettings } from '@shared/types/agent';
import type { StreamTextResult, UIMessage } from 'ai';
import { convertToModelMessages, stepCountIs, streamText } from 'ai';
import { getCurrentLanguage } from '../../core/menu';
import { createChatModel } from './model';
import { createAgentTools } from './tools';

const SYSTEM_PROMPT_EN = `You are Quarry AI Assistant, an expert database assistant integrated into Quarry application.

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

const SYSTEM_PROMPT_ZH = `你是 Quarry AI 助手，一个集成在 Quarry 应用中的专业数据库助手。

你的能力：
- 在连接的数据库上执行 SQL 查询
- 分析数据库结构和表结构
- 解释查询执行计划
- 分析表数据分布和统计信息
- 为查询建议索引优化
- 比较表之间的数据

使用指南：
1. 在编写复杂查询之前，务必先验证数据库结构
2. 处理用户提供的值时使用参数化查询
3. 在建议优化时解释你的推理过程
4. 对于潜在危险操作（DELETE、DROP 等）要警告用户
5. 格式化 SQL 查询以提高可读性
6. 在查询后提供执行时间和行数

当用户提问时：
- 对于数据问题：使用 execute_sql 工具
- 对于结构问题：首先使用 get_schema 工具
- 对于性能问题：使用 explain_query 和 suggest_index 工具
- 对于数据比较：使用 compare_data 工具

重要：使用任何工具后，你必须提供自然语言响应来总结结果。工具调用后永远不要留空响应——务必解释你发现了什么或采取了什么操作。

请简洁但全面地回答。使用 markdown 代码块格式化 SQL 代码。请用中文回复用户。`;

export interface ChatHandlerOptions {
  connectionId: string;
  messages: UIMessage[];
  settings: AgentSettings;
  signal?: AbortSignal;
}

/**
 * Handle a chat request with streaming response
 */
export async function handleChat(
  options: ChatHandlerOptions
): Promise<StreamTextResult<any, any>> {
  const { connectionId, messages, settings, signal } = options;

  // Create model and tools
  const { model, isDirectAnthropic } = createChatModel(settings.config);
  const tools = createAgentTools(connectionId, settings.execution);

  // Convert UI messages to model messages
  const modelMessages = await convertToModelMessages(messages);

  // Get system prompt based on current language
  const language = getCurrentLanguage();
  const systemPrompt = language === 'zh' ? SYSTEM_PROMPT_ZH : SYSTEM_PROMPT_EN;

  // Build streamText options
  const streamOptions: Parameters<typeof streamText>[0] = {
    model,
    system: systemPrompt,
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
      streamOptions.providerOptions = {
        anthropic: {
          thinking: { type: 'enabled', budgetTokens: 10000 },
        } satisfies AnthropicProviderOptions,
      };
      // Enable interleaved thinking for Claude 4 models
      streamOptions.headers = {
        'anthropic-beta': 'interleaved-thinking-2025-05-14',
      };
    }
  }

  // Stream the response
  const result = streamText(streamOptions);

  return result;
}
