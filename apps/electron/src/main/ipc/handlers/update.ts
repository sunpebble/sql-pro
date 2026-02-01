/**
 * Update IPC Handler
 *
 * Handles all auto-update related IPC operations.
 * Uses the new handler base class for unified error handling and logging.
 */

import type { UpdateStatus } from '@shared/types';
import type {HandlerContext} from '../base/handler';
import {
  checkForUpdates,
  downloadUpdate,
  getUpdateStatus,
  quitAndInstall,
} from '../../services/updater';
import {  IpcHandler } from '../base/handler';
import { updateChannels } from '../contracts/all-channels';

export class UpdateHandler extends IpcHandler {
  constructor() {
    super({ name: 'update' });
  }

  register(): void {
    this.handle(updateChannels.check, this.checkForUpdates.bind(this));
    this.handle(updateChannels.download, this.downloadUpdate.bind(this));
    this.handle(updateChannels.install, this.installUpdate.bind(this));
    this.handle(updateChannels.getStatus, this.getUpdateStatus.bind(this));
  }

  private async checkForUpdates(
    _request: void,
    _ctx: HandlerContext
  ): Promise<UpdateStatus> {
    this.log('info', 'Checking for updates');
    await checkForUpdates();
    return getUpdateStatus();
  }

  private async downloadUpdate(
    _request: void,
    _ctx: HandlerContext
  ): Promise<void> {
    this.log('info', 'Downloading update');
    downloadUpdate();
  }

  private async installUpdate(
    _request: void,
    _ctx: HandlerContext
  ): Promise<void> {
    this.log('info', 'Installing update and restarting');
    quitAndInstall();
  }

  private async getUpdateStatus(
    _request: void,
    _ctx: HandlerContext
  ): Promise<UpdateStatus> {
    this.log('debug', 'Getting update status');
    return getUpdateStatus();
  }
}

// Export singleton instance
export const updateHandler = new UpdateHandler();
