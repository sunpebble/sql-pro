/**
 * History IPC Handler
 *
 * Handles all query history related IPC operations.
 * Uses the new handler base class for unified error handling and logging.
 */

import type {
  ClearQueryHistoryRequest,
  ClearQueryHistoryResponse,
  DeleteQueryHistoryRequest,
  DeleteQueryHistoryResponse,
  GetQueryHistoryRequest,
  GetQueryHistoryResponse,
  QueryHistoryEntry,
  SaveQueryHistoryRequest,
  SaveQueryHistoryResponse,
} from '@shared/types';
import type {HandlerContext} from '../base/handler';
import {
  clearQueryHistory,
  deleteQueryHistoryEntry,
  getQueryHistory,
  saveQueryHistoryEntry,
} from '../../services/store';
import {  IpcHandler } from '../base/handler';
import { historyChannels } from '../contracts/all-channels';

export class HistoryHandler extends IpcHandler {
  constructor() {
    super({ name: 'history' });
  }

  register(): void {
    this.handle(historyChannels.get, this.getQueryHistory.bind(this));
    this.handle(historyChannels.save, this.saveQueryHistory.bind(this));
    this.handle(historyChannels.delete, this.deleteQueryHistory.bind(this));
    this.handle(historyChannels.clear, this.clearQueryHistory.bind(this));
  }

  private async getQueryHistory(
    request: GetQueryHistoryRequest,
    _ctx: HandlerContext
  ): Promise<GetQueryHistoryResponse> {
    const dbPath = request.dbPath || '';
    this.log('info', 'Getting query history', { dbPath });
    const history = getQueryHistory(dbPath);
    return { success: true, history };
  }

  private async saveQueryHistory(
    request: SaveQueryHistoryRequest,
    _ctx: HandlerContext
  ): Promise<SaveQueryHistoryResponse> {
    const entry: QueryHistoryEntry = request.entry || {
      id: crypto.randomUUID(),
      query: request.query || '',
      dbPath: request.connectionPath || '',
      timestamp: request.timestamp || new Date().toISOString(),
      description: request.description,
    };

    this.log('info', 'Saving query history entry', {
      id: entry.id,
      dbPath: entry.dbPath,
    });

    saveQueryHistoryEntry(entry);
    return { success: true };
  }

  private async deleteQueryHistory(
    request: DeleteQueryHistoryRequest,
    _ctx: HandlerContext
  ): Promise<DeleteQueryHistoryResponse> {
    const dbPath = request.dbPath || '';
    const entryId = request.id || request.entryId || '';

    this.log('info', 'Deleting query history entry', { dbPath, entryId });

    deleteQueryHistoryEntry(dbPath, entryId);
    return { success: true };
  }

  private async clearQueryHistory(
    request: ClearQueryHistoryRequest,
    _ctx: HandlerContext
  ): Promise<ClearQueryHistoryResponse> {
    const dbPath = request.dbPath || '';

    this.log('info', 'Clearing query history', { dbPath });

    clearQueryHistory(dbPath);
    return { success: true };
  }
}

// Export singleton instance
export const historyHandler = new HistoryHandler();
