# Phase 15: AI Natural Language Query - Research

**Researched:** 2026-01-30
**Domain:** AI-powered Text-to-SQL, Natural Language Query Generation
**Confidence:** HIGH

## Summary

Phase 15 builds upon the existing AI Agent infrastructure already implemented in SQL Pro. The codebase already has a complete Vercel AI SDK integration with streaming chat, tool calling, schema retrieval, and query execution capabilities. This phase focuses on extending these capabilities to provide:

1. **Quick Query Mode** - Command palette integration for rapid natural language to SQL conversion
2. **SQL Explanation** - Select SQL and get AI-powered explanations
3. **Query Optimization** - AI analysis and optimization suggestions

The existing agent implementation (`apps/electron/src/main/services/agent/`) provides the foundation. Key additions needed are structured output for SQL generation, command palette mode switching, and Monaco editor integration for SQL selection.

**Primary recommendation:** Extend the existing Vercel AI SDK `streamText` implementation with `generateObject` for structured SQL output, leverage existing schema tools, and integrate with command palette via a new "quick query" mode.

## Standard Stack

### Core (Already Installed)

| Library              | Version | Purpose                                             | Why Standard                                   |
| -------------------- | ------- | --------------------------------------------------- | ---------------------------------------------- |
| `ai` (Vercel AI SDK) | ^6.0.48 | Core AI functionality, streaming, structured output | Already in use, industry standard              |
| `@ai-sdk/anthropic`  | ^3.0.23 | Anthropic provider                                  | Already configured                             |
| `@ai-sdk/openai`     | ^3.0.18 | OpenAI provider                                     | Already configured                             |
| `@ai-sdk/react`      | ^3.0.50 | React hooks for AI                                  | useChat already in use                         |
| `zod`                | ^4.3.6  | Schema validation for structured output             | Already installed, required for generateObject |

### Supporting (Already Installed)

| Library                | Version | Purpose                   | When to Use                   |
| ---------------------- | ------- | ------------------------- | ----------------------------- |
| `cmdk`                 | ^1.1.1  | Command palette component | Quick query mode UI           |
| `@monaco-editor/react` | ^4.7.0  | SQL editor                | SQL selection for explanation |
| `zustand`              | ^5.0.10 | State management          | AI query state                |

### No New Dependencies Needed

The existing stack fully supports all Phase 15 requirements. No new packages required.

## Architecture Patterns

### Recommended Project Structure

```
apps/electron/src/
├── main/services/agent/
│   ├── tools/
│   │   ├── sql-tools.ts          # Existing - extend for NL query
│   │   ├── analysis-tools.ts     # Existing - extend for optimization
│   │   └── nl-query-tools.ts     # NEW: Structured SQL generation
│   ├── chat-handler.ts           # Existing - add quick query mode
│   ├── nl-query-handler.ts       # NEW: Dedicated NL->SQL handler
│   └── prompts/
│       ├── sql-generation.ts     # NEW: System prompts for SQL gen
│       ├── sql-explanation.ts    # NEW: Prompts for explanation
│       └── sql-optimization.ts   # NEW: Prompts for optimization
├── renderer/src/
│   ├── components/
│   │   ├── CommandPalette.tsx    # Extend with quick query mode
│   │   └── ai/
│   │       ├── QuickQueryInput.tsx    # NEW: NL input in command palette
│   │       ├── SQLPreviewDialog.tsx   # NEW: Preview generated SQL
│   │       └── SQLExplanationPopover.tsx  # NEW: Explain selected SQL
│   ├── stores/
│   │   └── ai-query-store.ts     # NEW: Quick query state
│   └── hooks/
│       ├── useAgent.ts           # Existing
│       ├── useAgentChat.ts       # Existing
│       └── useQuickQuery.ts      # NEW: Quick query hook
```

### Pattern 1: Structured SQL Generation with Zod

**What:** Use `generateObject` with Zod schema for type-safe SQL output
**When to use:** Natural language to SQL conversion
**Example:**

