# AI Agent 重构设计文档：Vercel AI SDK + AI Elements

> **日期**: 2026-01-22
> **状态**: 设计阶段
> **目标**: 使用 Vercel AI SDK `useChat` hook 和 AI Elements 组件库全面重构 AI Agent 系统

---

## 1. 当前架构问题

### 1.1 问题分析

| 问题                       | 当前实现                                  | 代码位置                                   | 行数    |
| -------------------------- | ----------------------------------------- | ------------------------------------------ | ------- |
| **重复的状态管理**         | 手写 messages 状态、streaming 处理        | `useAgent.ts`                              | 676 行  |
| **重复的 streaming 解析**  | 手动解析 `text-delta`, `tool-call` chunks | `useAgent.ts:160-378`                      | ~220 行 |
| **重复的 UI 组件**         | 手写 Shimmer、Reasoning、ToolCall         | `MessageContent.tsx`                       | 663 行  |
| **重复的 thinking 指示器** | 两处显示 "思考中..."                      | `AIAgentSidebar.tsx`, `MessageContent.tsx` | 已修复  |
| **复杂的 IPC 架构**        | 自定义 stream channel + chunk 转发        | `agent/index.ts:104-257`                   | ~150 行 |

### 1.2 当前数据流

```
Renderer (useAgent hook)
    ↓ IPC: agent:chat:send
Main Process (chat-handler.ts)
    ↓ streamText() → fullStream iterator
    ↓ 手动迭代发送 chunks
    ↓ IPC: agent:chat:stream:{streamId}
Renderer (handleStreamChunk - 手动解析每种 chunk 类型)
```

---

## 2. 目标架构

### 2.1 新数据流

```
Renderer (useChat hook with DefaultChatTransport)
    ↓ HTTP: POST http://localhost:${API_PORT}/api/chat
Main Process (Embedded Express Server)
    ↓ streamText() → toUIMessageStreamResponse()
    ↓ SSE stream response
Renderer (useChat 自动处理所有 streaming 状态)
```

### 2.2 架构对比

| 方面               | 当前架构                    | 新架构                         |
| ------------------ | --------------------------- | ------------------------------ |
| **Frontend State** | 手写 useAgent hook (676 行) | `useChat` from `@ai-sdk/react` |
| **Streaming 处理** | 手动解析 IPC chunks         | SDK 自动处理                   |
| **Backend API**    | IPC handlers                | 内嵌 Express HTTP API          |
| **UI 组件**        | 手写 MessageContent 等      | AI Elements 组件               |
| **Tool Calling**   | 手动状态管理                | SDK 内置 `addToolOutput`       |

### 2.3 新架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        Electron App                             │
├─────────────────────────────────────────────────────────────────┤
│  Main Process                                                   │
│  ├── Embedded Express Server (localhost:3847)                   │
│  │   └── POST /api/chat → streamText().toUIMessageStreamResponse│
│  │   └── POST /api/tool-execute → 执行数据库工具 (IPC 调用)      │
│  └── Existing IPC handlers (settings, history - 保留)           │
├─────────────────────────────────────────────────────────────────┤
│  Renderer Process                                               │
│  ├── useChat({ transport: DefaultChatTransport })               │
│  ├── AI Elements UI Components                                  │
│  │   ├── Conversation, ConversationContent                      │
│  │   ├── Message, MessageContent, MessageAvatar                 │
│  │   ├── PromptInput, PromptInputTextarea                       │
│  │   ├── Reasoning, ReasoningTrigger, ReasoningContent          │
│  │   └── Tool, ToolHeader, ToolContent, ToolInput, ToolOutput   │
│  └── onToolCall → window.sqlPro.agent.executeTool() (IPC)       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 实施计划

### Phase 1: 基础设施 (预计 1-2 小时)

#### 3.1 安装 AI Elements

```bash
cd apps/electron
# 添加 AI Elements 组件
npx shadcn@latest add "https://www.shadcn.io/r/ai/conversation.json"
npx shadcn@latest add "https://www.shadcn.io/r/ai/message.json"
npx shadcn@latest add "https://www.shadcn.io/r/ai/prompt-input.json"
npx shadcn@latest add "https://www.shadcn.io/r/ai/response.json"
npx shadcn@latest add "https://www.shadcn.io/r/ai/reasoning.json"
npx shadcn@latest add "https://www.shadcn.io/r/ai/tool.json"
npx shadcn@latest add "https://www.shadcn.io/r/ai/loader.json"
npx shadcn@latest add "https://www.shadcn.io/r/ai/actions.json"

# 安装依赖
pnpm add use-stick-to-bottom
```

