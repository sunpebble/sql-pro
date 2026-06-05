import { PatchDiff } from '@pierre/diffs/react';
import { getDiffsTheme } from '@/lib/pierre-diffs-theme';
import { useThemeStore } from '@/stores/theme-store';

interface SqlDiffViewProps {
  /** unified diff patch（由 lib/sql-diff 生成）。 */
  patch: string;
  className?: string;
}

/**
 * 用 @pierre/diffs 渲染 SQL 文本 diff,主题跟随 app 明暗。
 * 试点阶段走主线程渲染(disableWorkerPool),不依赖 WorkerPoolContextProvider。
 */
export function SqlDiffView({ patch, className }: SqlDiffViewProps) {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  return (
    <PatchDiff
      patch={patch}
      options={{ theme: getDiffsTheme(resolvedTheme) }}
      className={className}
      disableWorkerPool
    />
  );
}
