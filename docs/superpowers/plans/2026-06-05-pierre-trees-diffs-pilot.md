# Pierre trees/diffs 集成(阶段 0 + 试点)Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 引入 `@pierre/diffs` 给 schema 对比新增 SQL 文本 diff 视图,并用 `@pierre/trees` 试点替换 FolderTree,验证 beta 库契合度后再决定推广。

**Architecture:** diff 侧做加法(jsdiff 生成 unified patch → `<PatchDiff>` 渲染,与结构化视图并存切换);tree 侧做减法(`@pierre/trees` 的 path-first `FileTree` 接管展开/搜索/拖拽状态)。两侧共享主题映射,diff 计算经 `WorkerPoolContextProvider` 走 worker。

**Tech Stack:** React 19、Zustand、vitest + happy-dom、`@pierre/diffs@1.2.7`、`@pierre/trees@1.0.0-beta.4`、`diff`(jsdiff)。

**Scope:** 仅阶段 0(基础设施)+ 阶段 1(FolderTree 试点、schema SQL diff 试点)。阶段 2(Sidebar / QueryPlanNode / MigrationPreview / DataDiffPanel)待试点 go/no-go 后另立计划。详见 spec:`docs/superpowers/specs/2026-06-05-pierre-trees-diffs-refactor-design.md`(尤其 §10 API 校准补遗)。

**前置说明:**

- `@pierre/trees`、`@pierre/diffs` 已安装在 `apps/electron/package.json` dependencies。
- 运行单测:`pnpm --filter sqlpro-app exec vitest run <相对 apps/electron 的路径>`
- typecheck:`nx run sqlpro-app:typecheck`;lint:`nx run sqlpro-app:lint`
- 所有 renderer 源码根:`apps/electron/src/renderer/src/`(下文路径均相对仓库根)

---

## 阶段 0:基础设施

### Task 1:新增 jsdiff 依赖

**Files:**

- Modify: `apps/electron/package.json`(dependencies)

- [ ] **Step 1: 安装 diff + 类型**

Run:

```bash
pnpm --filter sqlpro-app add diff && pnpm --filter sqlpro-app add -D @types/diff
```

Expected: `apps/electron/package.json` 的 dependencies 出现 `diff`,devDependencies 出现 `@types/diff`。

- [ ] **Step 2: 验证已写入**

Run: `grep -E '"diff"|@types/diff' apps/electron/package.json`
Expected: 两行均有输出。

- [ ] **Step 3: Commit**

```bash
git add apps/electron/package.json pnpm-lock.yaml
git commit -m "build: add jsdiff for pierre diffs patch generation"
```

---

### Task 2:Pierre diff 主题映射工具(纯函数,TDD)

**Files:**

- Create: `apps/electron/src/renderer/src/lib/pierre-diffs-theme.ts`
- Test: `apps/electron/src/renderer/src/lib/pierre-diffs-theme.test.ts`

- [ ] **Step 1: 写失败测试**

`apps/electron/src/renderer/src/lib/pierre-diffs-theme.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getDiffsTheme } from './pierre-diffs-theme';

describe('getDiffsTheme', () => {
  it('maps dark to pierre-dark', () => {
    expect(getDiffsTheme('dark')).toBe('pierre-dark');
  });

  it('maps light to pierre-light', () => {
    expect(getDiffsTheme('light')).toBe('pierre-light');
  });
});
```

- [ ] **Step 2: 运行,确认失败**

Run: `pnpm --filter sqlpro-app exec vitest run src/renderer/src/lib/pierre-diffs-theme.test.ts`
Expected: FAIL —— 无法解析 `./pierre-diffs-theme`。

- [ ] **Step 3: 写最小实现**

`apps/electron/src/renderer/src/lib/pierre-diffs-theme.ts`:

