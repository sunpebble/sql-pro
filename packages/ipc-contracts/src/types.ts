import type { z } from 'zod';

/**
 * Represents an IPC channel with typed input and output
 */
export interface IpcChannel<TInput = void, TOutput = void> {
  readonly name: string;
  readonly _input: TInput;
  readonly _output: TOutput;
}

/**
 * Represents a streaming IPC channel
 */
export interface IpcStreamChannel<TInput = void, TChunk = unknown> {
  readonly name: string;
  readonly _input: TInput;
  readonly _chunk: TChunk;
}

/**
 * Extract input type from a channel
 */
export type ChannelInput<T> =
  T extends IpcChannel<infer I, unknown> ? I : never;

/**
 * Extract output type from a channel
 */
export type ChannelOutput<T> =
  T extends IpcChannel<unknown, infer O> ? O : never;

/**
 * Extract chunk type from a stream channel
 */
export type StreamChunk<T> =
  T extends IpcStreamChannel<unknown, infer C> ? C : never;

/**
 * IPC error response structure
 */
export interface IpcError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * IPC response wrapper
 */
export type IpcResponse<T> =
  | { success: true; data: T }
  | { success: false; error: IpcError };

/**
 * Handler function type for main process
 * Note: Electron types are available when used in main process context
 */
export type IpcHandler<TInput, TOutput> = (
  input: TInput,
  event: { sender: unknown; frameId: number }
) => Promise<TOutput>;

/**
 * Schema-based channel definition
 */
export interface SchemaChannel<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType,
> {
  readonly name: string;
  readonly inputSchema: TInputSchema;
  readonly outputSchema: TOutputSchema;
}
