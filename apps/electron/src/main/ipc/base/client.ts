/**
 * IPC Client for Renderer Process
 *
 * Provides type-safe IPC invocation from the renderer process.
 */

import type {
  ChannelInput,
  ChannelOutput,
  IpcChannel,
  IpcStreamChannel,
  StreamChunk,
} from '@sqlpro/ipc-contracts';

/**
 * Window API interface (exposed by preload)
 */
export interface WindowApi {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
  send: (channel: string, ...args: unknown[]) => void;
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
}

/**
 * Type-safe IPC client for renderer process
 */
export interface IpcClient {
  /**
   * Invoke an IPC channel with type safety
   */
  invoke: <TInput, TOutput>(
    channel: IpcChannel<TInput, TOutput>,
    input: TInput
  ) => Promise<TOutput>;

  /**
   * Invoke a channel by name (legacy support)
   */
  invokeLegacy: <TOutput>(channel: string, ...args: unknown[]) => Promise<TOutput>;

  /**
   * Subscribe to a streaming channel
   */
  subscribe: <TInput, TChunk>(
    channel: IpcStreamChannel<TInput, TChunk>,
    input: TInput,
    onChunk: (chunk: TChunk) => void
  ) => () => void;

  /**
   * Listen for events from main process
   */
  on: <T>(channel: string, callback: (data: T) => void) => () => void;

  /**
   * Send a one-way message to main process
   */
  send: (channel: string, ...args: unknown[]) => void;
}

/**
 * Create an IPC client using the preload API
 */
export function createIpcClient(api: WindowApi): IpcClient {
  return {
    invoke<TInput, TOutput>(
      channel: IpcChannel<TInput, TOutput>,
      input: TInput
    ): Promise<TOutput> {
      return api.invoke(channel.name, input) as Promise<TOutput>;
    },

    invokeLegacy<TOutput>(
      channelName: string,
      ...args: unknown[]
    ): Promise<TOutput> {
      return api.invoke(channelName, ...args) as Promise<TOutput>;
    },

    subscribe<TInput, TChunk>(
      channel: IpcStreamChannel<TInput, TChunk>,
      input: TInput,
      onChunk: (chunk: TChunk) => void
    ): () => void {
      const responseChannel = `${channel.name}:response:${Date.now()}`;

      // Set up listener for chunks
      const cleanup = api.on(responseChannel, (...args: unknown[]) => {
        const chunk = args[1] as TChunk;
        onChunk(chunk);
      });

      // Start the stream
      api.send(channel.name, { ...(input as object), responseChannel });

      return cleanup;
    },

    on<T>(channelName: string, callback: (data: T) => void): () => void {
      return api.on(channelName, (...args: unknown[]) => {
        const data = args[1] as T;
        callback(data);
      });
    },

    send(channelName: string, ...args: unknown[]): void {
      api.send(channelName, ...args);
    },
  };
}

/**
 * Type helper for extracting channel types
 */
export type InvokeArgs<T extends IpcChannel<unknown, unknown>> =
  ChannelInput<T>;
export type InvokeResult<T extends IpcChannel<unknown, unknown>> =
  ChannelOutput<T>;
export type StreamResult<T extends IpcStreamChannel<unknown, unknown>> =
  StreamChunk<T>;

// Declare window.api type for TypeScript
declare global {
  interface Window {
    api: {
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
      send: (channel: string, ...args: unknown[]) => void;
      on: (
        channel: string,
        callback: (...args: unknown[]) => void
      ) => () => void;
    };
  }
}