```ts
import type { DiffsThemeNames } from '@pierre/diffs/react';

/** 把 app 的已解析明暗主题映射到 Pierre 内置主题名。 */
export function getDiffsTheme(
  resolvedTheme: 'light' | 'dark'
): DiffsThemeNames {
  return resolvedTheme === 'dark' ? 'pierre-dark' : 'pierre-light';
}
```

- [ ] **Step 4: 运行,确认通过**

Run: `pnpm --filter sqlpro-app exec vitest run src/renderer/src/lib/pierre-diffs-theme.test.ts`
Expected: PASS（2 个用例）。

- [ ] **Step 5: Commit**

```bash
git add apps/electron/src/renderer/src/lib/pierre-diffs-theme.ts apps/electron/src/renderer/src/lib/pierre-diffs-theme.test.ts
git commit -m "feat: add pierre diffs theme mapping util"
```

---

### Task 3:挂载 WorkerPoolContextProvider

**Files:**

- Modify: `apps/electron/src/renderer/src/App.tsx`(provider 链,约 270-296)

- [ ] **Step 1: 加 import**

在 `App.tsx` 顶部 import 区新增:

```ts
import { WorkerPoolContextProvider } from '@pierre/diffs/react';
```

- [ ] **Step 2: 包裹子树**

把 `App.tsx` return 中 `<TooltipProvider>` 的子树用 `<WorkerPoolContextProvider>` 包裹(保留其余结构不变),目标结构:

```tsx
<TooltipProvider>
  <WorkerPoolContextProvider>
    <RouterProvider router={router} />
    <SqlLogPanel />
    {/* ...其余原有 dialog/popover 保持不变... */}
  </WorkerPoolContextProvider>
</TooltipProvider>
```

- [ ] **Step 3: typecheck**

Run: `nx run sqlpro-app:typecheck`
Expected: 通过,无类型错误。

- [ ] **Step 4: smoke 验证 worker 在 Electron renderer 可用**

Run: `pnpm dev:mock`(或 `nx run sqlpro-app:dev:mock`),应用启动后打开任意视图,确认控制台**无** worker 初始化报错(如 `Failed to construct 'Worker'`)。

- 若报 worker 加载失败:在后续 `SqlDiffView`(Task 5)给 `<PatchDiff>` 传 `disableWorkerPool` 作为回退,并在本计划「风险」一节记录。

- [ ] **Step 5: Commit**

```bash
git add apps/electron/src/renderer/src/App.tsx
git commit -m "feat: mount pierre diffs worker pool provider"
```

---

## 阶段 1A:Diff 试点 —— schema SQL diff 视图

### Task 4:SQL patch 生成工具(纯函数,TDD)

**Files:**

- Create: `apps/electron/src/renderer/src/lib/sql-diff.ts`
- Test: `apps/electron/src/renderer/src/lib/sql-diff.test.ts`

`TableDiff` / `TableInfo` 来自 `@/shared/types`:`TableInfo.sql` 为 CREATE 语句;`TableDiff.source`/`TableDiff.target` 为 `TableInfo | null`。

- [ ] **Step 1: 写失败测试**

