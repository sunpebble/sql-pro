/**
 * SQL Log IPC Handler
 *
 * Handles all SQL logging-related IPC operations.
 * Uses the new handler base class for unified error handling and logging.
 */

import type {
  ClearSqlLogsRequest,
  ClearSqlLogsResponse,
  GetSqlLogsRequest,
  GetSqlLogsResponse,
} from '@shared/types';
import type {HandlerContext} from '../base/handler';
import { sqlLogger } from '../../services/sql-logger';
import {  IpcHandler } from '../base/handler';
import { sqlLogChannels } from '../contracts/all-channels';

export class SqlLogHandler extends IpcHandler {
  constructor() {
    super({ name: 'sql-log' });
  }

  register(): void {
    this.handle(sqlLogChannels.get, this.getSqlLogs.bind(this));
    this.handle(sqlLogChannels.clear, this.clearSqlLogs.bind(this));
  }

  private async getSqlLogs(
    request: GetSqlLogsRequest,
    _ctx: HandlerContext
  ): Promise<GetSqlLogsResponse> {
    this.log('debug', 'Getting SQL logs', {
      limit: request.limit,
      connectionId: request.connectionId,
    });

    const logs = sqlLogger.getLogs({
      limit: request.limit,
      connectionId: request.connectionId,
      level: request.level,
    });

    return { success: true, logs };
  }

  private async clearSqlLogs(
    request: ClearSqlLogsRequest,
    _ctx: HandlerContext
  ): Promise<ClearSqlLogsResponse> {
    this.log('info', 'Clearing SQL logs', {
      connectionId: request.connectionId,
    });

    sqlLogger.clearLogs(request.connectionId);
    return { success: true };
  }
}

// Export singleton instance
export const sqlLogHandler = new SqlLogHandler();
