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

### Requirement: 幽灵线视觉指示

拖拽列宽时，系统 SHALL 显示一条垂直的幽灵指示线，指示当前拖拽位置。

#### Scenario: 开始拖拽时显示幽灵线

- **WHEN** 用户在列边界按下鼠标开始拖拽
- **THEN** 系统显示一条 2px 宽的蓝色垂直线，位置与鼠标对齐

#### Scenario: 拖拽过程中幽灵线跟随

- **WHEN** 用户拖拽鼠标移动
- **THEN** 幽灵线实时跟随鼠标水平位置，无卡顿（60fps+）

#### Scenario: 释放鼠标时隐藏幽灵线

- **WHEN** 用户释放鼠标
- **THEN** 幽灵线立即隐藏，列宽更新为最终拖拽位置

### Requirement: 拖拽过程零重渲染

拖拽列宽期间，系统 SHALL NOT 触发 React 组件重渲染。

#### Scenario: 大数据量表格拖拽性能

- **WHEN** 表格包含 10000+ 行数据
- **AND** 用户拖拽调整列宽
- **THEN** 拖拽过程保持流畅，不触发表格重渲染

#### Scenario: 仅释放时更新状态

- **WHEN** 用户完成列宽拖拽（释放鼠标）
- **THEN** 系统仅触发一次 `setColumnWidths` 状态更新

### Requirement: 防止拖拽后误触发排序

拖拽结束后，系统 SHALL 阻止短时间内的点击事件，防止误触发列排序。

#### Scenario: 拖拽结束后锁定期

- **WHEN** 用户释放鼠标完成列宽调整
- **THEN** 系统在 100ms 内忽略该列的点击事件

### Requirement: 保持现有功能

幽灵拖拽优化 SHALL 保持现有列宽调整功能的行为不变。

#### Scenario: 双击自动适应列宽

- **WHEN** 用户双击列边界
- **THEN** 列宽自动调整为最佳宽度（与当前行为一致）

#### Scenario: 最小/最大宽度限制

- **WHEN** 用户拖拽列宽超出限制
- **THEN** 列宽被限制在 minWidth 和 maxWidth 范围内

### Requirement: Component Neobrutalism Styling

系统 SHALL 使用 Neobrutalism 风格样式化所有 UI 组件。

#### Scenario: Button styling

- **WHEN** 渲染按钮组件时
- **THEN** 按钮 SHALL 具有以下样式：
  - 2px 实线边框
  - 偏移阴影 (4px 4px 0px 0px)
  - 悬停时阴影位移效果

#### Scenario: Card styling

- **WHEN** 渲染卡片组件时
- **THEN** 卡片 SHALL 具有以下样式：
  - 2px 实线边框
  - 偏移阴影
  - 无模糊或渐变效果

#### Scenario: Input styling

- **WHEN** 渲染输入框组件时
- **THEN** 输入框 SHALL 具有以下样式：
  - 2px 实线边框
  - 清晰的聚焦状态
  - 无内阴影

#### Scenario: Dialog styling

- **WHEN** 渲染对话框组件时
- **THEN** 对话框 SHALL 具有以下样式：
  - 2px 实线边框
  - 大偏移阴影 (8px 8px 0px 0px)
  - 实色背景

### Requirement: Tailwind-Only Styling Approach

组件 SHALL 完全使用 Tailwind CSS 工具类进行样式化。

#### Scenario: No custom CSS

- **WHEN** 开发新组件时
- **THEN** 开发者 SHALL NOT 创建自定义 CSS 文件

#### Scenario: Tailwind classes

- **WHEN** 需要样式化元素时
- **THEN** 开发者 SHALL 使用 Tailwind 工具类

#### Scenario: cn() utility

- **WHEN** 需要条件样式时
- **THEN** 开发者 SHALL 使用 cn() 工具函数组合类名

### Requirement: Animation and Transitions

组件 SHALL 使用简洁的动画效果。

#### Scenario: Hover effects

- **WHEN** 用户悬停在可交互元素上时
- **THEN** 元素 SHALL 显示位移或颜色变化效果

#### Scenario: Click effects

- **WHEN** 用户点击按钮时
- **THEN** 按钮 SHALL 显示向下位移效果（模拟按压）

#### Scenario: No blur effects

- **WHEN** 设计组件过渡效果时
- **THEN** 开发者 SHALL NOT 使用模糊或毛玻璃效果

### Requirement: Component Accessibility

所有组件 SHALL 保持无障碍功能。

#### Scenario: Focus states

- **WHEN** 元素获得键盘焦点时
- **THEN** 元素 SHALL 显示明显的聚焦指示器

#### Scenario: Color contrast

- **WHEN** 渲染文字时
- **THEN** 文字与背景 SHALL 满足 WCAG AA 对比度要求

#### Scenario: Screen reader support

- **WHEN** 使用屏幕阅读器时
- **THEN** 所有交互元素 SHALL 提供适当的 ARIA 标签