`apps/electron/src/renderer/src/lib/sql-diff.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { TableDiff, TableInfo } from '@/shared/types';
import { buildSchemaPatch, buildTablePatch } from './sql-diff';

function tableInfo(sql: string): TableInfo {
  return {
    name: 't',
    schema: 'main',
    columns: [],
    primaryKey: [],
    foreignKeys: [],
    indexes: [],
    triggers: [],
    sql,
  } as TableInfo;
}

function diff(partial: Partial<TableDiff>): TableDiff {
  return {
    name: 'users',
    schema: 'main',
    diffType: 'modified',
    source: null,
    target: null,
    ...partial,
  } as TableDiff;
}

describe('buildTablePatch', () => {
  it('emits a unified patch with both side contents for a modified table', () => {
    const patch = buildTablePatch(
      diff({
        source: tableInfo('CREATE TABLE users (id INT);'),
        target: tableInfo('CREATE TABLE users (id INT, name TEXT);'),
      })
    );
    expect(patch).toContain('main.users.sql');
    expect(patch).toContain('-CREATE TABLE users (id INT);');
    expect(patch).toContain('+CREATE TABLE users (id INT, name TEXT);');
  });

  it('treats a null source (added table) as empty before-side', () => {
    const patch = buildTablePatch(
      diff({
        diffType: 'added',
        source: null,
        target: tableInfo('CREATE TABLE a (id INT);'),
      })
    );
    expect(patch).toContain('+CREATE TABLE a (id INT);');
  });
});

describe('buildSchemaPatch', () => {
  it('skips tables whose source and target SQL are identical', () => {
    const same = tableInfo('CREATE TABLE x (id INT);');
    const patch = buildSchemaPatch([
      diff({ name: 'x', diffType: 'unchanged', source: same, target: same }),
    ]);
    expect(patch).toBe('');
  });

  it('concatenates patches for differing tables', () => {
    const patch = buildSchemaPatch([
      diff({ name: 'a', source: tableInfo('a1'), target: tableInfo('a2') }),
      diff({
        name: 'b',
        diffType: 'unchanged',
        source: tableInfo('b'),
        target: tableInfo('b'),
      }),
    ]);
    expect(patch).toContain('main.a.sql');
    expect(patch).not.toContain('main.b.sql');
  });
});
```

- [ ] **Step 2: 运行,确认失败**

Run: `pnpm --filter sqlpro-app exec vitest run src/renderer/src/lib/sql-diff.test.ts`
Expected: FAIL —— 无法解析 `./sql-diff`。

- [ ] **Step 3: 写实现**

`apps/electron/src/renderer/src/lib/sql-diff.ts`:

```ts
import { createTwoFilesPatch } from 'diff';
import type { TableDiff } from '@/shared/types';

function tableSql(side: TableDiff['source']): string {
  return side?.sql ?? '';
}

function patchName(tableDiff: TableDiff): string {
  return `${tableDiff.schema}.${tableDiff.name}.sql`;
}

/** 为单个表生成 source→target 的 CREATE SQL unified diff。 */
export function buildTablePatch(tableDiff: TableDiff): string {
  const name = patchName(tableDiff);
  return createTwoFilesPatch(
    name,
    name,
    tableSql(tableDiff.source),
    tableSql(tableDiff.target)
  );
}

/** 拼接所有「SQL 有变化」的表的 patch;无变化的表跳过。 */
export function buildSchemaPatch(tableDiffs: TableDiff[]): string {
  return tableDiffs
    .filter((d) => tableSql(d.source) !== tableSql(d.target))
    .map(buildTablePatch)
    .join('\n');
}
```

- [ ] **Step 4: 运行,确认通过**

Run: `pnpm --filter sqlpro-app exec vitest run src/renderer/src/lib/sql-diff.test.ts`
Expected: PASS（4 个用例）。

- [ ] **Step 5: Commit**

```bash
git add apps/electron/src/renderer/src/lib/sql-diff.ts apps/electron/src/renderer/src/lib/sql-diff.test.ts
git commit -m "feat: add schema SQL unified patch builder"
```

---

### Task 5:SqlDiffView 组件

**Files:**

- Create: `apps/electron/src/renderer/src/components/diff/SqlDiffView.tsx`

`theme-store` 暴露 `resolvedTheme: 'light' | 'dark'`(`stores/theme-store.ts`)。

- [ ] **Step 1: 写组件**

`apps/electron/src/renderer/src/components/diff/SqlDiffView.tsx`:

```tsx
import { PatchDiff } from '@pierre/diffs/react';
import { getDiffsTheme } from '@/lib/pierre-diffs-theme';
import { useThemeStore } from '@/stores/theme-store';

interface SqlDiffViewProps {
  /** unified diff patch（由 lib/sql-diff 生成）。 */
  patch: string;
  className?: string;
}

/** 用 @pierre/diffs 渲染 SQL 文本 diff,主题跟随 app 明暗。 */
export function SqlDiffView({ patch, className }: SqlDiffViewProps) {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  return (
    <PatchDiff
      patch={patch}
      options={{ theme: getDiffsTheme(resolvedTheme) }}
      className={className}
    />
  );
}
```

