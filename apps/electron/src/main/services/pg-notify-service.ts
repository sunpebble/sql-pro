/**
 * PostgreSQL LISTEN/NOTIFY Service
 *
 * Manages LISTEN connections for real-time database change notifications.
 * Uses dedicated pg.Client instances for each subscription since LISTEN
 * blocks the connection.
 */

import type { DatabaseConnectionConfig } from '@shared/types';
import {
  IPC_CHANNELS,
  isPostgreSQLCompatibleDatabaseType,
} from '@shared/types';
import { BrowserWindow } from 'electron';

// Types for pg module
interface PGNotification {
  channel: string;
  payload?: string;
  processId: number;
}

interface PGClient {
  query: (sql: string) => Promise<unknown>;
  end: () => Promise<void>;
  connect: () => Promise<void>;
  on: (event: string, callback: (msg: PGNotification) => void) => void;
  removeAllListeners: (event?: string) => void;
}

interface Subscription {
  id: string;
  connectionId: string;
  channel: string;
  table?: string;
  client: PGClient;
  createdAt: number;
}

export interface PgNotifySubscribeRequest {
  connectionId: string;
  channel: string;
  table?: string;
}

export interface PgNotifyUnsubscribeRequest {
  subscriptionId: string;
}

export interface PgNotifyEvent {
  subscriptionId: string;
  connectionId: string;
  channel: string;
  payload: string;
  table?: string;
  timestamp: number;
}

export interface PgNotifySubscription {
  id: string;
  connectionId: string;
  channel: string;
  table?: string;
  createdAt: number;
}

// Simple ID generator
let subscriptionIdCounter = 0;
function generateSubscriptionId(): string {
  subscriptionIdCounter += 1;
  return `pg_notify_${subscriptionIdCounter}_${Math.random().toString(36).substring(2, 9)}`;
}

class PgNotifyService {
  private subscriptions: Map<string, Subscription> = new Map();
  private connectionConfigs: Map<string, DatabaseConnectionConfig> = new Map();
  private pg: typeof import('pg') | null = null;

  /**
   * Store connection config for later use when creating LISTEN connections
   */
  registerConnection(
    connectionId: string,
    config: DatabaseConnectionConfig
  ): void {
    this.connectionConfigs.set(connectionId, config);
  }

  /**
   * Remove connection config and cleanup any subscriptions
   */
  unregisterConnection(connectionId: string): void {
    // Cleanup all subscriptions for this connection
    for (const [subId, sub] of this.subscriptions.entries()) {
      if (sub.connectionId === connectionId) {
        this.unsubscribe(subId).catch(console.error);
      }
    }
    this.connectionConfigs.delete(connectionId);
  }

  private async getPG() {
    if (!this.pg) {
      try {
        this.pg = await import('pg');
      } catch {
        throw new Error('PostgreSQL driver not installed');
      }
    }
    return this.pg;
  }

  /**
   * Subscribe to a PostgreSQL notification channel
   */
  async subscribe(
    request: PgNotifySubscribeRequest
  ): Promise<
    | { success: true; subscriptionId: string }
    | { success: false; error: string }
  > {
    const { connectionId, channel, table } = request;

    const config = this.connectionConfigs.get(connectionId);
    if (!config) {
      return {
        success: false,
        error: 'Connection not found. Please ensure the database is connected.',
      };
    }

    // Only works for PostgreSQL/Supabase
    if (!isPostgreSQLCompatibleDatabaseType(config.type)) {
      return {
        success: false,
        error:
          'LISTEN/NOTIFY is only supported for PostgreSQL-compatible connections',
      };
    }

    try {
      const pg = await this.getPG();

      // Build connection config
      let host = config.host;
      const port = config.port || 5432;
      const database = config.database || 'postgres';
      let username = config.username;
      let password = config.password;

      // Handle Supabase URL parsing
      if (config.type === 'supabase' && config.supabaseUrl) {
        const url = new URL(config.supabaseUrl);
        if (!host) {
          host = `db.${url.hostname}`;
        }
        password = config.supabaseKey || password;
        if (!username) {
          const projectRef = url.hostname.replace('.supabase.co', '');
          const isPooler = host?.includes('.pooler.supabase.com');
          username = isPooler ? `postgres.${projectRef}` : 'postgres';
        }
      }

      const connectionConfig: import('pg').ClientConfig = {
        host,
        port,
        user: username || 'postgres',
        password,
        database,
        connectionTimeoutMillis: 15000,
      };

      // SSL for Supabase or when explicitly enabled
      if (config.ssl || config.type === 'supabase') {
        connectionConfig.ssl = { rejectUnauthorized: false };
      }

      // Create a dedicated client for LISTEN
      const client = new pg.Client(connectionConfig) as unknown as PGClient;
      await client.connect();

      // Subscribe to the channel
      await client.query(`LISTEN "${channel}"`);

      const subscriptionId = generateSubscriptionId();

      // Handle notifications
      client.on('notification', (msg: PGNotification) => {
        const event: PgNotifyEvent = {
          subscriptionId,
          connectionId,
          channel: msg.channel,
          payload: msg.payload || '',
          table,
          timestamp: Date.now(),
        };

        // Broadcast to all renderer windows
        this.broadcastEvent(event);
      });

      const subscription: Subscription = {
        id: subscriptionId,
        connectionId,
        channel,
        table,
        client,
        createdAt: Date.now(),
      };

      this.subscriptions.set(subscriptionId, subscription);

      // eslint-disable-next-line no-console
      console.log(
        `[PgNotify] Subscribed to channel "${channel}" (${subscriptionId})`
      );

      return { success: true, subscriptionId };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to subscribe to notifications';
      console.error('[PgNotify] Subscribe error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Unsubscribe from a notification channel
   */
  async unsubscribe(
    subscriptionId: string
  ): Promise<{ success: true } | { success: false; error: string }> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    try {
      subscription.client.removeAllListeners('notification');
      await subscription.client.end();
      this.subscriptions.delete(subscriptionId);

      // eslint-disable-next-line no-console
      console.log(
        `[PgNotify] Unsubscribed from channel "${subscription.channel}" (${subscriptionId})`
      );

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to unsubscribe';
      console.error('[PgNotify] Unsubscribe error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get all active subscriptions for a connection
   */
  getSubscriptions(connectionId: string): PgNotifySubscription[] {
    const result: PgNotifySubscription[] = [];

    for (const sub of this.subscriptions.values()) {
      if (sub.connectionId === connectionId) {
        result.push({
          id: sub.id,
          connectionId: sub.connectionId,
          channel: sub.channel,
          table: sub.table,
          createdAt: sub.createdAt,
        });
      }
    }

    return result;
  }

  /**
   * Broadcast notification event to all renderer windows
   */
  private broadcastEvent(event: PgNotifyEvent): void {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send(IPC_CHANNELS.PG_NOTIFY_EVENT, event);
      }
    }
  }

  /**
   * Cleanup all subscriptions (called on app quit)
   */
  async cleanup(): Promise<void> {
    const promises: Promise<unknown>[] = [];

    for (const subscriptionId of this.subscriptions.keys()) {
      promises.push(this.unsubscribe(subscriptionId));
    }

    await Promise.allSettled(promises);
    this.connectionConfigs.clear();
  }
}

// Export singleton instance
export const pgNotifyService = new PgNotifyService();
