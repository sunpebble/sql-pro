## Why

当前的 SQL Pro 使用 "Warm Modern" 设计风格，虽然专业但缺乏视觉冲击力和个性化。Neobrutalism 是一种大胆、富有表现力的设计风格，融合了粗犷主义的直接性与现代设计的精致感。采用 neobrutalism.dev 组件库可以让 SQL Pro 在众多数据库管理工具中脱颖而出，同时保持基于 shadcn/ui 的组件质量和可访问性。

## What Changes

- **BREAKING** 完全重构官网 (website) 和桌面应用 (electron app) 的视觉风格为 Neobrutalism
- 替换当前的自定义 CSS 设计系统为 neobrutalism.dev 的 Tailwind CSS 变量和样式
- 使用 neobrutalism.dev 提供的 shadcn/ui 组件变体替换现有 UI 组件
- 移除自定义 CSS 文件，完全依赖 Tailwind CSS 工具类
- 保持暗色/亮色主题切换功能，但采用 neobrutalism 的配色方案
- 保留橙色作为主色调，但使用 neobrutalism 风格的呈现方式

## Capabilities

### New Capabilities

- `neobrutalism-design-system`: 基于 neobrutalism.dev 的设计系统，包含 CSS 变量、颜色方案和 Tailwind 配置

### Modified Capabilities

- `ui-component-system`: 组件样式规范变更为 neobrutalism 风格，使用粗边框、偏移阴影和大胆配色

## Impact

### 受影响的代码

**Website (apps/website/)**

- `src/index.css` - 完全替换为 neobrutalism 样式
- 所有组件 (`src/components/*.tsx`) - 更新为 neobrutalism UI 组件

**Electron App (apps/electron/src/renderer/)**

- `src/styles/globals.css` - 更新为 neobrutalism 主题变量
- 所有 UI 组件 - 应用 neobrutalism 样式类

**共享 UI 包 (packages/ui/)**

- shadcn/ui 组件替换为 neobrutalism 变体

### 依赖项

- 需要参考 neobrutalism.dev 文档安装/更新样式
- 保持 shadcn/ui 作为基础组件库
- Tailwind CSS v4 配置需要调整

### 设计约束

- 不创建自定义 CSS 组件，完全使用 Tailwind 工具类
- 优先使用 neobrutalism.dev 提供的组件样式
- 保持响应式设计和无障碍功能
