# Project Research Summary

**Project:** SQL Pro v2.0 Feature Additions
**Domain:** Database Management Desktop Application (Electron)
**Researched:** 2026-01-29
**Confidence:** HIGH

## Executive Summary

SQL Pro v2.0 aims to add four features to compete with TablePlus and DBeaver: SSH Tunnels, Table Tags, Saved Queries, and AI Natural Language Query. Research shows the existing architecture (Electron 40, React 19, Vercel AI SDK, electron-store, Zustand) is well-suited for these additions. Only one new dependency is required: `ssh2` for SSH tunneling.

The recommended approach prioritizes table stakes features first (SSH Tunnels, Saved Queries) to close competitive gaps, then differentiators (Table Tags, AI enhancements). The existing codebase already has partial implementations for Table Tags (store exists, needs persistence) and AI Natural Language Query (agent system exists, needs UI enhancements). This significantly reduces implementation risk.

Critical risks center on SSH tunnel lifecycle management, credential security, and AI-generated SQL safety. These are mitigated by following existing patterns in the codebase (password-storage.ts for credentials, DatabaseManager for connection lifecycle, agent tools with user confirmation). The architecture supports clean integration through established IPC patterns and Zustand state management.

## Key Findings

### Recommended Stack

The existing stack requires minimal additions. The project already has all infrastructure for Table Tags, Saved Queries, and AI Natural Language Query through electron-store, Zustand, and Vercel AI SDK. SSH Tunnels is the only feature requiring a new library.

**Core technologies:**

- **ssh2 (^1.17.0)**: SSH tunnel connections - Industry-standard pure-JS SSH2 client with Ed25519 support, no native binaries
- **Existing electron-store**: Table tags and saved queries persistence - Already used for connection profiles and query history
- **Existing Vercel AI SDK**: AI natural language query - Already integrated with structured output support via generateText
- **Existing Zustand**: State management for new features - Established pattern in table-organization-store and query-store

**Version compatibility verified:** All dependencies compatible with Electron 40 (Node 22) and current React 19.2.3.

### Expected Features

Research identified clear feature tiers based on competitor analysis (TablePlus, DBeaver, DB Pro).

**Must have (table stakes):**

- SSH Tunnels with password + private key auth - Professional users expect this; many databases are behind SSH
- Saved Queries with naming and organization - Every competitor has this; fundamental productivity feature
- Table Tags with filtering and colors - Organization feature that differentiates from basic tools
- AI-generated SQL preview before execution - Safety requirement; never auto-execute AI queries

**Should have (competitive):**

- Query folders and tag organization - Helps with large query collections
- SSH tunnel test button - Separate SSH validation from database connection testing
- Keyboard shortcuts for saved queries - Matches Linear/Raycast interaction model
- Query parameter support ({{variable}}) - Makes saved queries reusable across contexts

**Defer (v2+):**

- SSH jump server / bastion host support - Enterprise feature, can add based on demand
- AI conversation history - Multi-turn refinement, complex implementation
- Local LLM support via Ollama - Privacy-focused option, niche use case
- Tag cloud sync - Team collaboration, requires infrastructure

### Architecture Approach

The existing main/renderer process separation with IPC handlers supports clean feature integration. All four features follow established patterns already in the codebase.

**Major components:**

1. **SSH Tunnel Service (new)** - Main process service wrapping database connections with ssh2 port forwarding; integrates with existing DatabaseManager lifecycle
2. **Table Organization Store (extend existing)** - Already exists at table-organization-store.ts with tag support; needs persistence via renderer-store pattern
3. **Saved Queries Store (new)** - New Zustand store following query-templates-store pattern; persists via renderer-store or main process IPC
4. **AI Agent Enhancements (extend existing)** - Complete agent system already exists; add quick NL-to-SQL mode and UI improvements

**Integration pattern:** Each feature extends existing systems rather than creating parallel infrastructure. SSH tunnels wrap database adapters, tags extend table organization, saved queries mirror query history patterns, and AI builds on the complete Vercel AI SDK integration.

### Critical Pitfalls

Top 5 pitfalls from research, all preventable with existing codebase patterns:

1. **SSH Tunnel Lifecycle Mismatch** - Tunnel remains open after database connection closes, or database connection doesn't detect tunnel failures. Prevention: Extend ManagedConnection interface to include tunnel info; add tunnel cleanup to existing DatabaseManager.close() flow.

2. **SSH Credentials Stored Insecurely** - Private keys or passwords in plain electron-store. Prevention: Use existing password-storage.ts pattern with safeStorage API; store only file paths for keys, not content.

3. **AI-Generated SQL Executed Without Validation** - AI generates DROP TABLE or DELETE without WHERE, damaging user data. Prevention: Always show generated SQL for user approval; implement query classification (SELECT vs DML vs DDL); add safe mode for SELECT-only.

4. **Main Process Blocking During Operations** - SSH tunnel establishment or AI API calls freeze entire app. Prevention: Use async IPC patterns already in codebase; implement progress reporting; add cancellation support.

5. **Store State Desync Between Features** - Connection removed but tags/queries remain, causing memory leaks. Prevention: Follow existing memoryCleanup.cleanupConnection() pattern; add cleanup hooks to new stores in removeConnection() flow.

## Implications for Roadmap

Based on research, suggested phase structure prioritizes foundational features that close competitive gaps, then builds differentiators.

### Phase 1: SSH Tunnels (Foundation)

**Rationale:** Table stakes feature blocking enterprise adoption. Many production databases require SSH access. Must be solid before other features.

**Delivers:** Integrated SSH tunnel configuration in connection dialog with password and private key authentication, automatic tunnel lifecycle management.

