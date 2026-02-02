## ADDED Requirements

### Requirement: 行虚拟化渲染

DataTable 组件 SHALL 仅渲染可视区域内的行及缓冲区行，而非全部行。

#### Scenario: 大数据量表格初始渲染

- **WHEN** 表格数据包含 10000+ 行
- **THEN** 系统仅渲染可视区域内的行（约 20-30 行）加缓冲区（约 10 行）
- **AND** 初始渲染时间小于 100ms

#### Scenario: 滚动时动态渲染

- **WHEN** 用户滚动表格
- **THEN** 系统动态渲染新进入可视区域的行
- **AND** 移除离开可视区域的行 DOM 节点
- **AND** 滚动保持 60fps 流畅度

#### Scenario: 快速滚动

- **WHEN** 用户快速拖动滚动条
- **THEN** 系统根据滚动位置计算可视行索引
- **AND** 正确渲染对应的行数据

### Requirement: 虚拟化容器高度

DataTable 组件 SHALL 使用占位元素撑开容器高度，使滚动条反映真实数据量。

#### Scenario: 滚动条反映真实数据量

- **WHEN** 表格包含 10000 行数据
- **THEN** 滚动条高度反映全部数据量（容器高度 = 行数 × 行高）
- **AND** 滚动位置与数据位置对应

#### Scenario: 行高一致性

- **WHEN** 渲染虚拟化行
- **THEN** 每行高度固定为 36px
- **AND** 与非虚拟化模式的行高一致

### Requirement: 编辑功能兼容

行虚拟化 SHALL 保持单元格编辑功能正常工作。

#### Scenario: 编辑可见行

- **WHEN** 用户双击可视区域内的单元格
- **THEN** 单元格进入编辑状态
- **AND** 编辑体验与非虚拟化模式一致

#### Scenario: 编辑后滚动

- **WHEN** 用户编辑单元格后滚动使该行离开视口
- **THEN** 编辑变更保留在 changes store 中
- **AND** 滚动回该行时变更状态正确显示

### Requirement: 选择功能兼容

行虚拟化 SHALL 保持行选择和拖拽选择功能正常工作。

#### Scenario: 单行选择

- **WHEN** 用户点击可视区域内的行
- **THEN** 行被正确选中
- **AND** 选择状态在滚动后保持

#### Scenario: 拖拽选择

- **WHEN** 用户拖拽鼠标跨越多行
- **THEN** 拖拽范围内的行被选中
- **AND** 即使部分行不在可视区域也正确计算选择范围

### Requirement: 键盘导航兼容

行虚拟化 SHALL 保持键盘导航功能正常工作。

#### Scenario: 导航到不可见行

- **WHEN** 用户按方向键导航到当前不在视口内的行
- **THEN** 表格自动滚动使目标行进入视口
- **AND** 焦点正确设置到目标单元格

#### Scenario: 导航到新行

- **WHEN** 用户插入新行
- **THEN** 表格自动滚动到新行位置
- **AND** 新行的第一个单元格获得焦点

### Requirement: 内存管理配合

行虚拟化 SHALL 与 useVirtualData hook 的内存管理功能配合工作。

#### Scenario: 可视范围同步

- **WHEN** 虚拟化器计算出可视行范围
- **THEN** useVirtualData 的 visibleRange 同步更新
- **AND** 内存中保留的行数据与 DOM 渲染范围匹配
