import type { IpcChannel, IpcStreamChannel } from './types';

/**
 * Create a typed IPC channel
 */
export function channel<TInput = void, TOutput = void>(
  name: string
): IpcChannel<TInput, TOutput> {
  return {
    name,
    _input: undefined as unknown as TInput,
    _output: undefined as unknown as TOutput,
  };
}

/**
 * Create a typed streaming IPC channel
 */
export function streamChannel<TInput = void, TChunk = unknown>(
  name: string
): IpcStreamChannel<TInput, TChunk> {
  return {
    name,
    _input: undefined as unknown as TInput,
    _chunk: undefined as unknown as TChunk,
  };
}

/**
 * Type-safe channel namespace creator
 */
export function createChannelNamespace<
  T extends Record<string, IpcChannel<unknown, unknown>>,
>(prefix: string, channels: T): T {
  return Object.fromEntries(
    Object.entries(channels).map(([key, ch]) => [
      key,
      { ...ch, name: `${prefix}:${ch.name}` },
    ])
  ) as T;
}