#### 3.2 创建内嵌 Express API 服务

新增文件: `apps/electron/src/main/services/api-server.ts`

```typescript
// AI Chat API Server for Electron
// Provides HTTP endpoint for useChat hook

import type { Express } from 'express';
import type { Server } from 'http';
import type { AgentSettings } from '@shared/types/agent';
import { convertToModelMessages, streamText, UIMessage } from 'ai';
import express from 'express';
import { createChatModel } from './agent/model';
import { createAgentTools } from './agent/tools';
import { agentSettingsStore } from './agent/settings-store';
import { getCurrentLanguage } from './menu';

// Use a high port to avoid conflicts
const API_PORT = 3847;

let server: Server | null = null;
let app: Express | null = null;

const SYSTEM_PROMPT_EN = `You are SQL Pro AI Assistant...`; // 复用现有 prompt
const SYSTEM_PROMPT_ZH = `你是 SQL Pro AI 助手...`; // 复用现有 prompt

export function startApiServer(): number {
  if (server) return API_PORT;

  app = express();
  app.use(express.json({ limit: '10mb' }));

  // CORS for renderer
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

  // Chat endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const {
        messages,
        connectionId,
      }: {
        messages: UIMessage[];
        connectionId: string;
      } = req.body;

      const settings = agentSettingsStore.getSettings();
      if (!agentSettingsStore.isConfigured()) {
        return res.status(400).json({ error: 'Agent not configured' });
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

      // Enable extended thinking for Anthropic
      if (isDirectAnthropic) {
        // ... 复用现有的 extended thinking 配置
      }

      const result = streamText(streamOptions);

      // Return as UI message stream (SSE)
      return result.toUIMessageStreamResponse({
        sendSources: true,
        sendReasoning: true,
      });
    } catch (error) {
      console.error('Chat API error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Chat failed',
      });
    }
  });

  server = app.listen(API_PORT, '127.0.0.1', () => {
    console.log(`AI Chat API server running on http://127.0.0.1:${API_PORT}`);
  });

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
```

### Phase 2: Hook 重构 (预计 2-3 小时)

#### 3.3 新建 useAgentChat hook

新增文件: `apps/electron/src/renderer/src/hooks/useAgentChat.ts`

```typescript
// useAgentChat - AI Agent chat using Vercel AI SDK useChat
// Replaces the manual useAgent hook with SDK-native implementation

import type { AgentSettings, ChatSession } from '@shared/types/agent';
import { useChat } from '@ai-sdk/react';
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from 'ai';
import { useCallback, useEffect, useState } from 'react';

const API_PORT = 3847; // Must match api-server.ts

interface UseAgentChatOptions {
  connectionId: string;
  sessionId?: string;
}

interface UseAgentChatReturn {
  // From useChat
  messages: UIMessage[];
  status: 'submitted' | 'streaming' | 'ready' | 'error';
  error: Error | undefined;
  sendMessage: (text: string) => void;
  stop: () => void;
  regenerate: () => void;
  setMessages: (messages: UIMessage[]) => void;
  clearError: () => void;

  // Custom additions
  settings: AgentSettings | null;
  isConfigured: boolean;
  sessions: ChatSession[];
  createNewSession: () => string;
  loadSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  saveSettings: (settings: Partial<AgentSettings>) => Promise<void>;
}

