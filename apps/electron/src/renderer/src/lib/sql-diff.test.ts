import type { TableDiff, TableInfo } from '@shared/types';
import { describe, expect, it } from 'vitest';
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
  } as unknown as TableInfo;
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
