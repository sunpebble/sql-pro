import type { ReactNode } from 'react';
import type { FolderTreeProps } from './FolderTree';
import { FileTree, useFileTree } from '@pierre/trees/react';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { buildFolderTreePaths } from '@/lib/folder-tree-paths';
import { cn } from '@/lib/utils';

/**
 * 试点:用 @pierre/trees 的 path-first FileTree 替换手写 FolderTree。
 *
 * 已知与旧实现的差异(见 Task 9 go/no-go):
 * - 库无「双击/激活」回调,连接只能走右键菜单的 Connect 项。
 * - 行内 badge(🔒/👁/notes/子项计数)受 renderRowDecoration 限制,此处先省略。
 * - 展开/折叠状态由库内部管理,不回写 store 的 expandedFolderIds。
 */
export function FolderTreeView(props: FolderTreeProps) {
  const { t } = useTranslation('common');
  const { folders, profiles, selectedProfileId } = props;

  const { paths, byPath, pathById } = useMemo(
    () => buildFolderTreePaths(folders, profiles),
    [folders, profiles]
  );

  // useFileTree 仅在首次调用时捕获 options,用 ref 让回调始终读到最新查找表/props。
  const ctx = useRef({ byPath, pathById, props });
  ctx.current = { byPath, pathById, props };

  const profileById = useMemo(
    () => new Map(profiles.map((p) => [p.id, p])),
    [profiles]
  );

  const initialSelectedPaths = useMemo(() => {
    const p = selectedProfileId ? pathById.get(selectedProfileId) : undefined;
    return p ? [p] : [];
  }, [selectedProfileId, pathById]);

  const { model } = useFileTree({
    paths,
    initialExpansion: 'open',
    initialSelectedPaths,
    onSelectionChange: (selectedPaths) => {
      const first = selectedPaths[0];
      if (!first) return;
      const entity = ctx.current.byPath.get(first);
      if (entity?.kind === 'profile') {
        ctx.current.props.onSelectProfile(entity.id);
      }
    },
    dragAndDrop: {
      canDrag: (dragged) =>
        dragged.every((p) => ctx.current.byPath.get(p)?.kind === 'profile'),
      onDropComplete: (event) => {
        const dragged = event.draggedPaths[0];
        const profileEntity = dragged
          ? ctx.current.byPath.get(dragged)
          : undefined;
        if (profileEntity?.kind !== 'profile') return;
        const dirPath = event.target.directoryPath;
        const folderEntity = dirPath
          ? ctx.current.byPath.get(dirPath)
          : undefined;
        const folderId =
          folderEntity?.kind === 'folder' ? folderEntity.id : undefined;
        ctx.current.props.onDropOnFolder?.(profileEntity.id, folderId);
      },
    },
  });

  const renderContextMenu = (
    item: { path: string },
    menu: { close: () => void }
  ): ReactNode => {
    const entity = byPath.get(item.path);
    if (!entity) return null;
    const run = (fn: () => void) => () => {
      fn();
      menu.close();
    };
    const itemCls =
      'flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent';

    if (entity.kind === 'folder') {
      const folderId = entity.id;
      return (
        <div className="bg-popover min-w-40 rounded-md border p-1 shadow-md">
          <button
            type="button"
            className={itemCls}
            onClick={run(() => props.onCreateFolder(folderId))}
          >
            {t('folder.newSubfolder')}
          </button>
          <button
            type="button"
            className={itemCls}
            onClick={run(() => props.onRenameFolder(folderId))}
          >
            {t('common.rename')}
          </button>
          <button
            type="button"
            className={cn(itemCls, 'text-destructive')}
            onClick={run(() => props.onDeleteFolder(folderId))}
          >
            {t('common.delete')}
          </button>
        </div>
      );
    }

    const profile = profileById.get(entity.id);
    if (!profile) return null;
    return (
      <div className="bg-popover min-w-40 rounded-md border p-1 shadow-md">
        <button
          type="button"
          className={itemCls}
          onClick={run(() => props.onConnectProfile(profile))}
        >
          {t('profiles.connect')}
        </button>
        <button
          type="button"
          className={itemCls}
          onClick={run(() => props.onEditProfile(profile))}
        >
          {t('profiles.edit')}
        </button>
        <button
          type="button"
          className={itemCls}
          onClick={run(() => props.onDuplicateProfile(profile))}
        >
          {t('profiles.duplicate')}
        </button>
        <button
          type="button"
          className={cn(itemCls, 'text-destructive')}
          onClick={run(() => props.onDeleteProfile(profile.id))}
        >
          {t('common.delete')}
        </button>
      </div>
    );
  };

  return <FileTree model={model} renderContextMenu={renderContextMenu} />;
}