```typescript
// Source: Vercel AI SDK structured output pattern
import { generateObject } from 'ai';
import { z } from 'zod';

const SqlResultSchema = z.object({
  sql: z.string().describe('The generated SQL query'),
  explanation: z.string().describe('Brief explanation of what the query does'),
  tables: z.array(z.string()).describe('Tables referenced in the query'),
  isReadOnly: z.boolean().describe('Whether the query only reads data'),
  confidence: z.number().min(0).max(1).describe('Confidence score 0-1'),
});

export async function generateSqlFromNaturalLanguage(
  model: LanguageModel,
  prompt: string,
  schema: DatabaseSchema
) {
  const result = await generateObject({
    model,
    schema: SqlResultSchema,
    system: buildSchemaAwarePrompt(schema),
    prompt: `Generate SQL for: ${prompt}`,
  });

  return result.object;
}
```

### Pattern 2: Schema Context Injection

**What:** Include database schema in prompt for accurate SQL generation
**When to use:** Any SQL generation or optimization task
**Example:**

```typescript
// Source: Best practice from existing sql-tools.ts pattern
function buildSchemaAwarePrompt(schema: DatabaseSchema): string {
  const schemaContext = schema.tables
    .map((table) => {
      const columns = table.columns
        .map(
          (col) =>
            `  - ${col.name}: ${col.type}${col.isPrimaryKey ? ' [PK]' : ''}${col.nullable ? '' : ' NOT NULL'}`
        )
        .join('\n');
      const indexes =
        table.indexes
          ?.map((idx) => `  INDEX: ${idx.name} (${idx.columns.join(', ')})`)
          .join('\n') || '';

      return `TABLE: ${table.name}\n${columns}\n${indexes}`;
    })
    .join('\n\n');

  return `You are a SQL expert. Generate SQL queries based on the following database schema:

${schemaContext}

Rules:
1. Only use tables and columns that exist in the schema
2. Use proper quoting for identifiers
3. Prefer indexes for WHERE and JOIN conditions
4. For PostgreSQL, use double quotes for identifiers
5. For MySQL, use backticks for identifiers`;
}
```

### Pattern 3: Command Palette Mode Switching

**What:** Add "quick query" mode to command palette with natural language input
**When to use:** AI-04 requirement - Cmd+K natural language query
**Example:**

```typescript
// Extend command palette with AI mode
// When user types natural language, detect and switch mode
const QUERY_MODE_TRIGGERS = [
  'show',
  'find',
  'list',
  'get',
  'count',
  'how many',
];

function detectQueryMode(input: string): 'command' | 'query' {
  const lower = input.toLowerCase().trim();
  if (QUERY_MODE_TRIGGERS.some((trigger) => lower.startsWith(trigger))) {
    return 'query';
  }
  // Could also use AI to classify ambiguous inputs
  return 'command';
}
```

### Pattern 4: SQL Preview Before Execution

**What:** Always show generated SQL for user confirmation before running
**When to use:** AI-03 requirement - preview before execution
**Example:**

```typescript
// Preview dialog flow
interface SQLPreviewState {
  generatedSQL: string;
  explanation: string;
  isReadOnly: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit: (modifiedSQL: string) => void;
}

// User flow:
// 1. Enter natural language query
// 2. AI generates SQL (with loading indicator)
// 3. Preview dialog shows SQL with syntax highlighting
// 4. User can Edit, Execute, or Cancel
// 5. Only on "Execute" does query run
```

### Anti-Patterns to Avoid

- **Direct execution without preview:** Never auto-execute AI-generated SQL, always show preview first
- **Missing schema context:** SQL generation without schema leads to hallucinated table/column names
- **Single-shot generation:** For complex queries, use chain-of-thought or multi-step refinement
- **Ignoring database dialect:** Different SQL syntax for PostgreSQL vs MySQL - always consider target database

## Don't Hand-Roll

| Problem           | Don't Build         | Use Instead                     | Why                     |
| ----------------- | ------------------- | ------------------------------- | ----------------------- |
| SQL parsing       | Custom regex parser | Monaco SQL language support     | Edge cases, dialects    |
| Structured output | Manual JSON parsing | Zod + `generateObject`          | Type safety, validation |
| Streaming chat    | Custom WebSocket    | AI SDK `streamText`             | Already implemented     |
| Schema retrieval  | New implementation  | Existing `createGetSchemaTool`  | Already works           |
| Query execution   | New code            | Existing `createExecuteSqlTool` | Already works           |

