/**
 * File Transport
 *
 * Logs entries to a file with automatic rotation support.
 */

import type { WriteStream } from 'node:fs';
import type { LogEntry, Transport } from './index';
import { Buffer } from 'node:buffer';
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  renameSync,
  statSync,
} from 'node:fs';
import { dirname } from 'node:path';

export interface FileTransportOptions {
  path: string;
  maxSize?: number; // Max file size in bytes before rotation (default: 10MB)
  maxFiles?: number; // Max number of rotated files to keep (default: 5)
  timestamps?: boolean;
}

export class FileTransport implements Transport {
  readonly name = 'file';
  private path: string;
  private maxSize: number;
  private maxFiles: number;
  private timestamps: boolean;
  private stream: WriteStream | null = null;
  private currentSize: number = 0;
  private buffer: string[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(options: FileTransportOptions) {
    this.path = options.path;
    this.maxSize = options.maxSize ?? 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles ?? 5;
    this.timestamps = options.timestamps ?? true;

    this.ensureDirectory();
    this.initStream();
  }

  private ensureDirectory(): void {
    const dir = dirname(this.path);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  private initStream(): void {
    if (existsSync(this.path)) {
      this.currentSize = statSync(this.path).size;
    }

    this.stream = createWriteStream(this.path, { flags: 'a' });
  }

  private formatEntry(entry: LogEntry): string {
    const { level, namespace, message, context, timestamp } = entry;

    const parts: string[] = [];

    if (this.timestamps) {
      parts.push(`[${timestamp.toISOString()}]`);
    }

    parts.push(level.toUpperCase().padEnd(5));
    parts.push(`[${namespace}]`);
    parts.push(message);

    if (context && Object.keys(context).length > 0) {
      parts.push(JSON.stringify(context));
    }

    return `${parts.join(' ')  }\n`;
  }

  private rotate(): void {
    if (!this.stream) return;

    this.stream.end();

    // Rotate existing files
    for (let i = this.maxFiles - 1; i >= 1; i--) {
      const oldPath = i === 1 ? this.path : `${this.path}.${i - 1}`;
      const newPath = `${this.path}.${i}`;
      if (existsSync(oldPath)) {
        renameSync(oldPath, newPath);
      }
    }

    this.currentSize = 0;
    this.initStream();
  }

  log(entry: LogEntry): void {
    const formatted = this.formatEntry(entry);
    this.buffer.push(formatted);

    // Debounce writes
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flushToFile();
      }, 100);
    }
  }

   
  private flushToFile(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (!this.stream || this.buffer.length === 0) return;

    const content = this.buffer.join('');
    this.buffer = [];

    const contentSize = Buffer.byteLength(content);

    if (this.currentSize + contentSize > this.maxSize) {
      this.rotate();
    }

    this.stream.write(content);
    this.currentSize += contentSize;
  }

  async flush(): Promise<void> {
    return new Promise((resolve) => {
      this.flushToFile();

      if (this.stream) {
        this.stream.once('drain', resolve);
        // If already drained, resolve immediately
        if (this.stream.writableLength === 0) {
          resolve();
        }
      } else {
        resolve();
      }
    });
  }

  close(): void {
    this.flushToFile();
    if (this.stream) {
      this.stream.end();
      this.stream = null;
    }
  }
}
