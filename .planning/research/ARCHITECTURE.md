# Architecture Research: SQL Pro v2.0 Feature Integration

**Domain:** Electron Database Client - Feature Extension
**Researched:** 2026-01-29
**Confidence:** HIGH (based on existing codebase analysis)

## Executive Summary

This document analyzes how four new features integrate with SQL Pro's existing Electron architecture:

1. **SSH Tunnels** - Wrap database connections with SSH port forwarding
2. **Table Tags** - User-defined metadata for table organization
3. **Saved Queries** - Persistent query storage with metadata
4. **AI Natural Language Query** - Already partially implemented via agent system

The existing architecture follows a clean main/renderer process separation with IPC communication. All four features can be integrated by following established patterns already in the codebase.

---

## Existing Architecture Overview

```
+-----------------------------------------------------------------------------+
|                           RENDERER PROCESS (React)                           |
+-----------------------------------------------------------------------------+
|  +---------------+  +---------------+  +---------------+  +--------------+  |
|  | connection-   |  | query-store   |  | table-data-   |  | settings-    |  |
|  | store         |  |               |  | store         |  | store        |  |
|  +-------+-------+  +-------+-------+  +-------+-------+  +------+-------+  |
|          |                  |                  |                 |          |
|  +-------+------------------+------------------+-----------------+-------+  |
|  |                         Zustand State Management                      |  |
|  +-----------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------+
|                              PRELOAD (IPC Bridge)                            |
|  +-----------------------------------------------------------------------+  |
|  |  sqlProAPI.db.*  |  sqlProAPI.profile.*  |  sqlProAPI.agent.*  |  ... |  |
|  +-----------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------+
|                             MAIN PROCESS (Node.js)                           |
+-----------------------------------------------------------------------------+
|  +-----------------------------------------------------------------------+  |
|  |                        IPC Handlers (ipc/*.ts)                        |  |
|  |  database.ts  |  profiles.ts  |  history.ts  |  schema.ts  |  ...     |  |
|  +-----------------------------------------------------------------------+  |
|                                      |                                       |
|  +-----------------------------------------------------------------------+  |
|  |                     Database Adapters Layer                           |  |
|  |  +-----------+ +--------------+ +--------------+ +--------------+     |  |
|  |  | sqlite-   | | postgresql-  | | mysql-       | | turso-       |     |  |
|  |  | adapter   | | adapter      | | adapter      | | adapter      |     |  |
|  |  +-----------+ +--------------+ +--------------+ +--------------+     |  |
|  +-----------------------------------------------------------------------+  |
|                                      |                                       |
|  +-----------------------------------------------------------------------+  |
|  |                       Persistence Layer                               |  |
|  |  electron-store (store.ts)  |  Password Storage (keytar)              |  |
|  +-----------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------+
```

### Current Component Responsibilities

| Component                  | Location                                              | Responsibility                                           |
| -------------------------- | ----------------------------------------------------- | -------------------------------------------------------- |
| `DatabaseAdapter`          | `main/services/database-adapters/types.ts`            | Interface for all database operations                    |
| `databaseManager`          | `main/services/database-adapters/database-manager.ts` | Routes calls to correct adapter                          |
| `store.ts`                 | `main/services/store.ts`                              | electron-store persistence (profiles, settings, history) |
| `connection-store`         | `renderer/src/stores/connection-store.ts`             | Active connections, schemas, profiles UI state           |
| `query-store`              | `renderer/src/stores/query-store.ts`                  | Current query, results, history cache                    |
| `table-organization-store` | `renderer/src/stores/table-organization-store.ts`     | Table tags, sorting, filtering (already exists!)         |
| `preload/index.ts`         | `preload/index.ts`                                    | IPC bridge exposing `sqlProAPI` to renderer              |

---

## Feature 1: SSH Tunnels

### Integration Point

SSH tunnels must intercept database connections **before** they reach the database adapters. The tunnel wraps the connection, forwarding local port to remote database port.

### Architecture Pattern: Tunnel Wrapper Service

```
+--------------------------------------------------------------------+
|                         Main Process                                |
+--------------------------------------------------------------------+
|                                                                     |
|  +-----------------+    +-----------------+    +----------------+   |
|  |  IPC Handler    |--->|  SSH Tunnel     |--->|  Database      |   |
|  |  (database.ts)  |    |  Service        |    |  Adapter       |   |
|  +-----------------+    +-----------------+    +----------------+   |
|                                |                                    |
|                         +------+------+                             |
|                         | ssh2 tunnel |                             |
|                         | (local port)|                             |
|                         +-------------+                             |
+--------------------------------------------------------------------+
```

