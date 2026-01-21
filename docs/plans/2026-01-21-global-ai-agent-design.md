# Global AI Agent Design

## Overview

Implement a global AI Agent entry point for SQL Pro using Vercel AI SDK, replacing the existing multi-provider AI implementation with a unified, streamlined approach.

## Requirements Summary

- **UI**: Floating dialog accessible from any page
- **Functionality**: SQL assistant + general chat + data analysis (context-aware)
- **Workflow**: Multi-step reasoning with tool calling
- **API**: Unified configuration with auto-detection (OpenAI/Anthropic compatible)
- **Tools**: Full SQL and analysis toolkit
- **History**: Per-connection isolated chat history
- **Safety**: Configurable auto-execution for dangerous operations

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Renderer (React)                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Vercel AI SDK (@ai-sdk/react)           │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │    │
│  │  │ useChat  │ │ Message  │ │ Tool Confirmation    │ │    │
│  │  └──────────┘ └──────────┘ └──────────────────────┘ │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                  │
│                          ▼                                  │
│                   IPC (streaming)                           │
└──────────────────────────┼──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     Main Process                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Vercel AI SDK (ai package)                 │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────────┐    │    │
│  │  │ streamText│  │   Tools   │  │ History Store │    │    │
│  │  └───────────┘  └───────────┘  └───────────────┘    │    │
│  │                      │                               │    │
│  │                      ▼                               │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │     createOpenAI / createAnthropic          │    │    │
│  │  │     (Auto-detect from base URL)             │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Unified API Configuration

### Settings Interface

```typescript
interface AgentConfig {
  baseUrl: string; // API endpoint
  apiKey: string; // API key
  model: string; // Model name
  apiType?: 'openai' | 'anthropic'; // Optional hint
}
```

### Auto-Detection Logic

```typescript
function detectApiType(baseUrl: string): 'openai' | 'anthropic' {
  const url = baseUrl.toLowerCase();
  if (url.includes('anthropic') || url.includes('claude')) {
    return 'anthropic';
  }
  return 'openai'; // Default: most services are OpenAI-compatible
}
```

---

## Tools Definition

### Core SQL Tools

| Tool            | Description                             | Parameters                        |
| --------------- | --------------------------------------- | --------------------------------- |
| `execute_sql`   | Execute SQL query on current connection | `sql: string, params?: unknown[]` |
| `get_schema`    | Get database structure                  | `tableName?: string`              |
| `explain_query` | Analyze query execution plan            | `sql: string`                     |

### Data Analysis Tools

| Tool            | Description                         | Parameters                              |
| --------------- | ----------------------------------- | --------------------------------------- |
| `analyze_table` | Analyze table data distribution     | `tableName: string, columns?: string[]` |
| `suggest_index` | Suggest index optimizations         | `sql: string`                           |
| `compare_data`  | Compare data between tables/queries | `source, target, keyColumns`            |

### Safety Configuration

| Setting             | Description                   | Default |
| ------------------- | ----------------------------- | ------- |
| `autoExecuteSelect` | Auto-execute SELECT queries   | `true`  |
| `autoExecuteInsert` | Auto-execute INSERT           | `false` |
| `autoExecuteUpdate` | Auto-execute UPDATE           | `false` |
| `autoExecuteDelete` | Auto-execute DELETE           | `false` |
| `confirmDDL`        | Always confirm DDL operations | `true`  |

---

## UI Components

### Component Structure

```
renderer/src/components/agent/
├── AIAgentDialog.tsx       # Main dialog (useChat)
├── AIAgentTrigger.tsx      # Floating trigger button
├── SqlCodeBlock.tsx        # SQL code block with actions
├── ToolConfirmCard.tsx     # Tool confirmation UI
├── ToolResultCard.tsx      # Tool result display
└── AgentSettingsSheet.tsx  # Settings sidebar
```

### Trigger Methods

- Floating button (bottom-right corner)
- Keyboard shortcut: `Cmd/Ctrl + J`
- Draggable and resizable dialog

---

## Data Flow

### IPC Communication

1. Renderer sends message via `useChat` → IPC bridge
2. Main process calls `streamText()` with tools
3. Stream chunks sent back to renderer
4. Tool calls requiring confirmation pause for user input
5. User confirms/rejects → tool executes → result streamed back

### History Storage

```
~/.sqlpro/
├── agent/
│   ├── settings.json           # Agent configuration
│   └── history/
│       ├── {connectionId1}.json
│       └── {connectionId2}.json
```

Each connection has isolated chat history with sessions.

---

## Error Handling

| Error Code         | Description           | User Message                     |
| ------------------ | --------------------- | -------------------------------- |
| `API_ERROR`        | API request failed    | "⚠️ API 错误: {message}"         |
| `TOOL_ERROR`       | Tool execution failed | "❌ 执行 {tool} 失败: {message}" |
| `CONNECTION_ERROR` | Database disconnected | "🔌 数据库连接已断开"            |
| `RATE_LIMIT`       | Too many requests     | "⏳ 请求过于频繁"                |

---

## Migration Plan

### Files to Delete

```
- main/services/ipc/ai.ts
- renderer/src/stores/ai-store.ts
- renderer/src/hooks/useAI.ts
- renderer/src/components/ai/
- AI-related types in shared/types.ts
```

### Files to Create

```
+ main/services/agent/
  ├── index.ts
  ├── chat-handler.ts
  ├── tools/
  │   ├── index.ts
  │   ├── sql-tools.ts
  │   └── analysis-tools.ts
  ├── model.ts
  └── history-store.ts
+ renderer/src/components/agent/
+ renderer/src/stores/agent-store.ts
+ shared/types/agent.ts
```

### Dependency Changes

```diff
- "@anthropic-ai/sdk"
- "@anthropic-ai/claude-agent-sdk"
- "openai"
+ "ai": "^4.x.x"
+ "@ai-sdk/openai": "^1.x.x"
+ "@ai-sdk/anthropic": "^1.x.x"
+ "@ai-sdk/react": "^1.x.x"
+ "zod": "^3.x.x"
```

---

## Implementation Order

1. **Phase 1**: Setup dependencies, create type definitions
2. **Phase 2**: Implement main process agent (model, tools, IPC handlers)
3. **Phase 3**: Implement UI components (dialog, trigger, messages)
4. **Phase 4**: Add history storage and settings
5. **Phase 5**: Remove old AI code, cleanup
6. **Phase 6**: Testing and refinement