- [ ] **Step 2: typecheck**

Run: `nx run sqlpro-app:typecheck`
Expected: 通过。若 `options` 不接受 `theme` 字段,读 `node_modules/@pierre/diffs/dist/components/FileDiff.d.ts` 的 `FileDiffOptions` 与 `dist/types.d.ts:287-310` 的 `BaseDiffOptions` 确认 theme 字段真实名称后修正。

- [ ] **Step 3: Commit**

```bash
git add apps/electron/src/renderer/src/components/diff/SqlDiffView.tsx
git commit -m "feat: add SqlDiffView wrapping pierre PatchDiff"
```

---

### Task 6:schema-comparison-store 新增 viewMode(TDD)

**Files:**

- Modify: `apps/electron/src/renderer/src/stores/schema-comparison-store.ts`
- Test: `apps/electron/src/renderer/src/stores/schema-comparison-store.test.ts`(若不存在则新建)

- [ ] **Step 1: 写失败测试**

新增/追加 `apps/electron/src/renderer/src/stores/schema-comparison-store.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { useSchemaComparisonStore } from './schema-comparison-store';

describe('schema-comparison-store viewMode', () => {
  beforeEach(() => {
    useSchemaComparisonStore.setState({ viewMode: 'structured' });
  });

  it('defaults to structured', () => {
    expect(useSchemaComparisonStore.getState().viewMode).toBe('structured');
  });

  it('setViewMode switches to sql', () => {
    useSchemaComparisonStore.getState().setViewMode('sql');
    expect(useSchemaComparisonStore.getState().viewMode).toBe('sql');
  });
});
```

- [ ] **Step 2: 运行,确认失败**

Run: `pnpm --filter sqlpro-app exec vitest run src/renderer/src/stores/schema-comparison-store.test.ts`
Expected: FAIL —— `viewMode` / `setViewMode` 不存在(类型或运行时)。

- [ ] **Step 3: 在 store 中加 viewMode**

在 `schema-comparison-store.ts` 的 state interface 加:

```ts
  viewMode: 'structured' | 'sql';
  setViewMode: (mode: 'structured' | 'sql') => void;
```

在 `create(...)` 初始 state 加 `viewMode: 'structured',`;在 actions 区加:

```ts
  setViewMode: (mode) => set({ viewMode: mode }),
```

- [ ] **Step 4: 运行,确认通过**

Run: `pnpm --filter sqlpro-app exec vitest run src/renderer/src/stores/schema-comparison-store.test.ts`
Expected: PASS（2 个用例）。

- [ ] **Step 5: Commit**

```bash
git add apps/electron/src/renderer/src/stores/schema-comparison-store.ts apps/electron/src/renderer/src/stores/schema-comparison-store.test.ts
git commit -m "feat: add viewMode state to schema comparison store"
```

---

### Task 7:SchemaDiffView 接入 [结构化 | SQL Diff] 切换

**Files:**

- Modify: `apps/electron/src/renderer/src/components/schema-comparison/SchemaDiffView.tsx`

现状(参考):该组件用 `filteredTables`(`useMemo` 过滤 `comparisonResult.tableDiffs`)遍历渲染 `TableDiffCard`,从 `useSchemaComparisonStore` 取 `filters` / `expandedSections` / `toggleTableExpanded`。

- [ ] **Step 1: 引入依赖与状态**

在 `SchemaDiffView.tsx` 顶部 import:

```ts
import { buildSchemaPatch } from '@/lib/sql-diff';
import { SqlDiffView } from '@/components/diff/SqlDiffView';
```

在组件内从 store 取 `viewMode` / `setViewMode`:

