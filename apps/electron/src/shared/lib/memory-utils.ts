/**
 * Memory size estimation utilities for JavaScript objects.
 *
 * Provides accurate estimation of object memory sizes for use in memory budgeting
 * and cache management. Handles common data structures used in query results
 * and schema data.
 *
 * @example
 * ```typescript
 * import { estimateObjectSize, formatBytes } from './memory-utils';
 *
 * const queryResult = { columns: ['id', 'name'], rows: [...] };
 * const sizeInBytes = estimateObjectSize(queryResult);
 * console.log(`Query result size: ${formatBytes(sizeInBytes)}`);
 * ```
 */

// Note: Buffer checks use runtime detection of global Buffer to support
// both Node.js (main process) and browser (renderer) environments.
// Do NOT import from 'node:buffer' as it will fail in browser context.

/**
 * Byte size constants for JavaScript primitive types.
 * Based on V8 internal representations.
 */
export const BYTE_SIZES = {
  /** Size of a reference/pointer in V8 (64-bit) */
  REFERENCE: 8,
  /** Size of a number (64-bit float) */
  NUMBER: 8,
  /** Size of a boolean */
  BOOLEAN: 4,
  /** Overhead for an object (hidden class, properties, elements) */
  OBJECT_OVERHEAD: 32,
  /** Overhead for an array (length, elements pointer) */
  ARRAY_OVERHEAD: 24,
  /** Overhead for a Map entry */
  MAP_ENTRY_OVERHEAD: 40,
  /** Overhead for a Set entry */
  SET_ENTRY_OVERHEAD: 24,
  /** Overhead for a string (length, hash, type tag) */
  STRING_OVERHEAD: 20,
  /** Size of a Date object */
  DATE: 48,
  /** Size of a RegExp object (base) */
  REGEXP: 64,
  /** Overhead for a function */
  FUNCTION_OVERHEAD: 64,
  /** Size for null/undefined reference */
  NULL_UNDEFINED: 8,
} as const;

/**
 * Options for size estimation.
 */
export interface EstimateOptions {
  /**
   * Maximum depth to traverse for nested objects.
   * Prevents stack overflow on deeply nested structures.
   * @default 100
   */
  maxDepth?: number;

  /**
   * Whether to include function sizes in estimation.
   * Functions typically shouldn't be cached, so this is off by default.
   * @default false
   */
  includeFunctions?: boolean;

  /**
   * Whether to track seen objects for cycle detection.
   * Slightly slower but prevents infinite loops.
   * @default true
   */
  detectCycles?: boolean;
}

/**
 * Estimates the memory size of a JavaScript value in bytes.
 *
 * This is an approximation based on V8's internal representations.
 * The actual memory usage may vary based on:
 * - String interning
 * - Hidden classes sharing
 * - JIT compilation states
 *
 * @param value - The value to estimate size of
 * @param options - Estimation options
 * @returns Estimated size in bytes
 */
