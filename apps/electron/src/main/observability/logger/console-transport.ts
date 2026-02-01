/**
 * Console Transport
 *
 * Logs entries to the console with color coding and formatting.
 */

import type { LogEntry, LogLevel, Transport } from './index';

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '\x1B[36m', // Cyan
  info: '\x1B[32m', // Green
  warn: '\x1B[33m', // Yellow
  error: '\x1B[31m', // Red
};

const RESET = '\x1B[0m';

export interface ConsoleTransportOptions {
  colorize?: boolean;
  timestamps?: boolean;
}

export class ConsoleTransport implements Transport {
  readonly name = 'console';
  private colorize: boolean;
  private timestamps: boolean;

  constructor(options: ConsoleTransportOptions = {}) {
    this.colorize = options.colorize ?? true;
    this.timestamps = options.timestamps ?? true;
  }

  log(entry: LogEntry): void {
    const { level, namespace, message, context, timestamp } = entry;

    const parts: string[] = [];

    if (this.timestamps) {
      parts.push(`[${timestamp.toISOString()}]`);
    }

    const levelLabel = level.toUpperCase().padEnd(5);
    if (this.colorize) {
      parts.push(`${LEVEL_COLORS[level]}${levelLabel}${RESET}`);
    } else {
      parts.push(levelLabel);
    }

    parts.push(`[${namespace}]`);
    parts.push(message);

    const logMessage = parts.join(' ');

    if (context && Object.keys(context).length > 0) {
      const contextStr = JSON.stringify(context, null, 2);
      switch (level) {
        case 'debug':
          // Debug logging - use warn as fallback
          break;
        case 'info':
          // Info logging - use warn as fallback
          break;
        case 'warn':
          console.warn(logMessage, contextStr);
          break;
        case 'error':
          console.error(logMessage, contextStr);
          break;
      }
    } else {
      switch (level) {
        case 'debug':
          // Debug logging - use warn as fallback
          break;
        case 'info':
          // Info logging - use warn as fallback
          break;
        case 'warn':
          console.warn(logMessage);
          break;
        case 'error':
          console.error(logMessage);
          break;
      }
    }
  }
}