```ts
const {
  filters,
  expandedSections,
  toggleTableExpanded,
  viewMode,
  setViewMode,
} = useSchemaComparisonStore();
```

- [ ] **Step 2: 加切换工具条 + 条件渲染**

在 `return` 的 `ScrollArea` 之前加一个切换条,并按 `viewMode` 分支渲染(结构化分支保持原有 `filteredTables.map(...)` 不变):

```tsx
<div className="flex items-center gap-2 px-4 pt-3">
  <button
    type="button"
    onClick={() => setViewMode('structured')}
    data-active={viewMode === 'structured'}
    className="rounded px-2 py-1 text-sm data-[active=true]:bg-accent"
  >
    {t('schemaComparison.viewStructured', 'Structured')}
  </button>
  <button
    type="button"
    onClick={() => setViewMode('sql')}
    data-active={viewMode === 'sql'}
    className="rounded px-2 py-1 text-sm data-[active=true]:bg-accent"
  >
    {t('schemaComparison.viewSql', 'SQL Diff')}
  </button>
</div>

{viewMode === 'sql' ? (
  <ScrollArea className={cn('h-full', className)}>
    <div className="p-4">
      <SqlDiffView patch={buildSchemaPatch(filteredTables)} />
    </div>
  </ScrollArea>
) : (
  /* 原有结构化渲染:ScrollArea + filteredTables.map(TableDiffCard) */
)}
```

- [ ] **Step 3: typecheck + lint**

Run: `nx run sqlpro-app:typecheck && nx run sqlpro-app:lint`
Expected: 通过。

- [ ] **Step 4: smoke 验证**

Run: `pnpm dev:mock`,进入 schema 对比,运行一次对比 → 点击「SQL Diff」→ 应看到 Pierre 渲染的高亮 unified diff;切回「Structured」恢复原视图;切换 app 明暗主题,diff 配色随之变化。

- [ ] **Step 5: Commit**

```bash
git add apps/electron/src/renderer/src/components/schema-comparison/SchemaDiffView.tsx
git commit -m "feat: add SQL diff view toggle to schema comparison"
```

---

## 阶段 1B:Tree 试点 —— FolderTree

> **注意(契合度风险):** `@pierre/trees` 是 path-first「成品文件树」,其内置交互未必覆盖 FolderTree 的「双击连接」「空文件夹显示」「profile 行 badge」。Task 8(纯函数)确定性高;Task 9 含 **spike + go/no-go 决策**:用已确认 API 搭建,验证未确认交互,据结果决定是否推广到 Sidebar。

### Task 8:folder→path 映射工具(纯函数,TDD)

**Files:**

- Create: `apps/electron/src/renderer/src/lib/folder-tree-paths.ts`
- Test: `apps/electron/src/renderer/src/lib/folder-tree-paths.test.ts`

类型:`ProfileFolder { id; name; parentId?; createdAt; expanded? }`、`ConnectionProfile { id; displayName; folderId?; ... }`(`@/shared/types`)。

- [ ] **Step 1: 写失败测试**

`apps/electron/src/renderer/src/lib/folder-tree-paths.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { ConnectionProfile, ProfileFolder } from '@/shared/types';
import { buildFolderTreePaths } from './folder-tree-paths';

function folder(id: string, name: string, parentId?: string): ProfileFolder {
  return { id, name, parentId, createdAt: '2026-01-01' };
}
function profile(
  id: string,
  displayName: string,
  folderId?: string
): ConnectionProfile {
  return { id, displayName, folderId } as ConnectionProfile;
}

describe('buildFolderTreePaths', () => {
  it('nests folders by parentId and profiles by folderId', () => {
    const r = buildFolderTreePaths(
      [folder('f1', 'AWS'), folder('f2', 'Prod', 'f1')],
      [profile('p1', 'prod-main', 'f2'), profile('p2', 'scratch')]
    );
    expect(r.pathById.get('f2')).toBe('AWS/Prod');
    expect(r.pathById.get('p1')).toBe('AWS/Prod/prod-main');
    expect(r.pathById.get('p2')).toBe('scratch');
    expect(r.byPath.get('AWS/Prod/prod-main')).toEqual({
      kind: 'profile',
      id: 'p1',
    });
  });

  it('dedupes same-level duplicate names', () => {
    const r = buildFolderTreePaths(
      [folder('f1', 'Dup'), folder('f2', 'Dup')],
      []
    );
    const paths = [r.pathById.get('f1'), r.pathById.get('f2')].sort();
    expect(paths).toEqual(['Dup', 'Dup (2)']);
  });

  it('escapes slashes inside a name segment', () => {
    const r = buildFolderTreePaths([], [profile('p1', 'a/b')]);
    expect(r.pathById.get('p1')).toBe('a∕b');
  });
});
```

