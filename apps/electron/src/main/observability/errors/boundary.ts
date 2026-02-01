/**
 * Error Boundary Service
 *
 * Captures and reports uncaught exceptions and unhandled rejections.
 */

import process from 'node:process';
import { getLogger } from '../logger';

export interface ErrorContext {
  version?: string;
  platform?: string;
  connectionState?: string;
  [key: string]: unknown;
}

export interface ErrorReport {
  error: Error;
  context: ErrorContext;
  timestamp: Date;
  type: 'uncaughtException' | 'unhandledRejection' | 'caught';
}

export interface ErrorBoundaryOptions {
  onError?: (report: ErrorReport) => void;
  getContext?: () => ErrorContext;
  exitOnUncaught?: boolean;
}

class ErrorBoundary {
  private options: ErrorBoundaryOptions;
  private errorHistory: ErrorReport[] = [];
  private maxHistorySize = 50;
  private isInitialized = false;

  constructor(options: ErrorBoundaryOptions = {}) {
    this.options = options;
  }

  initialize(): void {
    if (this.isInitialized) return;

    process.on('uncaughtException', (error: Error) => {
      this.handleError(error, 'uncaughtException');

      if (this.options.exitOnUncaught !== false) {
        // Give time for logging before exit
        setTimeout(() => process.exit(1), 1000);
      }
    });

    process.on('unhandledRejection', (reason: unknown) => {
      const error =
        reason instanceof Error ? reason : new Error(String(reason));
      this.handleError(error, 'unhandledRejection');
    });

    this.isInitialized = true;
  }

  private handleError(error: Error, type: ErrorReport['type']): void {
    const context = this.options.getContext?.() ?? {};
    const report: ErrorReport = {
      error,
      context,
      timestamp: new Date(),
      type,
    };

    this.errorHistory.push(report);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
    }

    try {
      const logger = getLogger().child('error-boundary');
      logger.error(`${type}: ${error.message}`, {
        stack: error.stack,
        ...context,
      });
    } catch {
      // Logger not initialized, fallback to console
      console.error(`[ErrorBoundary] ${type}:`, error);
    }

    this.options.onError?.(report);
  }

  captureError(
    error: Error,
    additionalContext?: Record<string, unknown>
  ): void {
    const context = {
      ...this.options.getContext?.(),
      ...additionalContext,
    };

    const report: ErrorReport = {
      error,
      context,
      timestamp: new Date(),
      type: 'caught',
    };

    this.errorHistory.push(report);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
    }

    try {
      const logger = getLogger().child('error-boundary');
      logger.error(`Caught error: ${error.message}`, {
        stack: error.stack,
        ...context,
      });
    } catch {
      console.error('[ErrorBoundary] Caught error:', error);
    }

    this.options.onError?.(report);
  }

  getErrorHistory(): ErrorReport[] {
    return [...this.errorHistory];
  }

  clearHistory(): void {
    this.errorHistory = [];
  }
}

// Singleton instance
let errorBoundary: ErrorBoundary | null = null;

export function initializeErrorBoundary(
  options?: ErrorBoundaryOptions
): ErrorBoundary {
  errorBoundary = new ErrorBoundary(options);
  errorBoundary.initialize();
  return errorBoundary;
}

export function getErrorBoundary(): ErrorBoundary {
  if (!errorBoundary) {
    throw new Error(
      'ErrorBoundary not initialized. Call initializeErrorBoundary first.'
    );
  }
  return errorBoundary;
}

export function captureError(
  error: Error,
  context?: Record<string, unknown>
): void {
  getErrorBoundary().captureError(error, context);
}

export { ErrorBoundary };
