/**
 * Unified Logger Service
 *
 * Provides structured logging with multiple transports, namespacing,
 * and configurable log levels.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  namespace: string;
  message: string;
  context?: LogContext;
  timestamp: Date;
}

export interface Transport {
  name: string;
  log: (entry: LogEntry) => void;
  flush?: () => Promise<void>;
}

export interface LoggerOptions {
  namespace: string;
  level?: LogLevel;
  transports?: Transport[];
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private namespace: string;
  private level: LogLevel;
  private transports: Transport[];

  constructor(options: LoggerOptions) {
    this.namespace = options.namespace;
    this.level = options.level ?? 'info';
    this.transports = options.transports ?? [];
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): LogEntry {
    return {
      level,
      namespace: this.namespace,
      message,
      context,
      timestamp: new Date(),
    };
  }

  private emit(entry: LogEntry): void {
    for (const transport of this.transports) {
      try {
        transport.log(entry);
      } catch (error) {
        // Avoid infinite loop - don't log transport errors
        console.error(`[Logger] Transport "${transport.name}" failed:`, error);
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      this.emit(this.createEntry('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      this.emit(this.createEntry('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      this.emit(this.createEntry('warn', message, context));
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog('error')) {
      this.emit(this.createEntry('error', message, context));
    }
  }

  child(namespace: string): Logger {
    return new Logger({
      namespace: `${this.namespace}.${namespace}`,
      level: this.level,
      transports: this.transports,
    });
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  addTransport(transport: Transport): void {
    this.transports.push(transport);
  }

  removeTransport(name: string): void {
    this.transports = this.transports.filter((t) => t.name !== name);
  }

  async flush(): Promise<void> {
    await Promise.all(this.transports.map((t) => t.flush?.()).filter(Boolean));
  }
}

// Global logger instance
let globalLogger: Logger | null = null;

export function createLogger(options: LoggerOptions): Logger {
  return new Logger(options);
}

export function initializeLogger(options: LoggerOptions): Logger {
  globalLogger = new Logger(options);
  return globalLogger;
}

export function getLogger(): Logger {
  if (!globalLogger) {
    throw new Error('Logger not initialized. Call initializeLogger first.');
  }
  return globalLogger;
}

export function logger(): Logger {
  return getLogger();
}

export { Logger };
export type { Transport as LogTransport };