- [ ] **Step 2: 运行,确认失败**

Run: `pnpm --filter sqlpro-app exec vitest run src/renderer/src/lib/folder-tree-paths.test.ts`
Expected: FAIL —— 无法解析 `./folder-tree-paths`。

- [ ] **Step 3: 写实现**

`apps/electron/src/renderer/src/lib/folder-tree-paths.ts`:

```ts
import type { ConnectionProfile, ProfileFolder } from '@/shared/types';

const DIVISION_SLASH = '∕'; // 视觉近似 '/',避免破坏路径分隔

export interface FolderTreeEntity {
  kind: 'folder' | 'profile';
  id: string;
}

export interface FolderTreePaths {
  paths: string[];
  byPath: Map<string, FolderTreeEntity>;
  pathById: Map<string, string>;
}

function safeSegment(name: string): string {
  return name.replaceAll('/', DIVISION_SLASH);
}

function dedupe(base: string, used: Set<string>): string {
  let candidate = base;
  let n = 2;
  while (used.has(candidate)) {
    candidate = `${base} (${n})`;
    n += 1;
  }
  used.add(candidate);
  return candidate;
}

/** 把 folder/profile 列表编码成 @pierre/trees 的 path-first 输入。 */
export function buildFolderTreePaths(
  folders: ProfileFolder[],
  profiles: ConnectionProfile[]
): FolderTreePaths {
  const byPath = new Map<string, FolderTreeEntity>();
  const pathById = new Map<string, string>();
  const folderPath = new Map<string, string>();
  const usedByParent = new Map<string, Set<string>>();

  const usedFor = (parentPath: string): Set<string> => {
    let s = usedByParent.get(parentPath);
    if (!s) {
      s = new Set();
      usedByParent.set(parentPath, s);
    }
    return s;
  };

  const childrenByParent = new Map<string | undefined, ProfileFolder[]>();
  for (const f of folders) {
    const arr = childrenByParent.get(f.parentId) ?? [];
    arr.push(f);
    childrenByParent.set(f.parentId, arr);
  }

  const walk = (parentId: string | undefined, parentPath: string): void => {
    for (const f of childrenByParent.get(parentId) ?? []) {
      const seg = dedupe(safeSegment(f.name), usedFor(parentPath));
      const full = parentPath ? `${parentPath}/${seg}` : seg;
      folderPath.set(f.id, full);
      byPath.set(full, { kind: 'folder', id: f.id });
      pathById.set(f.id, full);
      walk(f.id, full);
    }
  };
  walk(undefined, '');

  for (const p of profiles) {
    const parentPath = p.folderId ? (folderPath.get(p.folderId) ?? '') : '';
    const seg = dedupe(safeSegment(p.displayName), usedFor(parentPath));
    const full = parentPath ? `${parentPath}/${seg}` : seg;
    byPath.set(full, { kind: 'profile', id: p.id });
    pathById.set(p.id, full);
  }

  return { paths: Array.from(byPath.keys()), byPath, pathById };
}
```

- [ ] **Step 4: 运行,确认通过**

