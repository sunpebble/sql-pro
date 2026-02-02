## ADDED Requirements

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
