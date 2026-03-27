/**
 * Error Utilities
 *
 * Centralized error handling utilities for consistent error processing
 * across the renderer process. Provides type-safe error extraction,
 * network error detection, user-friendly formatting, and logging.
 */

// Regex patterns for cleaning error messages
const ERROR_PREFIX_REGEX = /^Error:\s*/i;
const UNCAUGHT_PREFIX_REGEX = /^Uncaught\s*/i;
const EXCEPTION_PREFIX_REGEX = /^Exception:\s*/i;

// ============================================================================
// Types
// ============================================================================

/**
 * Error-like object with a message property
 */
interface ErrorLike {
  message: string;
  name?: string;
  stack?: string;
  code?: string | number;
}

/**
 * Network error codes commonly encountered
 */
const NETWORK_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'ETIMEDOUT',
  'ENETUNREACH',
  'EHOSTUNREACH',
  'ECONNABORTED',
  'ERR_NETWORK',
  'ERR_INTERNET_DISCONNECTED',
  'ERR_NAME_NOT_RESOLVED',
  'ERR_CONNECTION_REFUSED',
  'ERR_CONNECTION_RESET',
  'ERR_CONNECTION_TIMED_OUT',
]);

/**
 * Network error message patterns
 */
const NETWORK_ERROR_PATTERNS = [
  /network/i,
  /internet/i,
  /offline/i,
  /connection refused/i,
  /connection reset/i,
  /timed? ?out/i,
  /unreachable/i,
  /dns/i,
  /fetch failed/i,
  /failed to fetch/i,
  /network request failed/i,
  /no internet/i,
];

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Safely extracts an error message from an unknown error value.
 *
 * Handles:
 * - Standard Error objects
 * - Strings thrown directly
 * - Objects with message property
 * - Unknown types (fallback)
 *
 * @param error - The caught error value (could be anything)
 * @param fallback - Fallback message if error cannot be parsed (default: 'Unknown error')
 * @returns A string error message
 *
 * @example
 * ```typescript
 * try {
 *   await someAsyncOperation();
 * } catch (error) {
 *   const message = getErrorMessage(error);
 *   console.error(message);
 * }
 * ```
 */
export function getErrorMessage(
  error: unknown,
  fallback = 'Unknown error'
): string {
  // Standard Error object
  if (error instanceof Error) {
    return error.message;
  }

  // String thrown directly
  if (typeof error === 'string') {
    return error;
  }

  // Object with message property (error-like)
  if (isErrorLike(error)) {
    return error.message;
  }

  // Fallback for unknown types
  return fallback;
}

/**
 * Type guard to check if a value is error-like (has a message property)
 */
function isErrorLike(value: unknown): value is ErrorLike {
  return (
    value !== null &&
    typeof value === 'object' &&
    'message' in value &&
    typeof (value as ErrorLike).message === 'string'
  );
}

/**
 * Determines if an error is a network-related error.
 *
 * Checks:
 * - Error code (ECONNREFUSED, ETIMEDOUT, etc.)
 * - Error message patterns (network, offline, connection, etc.)
 * - TypeError with 'fetch' in message (common for network failures)
 *
 * @param error - The error to check
 * @returns true if the error appears to be network-related
 *
 * @example
 * ```typescript
 * try {
 *   await fetch(url);
 * } catch (error) {
 *   if (isNetworkError(error)) {
 *     showOfflineMessage();
 *   } else {
 *     showGenericError();
 *   }
 * }
 * ```
 */
