## Context

DataTable 组件是基于 TanStack Table 构建的功能丰富的表格组件，支持编辑、选择、拖拽、分组等高级功能。当前实现渲染所有行 DOM 节点，导致大数据量下性能问题。

**现有虚拟化实现参考：**

- `DataGrid.tsx` 和 `EditableDataGrid.tsx` 已使用 `@tanstack/react-virtual` 的 `useVirtualizer` 实现行虚拟化
- `useVirtualData` hook 已存在，用于内存管理（窗口化数据），但不做 DOM 虚拟化

**当前 DataTable 架构：**

- `DataTable.tsx`：主组件，使用 TanStack Table 的 `useTableCore` hook
- `TableHeader.tsx`：表头组件，支持列调整、排序、过滤
- `TableBody.tsx`：表体组件，当前渲染所有行

## Goals / Non-Goals

**Goals:**

1. 为 DataTable 集成 `@tanstack/react-virtual` 实现行虚拟化
2. 保持所有现有功能正常工作（编辑、选择、拖拽选择、键盘导航等）
3. 与 `useVirtualData` hook 配合，实现完整的虚拟滚动 + 内存管理方案
4. 滚动性能达到 60fps

**Non-Goals:**

- 列虚拟化（复杂度高，ROI 低，大多数表格列数 < 50）
- 改变 TanStack Table 的使用方式
- 修改 `DataGrid.tsx`/`EditableDataGrid.tsx`（它们已有虚拟化）

## Decisions

### 1. 使用 `@tanstack/react-virtual` 的 `useVirtualizer`

**选择：** 使用与 DataGrid 相同的虚拟化方案

**理由：**

- 项目中已有成功案例（DataGrid.tsx）
- 与 React 18 兼容良好
- 支持动态行高（虽然我们用固定行高）
- 轻量级，无额外依赖

**备选方案：**

- react-window：功能类似但 API 不如 TanStack 灵活
- 自己实现：维护成本高

### 2. 在 TableBody 层集成虚拟化

**选择：** 修改 `TableBody.tsx`，将虚拟化逻辑放在表体层

**理由：**

- 表头不需要虚拟化（只有一行）
- 与 TanStack Table 的 row model 配合更自然
- 最小化对现有代码的改动

**结构：**

```tsx
// TableBody.tsx
const rowVirtualizer = useVirtualizer({
  count: rows.length,
  getScrollElement: () => scrollElementRef.current,
  estimateSize: () => ROW_HEIGHT,
  overscan: 10,
});
```

### 3. 滚动容器位置

**选择：** 使用 DataTable 外层的 ScrollArea 作为滚动容器

**理由：**

- DataTable 已使用 `<ScrollArea>` 包裹
- `useVirtualizer` 需要访问滚动容器来计算可视区域
- 通过 ref 传递滚动元素引用

### 4. 与 useVirtualData 的配合

**选择：** 保留 `useVirtualData` 用于内存管理，`useVirtualizer` 用于 DOM 虚拟化

**数据流：**

1. `useVirtualData` 根据可视范围维护内存中的行数据窗口
2. `useVirtualizer` 决定渲染哪些 DOM 节点
3. 两者的可视范围同步

### 5. 编辑态处理

**选择：** 编辑中的单元格滚动出视口时保留状态

**实现：**

- 编辑状态存储在 `useTableEditing` hook 中（与行无关）
- 当编辑行滚动回视口时，检查是否有 pending 编辑状态并恢复
- 这与当前行为一致，因为编辑状态本就独立于 DOM

## Risks / Trade-offs

| Risk         | Mitigation                                                    |
| ------------ | ------------------------------------------------------------- |
| 编辑态丢失   | 编辑状态存储在 hook 中，与 DOM 生命周期解耦                   |
| 拖拽选择失效 | `useDragSelection` 基于鼠标坐标计算行索引，虚拟化不影响此逻辑 |
| 键盘导航问题 | 导航到不可见行时，先调用 `scrollToIndex` 再设置焦点           |
| 新行自动聚焦 | 插入新行后使用 `scrollToIndex` 滚动到新行位置                 |
| 行高不一致   | 使用固定行高（36px），与 DataGrid 一致                        |

## Implementation Notes

**关键修改点：**

1. **DataTable.tsx**
   - 创建 `scrollContainerRef` 并传递给 ScrollArea
   - 传递 ref 给 TableBody

2. **TableBody.tsx**
   - 添加 `useVirtualizer` hook
   - 修改渲染逻辑，只渲染 `virtualRows`
   - 添加占位 div 撑开容器高度

**参考 DataGrid.tsx 实现：**

```tsx
const rowVirtualizer = useVirtualizer({
  count: rows.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 36,
  overscan: 10,
});

// Body
<div
  style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}
>
  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
    const row = rows[virtualRow.index];
    return (
      <div
        key={virtualRow.index}
        style={{
          height: `${virtualRow.size}px`,
          transform: `translateY(${virtualRow.start}px)`,
          position: 'absolute',
        }}
      >
        {/* row content */}
      </div>
    );
  })}
</div>;
```
