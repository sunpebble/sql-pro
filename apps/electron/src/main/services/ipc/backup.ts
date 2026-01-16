import type {
  CreateBackupRequest,
  DeleteBackupRequest,
  ListBackupsRequest,
  RestoreBackupRequest,
} from '@shared/types';
import { IPC_CHANNELS } from '@shared/types';
import { ipcMain } from 'electron';
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
      return await createBackup(request);
    })
  );

  // Restore backup
  ipcMain.handle(
    IPC_CHANNELS.BACKUP_RESTORE,
    createHandler(async (request: RestoreBackupRequest) => {
      return await restoreBackup(request);
    })
  );

  // List backups
  ipcMain.handle(
    IPC_CHANNELS.BACKUP_LIST,
    createHandler(async (request: ListBackupsRequest) => {
      return await listBackups(request);
    })
  );

  // Delete backup
  ipcMain.handle(
    IPC_CHANNELS.BACKUP_DELETE,
    createHandler(async (request: DeleteBackupRequest) => {
      return await deleteBackup(request);
    })
  );
}
