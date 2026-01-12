/**
 * Utility functions for safe error handling in catch blocks.
 *
 * TypeScript catch blocks receive `unknown` type errors.
 * This module provides type-safe ways to extract error messages.
 */

/**
 * Safely extracts an error message from an unknown error value.
 *
 * @param error - The caught error value (could be anything)
 * @returns A string error message
 *
 * @example
 * try {
 *   await someAsyncOperation();
 * } catch (error) {
 *   return { error: getErrorMessage(error) };
 * }
 */
export function getErrorMessage(error: unknown): string {
  // Standard Error object
  if (error instanceof Error) {
    return error.message;
  }

  // String thrown directly
  if (typeof error === 'string') {
    return error;
  }

  // Object with message property (error-like)
  if (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  // Fallback for unknown types
  return 'An unknown error occurred';
}

/**
 * Safely extracts error details including stack trace if available.
 *
 * @param error - The caught error value
 * @returns An object with message and optional stack
 */
export function getErrorDetails(error: unknown): {
  message: string;
  stack?: string;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: getErrorMessage(error),
  };
}