export function useAgentChat(options: UseAgentChatOptions): UseAgentChatReturn {
  const { connectionId } = options;

  // Settings state (still using IPC for persistence)
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState(
    () => options.sessionId || `session-${Date.now()}`
  );

  // Core chat functionality via useChat
  const {
    messages,
    status,
    error,
    sendMessage: sdkSendMessage,
    stop,
    regenerate,
    setMessages,
    clearError,
    addToolOutput,
  } = useChat({
    id: currentSessionId,
    transport: new DefaultChatTransport({
      api: `http://127.0.0.1:${API_PORT}/api/chat`,
      body: { connectionId },
    }),

    // Auto-submit after tool calls complete
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,

    // Client-side tool handling (for tools that need renderer access)
    async onToolCall({ toolCall }) {
      // Database tools are executed server-side
      // Only handle client-side tools here if needed
    },

    onFinish: async ({ messages: finalMessages }) => {
      // Save to history via IPC
      await window.sqlPro.agent.saveHistory({
        connectionId,
        sessionId: currentSessionId,
        messages: finalMessages,
      });
      await loadSessions();
    },
  });

  // Wrapper for sendMessage
  const sendMessage = useCallback(
    (text: string) => {
      sdkSendMessage({ text });
    },
    [sdkSendMessage]
  );

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      const response = await window.sqlPro.agent.getSettings();
      setSettings(response.settings);
      setIsConfigured(response.isConfigured);
    };
    loadSettings();
  }, []);

  // Load sessions
  const loadSessions = useCallback(async () => {
    if (!connectionId) return;
    const response = await window.sqlPro.agent.getSessions({ connectionId });
    setSessions(response.sessions);
  }, [connectionId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Session management
  const createNewSession = useCallback(() => {
    const newId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setCurrentSessionId(newId);
    setMessages([]);
    return newId;
  }, [setMessages]);

  const loadSession = useCallback(
    async (sessionId: string) => {
      const response = await window.sqlPro.agent.getSession({
        connectionId,
        sessionId,
      });
      if (response.session) {
        setMessages(response.session.messages);
        setCurrentSessionId(sessionId);
      }
    },
    [connectionId, setMessages]
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      await window.sqlPro.agent.deleteSession({ connectionId, sessionId });
      await loadSessions();
      if (sessionId === currentSessionId) {
        createNewSession();
      }
    },
    [connectionId, currentSessionId, loadSessions, createNewSession]
  );

  const saveSettings = useCallback(
    async (newSettings: Partial<AgentSettings>) => {
      const response = await window.sqlPro.agent.saveSettings({
        settings: newSettings,
      });
      setSettings(response.settings);
      setIsConfigured(true);
    },
    []
  );

  return {
    messages,
    status,
    error,
    sendMessage,
    stop,
    regenerate,
    setMessages,
    clearError,
    settings,
    isConfigured,
    sessions,
    createNewSession,
    loadSession,
    deleteSession,
    saveSettings,
  };
}
```

### Phase 3: UI 组件重构 (预计 3-4 小时)

#### 3.4 重构 MessageContent 使用 AI Elements

新增文件: `apps/electron/src/renderer/src/components/agent/AgentMessage.tsx`

```tsx
// AgentMessage - Message renderer using AI Elements
// Replaces MessageContent.tsx with AI Elements components

import type { UIMessage } from 'ai';
import {
  Message,
  MessageAvatar,
  MessageContent as AIMessageContent,
} from '@/components/ui/ai/message';
import { Response } from '@/components/ui/ai/response';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ui/ai/reasoning';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ui/ai/tool';
import { Loader } from '@/components/ui/ai/loader';
import { Action, Actions } from '@/components/ui/ai/actions';
import { Bot, Copy, RefreshCw, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AgentMessageProps {
  message: UIMessage;
  isStreaming?: boolean;
  onCopy?: () => void;
  onRegenerate?: () => void;
}

export function AgentMessage({
  message,
  isStreaming,
  onCopy,
  onRegenerate,
}: AgentMessageProps) {
  const { t } = useTranslation();
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <Message from={message.role}>
      <MessageAvatar>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </MessageAvatar>

      <AIMessageContent>
        {message.parts.map((part, index) => {
          switch (part.type) {
            case 'text':
              return part.text ? (
                <Response key={index}>{part.text}</Response>
              ) : isStreaming ? (
                <Loader key={index} />
              ) : null;

            case 'reasoning':
              return (
                <Reasoning
                  key={index}
                  isStreaming={isStreaming}
                  defaultOpen={isStreaming}
                >
                  <ReasoningTrigger title={t('agent.reasoning', 'Thinking')} />
                  <ReasoningContent>{part.text}</ReasoningContent>
                </Reasoning>
              );

            case 'tool-call':
              return (
                <Tool key={index} defaultOpen={false}>
                  <ToolHeader
                    state={part.state}
                    type={`tool-${part.toolName}`}
                  />
                  <ToolContent>
                    <ToolInput input={part.input} />
                  </ToolContent>
                </Tool>
              );

            case 'tool-result':
              return (
                <ToolOutput
                  key={index}
                  output={<Response>{formatToolOutput(part.output)}</Response>}
                />
              );

            default:
              return null;
          }
        })}

        {/* Show loader for empty streaming messages */}
        {isStreaming && message.parts.length === 0 && <Loader />}
      </AIMessageContent>

      {/* Actions for assistant messages */}
      {isAssistant && !isStreaming && (
        <Actions>
          {onCopy && (
            <Action tooltip={t('common.copy', 'Copy')} onClick={onCopy}>
              <Copy className="size-4" />
            </Action>
          )}
          {onRegenerate && (
            <Action
              tooltip={t('agent.regenerate', 'Regenerate')}
              onClick={onRegenerate}
            >
              <RefreshCw className="size-4" />
            </Action>
          )}
        </Actions>
      )}
    </Message>
  );
}

