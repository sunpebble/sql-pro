## Why

当前代码库存在结构性问题：21个分散的 IPC 处理器缺乏统一抽象、36个 Zustand stores 功能重叠、100+ 组件目录过于扁平、业务逻辑散布于 components/hooks/stores 中。这导致代码难以维护、功能边界模糊、新功能开发效率低下。

现在进行重构是因为项目已达到临界复杂度，继续在现有结构上添加功能会加剧技术债务。按系统边界重组代码将提升可维护性、可测试性和开发效率。

## What Changes

### 主进程重构

- 引入 **Core 系统**：窗口管理、菜单、存储、生命周期管理
- 引入 **Database 系统**：适配器、查询执行、Schema 管理、连接池
- 引入 **Agent 系统**：AI 模型、工具、提示词、聊天处理
- 引入 **Features 系统**：备份、导出、导入、SSH 隧道等独立功能
- 引入 **IPC 系统**：统一的 IPC 处理器基类、类型安全的通道定义
- 引入 **Observability 系统**：日志、内存监控、性能追踪、错误报告

### 渲染进程重构

- 采用 **Feature-based 架构**：每个功能模块包含自己的 components/hooks/stores
- 引入 **Shared 层**：跨功能共享的组件、hooks、工具函数
- 引入 **App Shell**：路由、全局 providers、布局组件
- **BREAKING**: Store 文件路径变更，需要更新所有导入

### 共享层重构

- 创建 `packages/types`：集中管理所有类型定义
- 创建 `packages/ipc-contracts`：端到端类型安全的 IPC 定义
- 增强 `packages/ui`：按功能分组组件

## Capabilities

### New Capabilities

- `core-system`: 应用核心生命周期、窗口管理、菜单系统、持久化存储
- `database-system`: 数据库适配器、查询执行引擎、Schema 管理、连接池
- `agent-system`: AI Agent 架构、模型管理、工具注册、提示词模板
- `observability-system`: 统一日志、内存监控、性能追踪、错误边界
- `ipc-system`: 类型安全 IPC 层、处理器基类、通道注册
- `feature-modules`: 功能模块化架构（备份、导出、导入等）
- `ui-component-system`: 组件分层架构、共享组件库

### Modified Capabilities

（无现有 specs 需要修改）

## Impact

### 代码影响

- `apps/electron/src/main/`: 完全重组目录结构
- `apps/electron/src/renderer/src/`: 采用 feature-based 架构
- `apps/electron/src/shared/`: 扩展为完整的共享层
- `packages/`: 新增 types、ipc-contracts 包

### 依赖影响

- 所有模块间导入路径需要更新
- 可能需要更新 tsconfig paths 配置
- Nx 项目配置需要更新

### 测试影响

- 测试文件需要迁移到新目录结构
- 可能需要更新测试配置