export function isNetworkError(error: unknown): boolean {
  // Check error code
  if (error !== null && typeof error === 'object') {
    const errorWithCode = error as { code?: string | number };
    if (
      errorWithCode.code &&
      NETWORK_ERROR_CODES.has(String(errorWithCode.code))
    ) {
      return true;
    }
  }

  // Check error message
  const message = getErrorMessage(error, '');
  if (!message) return false;

  // Check for TypeError with fetch (common network failure pattern)
  if (error instanceof TypeError && message.toLowerCase().includes('fetch')) {
    return true;
  }

  // Check message patterns
  return NETWORK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Formats an error into a user-friendly message.
 *
 * - Simplifies technical error messages
 * - Provides context-appropriate messages for network errors
 * - Handles common error patterns
 *
 * @param error - The error to format
 * @param context - Optional context to include in the message
 * @returns A user-friendly error message
 *
 * @example
 * ```typescript
 * try {
 *   await saveData();
 * } catch (error) {
 *   toast.error(formatErrorForUser(error, 'saving data'));
 * }
 * ```
 */
export function formatErrorForUser(error: unknown, context?: string): string {
  // Handle network errors specially
  if (isNetworkError(error)) {
    const base = 'Network error. Please check your internet connection.';
    return context ? `${base} (${context})` : base;
  }

  const message = getErrorMessage(error);

  // Clean up common technical prefixes
  let cleanMessage = message
    .replace(ERROR_PREFIX_REGEX, '')
    .replace(UNCAUGHT_PREFIX_REGEX, '')
    .replace(EXCEPTION_PREFIX_REGEX, '');

  // Capitalize first letter
  if (cleanMessage.length > 0) {
    cleanMessage = cleanMessage.charAt(0).toUpperCase() + cleanMessage.slice(1);
  }

  // Add context if provided
  if (context) {
    return `${cleanMessage} (while ${context})`;
  }

  return cleanMessage;
}

/**
 * Logs an error with consistent formatting and optional context.
 *
 * Features:
 * - Consistent log format across the application
 * - Includes stack trace when available
 * - Supports optional context string
 * - Handles non-Error objects gracefully
 *
 * @param error - The error to log
 * @param context - Optional context describing where the error occurred
 *
 * @example
 * ```typescript
 * try {
 *   await processData();
 * } catch (error) {
 *   logError(error, 'processing user data');
 *   // Handle error...
 * }
 * ```
 */
export function logError(error: unknown, context?: string): void {
  const prefix = context ? `[${context}]` : '[Error]';
  const message = getErrorMessage(error);

  // Log the main error message
  console.error(`${prefix} ${message}`);

  // Log stack trace if available
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  } else if (isErrorLike(error) && error.stack) {
    console.error(error.stack);
  }

  // Log additional error properties for debugging
  if (error !== null && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    const additionalProps: Record<string, unknown> = {};

    // Collect non-standard properties
    for (const key of Object.keys(errorObj)) {
      if (!['message', 'name', 'stack'].includes(key)) {
        additionalProps[key] = errorObj[key];
      }
    }

    if (Object.keys(additionalProps).length > 0) {
      console.error(`${prefix} Additional error info:`, additionalProps);
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Safely extracts error details including stack trace if available.
 *
 * @param error - The caught error value
 * @returns An object with message, name, stack, and code if available
 */
export function getErrorDetails(error: unknown): {
  message: string;
  name?: string;
  stack?: string;
  code?: string | number;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: (error as Error & { code?: string | number }).code,
    };
  }

  if (isErrorLike(error)) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code,
    };
  }

  return {
    message: getErrorMessage(error),
  };
}

/**
 * Creates a standardized error response object.
 * Useful for IPC handlers and API responses.
 *
 * @param error - The error to convert
 * @param fallbackMessage - Fallback message if error cannot be parsed
 * @returns A standardized error response
 */
export function createErrorResponse(
  error: unknown,
  fallbackMessage = 'An unexpected error occurred'
): { success: false; error: string } {
  return {
    success: false as const,
    error: getErrorMessage(error, fallbackMessage),
  };
}

/**
 * Wraps an async function with error handling.
 * Returns a tuple of [result, error] similar to Go-style error handling.
 *
 * @param fn - The async function to wrap
 * @returns A tuple of [result, null] on success or [null, error] on failure
 *
 * @example
 * ```typescript
 * const [data, error] = await tryCatch(() => fetchData());
 * if (error) {
 *   logError(error, 'fetching data');
 *   return;
 * }
 * // Use data safely
 * ```
 */
export async function tryCatch<T>(
  fn: () => Promise<T>
): Promise<[T, null] | [null, Error]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (error) {
    const err =
      error instanceof Error ? error : new Error(getErrorMessage(error));
    return [null, err];
  }
}
