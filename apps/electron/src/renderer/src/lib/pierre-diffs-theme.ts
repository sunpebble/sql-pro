import type { DiffsThemeNames } from '@pierre/diffs/react';

/** 把 app 的已解析明暗主题映射到 Pierre 内置主题名。 */
export function getDiffsTheme(
  resolvedTheme: 'light' | 'dark'
): DiffsThemeNames {
  return resolvedTheme === 'dark' ? 'pierre-dark' : 'pierre-light';
}
