/**
 * Backup IPC Handler
 *
 * Handles all backup-related IPC operations.
 * Uses the new handler base class for unified error handling and logging.
 */

import type {
  CreateBackupRequest,
  CreateBackupResponse,
  DeleteBackupRequest,
  DeleteBackupResponse,
  ListBackupsRequest,
  ListBackupsResponse,
  RestoreBackupRequest,
  RestoreBackupResponse,
} from '@shared/types';
import type {HandlerContext} from '../base/handler';
import {
  createBackup,
  deleteBackup,
  listBackups,
  restoreBackup,
} from '../../services/backup';
import {  IpcHandler } from '../base/handler';
import { backupChannels } from '../contracts/all-channels';

export class BackupHandler extends IpcHandler {
  constructor() {
    super({ name: 'backup' });
  }

  register(): void {
    this.handle(backupChannels.create, this.createBackup.bind(this));
    this.handle(backupChannels.restore, this.restoreBackup.bind(this));
    this.handle(backupChannels.list, this.listBackups.bind(this));
    this.handle(backupChannels.delete, this.deleteBackup.bind(this));
  }

  private async createBackup(
    request: CreateBackupRequest,
    _ctx: HandlerContext
  ): Promise<CreateBackupResponse> {
    this.log('info', 'Creating backup', {
      connectionId: request.connectionId,
      name: request.name,
      format: request.format,
    });

    const result = await createBackup(request);

    if (result.success) {
      this.log('info', 'Backup created successfully', {
        connectionId: request.connectionId,
        name: request.name,
      });
    }

    return result;
  }

  private async restoreBackup(
    request: RestoreBackupRequest,
    _ctx: HandlerContext
  ): Promise<RestoreBackupResponse> {
    this.log('info', 'Restoring backup', {
      connectionId: request.connectionId,
      backupPath: request.backupPath,
    });

    const result = await restoreBackup(request);

    if (result.success) {
      this.log('info', 'Backup restored successfully', {
        connectionId: request.connectionId,
        backupPath: request.backupPath,
      });
    }

    return result;
  }

  private async listBackups(
    request: ListBackupsRequest,
    _ctx: HandlerContext
  ): Promise<ListBackupsResponse> {
    this.log('debug', 'Listing backups', {
      databaseType: request.databaseType,
      databaseName: request.databaseName,
    });

    const result = await listBackups(request);

    if (result.success) {
      this.log('debug', 'Backups listed successfully', {
        count: result.backups?.length || 0,
      });
    }

    return result;
  }

  private async deleteBackup(
    request: DeleteBackupRequest,
    _ctx: HandlerContext
  ): Promise<DeleteBackupResponse> {
    this.log('info', 'Deleting backup', {
      backupId: request.backupId,
    });

    const result = await deleteBackup(request);

    if (result.success) {
      this.log('info', 'Backup deleted successfully', {
        backupId: request.backupId,
      });
    }

    return result;
  }
}

// Export singleton instance
export const backupHandler = new BackupHandler();
