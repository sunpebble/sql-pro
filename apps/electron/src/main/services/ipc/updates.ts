import { IPC_CHANNELS } from '@shared/types';
import { ipcMain } from 'electron';
import {
  checkForUpdates,
  downloadUpdate,
  getUpdateStatus,
  quitAndInstall,
} from '../updater';
import { createHandler } from './utils';

export function setupUpdatesHandlers(): void {
  // Updates: Check For Updates
  ipcMain.handle(
    IPC_CHANNELS.UPDATES_CHECK,
    createHandler(async () => {
      await checkForUpdates();
      return {};
    })
  );

  // Updates: Get Status
  ipcMain.handle(
    IPC_CHANNELS.UPDATES_GET_STATUS,
    createHandler(async () => {
      const status = getUpdateStatus();
      return { status };
    })
  );

  // Updates: Download
  ipcMain.handle(
    IPC_CHANNELS.UPDATES_DOWNLOAD,
    createHandler(async () => {
      downloadUpdate();
      return {};
    })
  );

  // Updates: Quit and Install
  ipcMain.handle(
    IPC_CHANNELS.UPDATES_QUIT_AND_INSTALL,
    createHandler(async () => {
      quitAndInstall();
      return {};
    })
  );
}
