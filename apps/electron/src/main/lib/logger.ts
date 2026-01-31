import path from 'node:path';
import { app } from 'electron';
import log from 'electron-log';

/**
 * Log levels supported by the application logger
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Optional context for log entries
 */
export interface LogContext {
  [key: string]: unknown;
}

/**
 * Application logger for the Electron main process
 *
 * Features:
 * - Writes to console and file
 * - Automatic timestamps and log levels
 * - Optional context objects
 * - File rotation and size limits
 */
class AppLogger {
  constructor() {
    // Configure electron-log
    log.transports.file.level = 'info';
    log.transports.console.level = 'debug';

    // Set log file location
    const logPath = path.join(app.getPath('userData'), 'logs', 'main.log');
    log.transports.file.resolvePathFn = () => logPath;

    // Configure file rotation (10MB max, keep 5 files)
    log.transports.file.maxSize = 10 * 1024 * 1024;

    // Format: [2024-01-31 15:30:45.123] [info] Message
    log.transports.file.format =
      '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
    log.transports.console.format =
      '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: LogContext): void {
    if (context) {
      log.debug(message, context);
    } else {
      log.debug(message);
    }
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    if (context) {
      log.info(message, context);
    } else {
      log.info(message);
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    if (context) {
      log.warn(message, context);
    } else {
      log.warn(message);
    }
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = context ? { ...context } : {};

    if (error instanceof Error) {
      errorContext.errorName = error.name;
      errorContext.errorMessage = error.message;
      errorContext.errorStack = error.stack;
    } else if (error) {
      errorContext.error = String(error);
    }

    if (Object.keys(errorContext).length > 0) {
      log.error(message, errorContext);
    } else {
      log.error(message);
    }
  }

  /**
   * Set the minimum log level for file output
   */
  setFileLevel(level: LogLevel): void {
    log.transports.file.level = level;
  }

  /**
   * Set the minimum log level for console output
   */
  setConsoleLevel(level: LogLevel): void {
    log.transports.console.level = level;
  }

  /**
   * Get the path to the log file
   */
  getLogPath(): string {
    return log.transports.file.getFile().path;
  }
}

// Singleton instance
export const logger = new AppLogger();
