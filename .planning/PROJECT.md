# SQL Pro Design Refresh

## What This Is

SQL Pro 是一款专业的跨平台数据库管理应用，包含 Electron 桌面客户端和营销官网。本次项目是对现有产品的设计语言升级，将「暖橙色 + 浅色背景」的 Warm Modern 风格转变为 Linear/Raycast 风格的「深色优先 + 极简高端」体验。

## Core Value

**视觉和交互体验达到 Linear/Raycast 级别的精致度** —— 用户第一眼就能感受到「小而美」的高端质感。

## Requirements

### Validated

已有功能，本次项目不改变核心功能：

- ✓ Monorepo 架构 (Electron + Website + 共享包) — existing
- ✓ 多数据库支持 (SQLite, PostgreSQL, MySQL, LibSQL) — existing
- ✓ AI 集成 (OpenAI, Anthropic) — existing
- ✓ Monaco 代码编辑器 (带 Vim 模式) — existing
- ✓ 命令面板 (cmdk) — existing
- ✓ 许可证系统 — existing

### Active

None - v1.0 milestone complete.

### Completed (v1.0)

- [x] 设计系统升级为深色模式优先 + 橙色强调色
- [x] App 导航结构简化，减少层级嵌套
- [x] App 键盘快捷键体验强化 (Cmd+K 全局命令)
- [x] App 微交互动效升级 (hover/transition/loading)
- [x] 官网改版为极简风格落地页
- [x] 官网移除冗余营销内容
- [x] 官网加入产品演示/动效

### Out of Scope

- 新增核心功能 — 本次专注于设计和体验升级
- 移动端适配 — 桌面应用优先
- 完整的设计系统文档 — 实现优先，文档后补

## Context

**现有设计：** Warm Modern 风格

- 主色：橙色 #F97316
- 背景：暖白色 #FFFBF7
- 大圆角 (16-24px)
- 软阴影

**目标风格：** Linear/Raycast 风格

- 深色背景为主
- 橙色作为点缀强调色
- 极简视觉层次
- 精致微交互

**技术栈：**

- React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui
- Framer Motion 动效
- cmdk 命令面板

## Constraints

- **技术栈**: 沿用现有技术栈，不引入新框架
- **品牌色**: 保留橙色作为品牌识别，但使用方式调整
- **兼容性**: 支持 light/dark 双模式，但 dark 模式优先设计

## Key Decisions

| Decision       | Rationale                            | Outcome    |
| -------------- | ------------------------------------ | ---------- |
| 深色模式优先   | 与 Linear/Raycast 风格一致，更显高端 | ✓ Complete |
| 保留橙色强调色 | 品牌识别延续，在深色背景上更突出     | ✓ Complete |
| 官网去营销化   | 小而美产品的调性，让产品说话         | ✓ Complete |

---

_Last updated: 2026-01-28 after v1.0 milestone completion_
