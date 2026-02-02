## Context

当前 `useResizableColumns` hook 在列宽拖拽时，每次 `mousemove` 事件都会调用 `setColumnWidths`，导致整个表格组件重渲染。对于包含大量数据的虚拟滚动表格，这会造成明显的性能问题。

GoNavi 项目采用"幽灵拖拽"技术解决了这个问题：拖拽过程中只移动一条轻量级的指示线（直接操作 DOM），释放鼠标时才触发一次状态更新。

## Goals / Non-Goals

**Goals:**

- 拖拽列宽时保持 60fps 流畅体验
- 拖拽过程中不触发 React 重渲染
- 保持现有 API 兼容性（`useResizableColumns` 接口不变）
- 保留双击自动适应列宽功能

**Non-Goals:**

- 不修改虚拟滚动逻辑
- 不改变列宽计算算法
- 不添加新的用户可见功能

## Decisions

### 1. 使用 useRef + DOM 操作实现幽灵线

**选择**: 使用 `useRef` 持有幽灵线 DOM 元素，拖拽时直接修改 `style.left`
**原因**: 绕过 React 渲染周期，实现真正的零重渲染
**替代方案**: 使用 CSS transform - 效果类似，但 left 更直观

### 2. 幽灵线作为独立组件

**选择**: 创建 `GhostResizeLine` 组件，由表格容器渲染，通过 ref 传递给 hook
**原因**:

- 幽灵线需要相对于表格容器定位
- 解耦拖拽逻辑和视觉呈现
  **替代方案**: 在 hook 内部创建 DOM 元素 - 会违反 React 的 DOM 管理原则

### 3. 延迟状态更新 + 锁定机制

**选择**:

- 拖拽结束时才调用 `setColumnWidths`
- 使用 `isResizingRef` 阻止拖拽结束后 100ms 内的点击事件（防止误触发排序）
  **原因**: 确保拖拽和排序操作互不干扰

### 4. 保持向后兼容

**选择**: 扩展 `useResizableColumns` 返回值，新增 `ghostLineRef` 和 `containerRef`
**原因**: 现有使用方只需添加两个 ref 绑定即可启用幽灵拖拽

## Risks / Trade-offs

- **[风险] 直接 DOM 操作与 React 理念不符** → 仅限于幽灵线位置更新，不影响数据流
- **[风险] 跨浏览器兼容性** → 使用标准 DOM API，无兼容问题
- **[风险] 幽灵线定位不准确** → 使用 `getBoundingClientRect` 计算相对位置

## Implementation Approach

```
拖拽开始 (mousedown)
    ↓
记录 startX, startWidth
显示幽灵线 (ghostLine.style.display = 'block')
添加全局 mousemove/mouseup 监听
    ↓
拖拽中 (mousemove)
    ↓
计算新位置: newLeft = clientX - containerRect.left
直接更新: ghostLine.style.left = newLeft + 'px'
【不触发 setState】
    ↓
拖拽结束 (mouseup)
    ↓
计算最终宽度: newWidth = startWidth + deltaX
调用 setColumnWidths (触发一次重渲染)
隐藏幽灵线
设置 100ms 锁定期
```