export function estimateObjectSize(
  value: unknown,
  options: EstimateOptions = {}
): number {
  const {
    maxDepth = 100,
    includeFunctions = false,
    detectCycles = true,
  } = options;

  const seen = detectCycles ? new WeakSet<object>() : null;

  function estimate(val: unknown, depth: number): number {
    // Check depth limit
    if (depth > maxDepth) {
      return 0;
    }

    // Handle null and undefined
    if (val === null || val === undefined) {
      return BYTE_SIZES.NULL_UNDEFINED;
    }

    const type = typeof val;

    // Handle primitives
    switch (type) {
      case 'boolean':
        return BYTE_SIZES.BOOLEAN;

      case 'number':
        return BYTE_SIZES.NUMBER;

      case 'bigint':
        // BigInt size depends on value, approximate with number of digits
        return Math.ceil(val.toString().length / 2) + 8;

      case 'string':
        // JavaScript strings are UTF-16 encoded (2 bytes per character)
        // Plus overhead for the string object itself
        return (val as string).length * 2 + BYTE_SIZES.STRING_OVERHEAD;

      case 'symbol': {
        // Symbols have a description string plus overhead
        const desc = (val as symbol).description;
        return (desc ? desc.length * 2 : 0) + BYTE_SIZES.STRING_OVERHEAD;
      }

      case 'function':
        if (!includeFunctions) {
          return 0;
        }
        // Functions are complex; use a reasonable estimate
        return BYTE_SIZES.FUNCTION_OVERHEAD;

      case 'object':
        // Handle as object below
        break;

      default:
        return BYTE_SIZES.REFERENCE;
    }

    // At this point, val is an object
    const obj = val as object;

    // Cycle detection
    if (seen) {
      if (seen.has(obj)) {
        return BYTE_SIZES.REFERENCE; // Already counted
      }
      seen.add(obj);
    }

    // Handle Buffer (Node.js) - uses global Buffer which is available in Node.js runtime
    // eslint-disable-next-line node/prefer-global/buffer -- Runtime check for Node.js environment
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(obj)) {
      // eslint-disable-next-line node/prefer-global/buffer
      return (obj as Buffer).byteLength + BYTE_SIZES.OBJECT_OVERHEAD;
    }

    // Handle ArrayBuffer
    if (obj instanceof ArrayBuffer) {
      return obj.byteLength + BYTE_SIZES.OBJECT_OVERHEAD;
    }

    // Handle TypedArrays (Uint8Array, Float64Array, etc.)
    if (ArrayBuffer.isView(obj)) {
      return (obj as ArrayBufferView).byteLength + BYTE_SIZES.OBJECT_OVERHEAD;
    }

    // Handle Date
    if (obj instanceof Date) {
      return BYTE_SIZES.DATE;
    }

    // Handle RegExp
    if (obj instanceof RegExp) {
      return BYTE_SIZES.REGEXP + obj.source.length * 2;
    }

    // Handle Map
    if (obj instanceof Map) {
      let size = BYTE_SIZES.OBJECT_OVERHEAD;
      for (const [key, mapValue] of obj) {
        size +=
          BYTE_SIZES.MAP_ENTRY_OVERHEAD +
          estimate(key, depth + 1) +
          estimate(mapValue, depth + 1);
      }
      return size;
    }

    // Handle Set
    if (obj instanceof Set) {
      let size = BYTE_SIZES.OBJECT_OVERHEAD;
      for (const item of obj) {
        size += BYTE_SIZES.SET_ENTRY_OVERHEAD + estimate(item, depth + 1);
      }
      return size;
    }

    // Handle WeakMap/WeakSet (can't iterate, just return overhead)
    if (obj instanceof WeakMap || obj instanceof WeakSet) {
      return BYTE_SIZES.OBJECT_OVERHEAD;
    }

    // Handle Error
    if (obj instanceof Error) {
      let size = BYTE_SIZES.OBJECT_OVERHEAD;
      size += estimate(obj.message, depth + 1);
      size += estimate(obj.stack, depth + 1);
      size += estimate(obj.name, depth + 1);
      return size;
    }

    // Handle Array
    if (Array.isArray(obj)) {
      let size = BYTE_SIZES.ARRAY_OVERHEAD;
      // Account for array slots (even empty ones take space)
      size += obj.length * BYTE_SIZES.REFERENCE;
      // Add size of each element
      for (let i = 0; i < obj.length; i++) {
        size += estimate(obj[i], depth + 1);
      }
      return size;
    }

    // Handle plain objects
    let size = BYTE_SIZES.OBJECT_OVERHEAD;

    // Get all own properties including non-enumerable
    const allKeys = Object.getOwnPropertyNames(obj);

    for (const key of allKeys) {
      // Property key size (interned strings may be shared, but we count them)
      size += key.length * 2 + BYTE_SIZES.REFERENCE;

      try {
        const propValue = (obj as Record<string, unknown>)[key];
        size += estimate(propValue, depth + 1);
      } catch {
        // Property access may throw (e.g., getters)
        size += BYTE_SIZES.REFERENCE;
      }
    }

    return size;
  }

  return estimate(value, 0);
}

/**
 * Estimates the size of a query result structure.
 * Optimized for the common query result shape with columns and rows.
 *
 * @param result - Query result with columns, rows, and optional resultSets
 * @param result.columns - Array of column names
 * @param result.rows - Array of row objects
 * @param result.resultSets - Optional array of additional result sets
 * @returns Estimated size in bytes
 */
