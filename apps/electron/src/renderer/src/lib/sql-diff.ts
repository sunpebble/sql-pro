import type { TableDiff } from '@shared/types';
import { createTwoFilesPatch } from 'diff';

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
