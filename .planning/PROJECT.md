# SQL Pro

## What This Is

SQL Pro 是一款专业的跨平台数据库管理应用，包含 Electron 桌面客户端和营销官网。目标是成为开发者首选的现代数据库客户端，对标 DB Pro / TablePlus 级别的功能和体验。

## Core Value

**让数据库操作变得简单、高效、愉悦** —— 现代 UI + 强大功能 + AI 加持的专业工具。

## Current Milestone: v2.0 功能对齐

**Goal:** 对标 DB Pro 实现核心功能差距，建立竞争力

**Target features:**

- SSH Tunnels — 安全连接远程数据库
- Table Tags — 自定义标签组织表
- Saved Queries — 保存常用查询
- AI 自然语言查询 — 自然语言转 SQL

## Requirements

### Validated

已验证的核心功能：

- ✓ Monorepo 架构 (Electron + Website + 共享包) — existing
- ✓ 多数据库支持 (SQLite, PostgreSQL, MySQL, LibSQL) — existing
- ✓ AI 集成 (OpenAI, Anthropic) — existing
- ✓ Monaco 代码编辑器 (带 Vim 模式) — existing
- ✓ 命令面板 (cmdk) — existing
- ✓ 许可证系统 — existing
- ✓ Linear/Raycast 风格设计系统 — v1.0
- ✓ 深色优先 + 橙色强调色 — v1.0
- ✓ 极简官网 — v1.0

### Active

- [ ] SSH Tunnels 安全连接
- [ ] Table Tags 标签系统
- [ ] Saved Queries 查询保存
- [ ] AI 自然语言查询

### Out of Scope

- MongoDB / SQL Server 支持 — 延后到 v3.0
- Dashboards 数据可视化 — 延后到 v3.0
- Notebook Reports — 延后到 v3.0
- 移动端适配 — 桌面应用优先

## Context

**竞品对标：** DB Pro (dbpro.app)

- SSH Tunnels、Table Tags、Saved Queries 是 DB Pro 已有功能
- AI 自然语言查询是 DB Pro 规划中的功能，可抢先实现

**技术栈：**

- React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui
- Electron (main/renderer 进程架构)
- 已有数据库适配器模式 (database-adapters/)
- 已有 AI 服务集成 (OpenAI, Anthropic)

**现有架构：**

- 数据库适配器：mysql-adapter, postgresql-adapter, sqlite-adapter, turso-adapter
- 状态管理：Zustand stores (connection-store, query-store, table-data-store)
- UI：Monaco Editor, shadcn/ui 组件, cmdk 命令面板

## Constraints

- **技术栈**: 沿用现有技术栈和架构模式
- **设计系统**: 延续 v1.0 的 Linear/Raycast 风格
- **兼容性**: 新功能需支持所有已支持的数据库类型

## Key Decisions

| Decision       | Rationale                            | Outcome    |
| -------------- | ------------------------------------ | ---------- |
| 深色模式优先   | 与 Linear/Raycast 风格一致，更显高端 | ✓ Complete |
| 保留橙色强调色 | 品牌识别延续，在深色背景上更突出     | ✓ Complete |
| 官网去营销化   | 小而美产品的调性，让产品说话         | ✓ Complete |
| 对标 DB Pro    | 填补核心功能差距，建立竞争力         | — Pending  |

---

_Last updated: 2026-01-29 after v2.0 milestone start_
