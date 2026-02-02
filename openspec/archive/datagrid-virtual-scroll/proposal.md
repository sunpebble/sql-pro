## Why

DataTable 组件（TanStack Table 版本）当前渲染所有行，在大数据量（10000+ 行）场景下存在性能问题。虽然已有 `useVirtualData` hook 做内存管理，但 DOM 层面仍然渲染全部行，导致：

1. 初次渲染耗时长
2. 滚动时 DOM 节点过多影响流畅度
3. 与 `DataGrid.tsx`/`EditableDataGrid.tsx` 的虚拟化实现不一致

## What Changes

- 为 DataTable 组件集成 `@tanstack/react-virtual` 实现行虚拟化
- 仅渲染可视区域内的行 + 缓冲区
- 保持现有编辑、选择、拖拽等功能正常工作
- 与现有 `useVirtualData` hook 配合，实现完整的虚拟滚动方案

## Capabilities

### New Capabilities

- `datatable-row-virtualization`: DataTable 行虚拟化渲染，仅渲染可视区域行

### Modified Capabilities

（无需修改现有 spec，这是纯实现优化）

## Impact

**受影响代码：**

- `apps/electron/src/renderer/src/components/data-table/DataTable.tsx`
- `apps/electron/src/renderer/src/components/data-table/TableBody.tsx`

**依赖：**

- `@tanstack/react-virtual`（已在项目中）

**风险：**

- 需要确保编辑态单元格在滚动时正确处理
- 需要确保拖拽选择在虚拟化环境下正常工作
- 需要处理 auto-focus 新行时的滚动定位