**Key insight:** The existing agent implementation already handles 70% of Phase 15 requirements. The focus should be on UI integration (command palette, preview dialog) and structured output for SQL generation.

## Common Pitfalls

### Pitfall 1: Schema Size Overwhelming Context

**What goes wrong:** Large databases with hundreds of tables exceed LLM context window
**Why it happens:** Sending entire schema for every query
**How to avoid:**

- Use semantic search to find relevant tables first
- Implement RAG pattern: user query -> find relevant tables -> include only those in prompt
- Cache schema summaries and only expand when needed
  **Warning signs:** Slow generation times, truncated schemas, incorrect table references

### Pitfall 2: Dialect Mismatch

**What goes wrong:** Generated SQL uses wrong syntax for target database
**Why it happens:** Not specifying database type in prompt
**How to avoid:**

- Always include database type (PostgreSQL, MySQL) in system prompt
- Validate generated SQL syntax before showing preview
- Use dialect-specific examples in few-shot prompts
  **Warning signs:** Syntax errors on execution, quoted identifiers failing

### Pitfall 3: Unsafe Queries Without Warning

**What goes wrong:** AI generates DELETE/UPDATE/DROP without proper warnings
**Why it happens:** LLM follows user request literally
**How to avoid:**

- Classify query type before preview
- Show prominent warnings for destructive operations
- Require extra confirmation for DDL statements
- Leverage existing `requiresConfirmation` pattern from sql-tools.ts
  **Warning signs:** Users accidentally modifying data

### Pitfall 4: Confidence Without Calibration

**What goes wrong:** AI says "high confidence" but query is wrong
**Why it happens:** LLM confidence scores are not calibrated
**How to avoid:**

- Validate generated SQL parses correctly
- Cross-check table/column names against schema
- Ask clarifying questions when query is ambiguous
- Show validation status alongside confidence
  **Warning signs:** Low accuracy despite high reported confidence

## Code Examples

### Natural Language to SQL Handler

```typescript
// apps/electron/src/main/services/agent/nl-query-handler.ts
import { generateObject } from 'ai';
import { z } from 'zod';
import { createChatModel } from './model';
import { databaseManager } from '../database-adapters/database-manager';

const GeneratedSQLSchema = z.object({
  sql: z.string().describe('The SQL query to execute'),
  explanation: z.string().describe('What this query does in plain English'),
  referencedTables: z.array(z.string()).describe('Tables used in query'),
  isDestructive: z.boolean().describe('Whether query modifies data'),
  suggestedIndexes: z
    .array(z.string())
    .optional()
    .describe('Indexes that would help'),
});

export type GeneratedSQL = z.infer<typeof GeneratedSQLSchema>;

export async function generateSQL(options: {
  connectionId: string;
  naturalLanguage: string;
  settings: AgentSettings;
}): Promise<GeneratedSQL> {
  const { connectionId, naturalLanguage, settings } = options;

  // Get schema for context
  const schemaResult = await databaseManager.getSchemaAsync(connectionId);
  if (!schemaResult.success) {
    throw new Error('Failed to retrieve schema');
  }

  const { model } = createChatModel(settings.config);

  const result = await generateObject({
    model,
    schema: GeneratedSQLSchema,
    system: buildSQLGenerationPrompt(schemaResult, connectionId),
    prompt: naturalLanguage,
  });

  return result.object;
}

function buildSQLGenerationPrompt(
  schema: SchemaResult,
  connectionId: string
): string {
  const dbType = databaseManager.getConnectionType(connectionId);
  const schemaText = formatSchemaForPrompt(schema);

  return `You are a SQL expert for ${dbType} databases.

DATABASE SCHEMA:
${schemaText}

RULES:
1. Only reference tables and columns that exist in the schema above
2. Use ${dbType === 'postgresql' ? 'double quotes' : 'backticks'} for identifiers
3. Prefer indexed columns in WHERE clauses
4. Always specify table aliases for joins
5. Return only valid ${dbType} syntax

Generate a SQL query based on the user's natural language request.`;
}
```

### SQL Explanation Tool

```typescript
// apps/electron/src/main/services/agent/tools/explanation-tools.ts
import { generateText } from 'ai';

