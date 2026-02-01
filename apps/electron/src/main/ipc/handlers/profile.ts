/**
 * Profile IPC Handler
 *
 * Handles all profile and connection-related IPC operations.
 * Uses the new handler base class for unified error handling and logging.
 */

import type {
  DeleteProfileRequest,
  DeleteProfileResponse,
  GetProfilesRequest,
  GetProfilesResponse,
  RemoveConnectionRequest,
  RemoveConnectionResponse,
  SaveProfileRequest,
  SaveProfileResponse,
  UpdateConnectionRequest,
  UpdateConnectionResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
} from '@shared/types';
import type {HandlerContext} from '../base/handler';
import {
  deleteProfile,
  getProfiles,
  getRecentConnections,
  removeRecentConnection,
  saveProfile,
  updateProfile,
  updateRecentConnection,
} from '../../services/store';
import {  IpcHandler } from '../base/handler';
import {
  preferencesChannels,
  profileChannels,
} from '../contracts/all-channels';

export class ProfileHandler extends IpcHandler {
  constructor() {
    super({ name: 'profile' });
  }

  register(): void {
    this.handle(profileChannels.getAll, this.getProfiles.bind(this));
    this.handle(profileChannels.save, this.saveProfile.bind(this));
    this.handle(profileChannels.update, this.updateProfile.bind(this));
    this.handle(profileChannels.delete, this.deleteProfile.bind(this));
    this.handle(
      preferencesChannels.updateConnection,
      this.updateConnection.bind(this)
    );
    this.handle(
      preferencesChannels.removeConnection,
      this.removeConnection.bind(this)
    );
  }

  private async getProfiles(
    _request: GetProfilesRequest,
    _ctx: HandlerContext
  ): Promise<GetProfilesResponse> {
    this.log('debug', 'Getting profiles');
    const storedProfiles = getProfiles();
    // Map stored profiles to ensure required fields are always defined
    const profiles = storedProfiles.map((p) => ({
      ...p,
      displayName: p.displayName || p.filename || '',
      readOnly: p.readOnly ?? false,
      createdAt: p.createdAt || new Date().toISOString(),
    }));
    return { success: true, profiles };
  }

  private async saveProfile(
    request: SaveProfileRequest,
    _ctx: HandlerContext
  ): Promise<SaveProfileResponse> {
    this.log('info', 'Saving profile', {
      displayName: request.profile?.displayName,
    });
    const result = saveProfile({
      ...request.profile,
      path: request.profile.path || '',
      filename: request.profile.filename || '',
      lastOpened: new Date().toISOString(),
      isSaved: true,
    });
    if (result.success && result.profile) {
      return {
        success: true,
        profile: {
          ...result.profile,
          displayName:
            result.profile.displayName || result.profile.filename || '',
          readOnly: result.profile.readOnly ?? false,
          createdAt: result.profile.createdAt || new Date().toISOString(),
        },
      };
    }
    return result as SaveProfileResponse;
  }

  private async updateProfile(
    request: UpdateProfileRequest,
    _ctx: HandlerContext
  ): Promise<UpdateProfileResponse> {
    this.log('info', 'Updating profile', { id: request.id });
    const result = updateProfile(request.id, request.updates);
    if (result.success && result.profile) {
      return {
        success: true,
        profile: {
          ...result.profile,
          displayName:
            result.profile.displayName || result.profile.filename || '',
          readOnly: result.profile.readOnly ?? false,
          createdAt: result.profile.createdAt || new Date().toISOString(),
        },
      };
    }
    return result as UpdateProfileResponse;
  }

  private async deleteProfile(
    request: DeleteProfileRequest,
    _ctx: HandlerContext
  ): Promise<DeleteProfileResponse> {
    this.log('info', 'Deleting profile', { id: request.id });
    deleteProfile(request.id);
    return { success: true };
  }

  private async updateConnection(
    request: UpdateConnectionRequest,
    _ctx: HandlerContext
  ): Promise<UpdateConnectionResponse> {
    this.log('info', 'Updating connection', {
      path: request.path,
      connectionId: request.connectionId,
    });

    // First, try to find in profiles
    const profiles = getProfiles();
    const profile = profiles.find(
      (p) => p.path === request.path || p.id === request.connectionId
    );

    if (profile) {
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
        const result = updateRecentConnection(request.path, {
          displayName: request.updates?.displayName || request.displayName,
          readOnly: request.updates?.readOnly ?? request.readOnly,
          connectionConfig: request.connectionConfig,
        });
        return result;
      }
    }

    return { success: false, error: 'Connection not found' };
  }

  private async removeConnection(
    request: RemoveConnectionRequest,
    _ctx: HandlerContext
  ): Promise<RemoveConnectionResponse> {
    this.log('info', 'Removing connection', { path: request.path });
    removeRecentConnection(request.path);
    return { success: true };
  }
}

// Export singleton instance
export const profileHandler = new ProfileHandler();
