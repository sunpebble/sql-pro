# Stack Research: SQL Pro v2.0 Feature Additions

**Domain:** Database client feature additions (SSH Tunnels, Table Tags, Saved Queries, AI NL Query)
**Researched:** 2026-01-29
**Confidence:** HIGH

---

## Executive Summary

This research identifies stack additions for SQL Pro v2.0's four target features. The existing stack (Electron 40, React 19, Vercel AI SDK, electron-store, Zustand) is well-suited for these features. Only **one new dependency** is required: `ssh2` for SSH tunneling. The other three features leverage existing capabilities.

**Key Finding:** The project already has all infrastructure needed for Table Tags, Saved Queries, and AI Natural Language Query. SSH Tunnels is the only feature requiring a new library.

---

## Recommended Stack Additions

### New Dependencies

| Technology | Version | Purpose                                    | Why Recommended                                                                                                                                                                          |
| ---------- | ------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ssh2`     | ^1.17.0 | SSH tunnel connections to remote databases | Industry-standard pure-JS SSH2 client for Node.js. Actively maintained (latest release Aug 2025). Supports Ed25519, port forwarding, and dynamic tunneling. No native binaries required. |

### Existing Capabilities (No New Dependencies Needed)

| Feature       | Existing Stack               | How It's Used                                                                                       |
| ------------- | ---------------------------- | --------------------------------------------------------------------------------------------------- |
| Table Tags    | `electron-store` + Zustand   | Already stores `tags?: string[]` on `StoredConnectionProfile`. Extend to table-level tagging.       |
| Saved Queries | `electron-store` + Zustand   | Already has `QueryHistoryEntry` pattern. Add `SavedQuery` with name, description, and pinned flag.  |
| AI NL Query   | Vercel AI SDK (`ai` ^6.0.48) | Already uses `streamText` with tools. Add `generateText` with structured output for SQL generation. |

---

## Feature-Specific Stack Details

### 1. SSH Tunnels

**New Dependency Required**

```bash
pnpm add ssh2
pnpm add -D @types/ssh2
```

| Library       | Version | Purpose                       | Notes                                                                          |
| ------------- | ------- | ----------------------------- | ------------------------------------------------------------------------------ |
| `ssh2`        | ^1.17.0 | SSH2 client/server in pure JS | Supports password, private key (RSA, Ed25519, ECDSA), and agent authentication |
| `@types/ssh2` | ^1.15.0 | TypeScript definitions        | Required for type safety                                                       |

**Why ssh2 over alternatives:**

| Recommended | Alternative    | Why Not Alternative                                                                                                               |
| ----------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `ssh2`      | `tunnel-ssh`   | `tunnel-ssh` wraps `ssh2` but adds abstraction we don't need. Using `ssh2` directly gives more control over connection lifecycle. |
| `ssh2`      | `node-ssh`     | `node-ssh` is higher-level; we need low-level port forwarding control for database tunneling.                                     |
| `ssh2`      | `ssh2-promise` | Adds promise wrappers but `ssh2` already supports async patterns well. Fewer dependencies = fewer vulnerabilities.                |

**Integration Pattern:**

```typescript
// SSH tunnel manager runs in Electron main process
import { Client } from 'ssh2';

interface SSHTunnelConfig {
  sshHost: string;
  sshPort: number;
  sshUsername: string;
  sshPrivateKey?: string; // PEM format
  sshPassword?: string;
  sshPassphrase?: string; // For encrypted keys

  // Forwarding config
  remoteHost: string; // Database host from SSH server's perspective
  remotePort: number; // Database port
  localPort: number; // Local port to bind
}

