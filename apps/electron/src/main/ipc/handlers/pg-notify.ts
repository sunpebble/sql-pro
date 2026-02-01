/**
 * PostgreSQL Notify IPC Handler
 *
 * Handles IPC for PostgreSQL LISTEN/NOTIFY subscriptions.
 */

import type {
  PgNotifySubscribeRequest,
  PgNotifyUnsubscribeRequest,
} from '../../services/pg-notify-service';
import type {HandlerContext} from '../base/handler';
import { pgNotifyService } from '../../services/pg-notify-service';
import {  IpcHandler } from '../base/handler';

export class PgNotifyHandler extends IpcHandler {
  constructor() {
    super({ name: 'pg-notify' });
  }

  register(): void {
    this.handleLegacy('pg-notify:subscribe', this.subscribe.bind(this));
    this.handleLegacy('pg-notify:unsubscribe', this.unsubscribe.bind(this));
    this.handleLegacy(
      'pg-notify:get-subscriptions',
      this.getSubscriptions.bind(this)
    );
  }

  private async subscribe(
    request: PgNotifySubscribeRequest,
    _ctx: HandlerContext
  ): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    return pgNotifyService.subscribe(request);
  }

  private async unsubscribe(
    request: PgNotifyUnsubscribeRequest,
    _ctx: HandlerContext
  ): Promise<{ success: boolean; error?: string }> {
    return pgNotifyService.unsubscribe(request.subscriptionId);
  }

  private async getSubscriptions(
    request: { connectionId: string },
    _ctx: HandlerContext
  ): Promise<{ success: boolean; subscriptions: unknown[] }> {
    return {
      success: true,
      subscriptions: pgNotifyService.getSubscriptions(request.connectionId),
    };
  }
}

// Export singleton instance
export const pgNotifyHandler = new PgNotifyHandler();
