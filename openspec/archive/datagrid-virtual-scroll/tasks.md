## 1. 准备工作

- [x] 1.1 阅读现有 DataGrid.tsx 虚拟化实现，理解 `useVirtualizer` 的使用方式
- [x] 1.2 分析 DataTable.tsx 和 TableBody.tsx 的当前结构，确定修改点

## 2. 核心虚拟化实现

- [x] 2.1 在 DataTable.tsx 中添加 `scrollContainerRef`，获取 ScrollArea 的滚动容器引用
- [x] 2.2 将 `scrollContainerRef` 通过 props 传递给 TableBody 组件
- [x] 2.3 在 TableBody.tsx 中添加 `useVirtualizer` hook，配置行虚拟化
- [x] 2.4 修改 TableBody 渲染逻辑，使用 `virtualizer.getVirtualItems()` 替代直接遍历 rows
- [x] 2.5 添加容器占位 div，使用 `virtualizer.getTotalSize()` 撑开高度
- [x] 2.6 为每个虚拟行添加正确的定位样式（absolute + transform）

## 3. 功能兼容性修复

- [ ] 3.1 修复编辑态：确保编辑状态在行滚动出视口后保持
- [ ] 3.2 修复拖拽选择：确保 `useDragSelection` 在虚拟化环境下正确计算行索引
- [ ] 3.3 修复键盘导航：当导航到不可见行时，调用 `virtualizer.scrollToIndex()`
- [ ] 3.4 修复新行聚焦：插入新行后自动滚动到新行位置

## 4. 与 useVirtualData 集成

- [ ] 4.1 将 virtualizer 的可视范围同步到 useVirtualData 的 `visibleRange`
- [ ] 4.2 确保内存管理与 DOM 虚拟化协同工作

## 5. 测试验证

- [ ] 5.1 验证大数据量（10000+ 行）表格滚动流畅度达到 60fps
- [ ] 5.2 验证编辑功能在虚拟化环境下正常工作
- [ ] 5.3 验证拖拽选择功能正常
- [ ] 5.4 验证键盘导航（方向键、Tab、Vim 模式）正常
- [ ] 5.5 验证新行插入后自动滚动和聚焦
- [ ] 5.6 运行类型检查确保无错误
