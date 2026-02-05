## Requirements

### Requirement: Neobrutalism CSS Variables

系统 SHALL 使用 neobrutalism.dev 定义的 CSS 变量作为设计基础。

#### Scenario: Base styling variables

- **WHEN** 应用 neobrutalism 样式时
- **THEN** CSS 根元素 SHALL 定义以下变量：
  - `--background` 背景色
  - `--foreground` 前景色
  - `--main` 主色调
  - `--main-foreground` 主色调前景色
  - `--border` 边框颜色
  - `--ring` 聚焦环颜色

#### Scenario: Shadow configuration

- **WHEN** 配置组件阴影时
- **THEN** 系统 SHALL 使用偏移阴影格式 `Xpx Xpx 0px 0px var(--border)`

#### Scenario: Border configuration

- **WHEN** 配置组件边框时
- **THEN** 系统 SHALL 使用 `--border-width` 变量（默认 2px）

### Requirement: Theme Support

系统 SHALL 支持亮色和暗色主题切换。

#### Scenario: Light theme

- **WHEN** 用户选择亮色主题时
- **THEN** 系统 SHALL 应用亮色背景和深色文字

#### Scenario: Dark theme

- **WHEN** 用户选择暗色主题时
- **THEN** 系统 SHALL 应用暗色背景和浅色文字

#### Scenario: Theme persistence

- **WHEN** 用户切换主题后刷新页面时
- **THEN** 系统 SHALL 保持用户选择的主题

### Requirement: Typography System

系统 SHALL 定义统一的字体系统。

#### Scenario: Font family configuration

- **WHEN** 渲染文字时
- **THEN** 系统 SHALL 使用以下字体配置：
  - Display: Plus Jakarta Sans
  - Body: Inter
  - Mono: JetBrains Mono

#### Scenario: Font weight usage

- **WHEN** 渲染标题时
- **THEN** 系统 SHALL 使用 font-weight 700-800

### Requirement: Color Palette

系统 SHALL 使用橙色作为主色调的 Neobrutalism 配色。

#### Scenario: Primary color

- **WHEN** 渲染主要交互元素时
- **THEN** 元素 SHALL 使用橙色 (#F97316) 作为主色

#### Scenario: Accent colors

- **WHEN** 需要辅助色彩时
- **THEN** 系统 SHALL 提供成功(绿)、警告(黄)、错误(红)状态色

### Requirement: Spacing System

系统 SHALL 使用 Tailwind CSS 默认间距系统。

#### Scenario: Component spacing

- **WHEN** 设置组件内外边距时
- **THEN** 开发者 SHALL 使用 Tailwind 间距类 (p-4, m-2, gap-3 等)

#### Scenario: Layout spacing

- **WHEN** 设置页面布局间距时
- **THEN** 开发者 SHALL 使用 Tailwind 容器和间距类
