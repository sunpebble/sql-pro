import type {
  DeleteProfileRequest,
  RemoveConnectionRequest,
  SaveProfileRequest,
  UpdateConnectionRequest,
  UpdateProfileRequest,
} from '@shared/types';
import { IPC_CHANNELS } from '@shared/types';
import { ipcMain } from 'electron';
import {
  deleteProfile,
  getProfiles,
  getRecentConnections,
  removeRecentConnection,
  saveProfile,
  updateProfile,
  updateRecentConnection,
} from '../store';
import { createHandler } from './utils';

export function setupProfilesHandlers(): void {
  // Profiles: Get
  ipcMain.handle(
    IPC_CHANNELS.PROFILES_GET,
    createHandler(async () => {
      const profiles = getProfiles();
      return { profiles };
    })
  );

  // Profiles: Save
  ipcMain.handle(
    IPC_CHANNELS.PROFILES_SAVE,
    createHandler(async (request: SaveProfileRequest) => {
      const result = saveProfile({
        ...request.profile,
        path: request.profile.path || '',
        filename: request.profile.filename || '',
        lastOpened: new Date().toISOString(),
        isSaved: true,
      });
      return result;
    })
  );

  // Profiles: Update
  ipcMain.handle(
    IPC_CHANNELS.PROFILES_UPDATE,
    createHandler(async (request: UpdateProfileRequest) => {
      const result = updateProfile(request.id, request.updates);
      return result;
    })
  );

  // Profiles: Delete
  ipcMain.handle(
    IPC_CHANNELS.PROFILES_DELETE,
    createHandler(async (request: DeleteProfileRequest) => {
      deleteProfile(request.id);
      return {};
    })
  );

  // Connections: Update
  ipcMain.handle(
    IPC_CHANNELS.CONNECTION_UPDATE,
    createHandler(async (request: UpdateConnectionRequest) => {
      // First, try to find in profiles
      const profiles = getProfiles();
      const profile = profiles.find(
        (p) => p.path === request.path || p.id === request.connectionId
      );

      if (profile) {
        // Update profile
        const result = updateProfile(profile.id, {
          displayName: request.updates?.displayName || request.displayName,
          readOnly: request.updates?.readOnly ?? request.readOnly,
          connectionConfig: request.connectionConfig,
        });
        return result;
      }

      // If not found in profiles, try recent connections
      if (request.path) {
        const recentConnections = getRecentConnections();
        const recentConnection = recentConnections.find(
          (c) => c.path === request.path
        );

        if (recentConnection) {
          // Update recent connection
          const result = updateRecentConnection(request.path, {
            displayName: request.updates?.displayName || request.displayName,
            readOnly: request.updates?.readOnly ?? request.readOnly,
            connectionConfig: request.connectionConfig,
          });
          return result;
        }
      }

      return { success: false, error: 'Connection not found' };
    })
  );

  // Connections: Remove
  ipcMain.handle(
    IPC_CHANNELS.CONNECTION_REMOVE,
    createHandler(async (request: RemoveConnectionRequest) => {
      removeRecentConnection(request.path);
      return { success: true };
    })
  );
}
