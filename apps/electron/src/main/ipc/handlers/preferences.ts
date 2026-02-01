/**
 * Preferences IPC Handler
 *
 * Handles all preferences-related IPC operations.
 * Uses the new handler base class for unified error handling and logging.
 */

import type {
  GetPreferencesResponse,
  GetRecentConnectionsResponse,
  SetPreferencesRequest,
  SetPreferencesResponse,
} from '@shared/types';
import type {HandlerContext} from '../base/handler';
import {
  getPreferences,
  getRecentConnections,
  setPreferences,
} from '../../services/store';
import {  IpcHandler } from '../base/handler';
import { preferencesChannels } from '../contracts/all-channels';

export class PreferencesHandler extends IpcHandler {
  constructor() {
    super({ name: 'preferences' });
  }

  register(): void {
    this.handle(preferencesChannels.get, this.getPreferences.bind(this));
    this.handle(preferencesChannels.set, this.setPreferences.bind(this));
    this.handle(
      preferencesChannels.getRecentConnections,
      this.getRecentConnections.bind(this)
    );
  }

  private async getPreferences(
    _request: void,
    _ctx: HandlerContext
  ): Promise<GetPreferencesResponse> {
    this.log('debug', 'Getting preferences');
    const preferences = getPreferences();
    return { success: true, preferences };
  }

  private async setPreferences(
    request: SetPreferencesRequest,
    _ctx: HandlerContext
  ): Promise<SetPreferencesResponse> {
    this.log('info', 'Setting preferences');
    setPreferences(request.preferences);
    return { success: true };
  }

  private async getRecentConnections(
    _request: void,
    _ctx: HandlerContext
  ): Promise<GetRecentConnectionsResponse> {
    this.log('debug', 'Getting recent connections');
    const connections = getRecentConnections();
    return { success: true, connections };
  }
}

// Export singleton instance
export const preferencesHandler = new PreferencesHandler();
