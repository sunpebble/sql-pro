# Roadmap: SQL Pro v2.0

**Milestone:** v2.0 - Feature Parity
**Created:** 2026-01-29
**Depth:** Comprehensive
**Phases:** 4 (Phase 12-15)

## Overview

SQL Pro v2.0 closes competitive gaps with TablePlus and DB Pro by adding four key features: Table Tags, Saved Queries, SSH Tunnels, and AI Natural Language Query. The roadmap prioritizes quick wins (Table Tags - store already exists) before tackling complex infrastructure (SSH Tunnels) and differentiators (AI enhancements).

## Phases

### Phase 12: Table Tags

**Goal:** Users can organize tables with custom colored tags for efficient navigation

**Dependencies:** None (builds on existing table-organization-store)

**Plans:** 3 plans in 2 waves

Plans:

- [x] 12-01-PLAN.md — Upgrade store to TagDefinition with id, name, color
- [x] 12-02-PLAN.md — Create ColorPicker, ColoredTagBadge, TagDialog components
- [x] 12-03-PLAN.md — Add persistence, command palette integration, update Sidebar

**Requirements:**

- TAG-01: User can create custom tags (name + color)
- TAG-02: User can edit and delete existing tags
- TAG-03: User can assign one or more tags to tables
- TAG-04: Sidebar table list can filter by tag
- TAG-05: Tag data persists to electron-store
- TAG-06: Each tag has customizable display color
- TAG-07: Command palette (Cmd+K) can search and jump to tags

**Success Criteria:**

1. User creates a tag with custom name and color, and it appears in tag list
2. User assigns tags to tables, and tags display next to table names in sidebar
3. User filters sidebar by tag and only tagged tables are shown
4. User closes and reopens app, all tag assignments are preserved
5. User types tag name in command palette and can jump to filtered view

---

### Phase 13: Saved Queries

**Goal:** Users can save, organize, and quickly execute frequently-used queries

**Dependencies:** None (independent of Phase 12)

**Plans:** 3 plans in 2 waves

Plans:

- [ ] 13-01-PLAN.md — Create saved-queries-store with types and persistence
- [ ] 13-02-PLAN.md — Create UI components (dialogs, browser, cards)
- [ ] 13-03-PLAN.md — Integrate toolbar, command palette, and i18n

**Requirements:**

- QUERY-01: User can save current query (name + description)
- QUERY-02: User can browse saved queries list
- QUERY-03: User can quickly run a saved query
- QUERY-04: User can edit and delete saved queries
- QUERY-05: User can organize queries with folders
- QUERY-06: Queries support parameter variables `{{variable}}` syntax
- QUERY-07: Running parameterized query shows variable input dialog
- QUERY-08: Command palette (Cmd+K) can search and run saved queries

**Success Criteria:**

1. User saves a query with name and description, it appears in saved queries panel
2. User selects a saved query and it loads into the editor and can be executed
3. User creates folders and moves queries between them for organization
4. User runs a query with `{{date}}` parameter and is prompted to enter the value
5. User searches for query name in command palette and can execute directly

---

### Phase 14: SSH Tunnels

**Goal:** Users can securely connect to databases behind SSH with automatic tunnel management

**Dependencies:** None (independent infrastructure feature)

**Requirements:**

- SSH-01: User can establish SSH tunnel with password authentication
- SSH-02: User can establish SSH tunnel with private key authentication
- SSH-03: SSH credentials stored securely via Electron safeStorage
- SSH-04: Connection config UI shows SSH tunnel options
- SSH-05: Tunnel automatically handles port forwarding (dynamic local port)
- SSH-06: Connection status UI shows tunnel status indicator
- SSH-07: Tunnel automatically reconnects after network interruption
- SSH-08: User can connect via jump host (bastion) to target database

**Success Criteria:**

1. User configures SSH tunnel with password and successfully connects to remote database
2. User configures SSH tunnel with private key file and successfully connects
3. User disconnects and reconnects, SSH credentials are remembered securely
4. Connection status shows clear "SSH Tunnel Active" indicator when connected
5. User configures jump host and successfully reaches database behind bastion

---

### Phase 15: AI Natural Language Query

**Goal:** Users can generate SQL from natural language with schema-aware AI assistance

**Dependencies:** Phase 13 (saved queries - users will want to save AI-generated queries)

**Requirements:**

- AI-01: User can describe query needs in natural language
- AI-02: AI generates SQL based on current database schema
- AI-03: Generated SQL shows preview, user confirms before execution
- AI-04: Command palette supports quick query mode (Cmd+K natural language)
- AI-05: User can select SQL and have AI explain its meaning
- AI-06: AI can analyze query and provide optimization suggestions

**Success Criteria:**

1. User types "show all users who signed up last week" and receives valid SQL
2. Generated SQL correctly references actual table and column names from schema
3. User sees SQL preview and must click "Execute" before query runs
4. User selects complex SQL, asks for explanation, and receives clear breakdown
5. User asks for optimization of slow query and receives actionable suggestions

---

## Progress

| Phase | Name                | Requirements | Status   |
| ----- | ------------------- | ------------ | -------- |
| 12    | Table Tags          | 7            | Complete |
| 13    | Saved Queries       | 8            | Pending  |
| 14    | SSH Tunnels         | 8            | Pending  |
| 15    | AI Natural Language | 6            | Pending  |

**Total:** 29 requirements across 4 phases

## Coverage

All 29 v2.0 requirements mapped:

| Category | Requirements                                                                   | Phase |
| -------- | ------------------------------------------------------------------------------ | ----- |
| TAG      | TAG-01, TAG-02, TAG-03, TAG-04, TAG-05, TAG-06, TAG-07                         | 12    |
| QUERY    | QUERY-01, QUERY-02, QUERY-03, QUERY-04, QUERY-05, QUERY-06, QUERY-07, QUERY-08 | 13    |
| SSH      | SSH-01, SSH-02, SSH-03, SSH-04, SSH-05, SSH-06, SSH-07, SSH-08                 | 14    |
| AI       | AI-01, AI-02, AI-03, AI-04, AI-05, AI-06                                       | 15    |

**Coverage:** 29/29 (100%)

## Completed Milestones

See [MILESTONES.md](MILESTONES.md) for completed milestone history.

| Milestone | Name           | Completed  | Phases | Plans |
| --------- | -------------- | ---------- | ------ | ----- |
| v1.0      | Design Refresh | 2026-01-28 | 11     | 28    |

---

_Roadmap created: 2026-01-29_
_Last updated: 2026-01-30_