// Tunnel creates: localhost:localPort -> sshHost -> remoteHost:remotePort
```

**Key Capabilities Verified (from ssh2 GitHub):**

- Dynamic port forwarding via SOCKS5 proxy
- Local port forwarding (what we need for database tunneling)
- Support for jump hosts / connection hopping
- Keep-alive support for long-running tunnels
- Tested against OpenSSH 8.7+

**Confidence:** HIGH - Verified via [ssh2 GitHub documentation](https://github.com/mscdex/ssh2)

---

### 2. Table Tags

**No New Dependencies Required**

The existing `electron-store` schema already supports tags on connection profiles. Extend this pattern to tables.

**Current capability (from `store.ts`):**

```typescript
export interface StoredConnectionProfile extends StoredRecentConnection {
  id: string;
  tags?: string[]; // Already exists!
  // ...
}
```

**Extension needed:**

```typescript
// Add to StoreSchema
interface TableTagsStore {
  [connectionId: string]: {
    [tableName: string]: string[];  // Array of tag names
  };
}

// Add to electron-store defaults
tableTags: {},
```

**Storage Approach:**

| Approach             | Recommendation | Rationale                                                         |
| -------------------- | -------------- | ----------------------------------------------------------------- |
| electron-store JSON  | YES            | Simple key-value, fast reads, no schema changes to user databases |
| SQLite metadata DB   | NO             | Over-engineered for tags; would need migration system             |
| In-database comments | NO             | Modifies user's database; cross-DB compatibility issues           |

**Confidence:** HIGH - Based on existing codebase patterns in `/Users/shikun/Developer/opensource/sql-pro/apps/electron/src/main/services/store.ts`

---

### 3. Saved Queries

**No New Dependencies Required**

Extend existing `QueryHistoryEntry` pattern in electron-store.

**Current capability (from `store.ts`):**

```typescript
interface QueryHistoryStore {
  [dbPath: string]: QueryHistoryEntry[];
}
```

**Extension needed:**

```typescript
interface SavedQuery {
  id: string;
  connectionId: string;
  name: string;
  description?: string;
  sql: string;
  createdAt: string;
  updatedAt: string;
  folderId?: string; // For organization
  tags?: string[]; // Reuse tag system
  isPinned?: boolean; // Quick access
}

interface SavedQueriesStore {
  [connectionId: string]: SavedQuery[];
}
```

**UI Integration:**

- Add to existing Monaco Editor toolbar
- Integrate with cmdk command palette (already available)
- Use existing Zustand patterns for state management

**Confidence:** HIGH - Direct extension of existing patterns

---

### 4. AI Natural Language Query

**No New Dependencies Required**

The project already has comprehensive AI SDK integration.

**Existing AI stack (from `package.json`):**

```json
{
  "@ai-sdk/anthropic": "^3.0.23",
  "@ai-sdk/openai": "^3.0.18",
  "@ai-sdk/openai-compatible": "^2.0.18",
  "ai": "^6.0.48",
  "zod": "^4.3.6"
}
```

**Current implementation (from `chat-handler.ts`):**

- Uses `streamText` from Vercel AI SDK
- Has tool calling with `execute_sql`, `get_schema` tools
- Supports Claude and OpenAI models
- Already has extended thinking for Claude 4

**Extension for NL-to-SQL:**

```typescript
import { generateText } from 'ai';
import { z } from 'zod';

const sqlQuerySchema = z.object({
  sql: z.string().describe('The generated SQL query'),
  explanation: z.string().describe('Brief explanation of what the query does'),
  confidence: z
    .enum(['high', 'medium', 'low'])
    .describe('Confidence in query correctness'),
  warnings: z
    .array(z.string())
    .optional()
    .describe('Potential issues or assumptions'),
});

