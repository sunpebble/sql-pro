# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-29)

**Core value:** 让数据库操作变得简单、高效、愉悦
**Current focus:** v2.0 Feature Parity - compete with TablePlus/DB Pro

## Current Position

Milestone: v2.0 - 功能对齐
Phase: 14 - SSH Tunnels (in progress)
Plan: 2/3 complete
Status: Plan 02 complete, ready for Plan 03

Progress: [██████░░░░] 55%

### Phase Overview

| Phase | Name                | Requirements | Status      |
| ----- | ------------------- | ------------ | ----------- |
| 12    | Table Tags          | 7            | Complete    |
| 13    | Saved Queries       | 8            | Complete    |
| 14    | SSH Tunnels         | 8            | In Progress |
| 15    | AI Natural Language | 6            | Pending     |

## Target Features (v2.0)

- [x] Table Tags — 自定义标签组织表 (Phase 12) ✓
- [x] Saved Queries — 保存常用查询 (Phase 13) ✓
- [ ] SSH Tunnels — 安全连接远程数据库 (Phase 14)
- [ ] AI 自然语言查询 — 自然语言转 SQL (Phase 15)

## Accumulated Context

### Decisions

Decisions carried over from v1.0:

- Implemented: Dark mode first (:root = dark, .light = light override)
- Implemented: Orange accent (Orange 400 dark, Orange 600 light)
- Implemented: Border radius capped at 12px
- Implemented: 100ms ease-out transitions for interactive elements
- Implemented: Glassmorphism on dialogs

v2.0 decisions:

- Phase order: Table Tags first (store exists), then Saved Queries, SSH Tunnels, AI last
- SSH Tunnels: Use ssh2 library (pure JS, no native binaries)
- Credentials: Use existing password-storage.ts pattern with safeStorage API

Phase 12 decisions:

| ID                 | Decision                            | Rationale                                                        |
| ------------------ | ----------------------------------- | ---------------------------------------------------------------- |
| tag-id-format      | Use crypto.randomUUID() for tag IDs | Stable references that survive renames, no external dependencies |
| persistence-delay  | Debounced persistence (500ms)       | Prevents excessive IPC calls during rapid tag/metadata changes   |
| command-reg-global | Global command registration in App  | Ensures commands registered once at app level, not per-component |

Phase 13 decisions:

| ID                  | Decision                             | Rationale                                            |
| ------------------- | ------------------------------------ | ---------------------------------------------------- |
| query-size-limit    | 50KB max with toast notification     | Prevents storage bloat while providing user feedback |
| parameter-syntax    | Support {{name:type=default}} format | Flexible syntax allowing type hints and defaults     |
| cmd-palette-pattern | Follow useTagCommands pattern        | Consistency across command registration hooks        |
| toolbar-placement   | Save/Saved buttons before Side Panel | Visual grouping of query-related actions             |

Phase 14 decisions:

| ID              | Decision                                   | Rationale                                       |
| --------------- | ------------------------------------------ | ----------------------------------------------- |
| ssh-ui-pattern  | Controlled component with individual props | Full control from parent, easy state management |
| ssh-conditional | SSH section only for MySQL/PostgreSQL      | Other DB types don't need SSH tunnels           |

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-01-30
Stopped at: Completed 14-02-PLAN.md (SSH Tunnel UI)
Resume with: Execute 14-03-PLAN.md for SSH tunnel service implementation

---

_State updated: 2026-01-30_
