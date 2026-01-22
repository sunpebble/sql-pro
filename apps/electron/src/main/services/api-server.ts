import type { AnthropicProviderOptions } from '@ai-sdk/anthropic';
import type { UIMessage } from 'ai';
import type { Express, Request, Response } from 'express';
import type { Server } from 'node:http';
import { convertToModelMessages, stepCountIs, streamText } from 'ai';
import express from 'express';
import { createChatModel } from './agent/model';
import { agentSettingsStore } from './agent/settings-store';
import { createAgentTools } from './agent/tools';
import { getCurrentLanguage } from './menu';

const API_PORT = 3847;

let server: Server | null = null;
let app: Express | null = null;

const SYSTEM_PROMPT_EN = `You are SQL Pro AI Assistant, an expert database assistant integrated into SQL Pro application.

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

const SYSTEM_PROMPT_ZH = `你是 SQL Pro AI 助手，一个集成在 SQL Pro 应用中的专业数据库助手。

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

export function startApiServer(): number {
  if (server) return API_PORT;

  app = express();
  app.use(express.json({ limit: '10mb' }));

  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    if (_req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const {
        messages,
        connectionId,
      }: {
        messages: UIMessage[];
        connectionId: string;
      } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: 'Messages are required' });
        return;
      }

      const settings = agentSettingsStore.getSettings();
      if (!agentSettingsStore.isConfigured()) {
        res.status(400).json({ error: 'Agent not configured' });
        return;
      }

      const { model, isDirectAnthropic } = createChatModel(settings.config);
      const tools = createAgentTools(connectionId, settings.execution);
      const modelMessages = await convertToModelMessages(messages);
      const language = getCurrentLanguage();
      const systemPrompt =
        language === 'zh' ? SYSTEM_PROMPT_ZH : SYSTEM_PROMPT_EN;

      const streamOptions: Parameters<typeof streamText>[0] = {
        model,
        system: systemPrompt,
        messages: modelMessages,
        tools,
        stopWhen: stepCountIs(10),
      };

      if (isDirectAnthropic) {
        const modelName = settings.config.model?.toLowerCase() || '';
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
          streamOptions.headers = {
            'anthropic-beta': 'interleaved-thinking-2025-05-14',
          };
        }
      }

      const result = streamText(streamOptions);

      const response = result.toUIMessageStreamResponse({
        sendReasoning: true,
      });

      res.setHeader(
        'Content-Type',
        response.headers.get('Content-Type') || 'text/event-stream'
      );
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = response.body?.getReader();
      if (!reader) {
        res.status(500).json({ error: 'Failed to get stream reader' });
        return;
      }

      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              res.end();
              break;
            }
            res.write(value);
          }
        } catch (error) {
          console.error('Stream error:', error);
          res.end();
        }
      };

      req.on('close', () => {
        reader.cancel();
      });

      await pump();
    } catch (error) {
      console.error('Chat API error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Chat failed',
        });
      }
    }
  });

  server = app.listen(API_PORT, '127.0.0.1');

  return API_PORT;
}

export function stopApiServer(): void {
  if (server) {
    server.close();
    server = null;
    app = null;
  }
}

export function getApiPort(): number {
  return API_PORT;
}
