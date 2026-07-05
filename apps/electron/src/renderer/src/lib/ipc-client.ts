/**
 * IPC Client
 *
 * Type-safe IPC client utilities for renderer process.
 * Re-exports the quarry API with additional type helpers.
 */

import { getAPI, quarry } from './api';

// ============================================
// Type Helpers
// ============================================

/**
 * Standard result type for IPC operations
 */
export interface IpcResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Wrap an async IPC call with error handling
 */
export async function wrapIpcCall<T>(
  call: () => Promise<T>
): Promise<IpcResult<T>> {
  try {
    const result = await call();
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if a result indicates success
 */
export function isSuccess<T extends { success: boolean }>(
  result: T
): result is T & { success: true } {
  return result.success === true;
}

/**
 * Check if a result indicates failure
 */
export function isError<T extends { success: boolean }>(
  result: T
): result is T & { success: false; error: string } {
  return result.success === false;
}

// Re-export the main API
export { getAPI, quarry };
