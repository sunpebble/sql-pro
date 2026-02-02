## 1. 创建幽灵线组件

- [x] 1.1 创建 `GhostResizeLine` 组件，包含样式（2px 蓝色垂直线，绝对定位）
- [x] 1.2 组件接收 `ref` 用于外部控制显示/隐藏和位置

## 2. 修改 useResizableColumns Hook

- [x] 2.1 添加 `ghostLineRef` 和 `containerRef` 参数
- [x] 2.2 重构 `handleMouseMove`：不调用 setState，改为直接更新幽灵线位置
- [x] 2.3 重构 `handleResizeStart`：显示幽灵线，记录起始位置
- [x] 2.4 重构 `handleMouseUp`：隐藏幽灵线，计算最终宽度，一次性更新状态
- [x] 2.5 添加 `isResizingRef` 锁定机制，防止拖拽后 100ms 内触发排序

## 3. 更新表格组件

- [x] 3.1 在 `DataGrid.tsx` 中添加幽灵线容器和 ref 绑定
- [x] 3.2 在 `EditableDataGrid.tsx` 中添加幽灵线容器和 ref 绑定
- [x] 3.3 在 `data-table/DataTable.tsx` 中添加幽灵线容器和 ref 绑定

## 4. 测试验证

- [x] 4.1 验证大数据量表格（10000+ 行）拖拽列宽时无卡顿
- [x] 4.2 验证双击自动适应列宽功能正常
- [x] 4.3 验证拖拽结束后不会误触发列排序
- [x] 4.4 验证最小/最大宽度限制正常工作
