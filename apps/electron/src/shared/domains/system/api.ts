import type { SqlProApiDeps } from '../../lib/sql-pro-api';
import type { MenuAction } from './types';
import {
  dialogChannels,
  menuChannels,
  passwordChannels,
  systemChannels,
  updateChannels,
  windowChannels,
} from './channels';

export function createSystemApi({ invoke, on, off }: SqlProApiDeps) {
  return {
    window: {
      create: () => invoke(windowChannels.create.name),
      close: (r?: unknown) => invoke(windowChannels.close.name, r || {}),
      focus: (r: unknown) => invoke(windowChannels.focus.name, r),
      getAll: () => invoke(windowChannels.getAll.name),
      getCurrent: () => invoke(windowChannels.getCurrent.name),
    },
    dialog: {
      openFile: (r?: unknown) => invoke(dialogChannels.openFile.name, r || {}),
      saveFile: (r?: unknown) => invoke(dialogChannels.saveFile.name, r || {}),
      writeFile: (r: unknown) => invoke(dialogChannels.writeFile.name, r),
    },
    password: {
      save: (r: unknown) => invoke(passwordChannels.save.name, r),
      get: (r: unknown) => invoke(passwordChannels.get.name, r),
      has: (r: unknown) => invoke(passwordChannels.has.name, r),
      remove: (r: unknown) => invoke(passwordChannels.remove.name, r),
      isAvailable: () => invoke(passwordChannels.isAvailable.name),
    },
    system: {
      showItemInFolder: (r: unknown) =>
        invoke(systemChannels.showItemInFolder.name, r),
      openExternal: (r: unknown) => invoke(systemChannels.openExternal.name, r),
      getAppVersion: () => invoke(systemChannels.getAppVersion.name),
      getPlatform: () => invoke(systemChannels.getPlatform.name),
    },
    update: {
      check: (silent?: boolean) =>
        invoke(updateChannels.check.name, silent ?? true),
      download: () => invoke(updateChannels.download.name),
      install: () => invoke(updateChannels.install.name),
      onStatusChange: (cb: (e: unknown) => void) => {
        const handler = (_e: unknown, p: unknown) => cb(p);
        on(updateChannels.onStatusChange.name, handler);
        return () => off(updateChannels.onStatusChange.name, handler);
      },
    },
    menu: {
      onAction: (cb: (action: MenuAction) => void) => {
        const handler = (_e: unknown, action: MenuAction) => cb(action);
        on(menuChannels.onAction.name, handler);
        return () => off(menuChannels.onAction.name, handler);
      },
    },
    shortcuts: {
      update: (r: unknown) => invoke('shortcuts:update', r),
    },
  };
}

export type SystemApi = ReturnType<typeof createSystemApi>;