export function estimateQueryResultSize(result: {
  columns: string[];
  rows: Record<string, unknown>[];
  resultSets?: Array<{ columns: string[]; rows: Record<string, unknown>[] }>;
}): number {
  let size = BYTE_SIZES.OBJECT_OVERHEAD;

  // Columns array
  size += BYTE_SIZES.ARRAY_OVERHEAD;
  for (const col of result.columns) {
    size += col.length * 2 + BYTE_SIZES.STRING_OVERHEAD + BYTE_SIZES.REFERENCE;
  }

  // Rows array
  size += BYTE_SIZES.ARRAY_OVERHEAD;
  size += result.rows.length * BYTE_SIZES.REFERENCE;

  for (const row of result.rows) {
    size += estimateRowSize(row);
  }

  // Handle multiple result sets
  if (result.resultSets) {
    size += BYTE_SIZES.ARRAY_OVERHEAD;
    for (const rs of result.resultSets) {
      size += estimateQueryResultSize(rs);
    }
  }

  return size;
}

/**
 * Estimates the size of a single row object.
 * Optimized for typical database row shapes.
 *
 * @param row - A row object with column values
 * @returns Estimated size in bytes
 */
export function estimateRowSize(row: Record<string, unknown>): number {
  let size = BYTE_SIZES.OBJECT_OVERHEAD;

  for (const [key, value] of Object.entries(row)) {
    // Key size
    size += key.length * 2 + BYTE_SIZES.REFERENCE;
    // Value size
    size += estimateValueSize(value);
  }

  return size;
}

/**
 * Estimates the size of a single value.
 * Fast path for common database value types.
 *
 * @param value - A value to estimate
 * @returns Estimated size in bytes
 */
export function estimateValueSize(value: unknown): number {
  if (value === null || value === undefined) {
    return BYTE_SIZES.NULL_UNDEFINED;
  }

  const type = typeof value;

  switch (type) {
    case 'boolean':
      return BYTE_SIZES.BOOLEAN;

    case 'number':
      return BYTE_SIZES.NUMBER;

    case 'bigint':
      return Math.ceil(value.toString().length / 2) + 8;

    case 'string':
      return (value as string).length * 2 + BYTE_SIZES.STRING_OVERHEAD;

    case 'object':
      // Common database types
      if (value instanceof Date) {
        return BYTE_SIZES.DATE;
      }
      // eslint-disable-next-line node/prefer-global/buffer -- Runtime check for Node.js environment
      if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
        // eslint-disable-next-line node/prefer-global/buffer
        return (value as Buffer).byteLength + BYTE_SIZES.OBJECT_OVERHEAD;
      }
      if (ArrayBuffer.isView(value)) {
        return value.byteLength + BYTE_SIZES.OBJECT_OVERHEAD;
      }
      if (Array.isArray(value)) {
        let size =
          BYTE_SIZES.ARRAY_OVERHEAD + value.length * BYTE_SIZES.REFERENCE;
        for (const item of value) {
          size += estimateValueSize(item);
        }
        return size;
      }
      // Fall back to full estimation for complex objects
      return estimateObjectSize(value, { maxDepth: 10 });

    default:
      return BYTE_SIZES.REFERENCE;
  }
}

/**
 * Estimates the size of schema data.
 * Optimized for TableSchema and related structures.
 *
 * @param schema - Schema object (TableSchema, ColumnSchema, etc.)
 * @returns Estimated size in bytes
 */
export function estimateSchemaSize(schema: unknown): number {
  return estimateObjectSize(schema, { maxDepth: 20 });
}

/**
 * Formats a byte count into a human-readable string.
 *
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const isNegative = bytes < 0;
  bytes = Math.abs(bytes);

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / k ** i;

  const formatted = `${value.toFixed(dm)} ${sizes[i]}`;
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Parses a human-readable byte string into a number.
 *
 * @param str - Formatted byte string (e.g., "1.5 MB", "100KB", "1024")
 * @returns Number of bytes
 * @throws Error if the format is invalid
 */
const BYTE_VALUE_WITH_UNIT_RE =
  /^(-?\d+(?:\.\d+)?)\s*(bytes?|b|kb?|mb?|gb?|tb?|pb?|eb?|zb?|yb?)?$/i;

