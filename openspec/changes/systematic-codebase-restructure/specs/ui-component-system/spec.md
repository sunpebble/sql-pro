## ADDED Requirements

### Requirement: Component Layer Architecture

系统 SHALL 定义组件分层架构，区分共享组件和功能组件。

#### Scenario: Shared components

- **WHEN** 组件被多个功能模块使用时
- **THEN** 组件 SHALL 放置在 shared/components/ 目录

#### Scenario: Feature components

- **WHEN** 组件仅被单个功能模块使用时
- **THEN** 组件 SHALL 放置在 features/<name>/components/ 目录

#### Scenario: Component promotion

- **WHEN** 功能组件开始被其他模块使用时
- **THEN** 组件 SHALL 迁移到 shared/components/ 目录

### Requirement: Shared Component Library

系统 SHALL 维护共享组件库，提供跨功能的通用组件。

#### Scenario: Component export

- **WHEN** 导入共享组件时
- **THEN** 组件 SHALL 通过 shared/components/index.ts 统一导出

#### Scenario: Component documentation

- **WHEN** 创建共享组件时
- **THEN** 组件 SHALL 包含 TypeScript 类型和 JSDoc 注释

#### Scenario: Component styling

- **WHEN** 组件需要样式时
- **THEN** 组件 SHALL 使用 Tailwind CSS 和 cn() 工具函数

### Requirement: Store Organization

系统 SHALL 定义 Store 组织规范，减少 Store 数量并明确职责。

#### Scenario: Feature store

- **WHEN** 功能模块需要状态管理时
- **THEN** 模块 SHALL 创建单个聚合 Store 而非多个小 Store

#### Scenario: Global store

- **WHEN** 状态需要跨功能共享时
- **THEN** Store SHALL 放置在 shared/stores/ 目录

#### Scenario: Store slices

- **WHEN** 单个 Store 过于复杂时
- **THEN** Store SHALL 使用 Zustand slices 模式分割逻辑

### Requirement: Hooks Organization

系统 SHALL 定义 Hooks 组织规范，区分共享和功能特定的 Hooks。

#### Scenario: Shared hooks

- **WHEN** Hook 被多个功能使用时
- **THEN** Hook SHALL 放置在 shared/hooks/ 目录

#### Scenario: Feature hooks

- **WHEN** Hook 仅用于单个功能时
- **THEN** Hook SHALL 放置在 features/<name>/hooks/ 目录

#### Scenario: Hook composition

- **WHEN** 功能 Hook 需要共享功能时
- **THEN** Hook SHALL 组合使用共享 Hooks 而非重复实现

### Requirement: App Shell Architecture

系统 SHALL 提供 App Shell 架构，管理路由、布局和全局 Providers。

#### Scenario: Route definition

- **WHEN** 定义应用路由时
- **THEN** 路由配置 SHALL 放置在 app/routes/ 目录

#### Scenario: Provider composition

- **WHEN** 组合全局 Providers 时
- **THEN** Providers SHALL 在 app/providers/ 中定义并在根组件组合

#### Scenario: Layout components

- **WHEN** 定义页面布局时
- **THEN** 布局组件 SHALL 放置在 app/layouts/ 目录