function formatToolOutput(output: unknown): string {
  if (typeof output === 'string') return output;
  return JSON.stringify(output, null, 2);
}
```

#### 3.5 重构 AIAgentSidebar

更新文件: `apps/electron/src/renderer/src/components/agent/AIAgentSidebar.tsx`

```tsx
// AIAgentSidebar - Refactored with AI Elements
// Uses useAgentChat and AI Elements components

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ui/ai/conversation';
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from '@/components/ui/ai/prompt-input';
import { Button } from '@sqlpro/ui/button';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sqlpro/ui/tooltip';
import {
  ChevronRight,
  History,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAgentChat } from '@/hooks/useAgentChat';
import { AgentMessage } from './AgentMessage';
import { AgentSettingsPanel } from './AgentSettingsPanel';

interface AIAgentSidebarProps {
  connectionId: string;
  databaseName?: string;
  tableName?: string;
  onClose: () => void;
}

export function AIAgentSidebar({
  connectionId,
  databaseName,
  tableName,
  onClose,
}: AIAgentSidebarProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const {
    messages,
    status,
    error,
    sendMessage,
    stop,
    regenerate,
    clearError,
    isConfigured,
    sessions,
    createNewSession,
    loadSession,
    deleteSession,
    saveSettings,
    settings,
  } = useAgentChat({ connectionId });

  const isLoading = status === 'streaming' || status === 'submitted';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Show settings if not configured
  if (showSettings || !isConfigured) {
    return (
      <div className="bg-background flex h-full flex-col">
        {/* Header */}
        <div className="border-border/50 bg-muted/30 border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="text-primary h-4 w-4" />
              <span className="text-sm font-medium">
                {t('agent.settings', 'Agent Settings')}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1 p-4">
          <AgentSettingsPanel
            settings={settings}
            onSave={async (newSettings) => {
              await saveSettings(newSettings);
              setShowSettings(false);
            }}
            onCancel={isConfigured ? () => setShowSettings(false) : undefined}
          />
        </ScrollArea>
      </div>
    );
  }

  // Main chat view
  return (
    <div className="bg-background flex h-full flex-col">
      {/* Header */}
      <div className="border-border/50 bg-muted/30 border-b px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary h-4 w-4" />
            <span className="text-sm font-semibold">
              {t('agent.title', 'SQL Pro Agent')}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowHistory(true)}
                >
                  <History className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('agent.history', 'History')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={createNewSession}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('agent.newSession', 'New')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('agent.settings', 'Settings')}</TooltipContent>
            </Tooltip>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onClose}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <Conversation className="flex-1">
        <ConversationContent className="space-y-3 p-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground text-sm">
                {t('agent.welcomeTitle', 'How can I help?')}
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <AgentMessage
              key={message.id}
              message={message}
              isStreaming={isLoading && index === messages.length - 1}
              onCopy={() => {
                const text = message.parts
                  .filter((p) => p.type === 'text')
                  .map((p) => p.text)
                  .join('');
                handleCopy(text);
              }}
              onRegenerate={
                message.role === 'assistant' && index === messages.length - 1
                  ? regenerate
                  : undefined
              }
            />
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Error display */}
      {error && (
        <div className="border-destructive/20 bg-destructive/5 border-t px-3 py-2">
          <p className="text-destructive text-xs">{error.message}</p>
          <Button variant="ghost" size="sm" onClick={clearError}>
            {t('common.dismiss', 'Dismiss')}
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="border-border/50 border-t p-3">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('agent.placeholder', 'Ask about your data...')}
            disabled={isLoading || !isConfigured}
          />
          <PromptInputToolbar>
            <PromptInputSubmit
              disabled={!input.trim() || !isConfigured}
              status={status}
              onClick={isLoading ? stop : undefined}
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}
```

---

## 4. 文件变更清单

### 4.1 新增文件

| 文件                                                 | 用途                          |
| ---------------------------------------------------- | ----------------------------- |
| `src/main/services/api-server.ts`                    | 内嵌 Express HTTP API 服务    |
| `src/renderer/src/hooks/useAgentChat.ts`             | 基于 useChat 的新 hook        |
| `src/renderer/src/components/agent/AgentMessage.tsx` | 使用 AI Elements 的消息组件   |
| `src/renderer/src/components/ui/ai/*.tsx`            | AI Elements 组件 (via shadcn) |

### 4.2 修改文件

| 文件                                                   | 变更                                           |
| ------------------------------------------------------ | ---------------------------------------------- |
| `src/main/index.ts`                                    | 启动 API server                                |
| `src/main/services/agent/index.ts`                     | 保留 settings/history IPC, 移除 chat streaming |
| `src/renderer/src/components/agent/AIAgentSidebar.tsx` | 使用新组件和 hook                              |
| `package.json`                                         | 添加依赖: `express`, `use-stick-to-bottom`     |

### 4.3 可删除文件 (重构完成后)

| 文件                                                   | 原因                               |
| ------------------------------------------------------ | ---------------------------------- |
| `src/renderer/src/hooks/useAgent.ts`                   | 被 useAgentChat 替代               |
| `src/renderer/src/components/agent/MessageContent.tsx` | 被 AgentMessage + AI Elements 替代 |

---

## 5. 迁移策略

### 5.1 渐进式迁移

1. **Phase 1**: 并行运行新旧系统
   - 保留现有 `useAgent` hook
   - 新增 `useAgentChat` hook
   - 通过 feature flag 切换

2. **Phase 2**: 切换默认实现
   - 将 `AIAgentSidebar` 改为使用新 hook
   - 验证所有功能正常

3. **Phase 3**: 清理旧代码
   - 删除 `useAgent.ts`
   - 删除旧 `MessageContent.tsx`
   - 移除 IPC streaming 代码

### 5.2 回滚计划

如果新实现出现问题:

- 保留旧代码在 `_deprecated/` 目录
- 通过 settings 开关切换回旧实现

---

## 6. 风险与缓解

| 风险                     | 影响         | 缓解措施                          |
| ------------------------ | ------------ | --------------------------------- |
| Express 端口冲突         | API 无法启动 | 使用高端口 3847，支持自动端口切换 |
| AI SDK 版本不兼容        | 类型错误     | 锁定版本，充分测试                |
| Extended thinking 不工作 | 推理过程丢失 | 保留现有 Anthropic 配置逻辑       |
| Tool calling 行为变化    | 工具执行失败 | 全面测试所有 6 个工具             |

---

## 7. 测试计划

### 7.1 功能测试

- [ ] 基本对话流程
- [ ] Streaming 文本显示
- [ ] Extended thinking (reasoning) 显示
- [ ] Tool calling (execute_sql, get_schema, etc.)
- [ ] 错误处理和显示
- [ ] 取消/停止请求
- [ ] 重新生成响应
- [ ] Session 历史加载/保存
- [ ] Settings 配置

### 7.2 性能测试

- [ ] 首次加载时间
- [ ] Streaming 延迟
- [ ] 内存使用 (长对话)

---

## 8. 时间估算

| Phase    | 任务                               | 预计时间      |
| -------- | ---------------------------------- | ------------- |
| 1        | 安装 AI Elements + 创建 API server | 1-2 小时      |
| 2        | 创建 useAgentChat hook             | 2-3 小时      |
| 3        | 创建 AgentMessage 组件             | 1-2 小时      |
| 4        | 重构 AIAgentSidebar                | 2-3 小时      |
| 5        | 测试和调试                         | 2-3 小时      |
| 6        | 清理旧代码                         | 1 小时        |
| **总计** |                                    | **9-14 小时** |

---

## 9. 下一步

1. 审核此设计文档
2. 确认后开始 Phase 1 实施
3. 每个 Phase 完成后进行验证