export function parseBytes(str: string): number {
  const trimmed = str.trim();

  // Handle pure numbers
  const numOnly = Number.parseFloat(trimmed);
  if (!Number.isNaN(numOnly) && trimmed === String(numOnly)) {
    return numOnly;
  }

  const match = trimmed.match(BYTE_VALUE_WITH_UNIT_RE);
  if (!match) {
    throw new Error(`Invalid byte format: ${str}`);
  }

  const value = Number.parseFloat(match[1]);
  const unit = (match[2] || 'bytes').toLowerCase();

  const units: Record<string, number> = {
    byte: 1,
    bytes: 1,
    b: 1,
    k: 1024,
    kb: 1024,
    m: 1024 ** 2,
    mb: 1024 ** 2,
    g: 1024 ** 3,
    gb: 1024 ** 3,
    t: 1024 ** 4,
    tb: 1024 ** 4,
    p: 1024 ** 5,
    pb: 1024 ** 5,
    e: 1024 ** 6,
    eb: 1024 ** 6,
    z: 1024 ** 7,
    zb: 1024 ** 7,
    y: 1024 ** 8,
    yb: 1024 ** 8,
  };

  const multiplier = units[unit];
  if (multiplier === undefined) {
    throw new Error(`Unknown byte unit: ${unit}`);
  }

  return value * multiplier;
}

/**
 * Calculates the approximate memory size of an array of rows.
 * More efficient than estimating each row individually when rows share structure.
 *
 * @param rows - Array of row objects
 * @param sampleSize - Number of rows to sample for estimation (default: 100)
 * @returns Estimated total size in bytes
 */
export function estimateRowArraySize(
  rows: Record<string, unknown>[],
  sampleSize = 100
): number {
  if (rows.length === 0) {
    return BYTE_SIZES.ARRAY_OVERHEAD;
  }

  // For small arrays, estimate all rows
  if (rows.length <= sampleSize) {
    let size = BYTE_SIZES.ARRAY_OVERHEAD + rows.length * BYTE_SIZES.REFERENCE;
    for (const row of rows) {
      size += estimateRowSize(row);
    }
    return size;
  }

  // For large arrays, sample and extrapolate
  const step = Math.floor(rows.length / sampleSize);
  let sampleTotalSize = 0;
  let sampledCount = 0;

  for (let i = 0; i < rows.length; i += step) {
    sampleTotalSize += estimateRowSize(rows[i]);
    sampledCount++;
  }

  const avgRowSize = sampleTotalSize / sampledCount;
  const estimatedDataSize = avgRowSize * rows.length;

  return (
    BYTE_SIZES.ARRAY_OVERHEAD +
    rows.length * BYTE_SIZES.REFERENCE +
    estimatedDataSize
  );
}

/**
 * Size threshold utilities for quick decisions.
 */
export const SIZE_THRESHOLDS = {
  /** Considered a small object (< 1 KB) */
  SMALL: 1024,
  /** Considered a medium object (< 100 KB) */
  MEDIUM: 100 * 1024,
  /** Considered a large object (< 1 MB) */
  LARGE: 1024 * 1024,
  /** Considered a very large object (>= 1 MB) */
  VERY_LARGE: 1024 * 1024,
} as const;

/**
 * Categorizes the size of a value.
 *
 * @param bytes - Size in bytes
 * @returns Size category
 */
export function categorizeSize(
  bytes: number
): 'small' | 'medium' | 'large' | 'very-large' {
  if (bytes < SIZE_THRESHOLDS.SMALL) return 'small';
  if (bytes < SIZE_THRESHOLDS.MEDIUM) return 'medium';
  if (bytes < SIZE_THRESHOLDS.LARGE) return 'large';
  return 'very-large';
}

/**
 * Quick check if a value is likely to be large.
 * Faster than full size estimation for filtering.
 *
 * @param value - Value to check
 * @param threshold - Size threshold in bytes (default: 100KB)
 * @returns true if value is likely larger than threshold
 */
export function isLikelyLarge(
  value: unknown,
  threshold = SIZE_THRESHOLDS.MEDIUM
): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    // String length * 2 for UTF-16
    return value.length * 2 > threshold;
  }

  // eslint-disable-next-line node/prefer-global/buffer -- Runtime check for Node.js environment
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
    // eslint-disable-next-line node/prefer-global/buffer
    return (value as Buffer).byteLength > threshold;
  }

  if (ArrayBuffer.isView(value)) {
    return value.byteLength > threshold;
  }

  if (Array.isArray(value)) {
    // Rough estimate: if array has many items, it's likely large
    return value.length * 100 > threshold;
  }

  if (typeof value === 'object') {
    // Rough estimate: if object has many keys, it's likely large
    return Object.keys(value as object).length * 200 > threshold;
  }

  return false;
}
