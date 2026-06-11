/**
 * Minimal createHandler utility
 * Used by the agent service for wrapping IPC handlers with error catching.
 * Originally in services/ipc/utils.ts — moved here when legacy IPC handlers were removed.
 */

import type { IpcMainInvokeEvent } from 'electron';

type HandlerResult<R extends object> = { success: boolean } & R;

export function createHandler<T, R extends object>(
  handler: (request: T) => Promise<R>
): (_event: IpcMainInvokeEvent, request: T) => Promise<HandlerResult<R>> {
  return async (_event, request) => {
    try {
      const result = await handler(request);
      return { success: true as const, ...result };
    } catch (error) {
      return {
        success: false as const,
        error: error instanceof Error ? error.message : 'Operation failed',
      } as unknown as HandlerResult<R>;
    }
  };
}
