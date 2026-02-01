/**
 * IPC Handlers Index
 *
 * Exports all IPC handlers and provides a unified registration function.
 */

import { agentHandler } from './agent';
import { backupHandler } from './backup';
// Export all handlers
// Import for registration
import { databaseHandler } from './database';
import { dialogHandler } from './dialog';
import { exportHandler } from './export';
import { folderHandler } from './folder';
import { historyHandler } from './history';
import { imageHandler } from './image';
import { importHandler } from './import';
import { licenseHandler } from './license';
import { memoryHandler } from './memory';
import { passwordHandler } from './password';
import { pgNotifyHandler } from './pg-notify';
import { preferencesHandler } from './preferences';
import { proHandler } from './pro';
import { profileHandler } from './profile';
import { rendererStoreHandler } from './renderer-store';
import { schemaHandler } from './schema';
import { sqlLogHandler } from './sql-log';
import { sshHandler } from './ssh';
import { systemHandler } from './system';
import { updateHandler } from './update';

export { agentHandler } from './agent';
export { backupHandler } from './backup';
export { databaseHandler } from './database';
export { dialogHandler } from './dialog';
export { exportHandler } from './export';
export { folderHandler } from './folder';
export { historyHandler } from './history';
export { imageHandler } from './image';
export { importHandler } from './import';
export { licenseHandler } from './license';
export { memoryHandler } from './memory';
export { passwordHandler } from './password';
export { pgNotifyHandler } from './pg-notify';
export { preferencesHandler } from './preferences';
export { proHandler } from './pro';
export { profileHandler } from './profile';
export { rendererStoreHandler } from './renderer-store';
export { schemaHandler } from './schema';
export { sqlLogHandler } from './sql-log';
export { sshHandler } from './ssh';
export { systemHandler } from './system';
export { updateHandler } from './update';

/**
 * All handlers in registration order
 */
const allHandlers = [
  databaseHandler,
  schemaHandler,
  historyHandler,
  backupHandler,
  dialogHandler,
  passwordHandler,
  profileHandler,
  folderHandler,
  sqlLogHandler,
  preferencesHandler,
  systemHandler,
  updateHandler,
  exportHandler,
  importHandler,
  licenseHandler,
  proHandler,
  rendererStoreHandler,
  memoryHandler,
  pgNotifyHandler,
  imageHandler,
  sshHandler,
  agentHandler,
];

/**
 * Register all IPC handlers
 */
export function registerAllHandlers(): void {
  for (const handler of allHandlers) {
    handler.register();
  }
}

/**
 * Cleanup all IPC handlers
 */
export function cleanupAllHandlers(): void {
  for (const handler of allHandlers) {
    handler.cleanup();
  }
}
