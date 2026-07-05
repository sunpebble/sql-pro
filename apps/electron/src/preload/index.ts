import type { QuarryAPI } from '@shared/types/quarry-api';
import { electronAPI } from '@electron-toolkit/preload';
import { createQuarryAPI } from '@shared/lib/quarry-api';
import { contextBridge, ipcRenderer, webUtils } from 'electron';

export type { QuarryAPI };

export const quarryAPI = createQuarryAPI({
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  on: (channel, listener) => ipcRenderer.on(channel, listener),
  off: (channel, listener) => ipcRenderer.off(channel, listener),
  getPathForFile: (file) => webUtils.getPathForFile(file),
});

contextBridge.exposeInMainWorld('quarry', quarryAPI);
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
