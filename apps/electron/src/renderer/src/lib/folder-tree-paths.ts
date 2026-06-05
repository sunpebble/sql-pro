import type { ConnectionProfile, ProfileFolder } from '@shared/types';

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
