import type { ProActivateRequest } from '@shared/types';
import { IPC_CHANNELS } from '@shared/types';
import { ipcMain } from 'electron';
import { clearProStatus, getProStatus, saveProStatus } from '../store';
import { createHandler } from './utils';

export function setupProHandlers(): void {
  // Pro: Activate
  ipcMain.handle(
    IPC_CHANNELS.PRO_ACTIVATE,
    createHandler(async (request: ProActivateRequest) => {
      saveProStatus({
        isActive: true,
        activationDate: new Date().toISOString(),
        licenseKey: request.licenseKey,
      });
      return { success: true };
    })
  );

  // Pro: Get Status
  ipcMain.handle(
    IPC_CHANNELS.PRO_GET_STATUS,
    createHandler(async () => {
      const status = getProStatus();
      return { status };
    })
  );

  // Pro: Clear Status
  ipcMain.handle(
    IPC_CHANNELS.PRO_CLEAR_STATUS,
    createHandler(async () => {
      clearProStatus();
      return {};
    })
  );
}
