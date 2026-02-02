## Why

当前 `useResizableColumns` 在列宽拖拽过程中每次鼠标移动都会调用 `setColumnWidths`，触发整个表格重渲染。在包含数万行数据的表格中，这会导致明显卡顿，影响用户体验。参考 GoNavi 的"幽灵拖拽"(Ghost Resize) 技术，可以将拖拽过程与状态更新解耦，实现 60fps 的丝滑体验。

## What Changes

- 引入"幽灵线"(Ghost Line) 组件，在拖拽期间显示一条垂直指示线
- 修改 `useResizableColumns` hook，拖拽过程中仅更新幽灵线位置（直接操作 DOM），释放鼠标时才触发状态更新
- 添加 `isResizingRef` 锁定机制，防止拖拽结束后误触发排序
- 优化 `ColumnResizeHandle` 组件，集成幽灵拖拽逻辑

## Capabilities

### New Capabilities

- `ghost-resize`: 表格列宽的幽灵拖拽优化，提升大数据量表格的交互性能

### Modified Capabilities

（无现有规格需要修改）

## Impact

- **受影响的代码**:
  - `apps/electron/src/renderer/src/hooks/useResizableColumns.ts` - 核心拖拽逻辑
  - `apps/electron/src/renderer/src/components/ColumnResizeHandle.tsx` - 拖拽手柄组件
  - `apps/electron/src/renderer/src/components/DataGrid.tsx` - 需要添加幽灵线容器
  - `apps/electron/src/renderer/src/components/EditableDataGrid.tsx` - 同上
  - `apps/electron/src/renderer/src/components/data-table/DataTable.tsx` - 同上
- **风险**: 低 - 不改变功能行为，仅优化交互性能
- **依赖**: 无外部依赖变更
