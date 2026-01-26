# Requirements: SQL Pro Design Refresh

**Defined:** 2026-01-26
**Core Value:** 视觉和交互体验达到 Linear/Raycast 级别的精致度

## v1 Requirements

### 设计基础 (Foundation)

- [ ] **FOUND-01**: 设计系统切换为深色模式优先 (dark-first CSS variables)
- [ ] **FOUND-02**: 色彩系统迁移为 OKLCH 格式，使用冷色 Slate 中性色
- [ ] **FOUND-03**: 橙色强调色调整为适合深色背景的亮度
- [ ] **FOUND-04**: 圆角系统从 20px+ 缩减到 8-12px
- [ ] **FOUND-05**: 边框改为微妙透明风格 (6-10% opacity)
- [ ] **FOUND-06**: 阴影系统更新为深色模式适配的微妙阴影

### 交互系统 (Interaction)

- [ ] **INTR-01**: 命令面板 (Cmd+K) 样式升级为 Linear 风格
- [ ] **INTR-02**: 命令面板支持上下文命令 (根据当前视图变化)
- [ ] **INTR-03**: 所有菜单项和操作旁显示对应快捷键
- [ ] **INTR-04**: 全局过渡动效标准化为 100-200ms + ease-out
- [ ] **INTR-05**: 键盘焦点环仅在键盘导航时显示 (:focus-visible)

### 视觉效果 (Visual)

- [ ] **VISL-01**: 文字层次系统更新 (primary/secondary/muted 三级)
- [ ] **VISL-02**: 按钮组件视觉精细化 (减少装饰，更简洁)
- [ ] **VISL-03**: 输入框/表单组件视觉精细化
- [ ] **VISL-04**: 对话框/弹窗增加毛玻璃效果 (backdrop-filter: blur)
- [ ] **VISL-05**: Hover 状态微交互动效优化 (微妙背景变化，无 lift)
- [ ] **VISL-06**: Loading/Skeleton 状态简化为极简风格
- [ ] **VISL-07**: 表格视图样式适配深色模式高对比度

### App 导航 (Navigation)

- [ ] **NAVI-01**: 侧边栏视觉简化 (减少嵌套层级感)
- [ ] **NAVI-02**: 标签栏改为 pill 风格 (背景高亮而非下划线)
- [ ] **NAVI-03**: Activity Bar 精简为极简图标风格

### Monaco 编辑器 (Editor)

- [ ] **EDIT-01**: SQL 编辑器主题与新设计系统协调
- [ ] **EDIT-02**: 编辑器光标和选择色适配新强调色

### 官网 (Website)

- [ ] **WEB-01**: Hero 区域简化，突出产品截图
- [ ] **WEB-02**: 移除冗余营销文案，精简为核心价值
- [ ] **WEB-03**: 产品演示视频/动效嵌入
- [ ] **WEB-04**: Features 区域改为 Bento grid 布局
- [ ] **WEB-05**: 添加滚动进入动效 (fade-up on scroll)
- [ ] **WEB-06**: 下载区域简化
- [ ] **WEB-07**: Footer 精简为必要链接
- [ ] **WEB-08**: 整体配色与 App 深色主题统一

## v2 Requirements

### 交互增强

- **INTR-V2-01**: Vim 风格列表导航 (j/k)
- **INTR-V2-02**: 命令历史/最近使用
- **INTR-V2-03**: 快捷键学习提示

### 视觉增强

- **VISL-V2-01**: 渐变文字标题效果
- **VISL-V2-02**: 噪点纹理叠加
- **VISL-V2-03**: 主题变体 (Glass 等)
- **VISL-V2-04**: 性能感知动效 (高端硬件增强)

### 官网增强

- **WEB-V2-01**: 交互式产品演示
- **WEB-V2-02**: 深色/浅色主题切换

## Out of Scope

| Feature             | Reason                          |
| ------------------- | ------------------------------- |
| 移动端适配          | 桌面应用优先，移动端后续考虑    |
| 新增核心功能        | 本次专注设计升级，不增加新功能  |
| 完整设计系统文档    | 实现优先，文档后补              |
| Light mode 精细调优 | Dark-first，Light mode 可用即可 |

## Traceability

| Requirement | Phase   | Status  |
| ----------- | ------- | ------- |
| FOUND-01    | Phase 1 | Pending |
| FOUND-02    | Phase 1 | Pending |
| FOUND-03    | Phase 1 | Pending |
| FOUND-04    | Phase 1 | Pending |
| FOUND-05    | Phase 1 | Pending |
| FOUND-06    | Phase 1 | Pending |
| VISL-01     | Phase 2 | Pending |
| VISL-02     | Phase 2 | Pending |
| VISL-03     | Phase 2 | Pending |
| NAVI-01     | Phase 3 | Pending |
| NAVI-02     | Phase 3 | Pending |
| NAVI-03     | Phase 3 | Pending |
| INTR-01     | Phase 4 | Pending |
| INTR-02     | Phase 4 | Pending |
| INTR-03     | Phase 4 | Pending |
| INTR-04     | Phase 4 | Pending |
| INTR-05     | Phase 4 | Pending |
| VISL-04     | Phase 5 | Pending |
| VISL-05     | Phase 5 | Pending |
| VISL-06     | Phase 5 | Pending |
| VISL-07     | Phase 5 | Pending |
| EDIT-01     | Phase 6 | Pending |
| EDIT-02     | Phase 6 | Pending |
| WEB-01      | Phase 7 | Pending |
| WEB-02      | Phase 7 | Pending |
| WEB-03      | Phase 7 | Pending |
| WEB-04      | Phase 7 | Pending |
| WEB-05      | Phase 7 | Pending |
| WEB-06      | Phase 7 | Pending |
| WEB-07      | Phase 7 | Pending |
| WEB-08      | Phase 7 | Pending |

**Coverage:**

- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0 ✓

---

_Requirements defined: 2026-01-26_
_Last updated: 2026-01-26 after initial definition_