export async function explainSQL(options: {
  sql: string;
  schema: DatabaseSchema;
  model: LanguageModel;
}): Promise<string> {
  const { sql, schema, model } = options;

  const result = await generateText({
    model,
    system: `You are a SQL expert. Explain SQL queries in clear, concise language.
Focus on:
1. What data the query retrieves or modifies
2. How tables are joined and why
3. What filters/conditions are applied
4. Performance considerations

Schema context:
${formatSchemaForPrompt(schema)}`,
    prompt: `Explain this SQL query:\n\n${sql}`,
  });

  return result.text;
}
```

### Quick Query Command Palette Integration

```typescript
// apps/electron/src/renderer/src/stores/ai-query-store.ts
import { create } from 'zustand';

interface AIQueryState {
  mode: 'idle' | 'generating' | 'preview' | 'executing';
  naturalLanguageInput: string;
  generatedSQL: GeneratedSQL | null;
  error: string | null;

  setInput: (input: string) => void;
  generateSQL: () => Promise<void>;
  executeSQL: () => Promise<void>;
  reset: () => void;
}

export const useAIQueryStore = create<AIQueryState>()((set, get) => ({
  mode: 'idle',
  naturalLanguageInput: '',
  generatedSQL: null,
  error: null,

  setInput: (input) => set({ naturalLanguageInput: input }),

  generateSQL: async () => {
    set({ mode: 'generating', error: null });
    try {
      const result = await window.sqlPro.agent.generateSQL({
        naturalLanguage: get().naturalLanguageInput,
      });
      set({ mode: 'preview', generatedSQL: result });
    } catch (error) {
      set({ mode: 'idle', error: error.message });
    }
  },

  executeSQL: async () => {
    const { generatedSQL } = get();
    if (!generatedSQL) return;

    set({ mode: 'executing' });
    // Execute via existing query store
    // ...
  },

  reset: () =>
    set({
      mode: 'idle',
      naturalLanguageInput: '',
      generatedSQL: null,
      error: null,
    }),
}));
```

## State of the Art

| Old Approach               | Current Approach                 | When Changed      | Impact                      |
| -------------------------- | -------------------------------- | ----------------- | --------------------------- |
| Keyword matching NL-to-SQL | LLM with schema context          | 2023-2024         | 80%+ accuracy improvement   |
| Manual prompt strings      | Zod structured output            | AI SDK 3.4 (2024) | Type-safe, validated output |
| Single-shot generation     | Chain-of-thought with validation | 2024-2025         | Complex query handling      |
| Generic SQL generation     | Dialect-aware generation         | 2025              | Cross-database support      |

**Current best practices (2026):**

- Context engineering over prompt engineering
- RAG for schema discovery in large databases
- Multi-step validation before execution
- User confirmation for all generated SQL

## Open Questions

1. **Schema caching strategy**
   - What we know: Schema retrieval works, but may be slow for large DBs
   - What's unclear: Optimal cache invalidation strategy
   - Recommendation: Cache schema per connection, invalidate on DDL operations

2. **Natural language disambiguation**
   - What we know: LLMs can ask clarifying questions
   - What's unclear: Best UX for disambiguation flow
   - Recommendation: Start simple - show multiple query options if ambiguous

3. **Query optimization depth**
   - What we know: EXPLAIN works, LLM can analyze
   - What's unclear: How deep should optimization suggestions go?
   - Recommendation: Start with index suggestions, iterate based on user feedback

## Sources

### Primary (HIGH confidence)

- Vercel AI SDK documentation - structured output, generateObject
- Existing codebase: `apps/electron/src/main/services/agent/` - working implementation
- Existing codebase: `apps/electron/src/shared/types/agent.ts` - type definitions

### Secondary (MEDIUM confidence)

- [AI SDK structured output docs](https://ai-sdk.dev) - Zod schema generation
- [Vercel AI SDK blog](https://vercel.com) - Best practices for SQL generation
- [Text-to-SQL best practices](https://k2view.com) - Schema awareness patterns

### Tertiary (LOW confidence)

- WebSearch results on Text-to-SQL accuracy benchmarks (2026)
- Community patterns for LLM SQL generation

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - Already installed and working
- Architecture: HIGH - Extends existing patterns
- Pitfalls: MEDIUM - Based on general LLM SQL patterns

**Research date:** 2026-01-30
**Valid until:** 2026-03-01 (30 days - stable domain)
