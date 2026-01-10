/**
 * IPC handlers for PostgreSQL LISTEN/NOTIFY
 */

import type {
  PgNotifySubscribeRequest,
  PgNotifyUnsubscribeRequest,
} from '../pg-notify-service';
import { IPC_CHANNELS } from '@shared/types';
import { ipcMain } from 'electron';
import { pgNotifyService } from '../pg-notify-service';

export function setupPgNotifyHandlers(): void {
  // Subscribe to a notification channel
  ipcMain.handle(
    IPC_CHANNELS.PG_NOTIFY_SUBSCRIBE,
    async (_, request: PgNotifySubscribeRequest) => {
      return pgNotifyService.subscribe(request);
    }
  );

  // Unsubscribe from a notification channel
  ipcMain.handle(
    IPC_CHANNELS.PG_NOTIFY_UNSUBSCRIBE,
    async (_, request: PgNotifyUnsubscribeRequest) => {
      return pgNotifyService.unsubscribe(request.subscriptionId);
    }
  );

  // Get all active subscriptions for a connection
  ipcMain.handle(
    IPC_CHANNELS.PG_NOTIFY_GET_SUBSCRIPTIONS,
    async (_, request: { connectionId: string }) => {
      return {
        success: true,
        subscriptions: pgNotifyService.getSubscriptions(request.connectionId),
      };
    }
  );
}

export function cleanupPgNotifyHandlers(): void {
  ipcMain.removeHandler(IPC_CHANNELS.PG_NOTIFY_SUBSCRIBE);
  ipcMain.removeHandler(IPC_CHANNELS.PG_NOTIFY_UNSUBSCRIBE);
  ipcMain.removeHandler(IPC_CHANNELS.PG_NOTIFY_GET_SUBSCRIPTIONS);
}