// Use structured output for reliable SQL generation
const result = await generateText({
  model: createChatModel(settings.config).model,
  output: 'object',
  schema: sqlQuerySchema,
  system: NL_TO_SQL_SYSTEM_PROMPT,
  prompt: `Schema: ${schemaContext}\n\nUser request: ${naturalLanguageQuery}`,
});
```

**Key Approach:**

1. Fetch schema context before generation (existing `get_schema` tool)
2. Use `generateText` with `output: 'object'` and Zod schema for structured SQL output
3. Validate generated SQL before execution
4. Show confidence level and warnings to user

**Confidence:** HIGH - Based on [Vercel AI SDK structured output documentation](https://ai-sdk.dev) and existing `chat-handler.ts` implementation

---

## What NOT to Add

| Avoid                         | Why                                                             | Use Instead                  |
| ----------------------------- | --------------------------------------------------------------- | ---------------------------- |
| `tunnel-ssh`                  | Unnecessary wrapper over ssh2; less control                     | Direct `ssh2` usage          |
| `node-ssh`                    | Too high-level; hides port forwarding details                   | Direct `ssh2` usage          |
| IndexedDB for saved queries   | Over-engineered; electron-store sufficient for this scale       | `electron-store`             |
| Dedicated text-to-SQL library | AI SDK already handles this; specialized libs add complexity    | Vercel AI SDK `generateText` |
| `langchain`                   | Heavy dependency; AI SDK covers our needs                       | Vercel AI SDK                |
| `better-sqlite3` for metadata | Already using it for user DBs; separate metadata DB is overkill | `electron-store` JSON        |

---

## Installation

```bash
# SSH Tunnel support (only new dependency)
pnpm add ssh2
pnpm add -D @types/ssh2
```

That's it. All other features use existing dependencies.

---

## Version Compatibility

| Package                  | Version          | Compatible With       | Notes                                |
| ------------------------ | ---------------- | --------------------- | ------------------------------------ |
| `ssh2` ^1.17.0           | Node.js 10.16.0+ | Electron 40 (Node 22) | Ed25519 requires Node 12+            |
| `ai` ^6.0.48             | React 18/19      | Current React 19.2.3  | Structured output available since v3 |
| `electron-store` ^11.0.2 | Electron 30+     | Current Electron 40   | Already in use                       |
| `zod` ^4.3.6             | TypeScript 5+    | Current TS 5.9.3      | Already in use                       |

---

## Architecture Integration Points

### SSH Tunnels

- **Main Process:** SSH tunnel manager service
- **IPC:** New handlers for tunnel create/destroy/status
- **Renderer:** Connection form SSH config section
- **Store:** SSH configs in connection profiles (passwords via `safeStorage`)

### Table Tags

- **Main Process:** New store section for table tags
- **IPC:** CRUD handlers for tag operations
- **Renderer:** Tag input UI, filter by tag in sidebar
- **Store:** `tableTags` section in electron-store

### Saved Queries

- **Main Process:** New store section for saved queries
- **IPC:** CRUD handlers + folder management
- **Renderer:** Query library panel, Monaco toolbar integration
- **Store:** `savedQueries` section in electron-store

### AI NL Query

- **Main Process:** Extend existing agent tools
- **IPC:** New handler for NL-to-SQL conversion
- **Renderer:** Natural language input in query panel
- **Store:** None needed (uses existing AI settings)

---

## Sources

### HIGH Confidence

- [ssh2 GitHub Repository](https://github.com/mscdex/ssh2) - Version, features, Node.js compatibility
- [Vercel AI SDK Documentation](https://ai-sdk.dev) - Structured output, generateText API
- Existing codebase: `/Users/shikun/Developer/opensource/sql-pro/apps/electron/src/main/services/store.ts`
- Existing codebase: `/Users/shikun/Developer/opensource/sql-pro/apps/electron/src/main/services/agent/chat-handler.ts`

### MEDIUM Confidence

- [npm ssh2 package](https://snyk.io/advisor/npm-package/ssh2) - Version 1.17.0 confirmed via Snyk
- [tunnel-ssh comparison](https://socket.dev/npm/package/ssh-tunneling) - Alternative library analysis

---

## Confidence Assessment

| Area                  | Confidence | Reason                                                               |
| --------------------- | ---------- | -------------------------------------------------------------------- |
| SSH Tunnels (ssh2)    | HIGH       | Official GitHub docs, npm registry, multiple sources confirm v1.17.0 |
| Table Tags            | HIGH       | Direct extension of existing codebase patterns                       |
| Saved Queries         | HIGH       | Direct extension of existing QueryHistoryEntry pattern               |
| AI NL Query           | HIGH       | Existing AI SDK integration, verified structured output capability   |
| Version compatibility | HIGH       | Verified against package.json and Node.js requirements               |

---

_Stack research for: SQL Pro v2.0 Feature Additions_
_Researched: 2026-01-29_