### New Components Required

| Component               | Location                              | Purpose                            |
| ----------------------- | ------------------------------------- | ---------------------------------- |
| `ssh-tunnel-service.ts` | `main/services/ssh-tunnel-service.ts` | Manages SSH tunnel lifecycle       |
| `SSHTunnelConfig` type  | `shared/types.ts`                     | SSH tunnel configuration interface |

### Data Flow

1. User configures connection with SSH tunnel settings
2. `DatabaseConnectionConfig` extended with `sshTunnel?: SSHTunnelConfig`
3. Before `adapter.open()`, tunnel service establishes SSH connection
4. Tunnel forwards `localhost:randomPort` to `remoteHost:dbPort`
5. Adapter connects to `localhost:randomPort` instead of remote host
6. On connection close, tunnel is torn down

### Implementation Pattern

```typescript
// main/services/ssh-tunnel-service.ts
import { Client } from 'ssh2';
import net from 'net';

interface SSHTunnelConfig {
  host: string;
  port: number;
  username: string;
  // Auth: password OR privateKey
  password?: string;
  privateKey?: string;
  privateKeyPassphrase?: string;
}

interface ActiveTunnel {
  connectionId: string;
  sshClient: Client;
  server: net.Server;
  localPort: number;
}

class SSHTunnelService {
  private tunnels = new Map<string, ActiveTunnel>();

  async createTunnel(
    connectionId: string,
    sshConfig: SSHTunnelConfig,
    remoteHost: string,
    remotePort: number
  ): Promise<{ localPort: number }> {
    // 1. Create SSH client connection
    // 2. Create local server that forwards to remote via SSH
    // 3. Return local port for database adapter to use
  }

  closeTunnel(connectionId: string): void {
    // Cleanup SSH client and local server
  }
}
```

### Storage Changes

Extend `StoredConnectionProfile` in `store.ts`:

```typescript
export interface StoredConnectionProfile extends StoredRecentConnection {
  // ... existing fields
  sshTunnel?: {
    enabled: boolean;
    host: string;
    port: number;
    username: string;
    authType: 'password' | 'privateKey';
    // Password stored in keytar, not here
    privateKeyPath?: string;
  };
}
```

### Recommended Library

- **ssh2** - The standard Node.js SSH library, already used by many Electron apps
- npm: `ssh2` (v1.15+)

### Build Order for SSH Tunnels

1. Add `SSHTunnelConfig` type to `shared/types.ts`
2. Create `ssh-tunnel-service.ts` in main process
3. Modify `database.ts` IPC handler to check for tunnel config
4. Extend `DatabaseConnectionConfig` with tunnel fields
5. Add UI for SSH tunnel configuration in connection form
6. Integrate password storage for SSH credentials via existing keytar pattern

---

## Feature 2: Table Tags

### Integration Point

**Already partially implemented!** The `table-organization-store.ts` already has:

- `availableTags: string[]`
- `tableMetadata: Record<TableKey, TableMetadata>` with tags support
- `addTableTag()`, `removeTableTag()`, `setTableTags()` actions

### Current Gap

The store exists but is **not persisted**. Tags are lost on app restart.

### Architecture Pattern: Extend Existing Store with Persistence

```
+-----------------------------------------------------------------+
|                       Renderer Process                           |
|  +---------------------------------------------------------+    |
|  |              table-organization-store.ts                 |    |
|  |  (add persistence via rendererStore API)                 |    |
|  +---------------------------------------------------------+    |
|                              |                                   |
|                    persist/hydrate                               |
|                              v                                   |
+-----------------------------------------------------------------+
|                         Preload                                  |
|  sqlProAPI.rendererStore.get/set('tableOrganization', ...)       |
+-----------------------------------------------------------------+
|                       Main Process                               |
|  +---------------------------------------------------------+    |
|  |              renderer-store.ts (electron-store)          |    |
|  +---------------------------------------------------------+    |
+-----------------------------------------------------------------+
```

### Implementation Pattern

Follow existing pattern from `connection-store.ts` persistence:

