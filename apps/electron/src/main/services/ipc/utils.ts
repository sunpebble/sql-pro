import type { IpcMainInvokeEvent } from 'electron';

type SuccessResult<R> = { success: true } & R;
interface ErrorResult { success: false; error: string }
type HandlerResult<R> = SuccessResult<R> | ErrorResult;

/**
 * Wraps an async handler with consistent error handling
 */
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
      };
    }
  };
}