Run: `pnpm --filter sqlpro-app exec vitest run src/renderer/src/lib/folder-tree-paths.test.ts`
Expected: PASS（3 个用例）。

- [ ] **Step 5: Commit**

```bash
git add apps/electron/src/renderer/src/lib/folder-tree-paths.ts apps/electron/src/renderer/src/lib/folder-tree-paths.test.ts
git commit -m "feat: add folder tree path encoder for pierre trees"
```

---

### Task 9:FolderTreeView spike + go/no-go 决策

**Files:**

- Create: `apps/electron/src/renderer/src/components/connection-profiles/FolderTreeView.tsx`(新组件,**先与现有 FolderTree 并存**,验证通过再替换 ProfileManager 的引用)

**已确认可用的 API**(`@pierre/trees/react`,见 spec §10.1):`useFileTree(options)` → `{ model }`;`<FileTree model renderContextMenu />`;`options.paths`、`initialExpansion`、`initialSelectedPaths`、`onSelectionChange`、`dragAndDrop:{canDrag,canDrop,onDropComplete}`、`renderRowDecoration`、`icons`、`unsafeCSS`。

- [ ] **Step 1: 搭建最小渲染**

`FolderTreeView.tsx` 用 `buildFolderTreePaths(folders, profiles)` 得到 `{ paths, byPath, pathById }`,传入 `useFileTree({ paths, initialExpansion: 'open' })`,渲染 `<FileTree model={model} />`。props 复用现有 `FolderTreeProps`(从 `./FolderTree` 导出的 interface)。

```tsx
import { FileTree, useFileTree } from '@pierre/trees/react';
import { buildFolderTreePaths } from '@/lib/folder-tree-paths';
import type { FolderTreeProps } from './FolderTree';

export function FolderTreeView(props: FolderTreeProps) {
  const { folders, profiles } = props;
  const { paths, byPath, pathById } = buildFolderTreePaths(folders, profiles);
  const { model } = useFileTree({ paths, initialExpansion: 'open' });
  return <FileTree model={model} />;
}
```

typecheck:`nx run sqlpro-app:typecheck`。若 `useFileTree` 必填字段缺失,读 `node_modules/@pierre/trees/dist/model/publicTypes.d.ts` 的 `FileTreeOptions` 补齐。

- [ ] **Step 2: 接 selection → onSelectProfile / onConnectProfile**

给 `useFileTree` 加 `initialSelectedPaths`(由 `props.selectedProfileId` 经 `pathById` 反查)与 `onSelectionChange`:在回调里用 `byPath` 反查命中的 entity,`kind==='profile'` 时调用 `props.onSelectProfile(id)`。
**验证未确认点**:`@pierre/trees` 是否有「双击/激活」回调用于 `onConnectProfile`。先读 `publicTypes.d.ts` 搜索 `activate`/`onOpen`/`dblclick`;若无,改用 `renderContextMenu` 提供「Connect」菜单项作为连接入口,并在下方决策记录此差异。

- [ ] **Step 3: 接 renderContextMenu → 现有菜单回调**

实现 `renderContextMenu={(item, ctx) => ...}`:按 `byPath.get(item.path)?.kind` 分支,folder 项给「新建子文件夹/重命名/删除」(`onCreateFolder(id)`/`onRenameFolder`/`onDeleteFolder`),profile 项给「连接/编辑/复制/删除」(`onConnectProfile`/`onEditProfile`/`onDuplicateProfile`/`onDeleteProfile`)。用项目现有菜单原子组件渲染,`ctx.close()` 关闭。

- [ ] **Step 4: 接 dragAndDrop → onDropOnFolder**

给 `useFileTree` 传 `dragAndDrop: { onDropComplete: (e) => {...} }`:从 `e.draggedPaths[0]` 经 `byPath` 取 profile id,从 `e.target.directoryPath` 经 `byPath` 取 folder id(root 时为 undefined),调用 `props.onDropOnFolder?.(profileId, folderId)`。`canDrag` 仅允许 profile 段。

