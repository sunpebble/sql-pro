## 1. 基础样式配置

- [x] 1.1 从 neobrutalism.dev/styling 获取 CSS 变量配置（橙色主题）
- [x] 1.2 替换 apps/website/src/index.css 为 neobrutalism CSS 变量
- [x] 1.3 替换 apps/electron/src/renderer/src/styles/globals.css 为 neobrutalism CSS 变量
- [x] 1.4 配置 Tailwind 以识别 neobrutalism CSS 变量

## 2. 共享 UI 组件更新 (packages/ui)

- [x] 2.1 更新 Button 组件为 neobrutalism 样式
- [x] 2.2 更新 Card 组件为 neobrutalism 样式
- [x] 2.3 更新 Dialog 组件为 neobrutalism 样式
- [x] 2.4 更新 Input 组件为 neobrutalism 样式
- [x] 2.5 更新 Select 组件为 neobrutalism 样式
- [x] 2.6 更新 Checkbox 组件为 neobrutalism 样式
- [x] 2.7 更新 Badge 组件为 neobrutalism 样式
- [x] 2.8 更新 Tabs 组件为 neobrutalism 样式
- [x] 2.9 更新 Table 组件为 neobrutalism 样式
- [x] 2.10 更新其他 shadcn/ui 组件为 neobrutalism 样式

## 3. Website 组件重构

- [ ] 3.1 重构 TopBar 组件
- [ ] 3.2 重构 Hero 组件
- [ ] 3.3 重构 Features 组件
- [ ] 3.4 重构 Screenshots 组件
- [ ] 3.5 重构 Pricing 组件
- [ ] 3.6 重构 Testimonials 组件
- [ ] 3.7 重构 FAQ 组件
- [ ] 3.8 重构 Download 组件
- [ ] 3.9 重构 Footer 组件
- [ ] 3.10 重构 Stats 组件
- [ ] 3.11 移除所有自定义 CSS 类，使用 Tailwind 工具类

## 4. Electron App 核心组件

- [ ] 4.1 重构 Sidebar 组件
- [ ] 4.2 重构 ActivityBar 组件
- [ ] 4.3 重构 DataTable 组件
- [ ] 4.4 重构 Dialog 相关组件 (SettingsDialog, AboutDialog 等)
- [ ] 4.5 重构 WelcomeScreen 组件
- [ ] 4.6 重构 ConnectionSelector 组件

## 5. Electron App 功能组件

- [ ] 5.1 重构 QueryView 组件
- [ ] 5.2 重构 TableView 组件
- [ ] 5.3 重构 ERDiagram 组件
- [ ] 5.4 重构 MonacoSqlEditor 相关样式
- [ ] 5.5 重构 ExportDialog 组件
- [ ] 5.6 重构 BackupRestoreDialog 组件
- [ ] 5.7 重构 SchemaComparison 相关组件
- [ ] 5.8 重构 QueryBuilder 相关组件

## 6. 主题和状态样式

- [ ] 6.1 实现暗色主题 CSS 变量
- [ ] 6.2 实现亮色主题 CSS 变量
- [ ] 6.3 验证主题切换功能正常
- [ ] 6.4 更新加载状态样式
- [ ] 6.5 更新错误状态样式
- [ ] 6.6 更新成功/警告状态样式

## 7. 验证和清理

- [ ] 7.1 测试所有页面的视觉一致性
- [ ] 7.2 测试所有组件的交互功能
- [ ] 7.3 验证无障碍功能 (键盘导航、屏幕阅读器)
- [ ] 7.4 验证响应式布局 (移动端、平板、桌面)
- [ ] 7.5 运行 Lighthouse 性能测试
- [ ] 7.6 删除未使用的自定义 CSS 文件
- [ ] 7.7 更新 AGENTS.md 设计系统文档
