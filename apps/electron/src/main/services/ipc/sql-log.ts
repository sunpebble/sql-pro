/**
 * IPC handlers for SQL logging operations
 */

import type { ClearSqlLogsRequest, GetSqlLogsRequest } from '@shared/types';
import { IPC_CHANNELS } from '@shared/types';
import { ipcMain } from 'electron';
import { sqlLogger } from '../sql-logger';
import { createHandler } from './utils';

export function setupSqlLogHandlers(): void {
  // SQL Log: Get logs
  ipcMain.handle(
    IPC_CHANNELS.SQL_LOG_GET,
    createHandler(async (request: GetSqlLogsRequest) => {
      const logs = sqlLogger.getLogs({
        limit: request.limit,
        connectionId: request.connectionId,
        level: request.level,
      });
      return { logs };
    })
  );

  // SQL Log: Clear logs
  ipcMain.handle(
    IPC_CHANNELS.SQL_LOG_CLEAR,
    createHandler(async (request: ClearSqlLogsRequest) => {
      sqlLogger.clearLogs(request.connectionId);
      return {};
    })
  );
}

export function cleanupSqlLogHandlers(): void {
  ipcMain.removeHandler(IPC_CHANNELS.SQL_LOG_GET);
  ipcMain.removeHandler(IPC_CHANNELS.SQL_LOG_CLEAR);
}