- [ ] **Step 5: 临时挂载验证**

在 `ProfileManager.tsx` 把 `<FolderTree .../>` 暂时替换为 `<FolderTreeView .../>`(props 不变),`pnpm dev:mock` 跑通。

- [ ] **Step 6: go/no-go 验收清单**

逐项核对并记录结果(✅/⚠️/❌):

- [ ] 文件夹/连接层级显示正确,展开/折叠可用
- [ ] 单击选中 profile(`onSelectProfile`)
- [ ] 连接 profile 可达(双击或右键 Connect)(`onConnectProfile`)
- [ ] 右键菜单 7 项齐全且可触发
- [ ] 拖拽 profile 到文件夹(`onDropOnFolder`)
- [ ] 空文件夹能正确显示为目录(path-first 已知摩擦)
- [ ] 搜索(`useFileTreeSearch`,可选)
- [ ] 明暗主题观感可接受

- [ ] **Step 7: 决策与提交**

- **全部 ✅ 或仅次要 ⚠️** → 删除旧 `FolderTree.tsx`,`FolderTreeView` 正式接管,提交:
  ```bash
  git rm apps/electron/src/renderer/src/components/connection-profiles/FolderTree.tsx
  git add apps/electron/src/renderer/src/components/connection-profiles/FolderTreeView.tsx apps/electron/src/renderer/src/components/connection-profiles/ProfileManager.tsx
  git commit -m "feat: replace FolderTree with pierre trees FileTree"
  ```
  并在 spec §10 追加「FolderTree 试点通过,可推广 Sidebar」结论。
- **出现阻断 ❌**(如无法表达连接/空目录/必要菜单)→ 还原 `ProfileManager` 引用,保留 `FolderTreeView` 为参考,提交:
  ```bash
  git add -A && git commit -m "chore: spike pierre trees FileTree for FolderTree (blocked: <原因>)"
  ```
  并在 spec §10 记录阻断点与建议(如 tree 侧改用底层 `@headless-tree/core` 以获得完全自定义渲染,或 tree 侧暂缓)。**此时停止,向用户汇报后再决定阶段 2。**

---

## 阶段验证(每阶段结束)

按序执行:

```bash
pnpm --filter sqlpro-app exec vitest run            # 全量单测
nx run sqlpro-app:typecheck
nx run sqlpro-app:lint
nx run sqlpro-app:build                              # 受影响时
```

smoke:`pnpm dev:mock` 手测对应视图。

---

## 风险

- **worker 在 Electron renderer**:Task 3 Step 4 验证;失败则 `SqlDiffView` 加 `disableWorkerPool` 回退。
- **`@pierre/trees` 契合度**(beta + path-first 成品文件树):Task 9 go/no-go 把关;阻断则 tree 侧改 `@headless-tree/core` 或暂缓,不连累 diff 侧成果。
- **split/stacked 布局**:`PatchDiff` 默认 unified;split 待读 `BaseDiffOptions` 确认字段后增量加,不阻塞本计划。
- **`options.theme` 字段名**:Task 5 Step 2 以真实 `.d.ts` 校准。

---

## Self-Review

- **Spec 覆盖**:阶段 0(deps/theme/worker provider)= Task 1-3;§5.3 SQL diff 视图 = Task 4-7;§5.2 FolderTree 试点 = Task 8-9;§10 校准已纳入各 Task。阶段 2(Sidebar/QueryPlanNode/MigrationPreview/DataDiffPanel)按 spec「试点先行」明确延后,非遗漏。
- **占位扫描**:无 TBD;不确定项(双击连接、空目录、layout、theme 字段名)均落为「读指定 `.d.ts` 行号确认」的真实步骤,非占位。
- **类型一致**:`buildSchemaPatch`/`buildTablePatch`、`buildFolderTreePaths`→`{paths,byPath,pathById}`、store `viewMode`/`setViewMode`、`getDiffsTheme` 在各引用处签名一致。