```typescript
// In table-organization-store.ts, add:
import { sqlPro } from '@/lib/api';

// On store creation, hydrate from main process
sqlPro.rendererStore.get({ key: 'tableOrganization' }).then((result) => {
  if (result.success && result.value) {
    useTableOrganizationStore.setState({
      availableTags: result.value.availableTags || [],
      tableMetadata: result.value.tableMetadata || {},
      sortOption: result.value.sortOption || 'name-asc',
    });
  }
});

// Subscribe to persist changes
useTableOrganizationStore.subscribe((state) => {
  sqlPro.rendererStore.set({
    key: 'tableOrganization',
    value: {
      availableTags: state.availableTags,
      tableMetadata: state.tableMetadata,
      sortOption: state.sortOption,
    },
  });
});
```

### Storage Schema Extension

Add to `RendererStoreSchema` in `shared/types/renderer-store.ts`:

```typescript
export interface RendererStoreSchema {
  // ... existing
  tableOrganization: {
    availableTags: string[];
    tableMetadata: Record<string, TableMetadata>;
    sortOption: TableSortOption;
  };
}
```

### Build Order for Table Tags

1. Add `tableOrganization` to `RendererStoreSchema`
2. Add hydration logic to `table-organization-store.ts`
3. Add persistence subscription to store
4. Test persistence across app restarts
5. (Optional) Add tag management UI improvements

---

## Feature 3: Saved Queries

### Integration Point

Similar to `query-templates-store.ts` but for user-saved queries with connection context.

### Architecture Pattern: New Store + Persistence

```
+-----------------------------------------------------------------+
|                       Renderer Process                           |
|  +---------------------------------------------------------+    |
|  |                 saved-queries-store.ts                   |    |
|  |  - queries: SavedQuery[]                                 |    |
|  |  - folders: QueryFolder[]                                |    |
|  |  - CRUD operations                                       |    |
|  +---------------------------------------------------------+    |
|                              |                                   |
+-----------------------------------------------------------------+
|                       Main Process                               |
|  +---------------------------------------------------------+    |
|  |  Option A: renderer-store.ts (electron-store)            |    |
|  |  Option B: New savedQueries section in store.ts          |    |
|  +---------------------------------------------------------+    |
+-----------------------------------------------------------------+
```

### Data Model

```typescript
// shared/types.ts
export interface SavedQuery {
  id: string;
  name: string;
  description?: string;
  query: string;
  // Connection context (optional - can be connection-agnostic)
  connectionId?: string;
  databaseType?: DatabaseType;
  // Organization
  folderId?: string;
  tags?: string[];
  // Metadata
  createdAt: string;
  updatedAt: string;
  lastExecutedAt?: string;
  // Optional: execution stats
  executionCount?: number;
}

export interface QueryFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
}
```

### Implementation Options

**Option A: Renderer Store (Recommended for simplicity)**

- Store in `RendererStoreSchema.savedQueries`
- Follows existing pattern for table organization
- Simpler, less IPC overhead

**Option B: Main Process Store (Better for large collections)**

- New IPC handlers in `main/services/ipc/saved-queries.ts`
- Store in electron-store like profiles
- Better for syncing, export/import features

### Recommended: Option A with Migration Path

Start with renderer store persistence. If query collections grow large or need cross-window sync, migrate to main process store later.

### Build Order for Saved Queries

1. Define `SavedQuery` and `QueryFolder` types in `shared/types.ts`
2. Create `saved-queries-store.ts` with Zustand
3. Add `savedQueries` to `RendererStoreSchema`
4. Add persistence (hydration + subscription)
5. Create UI components (query list, save dialog, folders)
6. Add keyboard shortcut for "Save Query" (Cmd/Ctrl+S when in query editor)

---

## Feature 4: AI Natural Language Query

### Integration Point

**Already implemented!** The codebase has a complete AI agent system:

- `main/services/agent/chat-handler.ts` - Handles AI chat with streaming
- `main/services/agent/tools/*.ts` - SQL execution, schema analysis tools
- `main/services/agent/settings-store.ts` - AI provider configuration
- `preload/index.ts` - `sqlProAPI.agent.*` IPC bridge

### Current Implementation

```typescript
// Already exists in chat-handler.ts
export async function handleChat(options: ChatHandlerOptions) {
  const { connectionId, messages, settings, signal } = options;
  const { model, isDirectAnthropic } = createChatModel(settings.config);
  const tools = createAgentTools(connectionId, settings.execution);
  // ... streaming response with Vercel AI SDK
}
```

