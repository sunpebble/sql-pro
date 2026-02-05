## ADDED Requirements

### Requirement: Monaco 滚动条 Neobrutalism 样式

Monaco 编辑器滚动条 SHALL 使用 Neobrutalism 风格样式。

#### Scenario: 滚动条轨道样式

- **WHEN** 渲染 Monaco 编辑器滚动条轨道时
- **THEN** 轨道 SHALL 使用 `var(--muted)` 背景色
- **AND** 轨道 SHALL 有 2px 实线边框 `var(--border)`

#### Scenario: 滚动条滑块样式

- **WHEN** 渲染滚动条滑块时
- **THEN** 滑块 SHALL 使用 `var(--border)` 背景色
- **AND** 滑块 SHALL 使用 5px 圆角 (rounded-base)
- **AND** 滑块 SHALL NOT 使用渐变或模糊效果

#### Scenario: 滚动条悬停效果

- **WHEN** 用户悬停在滚动条滑块上时
- **THEN** 滑块 SHALL 使用 `var(--main)` 背景色

### Requirement: Monaco 建议弹窗 Neobrutalism 样式

Monaco 代码建议弹窗 SHALL 使用 Neobrutalism 风格样式。

#### Scenario: 建议弹窗容器样式

- **WHEN** 渲染代码建议弹窗时
- **THEN** 弹窗 SHALL 有 2px 实线边框 `var(--border)`
- **AND** 弹窗 SHALL 有偏移阴影 `4px 4px 0px 0px var(--border)`
- **AND** 弹窗 SHALL 使用 5px 圆角

#### Scenario: 建议项选中样式

- **WHEN** 用户选中某个建议项时
- **THEN** 选中项 SHALL 使用 `var(--main)` 背景色
- **AND** 选中项文字 SHALL 使用 `var(--main-foreground)` 颜色

### Requirement: Monaco Hover 提示 Neobrutalism 样式

Monaco Hover 提示弹窗 SHALL 使用 Neobrutalism 风格样式。

#### Scenario: Hover 提示容器样式

- **WHEN** 渲染 Hover 提示时
- **THEN** 弹窗 SHALL 有 2px 实线边框 `var(--border)`
- **AND** 弹窗 SHALL 有偏移阴影 `4px 4px 0px 0px var(--border)`
- **AND** 弹窗 SHALL 使用实色背景 `var(--popover)`

### Requirement: Monaco 编辑器容器 Neobrutalism 样式

Monaco 编辑器容器 SHALL 使用 Neobrutalism 风格边框。

#### Scenario: 编辑器容器边框

- **WHEN** 渲染 Monaco 编辑器容器时
- **THEN** 容器 SHALL 有 2px 实线边框 `var(--border)`
- **AND** 容器 SHALL 使用 5px 圆角
- **AND** 容器 SHALL 有 `overflow: hidden` 防止内容溢出圆角

### Requirement: Monaco Minimap Neobrutalism 样式

Monaco Minimap 滑块 SHALL 使用 Neobrutalism 风格样式。

#### Scenario: Minimap 滑块样式

- **WHEN** 渲染 Minimap 可视区域滑块时
- **THEN** 滑块 SHALL 使用半透明 `var(--main)` 背景色
- **AND** 滑块边框 SHALL 使用 `var(--border)` 颜色

### Requirement: Monaco 查找替换弹窗 Neobrutalism 样式

Monaco 查找替换弹窗 SHALL 使用 Neobrutalism 风格样式。

#### Scenario: 查找弹窗容器样式

- **WHEN** 用户打开查找替换功能时
- **THEN** 弹窗 SHALL 有 2px 实线边框 `var(--border)`
- **AND** 弹窗 SHALL 有偏移阴影

#### Scenario: 查找输入框样式

- **WHEN** 渲染查找输入框时
- **THEN** 输入框 SHALL 有 2px 实线边框
- **AND** 输入框 SHALL 使用 5px 圆角

### Requirement: 主题响应式切换

所有 Monaco Neobrutalism 样式 SHALL 响应应用主题切换。

#### Scenario: 深色主题切换

- **WHEN** 用户切换到深色主题时
- **THEN** 所有 Monaco UI 元素 SHALL 自动更新为深色主题配色
- **AND** 更新 SHALL 使用 CSS 变量实现，无需重新渲染编辑器

#### Scenario: 浅色主题切换

- **WHEN** 用户切换到浅色主题时
- **THEN** 所有 Monaco UI 元素 SHALL 自动更新为浅色主题配色
