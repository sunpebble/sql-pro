/**
 * Observability System
 *
 * Unified export for all observability services:
 * - Logger: Structured logging with transports
 * - Memory Monitor: Memory usage tracking and leak detection
 * - Trace: Performance measurement and tracing
 * - Error Boundary: Uncaught error handling
 */

// Error boundary exports
export {
  captureError,
  ErrorBoundary,
  type ErrorBoundaryOptions,
  type ErrorContext,
  type ErrorReport,
  getErrorBoundary,
  initializeErrorBoundary,
} from './errors/boundary';

// Logger exports
export {
  createLogger,
  getLogger,
  initializeLogger,
  type LogContext,
  type LogEntry,
  logger,
  Logger,
  type LoggerOptions,
  type LogLevel,
  type Transport as LogTransport,
} from './logger';
export {
  ConsoleTransport,
  type ConsoleTransportOptions,
} from './logger/console-transport';

export {
  FileTransport,
  type FileTransportOptions,
} from './logger/file-transport';

// Memory monitor exports
export {
  getMemoryMonitor,
  initializeMemoryMonitor,
  type MemoryMetrics,
  MemoryMonitor,
  memoryMonitor,
  type MemoryMonitorOptions,
  type MemoryThresholds,
} from './memory/monitor';

// Trace exports
export {
  endTrace,
  startTrace,
  trace,
  TraceContext,
  traceContext,
  Traced,
  type TraceOptions,
  type TraceSpan,
  traceSync,
} from './metrics/trace';
