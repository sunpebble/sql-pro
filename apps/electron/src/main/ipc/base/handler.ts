/**
 * IPC Handler Base Class
 *
 * Provides a unified base class for all IPC handlers with:
 * - Automatic error handling and logging
 * - Request/response timing
 * - Type-safe channel registration
 */

import type { IpcChannel } from '@sqlpro/ipc-contracts';
import type {IpcMainInvokeEvent} from 'electron';
import process from 'node:process';
import { ipcMain  } from 'electron';

export interface HandlerContext {
  event: IpcMainInvokeEvent;
  startTime: number;
}

export interface HandlerOptions {
  /** Handler name for logging */
  name: string;
  /** Enable request logging (default: true in development) */
  logRequests?: boolean;
}

/**
 * Base class for IPC handlers
 */
export abstract class IpcHandler {
  protected readonly name: string;
  protected readonly logRequests: boolean;
  private registeredChannels: string[] = [];

  constructor(options: HandlerOptions) {
    this.name = options.name;
    this.logRequests =
      options.logRequests ?? process.env.NODE_ENV === 'development';
  }

  /**
   * Register all handlers. Override in subclass.
   */
  abstract register(): void;

  /**
   * Cleanup resources. Override in subclass if needed.
   */
  cleanup(): void {
    // Unregister all handlers
    for (const channel of this.registeredChannels) {
      ipcMain.removeHandler(channel);
    }
    this.registeredChannels = [];
  }

  /**
   * Register a typed handler for a channel
   */
  protected handle<TInput, TOutput>(
    channel: IpcChannel<TInput, TOutput>,
    handler: (input: TInput, ctx: HandlerContext) => Promise<TOutput>
  ): void {
    const channelName = channel.name;

    ipcMain.handle(channelName, async (event, input: TInput) => {
      const startTime = performance.now();
      const ctx: HandlerContext = { event, startTime };

      try {
        if (this.logRequests) {
          this.log('debug', `[${channelName}] Request`, { input });
        }

        const result = await handler(input, ctx);

        if (this.logRequests) {
          const duration = performance.now() - startTime;
          this.log('debug', `[${channelName}] Response`, {
            duration: `${duration.toFixed(2)}ms`,
          });
        }

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        this.log('error', `[${channelName}] Error`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          duration: `${duration.toFixed(2)}ms`,
        });

        // Re-throw to propagate to renderer
        throw this.normalizeError(error);
      }
    });

    this.registeredChannels.push(channelName);
  }

  /**
   * Register a handler using a string channel name (for backward compatibility)
   */
  protected handleLegacy<TInput, TOutput>(
    channelName: string,
    handler: (input: TInput, ctx: HandlerContext) => Promise<TOutput>
  ): void {
    ipcMain.handle(channelName, async (event, input: TInput) => {
      const startTime = performance.now();
      const ctx: HandlerContext = { event, startTime };

      try {
        if (this.logRequests) {
          this.log('debug', `[${channelName}] Request`, { input });
        }

        const result = await handler(input, ctx);

        if (this.logRequests) {
          const duration = performance.now() - startTime;
          this.log('debug', `[${channelName}] Response`, {
            duration: `${duration.toFixed(2)}ms`,
          });
        }

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        this.log('error', `[${channelName}] Error`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          duration: `${duration.toFixed(2)}ms`,
        });

        throw this.normalizeError(error);
      }
    });

    this.registeredChannels.push(channelName);
  }

  /**
   * Normalize error for IPC transmission
   */
  private normalizeError(error: unknown): Error {
    if (error instanceof Error) {
      // Create a plain error that can be serialized
      const normalizedError = new Error(error.message);
      normalizedError.name = error.name;
      normalizedError.stack = error.stack;
      return normalizedError;
    }
    return new Error(String(error));
  }

  /**
   * Log a message. Override for custom logging.
   */
  protected log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    context?: Record<string, unknown>
  ): void {
    const prefix = `[IPC:${this.name}]`;
    const fullMessage = `${prefix} ${message}`;

    switch (level) {
      case 'debug':
        // Debug logging disabled in production
        break;
      case 'info':
        // Info logging disabled in production
        break;
      case 'warn':
        console.warn(fullMessage, context ?? '');
        break;
      case 'error':
        console.error(fullMessage, context ?? '');
        break;
    }
  }
}

/**
 * Handler registry for managing multiple handlers
 */
export class HandlerRegistry {
  private handlers: Map<string, IpcHandler> = new Map();

  /**
   * Register a handler
   */
  register(handler: IpcHandler): void {
    const name = (handler as unknown as { name: string }).name;
    if (this.handlers.has(name)) {
      console.warn(
        `[HandlerRegistry] Handler "${name}" is already registered, replacing...`
      );
      this.handlers.get(name)?.cleanup();
    }

    handler.register();
    this.handlers.set(name, handler);
  }

  /**
   * Unregister a handler by name
   */
  unregister(name: string): void {
    const handler = this.handlers.get(name);
    if (handler) {
      handler.cleanup();
      this.handlers.delete(name);
    }
  }

  /**
   * Cleanup all handlers
   */
  cleanup(): void {
    for (const handler of this.handlers.values()) {
      handler.cleanup();
    }
    this.handlers.clear();
  }

  /**
   * Get a handler by name
   */
  get(name: string): IpcHandler | undefined {
    return this.handlers.get(name);
  }

  /**
   * Get all registered handler names
   */
  getNames(): string[] {
    return Array.from(this.handlers.keys());
  }
}

// Global registry instance
export const handlerRegistry = new HandlerRegistry();