### Enhancement Opportunities

The AI system is functional. Enhancements for "Natural Language Query" could include:

1. **Quick Query Mode** - Single-shot NL to SQL without chat history
2. **Query Suggestions** - AI suggests queries based on schema context
3. **Query Explanation** - Explain what a SQL query does in plain language

### Architecture for Quick NL Query

```typescript
// New IPC channel for single-shot NL query
ipcMain.handle(
  'agent:quick-query',
  async (
    _event,
    request: {
      connectionId: string;
      naturalLanguage: string;
    }
  ) => {
    // 1. Get schema context
    // 2. Single LLM call to generate SQL
    // 3. Return generated SQL (don't execute)
  }
);
```

### Build Order for AI Enhancements

1. Expose existing AI features in UI (if not already visible)
2. Add "Quick Query" mode for NL to SQL conversion
3. Add inline query suggestions in editor
4. Add "Explain Query" feature for selected SQL

---

## Integration Summary

### New Components by Feature

| Feature       | New Main Process             | New Renderer             | Storage                                 |
| ------------- | ---------------------------- | ------------------------ | --------------------------------------- |
| SSH Tunnels   | `ssh-tunnel-service.ts`      | Connection form fields   | `StoredConnectionProfile.sshTunnel`     |
| Table Tags    | None (use existing)          | Persistence logic        | `RendererStoreSchema.tableOrganization` |
| Saved Queries | Optional IPC handlers        | `saved-queries-store.ts` | `RendererStoreSchema.savedQueries`      |
| AI NL Query   | Optional quick-query handler | UI enhancements          | Already exists                          |

### Dependency Graph

```
Phase 1: Foundation (no dependencies)
+-- Table Tags Persistence (independent)
+-- SSH Tunnel Service (independent)
+-- Saved Queries Store (independent)

Phase 2: Integration (depends on Phase 1)
+-- SSH Tunnel UI (depends on service)
+-- Saved Queries UI (depends on store)
+-- AI Quick Query (depends on existing agent)

Phase 3: Polish
+-- SSH key management improvements
+-- Query folder organization
+-- AI query suggestions
```

### Suggested Build Order

1. **Table Tags Persistence** - Smallest change, immediate value
2. **Saved Queries** - New feature, follows established patterns
3. **SSH Tunnels** - Most complex, requires new service layer
4. **AI Enhancements** - Builds on existing complete system

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Putting Tunnel Logic in Adapters

**What people do:** Add SSH tunnel code directly in each database adapter
**Why it's wrong:** Duplicates logic, harder to maintain, violates single responsibility
**Do this instead:** Create a dedicated tunnel service that wraps adapter connections

### Anti-Pattern 2: Storing Secrets in electron-store

**What people do:** Store SSH passwords/keys in plain electron-store
**Why it's wrong:** Not secure, electron-store is readable JSON file
**Do this instead:** Use existing `password-storage.ts` (keytar) for credentials

### Anti-Pattern 3: Syncing Large Data via Renderer Store

**What people do:** Store thousands of saved queries in renderer store
**Why it's wrong:** Serializes entire collection on every change, slow
**Do this instead:** Use main process store with granular IPC for large collections

### Anti-Pattern 4: Blocking Main Process During Tunnel Setup

**What people do:** Synchronous tunnel creation blocking main process
**Why it's wrong:** Freezes entire app during connection
**Do this instead:** Async tunnel creation with progress feedback to renderer

---

## Scalability Considerations

| Scale                | Approach                            |
| -------------------- | ----------------------------------- |
| 1-50 saved queries   | Renderer store persistence (simple) |
| 50-500 saved queries | Main process store with pagination  |
| 500+ saved queries   | Consider SQLite for query storage   |
| Multiple SSH tunnels | Connection pool with health checks  |

---

## Sources

- Existing codebase analysis (HIGH confidence)
- ssh2 library documentation: [github.com/mscdex/ssh2](https://github.com/mscdex/ssh2)
- Electron-store patterns from existing `store.ts` implementation
- Vercel AI SDK integration patterns from `chat-handler.ts`

---

_Architecture research for: SQL Pro v2.0 Feature Integration_
_Researched: 2026-01-29_
