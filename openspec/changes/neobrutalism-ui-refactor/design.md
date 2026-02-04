## Context

SQL Pro 当前使用自定义的 "Warm Modern" 设计系统，包含大量自定义 CSS（约 1300 行 index.css）。该设计系统：

- 基于 OKLCH 颜色空间
- 使用 Plus Jakarta Sans、Inter、JetBrains Mono 字体
- 包含渐变、模糊效果和复杂阴影

Neobrutalism.dev 是一个基于 shadcn/ui 的组件库，特点：

- 使用 CSS 变量配置
- 粗边框 (border-width)、偏移阴影 (box-shadow offset)
- 大胆的色彩搭配
- 直接通过 shadcn CLI 安装组件

## Goals / Non-Goals

**Goals:**

- 将网站和应用界面统一为 Neobrutalism 风格
- 使用 neobrutalism.dev 的样式系统替换自定义 CSS
- 保持现有功能不变，仅修改视觉表现
- 支持亮色/暗色主题切换
- 确保所有组件可访问性

**Non-Goals:**

- 不重构业务逻辑或状态管理
- 不更改路由或页面结构
- 不引入新的组件库（继续使用 shadcn/ui）
- 不自定义 CSS 组件（完全使用 Tailwind）

## Decisions

### Decision 1: 样式配置方案

**选择**: 使用 neobrutalism.dev 的 CSS 变量方案

**理由**:

- 与 shadcn/ui 原生兼容
- 通过 CSS 变量轻松切换主题
- 无需修改组件逻辑

**替代方案**:

- 手动编写 neobrutalism 样式 → 工作量大，不一致风险高

### Decision 2: 组件迁移策略

**选择**: 逐组件替换

**流程**:

1. 从 neobrutalism.dev 复制组件样式到 packages/ui/src/components
2. 更新 website 和 electron app 中的引用
3. 测试每个组件的视觉和功能

**理由**:

- 渐进式迁移，风险可控
- 可以逐步验证每个组件

### Decision 3: 主色调保留

**选择**: 保留橙色 (orange) 作为主色，但调整为 neobrutalism 风格

**配置**:

```css
--main: #f97316;
--main-foreground: #000;
```

**理由**:

- 保持品牌一致性
- neobrutalism 支持任意主色配置

### Decision 4: 字体选择

**选择**: 保留当前字体配置

**字体**:

- Display: Plus Jakarta Sans
- Body: Inter
- Mono: JetBrains Mono

**理由**:

- 这些字体与 neobrutalism 风格兼容
- 避免过多视觉变化

### Decision 5: 边框和阴影配置

**选择**: 使用 neobrutalism 默认配置

**配置**:

```css
--border-width: 2px;
--shadow-base: 4px 4px 0px 0px;
--shadow-lg: 8px 8px 0px 0px;
```

**理由**:

- 保持与 neobrutalism.dev 组件视觉一致
- 可通过 CSS 变量全局调整

## Risks / Trade-offs

**[视觉巨变]** → 用户可能不适应

- 提供主题切换选项
- 考虑保留"经典模式"作为后续选项

**[组件兼容性]** → 某些自定义组件可能与新样式冲突

- 逐一测试所有组件
- 必要时微调 Tailwind 类

**[性能影响]** → 新样式可能影响渲染性能

- neobrutalism 样式较简单（无模糊/渐变），预计性能更好
- 需要进行 Lighthouse 测试对比

**[深色模式]** → neobrutalism 的深色模式可能需要调整

- 使用 neobrutalism.dev 的 styling 页面生成合适配置
- 测试所有组件在两种模式下的表现

## Migration Plan

### Phase 1: 基础样式配置

1. 从 neobrutalism.dev/styling 获取 CSS 变量配置
2. 替换 apps/website/src/index.css
3. 替换 apps/electron/src/renderer/src/styles/globals.css

### Phase 2: 共享 UI 组件

1. 更新 packages/ui 中的 shadcn/ui 组件为 neobrutalism 样式
2. 逐个组件：Button → Card → Dialog → Input → ...

### Phase 3: Website 组件

1. 更新 Hero、Features、Pricing 等页面组件
2. 移除自定义 CSS 类，使用 Tailwind 工具类

### Phase 4: Electron App 组件

1. 更新 Sidebar、DataTable、Dialogs 等核心组件
2. 确保与桌面应用风格协调

### Phase 5: 验证和优化

1. 全量 UI 测试
2. Lighthouse 性能测试
3. 无障碍功能验证

## Open Questions

- [ ] 是否需要保留"经典模式"供不喜欢新设计的用户使用？
- [ ] neobrutalism 的某些组件（如 Chart）是否完全满足需求？
- [ ] 是否需要调整 neobrutalism 的默认边框宽度（2px → 3px）？
