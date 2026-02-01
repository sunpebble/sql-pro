/**
 * @deprecated Use @observability/logger instead
 * This file is maintained for backward compatibility
 */

import type {LogContext, LogLevel} from '../observability/logger';
import path from 'node:path';
import { app } from 'electron';

import log from 'electron-log';
// Import new logger system
import {
  getLogger as getNewLogger,
  initializeLogger
  
  
} from '../observability/logger';
import { ConsoleTransport } from '../observability/logger/console-transport';
import { FileTransport } from '../observability/logger/file-transport';

// Re-export types from new logger
export type { LogContext, LogLevel } from '../observability/logger';

/**
 * @deprecated Application logger for the Electron main process
 * Use the new observability logger instead
 */
class AppLogger {
  private initialized = false;

  constructor() {
    // Configure electron-log for backward compatibility
    log.transports.file.level = 'info';
    log.transports.console.level = 'debug';

    const logPath = path.join(app.getPath('userData'), 'logs', 'main.log');
    log.transports.file.resolvePathFn = () => logPath;

    log.transports.file.maxSize = 10 * 1024 * 1024;

    log.transports.file.format =
      '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
    log.transports.console.format =
      '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';

    // Initialize new logger system
    this.initNewLogger(logPath);
  }

  private initNewLogger(logPath: string): void {
    if (this.initialized) return;
    this.initialized = true;

    try {
      initializeLogger({
        namespace: 'sqlpro',
        level: 'info',
        transports: [
          new ConsoleTransport({ colorize: true, timestamps: true }),
          new FileTransport({
            path: logPath,
            maxSize: 10 * 1024 * 1024,
            maxFiles: 5,
          }),
        ],
      });
    } catch {
      // Logger might already be initialized
    }
  }

  debug(message: string, context?: LogContext): void {
    if (context) {
      log.debug(message, context);
    } else {
      log.debug(message);
    }
    // Also log to new system
    try {
      getNewLogger().debug(message, context);
    } catch {
      // New logger not ready
    }
  }

  info(message: string, context?: LogContext): void {
    if (context) {
      log.info(message, context);
    } else {
      log.info(message);
    }
    try {
      getNewLogger().info(message, context);
    } catch {
      // New logger not ready
    }
  }

  warn(message: string, context?: LogContext): void {
    if (context) {
      log.warn(message, context);
    } else {
      log.warn(message);
    }
    try {
      getNewLogger().warn(message, context);
    } catch {
      // New logger not ready
    }
  }

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

    try {
      getNewLogger().error(message, errorContext);
    } catch {
      // New logger not ready
    }
  }

  setFileLevel(level: LogLevel): void {
    log.transports.file.level = level;
  }

  setConsoleLevel(level: LogLevel): void {
    log.transports.console.level = level;
  }

  getLogPath(): string {
    return log.transports.file.getFile().path;
  }
}

// Singleton instance
export const logger = new AppLogger();