**Addresses:** SSH Tunnels (must-have from FEATURES.md), credential security pattern for other features.

**Avoids:** Pitfall #1 (lifecycle mismatch) by integrating with DatabaseManager from start; Pitfall #2 (credential storage) by using password-storage.ts pattern.

**Stack:** Requires ssh2 installation, extends StoredConnectionProfile schema.

**Research flag:** Standard pattern, well-documented by ssh2 library. Skip additional research.

### Phase 2: Table Tags (Quick Win)

**Rationale:** Store already exists with full tag functionality; only needs persistence. Low implementation cost, immediate user value for organization.

**Delivers:** Persistent table tags with colors, filtering, and tag-based grouping in sidebar.

**Addresses:** Table Tags (should-have from FEATURES.md).

**Avoids:** Pitfall #5 (store desync) by implementing proper cleanup hooks.

**Stack:** Uses existing table-organization-store.ts, adds renderer-store persistence following connection-store pattern.

**Research flag:** Zero-risk, extends existing implementation. Skip additional research.

### Phase 3: Saved Queries (Core Productivity)

**Rationale:** Table stakes feature for professional users. Follows established query-history pattern. Enables productivity gains for repeat queries.

**Delivers:** Save queries with names, folders, tags; execute from sidebar; keyword binding for snippets; search and organization.

**Addresses:** Saved Queries (must-have from FEATURES.md), query folder organization (should-have).

**Avoids:** Pitfall #6 (query scope issues) by storing connection/database type metadata; Pitfall #7 (Monaco blocking) by implementing cache-first autocomplete.

**Stack:** Uses existing electron-store or renderer-store pattern, integrates with Monaco editor and command palette.

**Research flag:** Standard CRUD pattern. Skip additional research.

### Phase 4: AI Natural Language Query (Differentiator)

**Rationale:** Agent system already complete; needs UI enhancements for quick NL-to-SQL mode. Differentiates from competitors. Build after core features are solid.

**Delivers:** Natural language to SQL conversion with schema awareness, generated SQL preview, confidence indicators, explanation of query logic.

**Addresses:** AI Natural Language Query (should-have from FEATURES.md).

**Avoids:** Pitfall #3 (AI execution without validation) by requiring user confirmation; Pitfall #8 (schema token limits) by implementing schema pruning.

**Stack:** Uses existing Vercel AI SDK with generateText and structured output; extends existing agent tools.

**Research flag:** AI prompt engineering for schema pruning may need experimentation during implementation.

### Phase Ordering Rationale

- **SSH Tunnels first** because it's foundational infrastructure that other features depend on (can't test saved queries or AI on production databases without SSH access)
- **Table Tags second** because implementation is trivial (store exists) and provides immediate organization value for testing other features
- **Saved Queries third** because it builds user workflow patterns that inform AI query feature (users will want to save AI-generated queries)
- **AI enhancements last** because the agent system already exists; this phase is UI polish and optimization, not core functionality

**Dependency flow:** Phase 1 → Phase 2 (independent) → Phase 3 → Phase 4 (benefits from saved queries for storing AI generations)

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 4 (AI):** Schema context optimization for large databases (100+ tables) may need experimentation to balance token limits vs. context completeness

Phases with standard patterns (skip research-phase):

- **Phase 1 (SSH Tunnels):** ssh2 library well-documented; standard port forwarding pattern
- **Phase 2 (Table Tags):** Extends existing store; established persistence pattern
- **Phase 3 (Saved Queries):** CRUD operations following existing query-history pattern

## Confidence Assessment

| Area         | Confidence | Notes                                                                                                                     |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| Stack        | HIGH       | Only one new dependency (ssh2); version compatibility verified; existing stack sufficient for 3/4 features                |
| Features     | HIGH       | Based on direct competitor analysis (TablePlus, DBeaver, DB Pro); clear table stakes vs. differentiators                  |
| Architecture | HIGH       | Based on existing codebase analysis; all patterns already established; integration points identified                      |
| Pitfalls     | HIGH       | Verified against existing architecture and industry best practices; prevention strategies leverage existing code patterns |

**Overall confidence:** HIGH

### Gaps to Address

Areas where research was inconclusive or needs validation during implementation:

- **AI schema context pruning strategy:** Large databases (100+ tables) may exceed token limits. Need experimentation to determine optimal pruning algorithm (keyword matching vs. embeddings vs. tiered context). Address during Phase 4 planning.

- **SSH tunnel health check frequency:** Research didn't establish optimal keepalive interval for long-running tunnels. May need user testing to balance connection reliability vs. resource usage. Address during Phase 1 implementation.

- **Saved query autocomplete performance threshold:** Monaco editor integration may have different performance characteristics than assumed. Need profiling with realistic query collections (100+, 500+, 1000+ saved queries) to validate cache-first approach. Address during Phase 3 implementation.

## Sources

### Primary (HIGH confidence)

- SQL Pro codebase analysis - `/apps/electron/src/main/services/`, `/apps/electron/src/renderer/src/stores/`
- ssh2 GitHub repository - Version 1.17.0 features, Node.js compatibility, authentication methods
- Vercel AI SDK documentation - Structured output with generateText, schema validation with Zod
- electron-store patterns - Existing store.ts implementation for connection profiles and query history

### Secondary (MEDIUM confidence)

- TablePlus, DBeaver, DB Pro - Competitor feature analysis via web documentation
- Electron security best practices - Official documentation for safeStorage API and IPC patterns
- Monaco Editor completion providers - Community patterns for async autocomplete

### Tertiary (LOW confidence)

- WebSearch - Command palette patterns, dark mode best practices (for related design system research)

---

_Research completed: 2026-01-29_
_Ready for roadmap: yes_
