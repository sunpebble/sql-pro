import { IPC_CHANNELS } from '@shared/types';
import { ipcMain } from 'electron';
import { cleanupAgentHandlers, setupAgentHandlers } from '../agent';
import { setupBackupHandlers } from './backup';
import { setupDatabaseHandlers } from './database';
import { setupDialogHandlers } from './dialog';
import { setupExportHandlers } from './export';
import { setupFoldersHandlers } from './folders';
import { setupHistoryHandlers } from './history';
import { cleanupImageHandlers, setupImageHandlers } from './image';
import { setupImportHandlers } from './import';
import { setupLicenseHandlers } from './license';
import { cleanupMemoryHandlers, setupMemoryHandlers } from './memory';
import { setupPasswordHandlers } from './password';
import { cleanupPgNotifyHandlers, setupPgNotifyHandlers } from './pg-notify';
import { setupPreferencesHandlers } from './preferences';
import { setupProHandlers } from './pro';
import { setupProfilesHandlers } from './profiles';
import {
  cleanupRendererStoreHandlers,
  setupRendererStoreHandlers,
} from './renderer-store';
import { setupSchemaHandlers } from './schema';
import { setupSqlLogHandlers } from './sql-log';
import { setupSystemHandlers } from './system';
import { setupUpdatesHandlers } from './updates';

export function setupIpcHandlers(): void {
  setupDatabaseHandlers();
  setupDialogHandlers();
  setupExportHandlers();
  setupImportHandlers();
  setupSchemaHandlers();
  setupHistoryHandlers();
  setupProfilesHandlers();
  setupFoldersHandlers();
  setupPasswordHandlers();
  setupPreferencesHandlers();
  setupProHandlers();
  setupLicenseHandlers();
  setupAgentHandlers(); // Unified AI Agent
  setupSystemHandlers();
  setupUpdatesHandlers();
  setupRendererStoreHandlers();
  setupSqlLogHandlers();
  setupMemoryHandlers();
  setupPgNotifyHandlers();
  setupImageHandlers();
  setupBackupHandlers();
}

export function cleanupIpcHandlers(): void {
  Object.values(IPC_CHANNELS).forEach((channel) => {
    ipcMain.removeHandler(channel);
  });
  // Also clean up renderer store channels
  cleanupRendererStoreHandlers();
  // Clean up memory handler subscriptions
  cleanupMemoryHandlers();
  // Clean up PG notify subscriptions
  cleanupPgNotifyHandlers();
  // Clean up image handlers
  cleanupImageHandlers();
  // Clean up agent handlers
  cleanupAgentHandlers();
}
