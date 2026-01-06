import type {
  CheckUnsavedChangesRequest,
  FocusWindowRequest,
} from '@shared/types';
import { IPC_CHANNELS } from '@shared/types';
import { BrowserWindow, ipcMain } from 'electron';
import { sqlLogger } from '../sql-logger';
import { createHandler } from './utils';

export function setupSystemHandlers(): void {
  // System: Focus Window
  ipcMain.handle(
    IPC_CHANNELS.SYSTEM_FOCUS_WINDOW,
    createHandler(async (request: FocusWindowRequest) => {
      const window = BrowserWindow.fromId(request.windowId);
      if (window) {
        window.focus();
      }
      return { success: true };
    })
  );

  // Check Unsaved Changes
  ipcMain.handle(
    IPC_CHANNELS.CHECK_UNSAVED_CHANGES,
    createHandler(async (_request: CheckUnsavedChangesRequest) => {
      return { success: true, hasChanges: false };
    })
  );

  // SQL Logging
  ipcMain.on('sql-execute', (_event, data) => {
    sqlLogger.log(data);
  });
}
