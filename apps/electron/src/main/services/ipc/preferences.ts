import type { SetPreferencesRequest } from '@shared/types';
import { IPC_CHANNELS } from '@shared/types';
import { ipcMain } from 'electron';
import { getPreferences, getRecentConnections, setPreferences } from '../store';
import { createHandler } from './utils';

export function setupPreferencesHandlers(): void {
  // Preferences: Get
  ipcMain.handle(
    IPC_CHANNELS.PREFERENCES_GET,
    createHandler(async () => {
      const preferences = getPreferences();
      return { preferences };
    })
  );

  // Preferences: Set
  ipcMain.handle(
    IPC_CHANNELS.PREFERENCES_SET,
    createHandler(async (request: SetPreferencesRequest) => {
      const preferences = setPreferences(request.preferences);
      return { preferences };
    })
  );

  // App: Get Recent Connections
  ipcMain.handle(
    IPC_CHANNELS.APP_GET_RECENT_CONNECTIONS,
    createHandler(async () => {
      const connections = getRecentConnections();
      return { connections };
    })
  );
}
