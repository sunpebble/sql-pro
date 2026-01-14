/**
 * IPC Retry Utility
 *
 * Provides retry logic for IPC calls to handle race conditions
 * where renderer may call IPC before main process handlers are fully registered.
 * This is particularly important when new windows are created.
 */

import { getErrorMessage } from './error-utils';

const DEFAULT_MAX_RETRIES = 5;
const DEFAULT_RETRY_DELAY_MS = 100;

/**
 * Execute an IPC call with retry logic
 * Uses exponential backoff to handle race conditions during window initialization
 *
 * @param fn - The async function to execute
 * @param options - Retry options
 * @param options.maxRetries - Maximum number of retry attempts (default: 5)
 * @param options.retryDelayMs - Base delay between retries in ms (default: 100)
 * @param options.silent - If true, don't log errors (default: false)
 * @returns The result of the function, or throws after all retries exhausted
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => window.sqlPro.ai.getSettings(),
 *   { silent: true }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelayMs?: number;
    /**
     * If true, don't log errors (useful for initialization calls
     * where failures are expected during startup)
     */
    silent?: boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    silent = false,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if this is a "no handler registered" error
      const errorMessage = getErrorMessage(error);
      const isHandlerNotRegistered =
        errorMessage.includes('No handler registered') ||
        errorMessage.includes('not defined');

      // If it's not a handler registration issue, throw immediately
      if (!isHandlerNotRegistered) {
        throw error;
      }

      // Wait before retrying with exponential backoff
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelayMs * 2 ** attempt)
        );
      }
    }
  }

  // All retries exhausted
  if (!silent) {
    console.error(`IPC call failed after ${maxRetries} retries:`, lastError);
  }
  throw lastError;
}

/**
 * Execute an IPC call with retry, returning a default value on failure
 * Useful for initialization calls where we want to proceed even if IPC fails
 *
 * @param fn - The async function to execute
 * @param defaultValue - The value to return if all retries fail
 * @param options - Retry options
 * @param options.maxRetries - Maximum number of retry attempts (default: 5)
 * @param options.retryDelayMs - Base delay between retries in ms (default: 100)
 * @param options.silent - If true, don't log errors (default: false)
 * @returns The result of the function, or the default value on failure
 */
export async function withRetryOrDefault<T>(
  fn: () => Promise<T>,
  defaultValue: T,
  options: {
    maxRetries?: number;
    retryDelayMs?: number;
    silent?: boolean;
  } = {}
): Promise<T> {
  try {
    return await withRetry(fn, { ...options, silent: true });
  } catch {
    return defaultValue;
  }
}
