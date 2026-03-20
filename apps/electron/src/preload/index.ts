import type { SqlProAPI } from '@shared/types/sql-pro-api';
import { electronAPI } from '@electron-toolkit/preload';
import { createSqlProAPI } from '@shared/lib/sql-pro-api';
import { contextBridge, ipcRenderer, webUtils } from 'electron';

export type { SqlProAPI };

export const sqlProAPI = createSqlProAPI({
  invoke: (channel, ...args) =>
    ipcRenderer.invoke(channel as never, ...(args as never[])),
  on: (channel, listener) => ipcRenderer.on(channel, listener),
  off: (channel, listener) => ipcRenderer.off(channel, listener),
  getPathForFile: (file) => webUtils.getPathForFile(file),
});

contextBridge.exposeInMainWorld('sqlPro', sqlProAPI);
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
