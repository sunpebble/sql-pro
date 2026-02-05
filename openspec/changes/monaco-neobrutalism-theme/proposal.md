## Why

当前 Monaco 编辑器的主题配置虽然使用了橙色作为主色调，但部分视觉元素未完全遵循 Neobrutalism 设计规范。需要全面完善主题适配，确保编辑器的滚动条、minimap、建议弹窗、边框等所有 UI 元素与应用整体的 Neobrutalism 风格保持一致。

## What Changes

- 更新 Monaco 编辑器滚动条样式，使用实色背景和清晰边框
- 完善建议弹窗（Suggest Widget）样式，添加 Neobrutalism 边框和阴影
- 更新 Minimap 滑块样式
- 完善编辑器边框和容器样式
- 更新悬停提示（Hover Widget）样式
- 调整行号区域和边栏样式
- 确保所有交互状态使用位移效果而非渐变

## Capabilities

### New Capabilities

- `monaco-theme-system`: Monaco 编辑器完整的 Neobrutalism 主题系统，包含滚动条、弹窗、边框等所有 UI 元素的样式定义

### Modified Capabilities

(无需修改现有 spec)

## Impact

- **受影响文件**:
  - `apps/electron/src/renderer/src/lib/monaco-sql-config.ts` - 主题颜色定义
  - `apps/electron/src/renderer/src/styles/globals.css` - Monaco CSS 覆盖样式
  - `apps/electron/src/renderer/src/components/MonacoSqlEditor.tsx` - 编辑器容器样式
- **无 Breaking Changes**: 仅视觉样式更新，不影响功能
- **无新依赖**: 使用现有 CSS 变量和 Tailwind 工具类
