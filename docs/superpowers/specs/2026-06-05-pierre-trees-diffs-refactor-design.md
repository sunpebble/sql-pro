# Spec:集成 @pierre/trees 与 @pierre/diffs 重构

- **日期**:2026-06-05
- **状态**:已批准设计,待写实施计划
- **作者**:kunish + Claude
- **范围**:`apps/electron`(renderer 层)的 tree 与 diff 相关组件

---

## 1. 背景与动机

SQL Pro 当前的树状视图与 diff 视图**全部为手写实现**,未使用任何第三方 tree/diff 库。本次重构引入 Pierre Computer Company 的两个库:

- **`@pierre/diffs`**(https://diffs.com)—— 文本/代码逐行 diff 渲染库
- **`@pierre/trees`**(https://trees.software)—— 基于 headless-tree 的树视图库

目标(已与用户确认):**diff 与 tree 两侧都用这两个库重构**,首要目标**两者兼顾**——既替换手写逻辑(减法),也借此升级体验(加法)。

### 已确认的关键决策

1. **整体策略 = 方案 A「增强并存」**:tree 侧用 trees 接管,diff 侧用 diffs 做加法、结构化视图保留并存。
2. **接受引入 Shiki**:diff 视图用 Shiki 高亮,Monaco 继续管编辑器,两套高亮并存,共享主题色。
3. **试点节奏落地**:先小范围验证 beta 库,再推广。

---

## 2. 核心洞察:为什么 tree 是「减法」、diff 是「加法」

这是本设计的根基,决定了两侧采用不同策略:

- **`@pierre/trees` = 干净替换。** 它基于 headless-tree —— headless 模型只接管「树状态」(展开/折叠/选择/键盘导航/拖拽/搜索),节点渲染与右键菜单全部留给调用方。因此能直接替掉手写的 `Record<string,boolean>` / `Set` 展开状态管理,**同时保留**所有自定义渲染、context menu、vim 导航、搜索过滤。

- **`@pierre/diffs` = 增强,不是替换。** 它渲染的是**文本/代码逐行 diff**(git patch 或两份文件文本 + Shiki 高亮)。而 SQL Pro 的 `schema-comparison` 是**结构化语义 diff**(`TableDiff → ColumnDiff`,带类型变化、过滤、子对象展开)。二者不是同一种东西;强行替换会丢失过滤/展开/行内编辑等业务交互。`@pierre/diffs` 真正契合的用例是 **SQL 文本的 diff 呈现**,因此采用「新增文本 diff 视图,与结构化视图并存切换」。

---

## 3. 库 API 事实(已核实)

| 项         | `@pierre/trees`                             | `@pierre/diffs`                           |
| ---------- | ------------------------------------------- | ----------------------------------------- |
| 版本       | `1.0.0-beta.4`(**beta**)                    | `1.2.7`(稳定)                             |
| 内核       | `@headless-tree/core` + Preact,React 适配层 | `diff`(jsdiff)+ `shiki` + `@pierre/theme` |
| peerDeps   | react `^18.3.1 \|\| ^19.0.0`                | react `^18.3.1 \|\| ^19.0.0`              |
| React 入口 | `@pierre/trees/react`                       | `@pierre/diffs/react`                     |
| 其他入口   | `.`、`./web-components`、`./ssr`            | `.`、`./ssr`、`./worker`                  |

**项目兼容性**:`apps/electron` 使用 **React 19.2.4**,满足两库 peer deps。项目当前用 **Monaco**(`@monaco-editor/react`、`monaco-editor`、`monaco-vim`)做 SQL 编辑/高亮,**未使用 shiki**。

### `@pierre/trees/react` 导出

- 组件:`FileTree`
- hooks:`useFileTree`、`useFileTreeSelector`、`useFileTreeSelection`、`useFileTreeSearch`
- 类型:`FileTreeProps`、`FileTreePreloadedData`、`FileTreeSearchState`、`FileTreeSelector`、`FileTreeSelectorEquality`、`UseFileTreeResult`

### `@pierre/diffs/react` 导出

- 组件:`CodeView`、`File`、`FileDiff`、`UnresolvedFile`(合并冲突)、`MultiFileDiff`、`PatchDiff`、`Virtualizer`、`WorkerPoolContextProvider`
- hooks:`useVirtualizer`、`useWorkerPool`、`useFileDiffInstance`、`useFileInstance`、`useStableCallback`
- 类型:`CodeViewProps`/`ControlledCodeViewProps`/`UncontrolledCodeViewProps`、`DiffBasePropsReact`、`FileOptions`、`FileDiffProps`、`FileDiffMetadata`、`MultiFileDiffProps`、`PatchDiffProps`、`RenderDiffOptions`、`RenderFileOptions`、`CodeViewLayout`(split/stacked)、`DiffsThemeNames`、`BundledLanguage`/`SupportedLanguages`、`LineAnnotation`(行内注释)、`SelectedLineRange`/`SelectionPoint`(行选择)

> **精确 props 字段**:barrel `.d.ts` 仅暴露导出名,字段级签名将在阶段 0 安装后,以 `node_modules/@pierre/*/dist/react/index.d.ts` 真实声明为准校准。这是已知的实现细节校准点,非未决设计问题。

---

## 4. 现有代码盘点

### Diff 侧(`apps/electron/src/renderer/src`)

| 组件                    | 路径                                                     | 职责                               | 本轮处置                        |
| ----------------------- | -------------------------------------------------------- | ---------------------------------- | ------------------------------- |
| SchemaComparisonPanel   | `components/schema-comparison/SchemaComparisonPanel.tsx` | schema 对比主容器                  | 保留(加视图切换入口)            |
| SchemaDiffView          | `components/schema-comparison/SchemaDiffView.tsx`        | 渲染过滤后 TableDiff 列表          | 保留 + 新增 SQL Diff 视图切换   |
| TableDiffCard           | `components/schema-comparison/TableDiffCard.tsx`         | 单表结构化 diff(4 层嵌套)          | **保留**(承载过滤/展开交互)     |
| DiffFilterBar           | `components/schema-comparison/DiffFilterBar.tsx`         | 多维过滤 UI                        | 保留                            |
| MigrationPreview        | `components/schema-comparison/MigrationPreview.tsx`      | 迁移 SQL 展示                      | SQL 展示升级为 diffs            |
| DiffPreview             | `components/DiffPreview.tsx`                             | pending changes 行级 + 行内编辑    | **保留手写**(非可编辑表格场景)  |
| DataDiffPanel           | `components/data-diff/DataDiffPanel.tsx`                 | 数据行对比(详细视图为 placeholder) | 详细行对比用 diffs 文本模式实现 |
| CompareView             | `components/CompareView.tsx`                             | schema/data 对比标签入口           | 不动                            |
| schema-comparison-store | `stores/schema-comparison-store.ts`                      | 过滤/展开状态                      | 保留                            |
| data-diff-store         | `stores/data-diff-store.ts`                              | 数据对比状态                       | 保留                            |

### Tree 侧(`apps/electron/src/renderer/src`)

| 组件                          | 路径                                            | 层级                       | 本轮处置              |
| ----------------------------- | ----------------------------------------------- | -------------------------- | --------------------- |
| Sidebar                       | `components/Sidebar.tsx`                        | 3 层(schema→section→table) | 迁移到 DataTree       |
| FolderTree                    | `components/connection-profiles/FolderTree.tsx` | 2 层(folder→profile)       | 迁移到 DataTree(试点) |
| QueryOptimizerPanel(PlanNode) | `components/data-tools/QueryOptimizerPanel.tsx` | 任意深度                   | 迁移到 DataTree       |
| ExecutionPlanNode             | `components/data-tools/ExecutionPlanNode.tsx`   | xyflow 图节点              | **不动**(不是树)      |

---

## 5. 设计

### 5.1 基础设施

- 新增依赖:`@pierre/trees`、`@pierre/diffs`(自动带入 `shiki`、`@pierre/theme`);加入 pnpm catalog。
- 在 renderer 根 providers 层用 `WorkerPoolContextProvider` 包裹应用 → diff 计算走 worker,不阻塞主线程。(具体挂载点:`apps/electron/src/renderer/src` 的根 App/providers 组件,阶段 0 定位。)
- 主题:封装一个映射,把 `DiffsThemeNames` 与现有 app 明暗主题对应;Shiki 主题色对齐 Linear/Monaco 风格,通过共享 CSS 变量保证视觉一致。

### 5.2 Tree 侧统一适配层

新建目录 `apps/electron/src/renderer/src/components/tree/`:

- **`types.ts`** —— 领域无关节点类型:
  ```ts
  interface TreeNode<T = unknown> {
    id: string;
    label: string;
    kind: string; // 业务区分:'schema' | 'section' | 'table' | 'folder' | 'profile' | 'plan' ...
    children?: TreeNode<T>[];
    data?: T; // 携带业务原始对象
    isGroup?: boolean; // 逻辑分组节点(如 Sidebar 的 tables/views/triggers section)
  }
  ```
- **`useDataTree.ts`** —— 封装 `useFileTree` + `useFileTreeSearch` + selection,输入 `TreeNode<T>[]`,输出渲染所需的扁平 items、展开/选择/搜索 API。
- **`DataTree.tsx`** —— 渲染壳,基于 `FileTree`,通过 render props 暴露:
  - `renderNode(node, state)` —— 业务自定义节点渲染
  - `onContextMenu(node, event)` —— 右键菜单钩子
  - `onActivate(node)` —— 激活(点击/回车)
  - 可选:`enableDragDrop`、`onDrop`、`enableVirtualizer`

业务树只需提供三件事:**数据→`TreeNode` 映射**、**`renderNode`**、**context menu**。

#### 5.2.1 FolderTree(试点 1,2 层)

- `folders` + `profiles` → `TreeNode`(folder 为容器,profile 为叶子,`data` 携带原对象)。
- 删除手写 `expandedFolderIds: Set` 管理,改由 DataTree 接管。
- 保留:HTML5 拖拽改用 headless-tree 拖拽特性(`enableDragDrop` + `onDrop` → 现有 `onDropOnFolder`);所有 context menu 回调通过 `onContextMenu` 透传。

#### 5.2.2 Sidebar(3 层)

- 映射:`schema → TreeNode(kind:'schema')`,其下 **section 节点**(`kind:'section'`、`isGroup:true`,label 如 `Tables (42)`),section 下为 `table`/`view`/`trigger` 节点。
- 搜索:接 `useFileTreeSearch` 取代手写 `searchQuery` 过滤。
- 排序/标签过滤/pin:在「数据→节点」映射**之前**完成(pin 表与普通表分组排序后合并),不进入 tree 库。
- 保留:context menu(7+ 操作)经 `onContextMenu`;vim 导航映射到 DataTree 的 focused item;全展开/全折叠用 tree API。

#### 5.2.3 QueryOptimizerPanel 的 PlanNode(任意深度)

- `QueryPlanNode` 树 → `TreeNode`(`data` 携带 `ExecutionPlanNodeData`)。
- 天然契合;统一展开/折叠;深度大时开启 `Virtualizer`。
- 注意:`ExecutionPlanNode`(xyflow 图视图)与此独立,不动。

### 5.3 Diff 侧集成

新建 `apps/electron/src/renderer/src/components/diff/SqlDiffView.tsx`:

- 封装 `FileDiff`,props:`{ before: string, after: string, lang?: 'sql', layout?: CodeViewLayout, theme?: DiffsThemeNames }`。
- `layout` 控制 split/stacked;`theme` 跟随 app 主题。

接入点:

#### 5.3.1 schema-comparison(试点 2)

- 在 `SchemaDiffView` 顶部增加视图切换 `[结构化 | SQL Diff]`(状态存 `schema-comparison-store`)。
- **SQL Diff 模式**:取 source/target 的整库或单表 CREATE SQL(`TableInfo.sql` / 整库 schema SQL),用 `SqlDiffView` 渲染。
- **结构化模式**:`TableDiffCard` 等现有组件**全部保留**,默认视图。

#### 5.3.2 MigrationPreview

- 迁移 SQL 展示从 `components/ui/sql-highlight.tsx` 升级为 `@pierre/diffs` 的 `File`/`CodeView`(更好的高亮)。
- 复制/下载/插入编辑器等现有操作不变。

#### 5.3.3 DataDiffPanel 详细行对比(当前 placeholder)

- 用文本 diff 模式实现:按 primary key 匹配源/目标行后,将行序列化为文本,交 `FileDiff` 渲染。
- 大数据量配 `Virtualizer`。

#### 5.3.4 不纳入本轮

- **DiffPreview**(pending changes 行内编辑):保留手写——`@pierre/diffs` 不是可编辑表格。后续可借鉴 `LineAnnotation` 做只读预览(列为可选 follow-up,不在本轮范围)。

---

## 6. 迁移阶段

- **阶段 0(基础)**:装依赖 + catalog;挂载 `WorkerPoolContextProvider`;主题映射;搭建 `components/tree/`(types/useDataTree/DataTree)与 `components/diff/SqlDiffView` 骨架;以真实 `.d.ts` 校准 props。
- **阶段 1(试点)**:FolderTree → DataTree;schema-comparison 新增 SQL Diff 视图。**验证 beta 库契合度与视觉一致性**,作为是否继续的检查点。
- **阶段 2(推广)**:Sidebar、QueryOptimizerPanel PlanNode 迁移到 DataTree;MigrationPreview + DataDiffPanel 接入 diffs。

每阶段独立可验证、可回滚。

---

## 7. 风险与对策

| 风险                                      | 对策                                                                                                       |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `@pierre/trees` 仍是 beta                 | 适配层(DataTree/useDataTree)隔离,业务仅依赖自有接口,库 API 变动只改一处                                    |
| 双高亮引擎(shiki + monaco)                | 共享主题 CSS 变量;diff 用 shiki、编辑器用 monaco,职责边界清晰                                              |
| Sidebar 的 section 逻辑分组 + 多维过滤    | 在「数据→节点」映射层处理(`isGroup` 节点 + 映射前过滤排序),不污染 tree 库                                  |
| trees 基于 Preact 内核                    | 通过官方 `@pierre/trees/react` 适配入口接入,不直接触碰 Preact                                              |
| 精确 props 未知                           | 阶段 0 安装后以 `node_modules` 真实 `.d.ts` 校准                                                           |
| diff worker 在 Electron renderer 的兼容性 | 阶段 0 在 `WorkerPoolContextProvider` 挂载时验证;若不兼容则退回主线程 diff(`@pierre/diffs` 非 worker 路径) |

---

## 8. 验证策略

每阶段按序执行:

1. **targeted test**:`nx run sqlpro-app:test`(改动相关组件)
2. **typecheck**:`nx run sqlpro-app:typecheck`
3. **lint**:`nx run sqlpro-app:lint`
4. **build**:`nx run sqlpro-app:build`(受影响时)
5. **smoke**:`dev:mock` 启动,人工核对——FolderTree 展开/拖拽/右键、schema SQL Diff 切换与高亮、明暗主题切换。

完成判据:树交互(展开/折叠/选择/搜索/拖拽/vim/右键)与重构前对等;SQL Diff 视图正确渲染 split/stacked 且主题一致;无 typecheck/lint/test 回归。

---

## 9. 范围边界(YAGNI)

**本轮不做**:DiffPreview 行内编辑迁移、合并冲突 UI(`UnresolvedFile`)、行内评论(`LineAnnotation`)、Sidebar 拖拽重排、`@pierre/diffs` 多文件 diff(`MultiFileDiff`)的额外场景。这些列为潜在 follow-up,不进入本次实施计划。
