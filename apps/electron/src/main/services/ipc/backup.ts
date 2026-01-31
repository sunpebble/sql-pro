import type {
  CreateBackupRequest,
  DeleteBackupRequest,
  ListBackupsRequest,
  RestoreBackupRequest,
} from '@shared/types';
import { IPC_CHANNELS } from '@shared/types';
import { ipcMain } from 'electron';
import { logger } from '../../lib/logger';
import {
  createBackup,
  deleteBackup,
  listBackups,
  restoreBackup,
} from '../backup';
import { createHandler } from './utils';

export function setupBackupHandlers(): void {
  // Create backup
  ipcMain.handle(
    IPC_CHANNELS.BACKUP_CREATE,
    createHandler(async (request: CreateBackupRequest) => {
      logger.info('Creating backup', {
        connectionId: request.connectionId,
        name: request.name,
        format: request.format,
      });
      const result = await createBackup(request);
      if (result.success) {
        logger.info('Backup created successfully', {
          connectionId: request.connectionId,
          name: request.name,
        });
      } else {
        logger.error('Failed to create backup', undefined, {
          connectionId: request.connectionId,
          name: request.name,
          error: result.error,
        });
      }
      return result;
    })
  );

  // Restore backup
  ipcMain.handle(
    IPC_CHANNELS.BACKUP_RESTORE,
    createHandler(async (request: RestoreBackupRequest) => {
      logger.info('Restoring backup', {
        connectionId: request.connectionId,
        backupPath: request.backupPath,
      });
      const result = await restoreBackup(request);
      if (result.success) {
        logger.info('Backup restored successfully', {
          connectionId: request.connectionId,
          backupPath: request.backupPath,
        });
      } else {
        logger.error('Failed to restore backup', undefined, {
          connectionId: request.connectionId,
          backupPath: request.backupPath,
          error: result.error,
        });
      }
      return result;
    })
  );

  // List backups
  ipcMain.handle(
    IPC_CHANNELS.BACKUP_LIST,
    createHandler(async (request: ListBackupsRequest) => {
      logger.debug('Listing backups', {
        databaseType: request.databaseType,
        databaseName: request.databaseName,
      });
      const result = await listBackups(request);
      if (result.success) {
        logger.debug('Backups listed successfully', {
          count: result.backups?.length || 0,
        });
      } else {
        logger.error('Failed to list backups', undefined, {
          error: result.error,
        });
      }
      return result;
    })
  );

  // Delete backup
  ipcMain.handle(
    IPC_CHANNELS.BACKUP_DELETE,
    createHandler(async (request: DeleteBackupRequest) => {
      logger.info('Deleting backup', {
        backupId: request.backupId,
      });
      const result = await deleteBackup(request);
      if (result.success) {
        logger.info('Backup deleted successfully', {
          backupId: request.backupId,
        });
      } else {
        logger.error('Failed to delete backup', undefined, {
          backupId: request.backupId,
          error: result.error,
        });
      }
      return result;
    })
  );
}
