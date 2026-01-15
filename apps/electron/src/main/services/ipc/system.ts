import type {
  CheckUnsavedChangesRequest,
  CloseWindowRequest,
  FocusWindowRequest,
  OpenExternalRequest,
  ShowItemInFolderRequest,
} from '@shared/types';
import { IPC_CHANNELS } from '@shared/types';
import { BrowserWindow, ipcMain, shell } from 'electron';
import { sqlLogger } from '../sql-logger';
import { windowManager } from '../window-manager';
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

  // Window: Create new window
  ipcMain.handle(
    IPC_CHANNELS.WINDOW_CREATE,
    createHandler(async () => {
      const windowId = windowManager.createWindow();
      return { success: true, windowId };
    })
  );

  // Window: Close window
  ipcMain.handle(
    IPC_CHANNELS.WINDOW_CLOSE,
    createHandler(async (request: CloseWindowRequest) => {
      const windowIdStr = request?.windowId;
      if (windowIdStr) {
        const windowId = Number.parseInt(windowIdStr, 10);
        if (Number.isNaN(windowId)) {
          return { success: false, error: 'Invalid window ID' };
        }
        const window = BrowserWindow.fromId(windowId);
        if (window && !window.isDestroyed()) {
          window.close();
        }
      }
      return { success: true };
    })
  );

  // Note: WINDOW_FOCUS is already handled by SYSTEM_FOCUS_WINDOW above
  // (both map to 'window:focus' channel)

  // Window: Get all windows
  ipcMain.handle(
    IPC_CHANNELS.WINDOW_GET_ALL,
    createHandler(async () => {
      const windows = BrowserWindow.getAllWindows()
        .filter((w) => !w.isDestroyed())
        .map((w) => ({
          id: w.id,
          title: w.getTitle(),
          focused: w.isFocused(),
        }));
      return { success: true, windows };
    })
  );

  // Window: Get current window
  ipcMain.handle(IPC_CHANNELS.WINDOW_GET_CURRENT, async (event) => {
    try {
      const webContents = event.sender;
      const window = BrowserWindow.fromWebContents(webContents);
      if (window && !window.isDestroyed()) {
        return {
          success: true,
          window: {
            id: window.id,
            title: window.getTitle(),
            focused: window.isFocused(),
          },
        };
      }
      throw new Error('No current window found');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Operation failed',
      };
    }
  });

  // System: Show item in folder (reveal in Finder/Explorer)
  ipcMain.handle(
    IPC_CHANNELS.SYSTEM_SHOW_ITEM_IN_FOLDER,
    createHandler(async (request: ShowItemInFolderRequest) => {
      shell.showItemInFolder(request.path);
      return { success: true };
    })
  );

  // System: Open external URL
  ipcMain.handle(
    IPC_CHANNELS.SYSTEM_OPEN_EXTERNAL,
    createHandler(async (request: OpenExternalRequest) => {
      await shell.openExternal(request.url);
      return { success: true };
    })
  );
}
