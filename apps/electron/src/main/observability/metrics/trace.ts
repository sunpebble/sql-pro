/**
 * Performance Tracing Service
 *
 * Provides performance measurement and tracing for operations.
 */

import { getLogger } from '../logger';

export interface TraceSpan {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
  parentId?: string;
}

export interface TraceOptions {
  slowThreshold?: number; // Log warning if operation exceeds this (ms)
  metadata?: Record<string, unknown>;
}

const DEFAULT_SLOW_THRESHOLD = 1000; // 1 second

class TraceContext {
  private spans: Map<string, TraceSpan> = new Map();
  private currentSpanId: string | null = null;
  private slowThreshold: number;

  constructor(slowThreshold = DEFAULT_SLOW_THRESHOLD) {
    this.slowThreshold = slowThreshold;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  startSpan(name: string, options?: TraceOptions): string {
    const id = this.generateId();
    const span: TraceSpan = {
      id,
      name,
      startTime: performance.now(),
      parentId: this.currentSpanId ?? undefined,
      metadata: options?.metadata,
    };

    this.spans.set(id, span);
    this.currentSpanId = id;

    return id;
  }

  endSpan(id: string, options?: TraceOptions): TraceSpan | null {
    const span = this.spans.get(id);
    if (!span) return null;

    span.endTime = performance.now();
    span.duration = span.endTime - span.startTime;

    if (options?.metadata) {
      span.metadata = { ...span.metadata, ...options.metadata };
    }

    // Restore parent as current
    this.currentSpanId = span.parentId ?? null;

    // Log slow operations
    const threshold = options?.slowThreshold ?? this.slowThreshold;
    if (span.duration > threshold) {
      try {
        const logger = getLogger().child('trace');
        logger.warn(`Slow operation: ${span.name}`, {
          duration: `${span.duration.toFixed(2)}ms`,
          threshold: `${threshold}ms`,
          ...span.metadata,
        });
      } catch {
        // Logger not initialized
      }
    }

    return span;
  }

  getSpan(id: string): TraceSpan | undefined {
    return this.spans.get(id);
  }

  getCurrentSpanId(): string | null {
    return this.currentSpanId;
  }

  clear(): void {
    this.spans.clear();
    this.currentSpanId = null;
  }
}

// Global trace context
const traceContext = new TraceContext();

/**
 * Start a trace span
 */
export function startTrace(name: string, options?: TraceOptions): string {
  return traceContext.startSpan(name, options);
}

/**
 * End a trace span
 */
export function endTrace(id: string, options?: TraceOptions): TraceSpan | null {
  return traceContext.endSpan(id, options);
}

/**
 * Trace a function execution
 */
export async function trace<T>(
  name: string,
  fn: () => Promise<T>,
  options?: TraceOptions
): Promise<T> {
  const id = startTrace(name, options);
  try {
    const result = await fn();
    endTrace(id);
    return result;
  } catch (error) {
    endTrace(id, { metadata: { error: String(error) } });
    throw error;
  }
}

/**
 * Trace a synchronous function execution
 */
export function traceSync<T>(
  name: string,
  fn: () => T,
  options?: TraceOptions
): T {
  const id = startTrace(name, options);
  try {
    const result = fn();
    endTrace(id);
    return result;
  } catch (error) {
    endTrace(id, { metadata: { error: String(error) } });
    throw error;
  }
}

/**
 * Decorator for tracing class methods
 */
export function Traced(options?: TraceOptions) {
  return function (
    _target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const className = this.constructor.name;
      const traceName = `${className}.${propertyKey}`;
      return trace(traceName, () => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
}

export { TraceContext, traceContext };
