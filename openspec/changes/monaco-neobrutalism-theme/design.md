## Context

Monaco 编辑器是 SQL Pro 的核心组件，当前已有自定义主题 `sql-pro-light` 和 `sql-pro-dark`，使用橙色作为主色调。但以下 UI 元素尚未完全符合 Neobrutalism 设计规范：

- 滚动条使用默认的圆角和渐变效果
- 建议弹窗缺少 2px 边框和偏移阴影
- Hover 提示弹窗样式不一致
- Minimap 滑块使用默认样式
- 编辑器容器边框不明显

**当前主题定义位置**: `apps/electron/src/renderer/src/lib/monaco-sql-config.ts`
**当前 CSS 覆盖**: `apps/electron/src/renderer/src/styles/globals.css`

## Goals / Non-Goals

**Goals:**

- 滚动条使用实色背景、2px 边框、方形滑块
- 建议弹窗（Suggest Widget）添加 Neobrutalism 边框和偏移阴影
- Hover 提示弹窗与应用 Tooltip 样式一致
- 编辑器容器有清晰的 2px 边框
- 所有 UI 元素使用 CSS 变量，支持主题切换
- 保持与现有 `--border`、`--background`、`--main` 等变量的一致性

**Non-Goals:**

- 不修改语法高亮颜色（已符合规范）
- 不修改编辑器功能逻辑
- 不添加新的编辑器功能

## Decisions

### 1. 使用 CSS 覆盖而非 Monaco 主题 API

**决策**: 主要通过 CSS 覆盖 Monaco 内置样式，而非完全依赖 `monaco.editor.defineTheme()`

**原因**:

- Monaco 主题 API 不支持滚动条、弹窗边框等样式
- CSS 覆盖更灵活，可以使用 CSS 变量实现主题切换
- 已有 globals.css 中的 Monaco 样式覆盖模式

**替代方案**: 仅使用主题 API → 无法实现完整的 Neobrutalism 效果

### 2. 使用 CSS 变量实现主题响应

**决策**: 所有颜色使用 `var(--xxx)` CSS 变量

**原因**:

- 自动响应 light/dark 主题切换
- 与应用其他组件保持一致
- 单一真相来源

### 3. 滚动条样式策略

**决策**: 使用 `::-webkit-scrollbar` 系列伪元素覆盖滚动条样式

**原因**:

- Electron 使用 Chromium，完全支持 WebKit 滚动条样式
- 可以实现方形滑块、实色背景、清晰边框

## Risks / Trade-offs

| 风险                               | 缓解措施                                            |
| ---------------------------------- | --------------------------------------------------- |
| CSS 覆盖可能在 Monaco 升级后失效   | 使用稳定的类名选择器，添加注释标记版本依赖          |
| 滚动条样式在非 WebKit 浏览器不生效 | Electron 仅使用 Chromium，无此问题                  |
| 过多 CSS 覆盖导致维护困难          | 集中在 globals.css 的 Monaco 专属区块，添加清晰注释 |
