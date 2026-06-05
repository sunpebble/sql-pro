import type { ConnectionProfile, ProfileFolder } from '@shared/types';
import { describe, expect, it } from 'vitest';
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
