/**
 * Tests for memory-utils
 */
import { describe, expect, it } from 'vitest';
import {
  BYTE_SIZES,
  categorizeSize,
  estimateObjectSize,
  estimateQueryResultSize,
  estimateRowArraySize,
  estimateRowSize,
  estimateSchemaSize,
  estimateValueSize,
  formatBytes,
  isLikelyLarge,
  parseBytes,
  SIZE_THRESHOLDS,
} from './memory-utils';

describe('memoryUtils', () => {
  describe('estimateObjectSize', () => {
    describe('primitives', () => {
      it('should return correct size for null', () => {
        expect(estimateObjectSize(null)).toBe(BYTE_SIZES.NULL_UNDEFINED);
      });

      it('should return correct size for undefined', () => {
        expect(estimateObjectSize(undefined)).toBe(BYTE_SIZES.NULL_UNDEFINED);
      });

      it('should return correct size for boolean', () => {
        expect(estimateObjectSize(true)).toBe(BYTE_SIZES.BOOLEAN);
        expect(estimateObjectSize(false)).toBe(BYTE_SIZES.BOOLEAN);
      });

      it('should return correct size for number', () => {
        expect(estimateObjectSize(42)).toBe(BYTE_SIZES.NUMBER);
        expect(estimateObjectSize(3.14159)).toBe(BYTE_SIZES.NUMBER);
        expect(estimateObjectSize(0)).toBe(BYTE_SIZES.NUMBER);
        expect(estimateObjectSize(-1000)).toBe(BYTE_SIZES.NUMBER);
      });

      it('should return correct size for string', () => {
        const str = 'hello';
        const expected = str.length * 2 + BYTE_SIZES.STRING_OVERHEAD;
        expect(estimateObjectSize(str)).toBe(expected);
      });

      it('should handle empty string', () => {
        expect(estimateObjectSize('')).toBe(BYTE_SIZES.STRING_OVERHEAD);
      });

      it('should handle bigint', () => {
        const big = BigInt('12345678901234567890');
        const size = estimateObjectSize(big);
        expect(size).toBeGreaterThan(8);
      });

      it('should handle symbol', () => {
        const sym = Symbol('test');
        const size = estimateObjectSize(sym);
        expect(size).toBeGreaterThan(0);
      });

      it('should handle symbol without description', () => {
        // eslint-disable-next-line symbol-description
        const sym = Symbol();
        const size = estimateObjectSize(sym);
        expect(size).toBe(BYTE_SIZES.STRING_OVERHEAD);
      });
    });

    describe('functions', () => {
      it('should return 0 for functions by default', () => {
        expect(estimateObjectSize(() => {})).toBe(0);
        expect(estimateObjectSize(() => {})).toBe(0);
      });

      it('should include function size when option enabled', () => {
        const fn = () => {};
        expect(estimateObjectSize(fn, { includeFunctions: true })).toBe(
          BYTE_SIZES.FUNCTION_OVERHEAD
        );
      });
    });

    describe('arrays', () => {
      it('should handle empty array', () => {
        const size = estimateObjectSize([]);
        expect(size).toBe(BYTE_SIZES.ARRAY_OVERHEAD);
      });

      it('should handle array with primitives', () => {
        const arr = [1, 2, 3];
        const size = estimateObjectSize(arr);
        expect(size).toBe(
          BYTE_SIZES.ARRAY_OVERHEAD +
            arr.length * BYTE_SIZES.REFERENCE +
            arr.length * BYTE_SIZES.NUMBER
        );
      });

      it('should handle array with strings', () => {
        const arr = ['hello', 'world'];
        const size = estimateObjectSize(arr);
        const stringsSize =
          'hello'.length * 2 +
          BYTE_SIZES.STRING_OVERHEAD +
          ('world'.length * 2 + BYTE_SIZES.STRING_OVERHEAD);
        expect(size).toBe(
          BYTE_SIZES.ARRAY_OVERHEAD +
            arr.length * BYTE_SIZES.REFERENCE +
            stringsSize
        );
      });

      it('should handle nested arrays', () => {
        const arr = [
          [1, 2],
          [3, 4],
        ];
        const size = estimateObjectSize(arr);
        expect(size).toBeGreaterThan(BYTE_SIZES.ARRAY_OVERHEAD * 2);
      });
    });

    describe('objects', () => {
      it('should handle empty object', () => {
        const size = estimateObjectSize({});
        expect(size).toBe(BYTE_SIZES.OBJECT_OVERHEAD);
      });

      it('should handle object with primitives', () => {
        const obj = { a: 1, b: true, c: 'test' };
        const size = estimateObjectSize(obj);
        expect(size).toBeGreaterThan(BYTE_SIZES.OBJECT_OVERHEAD);
      });

      it('should handle nested objects', () => {
        const obj = { outer: { inner: { value: 42 } } };
        const size = estimateObjectSize(obj);
        expect(size).toBeGreaterThan(BYTE_SIZES.OBJECT_OVERHEAD * 3);
      });
    });

    describe('special objects', () => {
      it('should handle Date', () => {
        const date = new Date();
        expect(estimateObjectSize(date)).toBe(BYTE_SIZES.DATE);
      });

      it('should handle RegExp', () => {
        const regex = /test/gi;
        const size = estimateObjectSize(regex);
        expect(size).toBe(BYTE_SIZES.REGEXP + 'test'.length * 2);
      });

      it('should handle ArrayBuffer', () => {
        const buffer = new ArrayBuffer(100);
        expect(estimateObjectSize(buffer)).toBe(
          100 + BYTE_SIZES.OBJECT_OVERHEAD
        );
      });

      it('should handle Uint8Array', () => {
        const arr = new Uint8Array(50);
        expect(estimateObjectSize(arr)).toBe(50 + BYTE_SIZES.OBJECT_OVERHEAD);
      });

      it('should handle Float64Array', () => {
        const arr = new Float64Array(10);
        expect(estimateObjectSize(arr)).toBe(80 + BYTE_SIZES.OBJECT_OVERHEAD);
      });

      it('should handle Map', () => {
        const map = new Map([
          ['a', 1],
          ['b', 2],
        ]);
        const size = estimateObjectSize(map);
        expect(size).toBeGreaterThan(
          BYTE_SIZES.OBJECT_OVERHEAD + 2 * BYTE_SIZES.MAP_ENTRY_OVERHEAD
        );
      });

      it('should handle empty Map', () => {
        const map = new Map();
        expect(estimateObjectSize(map)).toBe(BYTE_SIZES.OBJECT_OVERHEAD);
      });

      it('should handle Set', () => {
        const set = new Set([1, 2, 3]);
        const size = estimateObjectSize(set);
        expect(size).toBeGreaterThan(
          BYTE_SIZES.OBJECT_OVERHEAD + 3 * BYTE_SIZES.SET_ENTRY_OVERHEAD
        );
      });

      it('should handle empty Set', () => {
        const set = new Set();
        expect(estimateObjectSize(set)).toBe(BYTE_SIZES.OBJECT_OVERHEAD);
      });

      it('should handle WeakMap', () => {
        const wm = new WeakMap();
        expect(estimateObjectSize(wm)).toBe(BYTE_SIZES.OBJECT_OVERHEAD);
      });

      it('should handle WeakSet', () => {
        const ws = new WeakSet();
        expect(estimateObjectSize(ws)).toBe(BYTE_SIZES.OBJECT_OVERHEAD);
      });

      it('should handle Error', () => {
        const error = new Error('Test error');
        const size = estimateObjectSize(error);
        expect(size).toBeGreaterThan(BYTE_SIZES.OBJECT_OVERHEAD);
      });
    });

    describe('cycle detection', () => {
      it('should handle circular references', () => {
        const obj: Record<string, unknown> = { a: 1 };
        obj.self = obj;

        // Should not throw and should return reasonable size
        const size = estimateObjectSize(obj);
        expect(size).toBeGreaterThan(0);
        expect(size).toBeLessThan(10000); // Not infinite
      });

      it('should handle deeply nested circular references', () => {
        const a: Record<string, unknown> = { name: 'a' };
        const b: Record<string, unknown> = { name: 'b', parent: a };
        const c: Record<string, unknown> = { name: 'c', parent: b };
        a.child = c;

        const size = estimateObjectSize(a);
        expect(size).toBeGreaterThan(0);
        expect(size).toBeLessThan(10000);
      });

      it('should handle circular arrays', () => {
        const arr: unknown[] = [1, 2, 3];
        arr.push(arr);

        const size = estimateObjectSize(arr);
        expect(size).toBeGreaterThan(0);
      });

      it('should skip cycle detection when disabled', () => {
        const obj: Record<string, unknown> = { a: 1 };
        // Without circular reference, should work
        const size = estimateObjectSize(obj, { detectCycles: false });
        expect(size).toBeGreaterThan(0);
      });
    });

    describe('depth limiting', () => {
      it('should respect maxDepth option', () => {
        const deep = { a: { b: { c: { d: { e: { f: 1 } } } } } };
        const sizeWithLimit = estimateObjectSize(deep, { maxDepth: 2 });
        const sizeWithoutLimit = estimateObjectSize(deep, { maxDepth: 100 });
        expect(sizeWithLimit).toBeLessThan(sizeWithoutLimit);
      });
    });
  });

  describe('estimateQueryResultSize', () => {
    it('should estimate empty result', () => {
      const result = { columns: [], rows: [] };
      const size = estimateQueryResultSize(result);
      expect(size).toBeGreaterThan(0);
    });

    it('should estimate result with columns', () => {
      const result = { columns: ['id', 'name', 'email'], rows: [] };
      const size = estimateQueryResultSize(result);
      expect(size).toBeGreaterThan(BYTE_SIZES.OBJECT_OVERHEAD);
    });

    it('should estimate result with rows', () => {
      const result = {
        columns: ['id', 'name'],
        rows: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      };
      const size = estimateQueryResultSize(result);
      expect(size).toBeGreaterThan(0);
    });

    it('should handle multiple result sets', () => {
      const result = {
        columns: ['id'],
        rows: [{ id: 1 }],
        resultSets: [
          { columns: ['name'], rows: [{ name: 'Test' }] },
          { columns: ['value'], rows: [{ value: 42 }] },
        ],
      };
      const size = estimateQueryResultSize(result);
      expect(size).toBeGreaterThan(0);
    });

    it('should scale with row count', () => {
      const smallResult = {
        columns: ['id', 'name'],
        rows: Array.from({ length: 10 }, (_, i) => ({
          id: i,
          name: `Name${i}`,
        })),
      };
      const largeResult = {
        columns: ['id', 'name'],
        rows: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Name${i}`,
        })),
      };

      const smallSize = estimateQueryResultSize(smallResult);
      const largeSize = estimateQueryResultSize(largeResult);

      expect(largeSize).toBeGreaterThan(smallSize * 50); // Should scale roughly linearly
    });
  });

  describe('estimateRowSize', () => {
    it('should estimate empty row', () => {
      const size = estimateRowSize({});
      expect(size).toBe(BYTE_SIZES.OBJECT_OVERHEAD);
    });

    it('should estimate row with primitive values', () => {
      const row = { id: 1, active: true, name: 'test' };
      const size = estimateRowSize(row);
      expect(size).toBeGreaterThan(BYTE_SIZES.OBJECT_OVERHEAD);
    });

    it('should estimate row with null values', () => {
      const row = { id: 1, deletedAt: null };
      const size = estimateRowSize(row);
      expect(size).toBeGreaterThan(0);
    });
  });

  describe('estimateValueSize', () => {
    it('should handle null', () => {
      expect(estimateValueSize(null)).toBe(BYTE_SIZES.NULL_UNDEFINED);
    });

    it('should handle undefined', () => {
      expect(estimateValueSize(undefined)).toBe(BYTE_SIZES.NULL_UNDEFINED);
    });

    it('should handle boolean', () => {
      expect(estimateValueSize(true)).toBe(BYTE_SIZES.BOOLEAN);
    });

    it('should handle number', () => {
      expect(estimateValueSize(42)).toBe(BYTE_SIZES.NUMBER);
    });

    it('should handle string', () => {
      expect(estimateValueSize('test')).toBe(
        'test'.length * 2 + BYTE_SIZES.STRING_OVERHEAD
      );
    });

    it('should handle Date', () => {
      expect(estimateValueSize(new Date())).toBe(BYTE_SIZES.DATE);
    });

    it('should handle array of primitives', () => {
      const arr = [1, 2, 3];
      const size = estimateValueSize(arr);
      expect(size).toBeGreaterThan(BYTE_SIZES.ARRAY_OVERHEAD);
    });
  });

  describe('estimateSchemaSize', () => {
    it('should estimate table schema', () => {
      const schema = {
        name: 'users',
        type: 'table',
        columns: [
          { name: 'id', type: 'INTEGER', nullable: false, isPrimaryKey: true },
          { name: 'name', type: 'TEXT', nullable: true, isPrimaryKey: false },
        ],
        indexes: [],
        foreignKeys: [],
        triggers: [],
      };

      const size = estimateSchemaSize(schema);
      expect(size).toBeGreaterThan(0);
    });
  });

  describe('estimateRowArraySize', () => {
    it('should handle empty array', () => {
      const size = estimateRowArraySize([]);
      expect(size).toBe(BYTE_SIZES.ARRAY_OVERHEAD);
    });

    it('should estimate small arrays exactly', () => {
      const rows = [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
      ];
      const size = estimateRowArraySize(rows);
      expect(size).toBeGreaterThan(BYTE_SIZES.ARRAY_OVERHEAD);
    });

    it('should sample large arrays', () => {
      const rows = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Name ${i}`,
        email: `user${i}@example.com`,
      }));

      const size = estimateRowArraySize(rows, 100);
      expect(size).toBeGreaterThan(0);
    });

    it('should produce reasonable estimates for large arrays', () => {
      const rows = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        value: 'same'.repeat(10),
      }));

      const sampledSize = estimateRowArraySize(rows, 50);
      const exactSize = estimateRowArraySize(rows, 1000);

      // Sampled should be within 20% of exact
      const ratio = sampledSize / exactSize;
      expect(ratio).toBeGreaterThan(0.8);
      expect(ratio).toBeLessThan(1.2);
    });
  });

  describe('formatBytes', () => {
    it('should format 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
    });

    it('should format bytes', () => {
      expect(formatBytes(500)).toBe('500.00 Bytes');
    });

    it('should format kilobytes', () => {
      expect(formatBytes(1024)).toBe('1.00 KB');
      expect(formatBytes(1536)).toBe('1.50 KB');
    });

    it('should format megabytes', () => {
      expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
      expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.50 MB');
    });

    it('should format gigabytes', () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB');
    });

    it('should format terabytes', () => {
      expect(formatBytes(1024 ** 4)).toBe('1.00 TB');
    });

    it('should respect decimals parameter', () => {
      expect(formatBytes(1536, 0)).toBe('2 KB');
      expect(formatBytes(1536, 1)).toBe('1.5 KB');
      expect(formatBytes(1536, 3)).toBe('1.500 KB');
    });

    it('should handle negative values', () => {
      expect(formatBytes(-1024)).toBe('-1.00 KB');
    });
  });

  describe('parseBytes', () => {
    it('should parse pure numbers', () => {
      expect(parseBytes('1024')).toBe(1024);
      expect(parseBytes('0')).toBe(0);
    });

    it('should parse bytes', () => {
      expect(parseBytes('100 bytes')).toBe(100);
      expect(parseBytes('100 Bytes')).toBe(100);
      expect(parseBytes('100B')).toBe(100);
    });

    it('should parse kilobytes', () => {
      expect(parseBytes('1 KB')).toBe(1024);
      expect(parseBytes('1.5KB')).toBe(1536);
      expect(parseBytes('1K')).toBe(1024);
    });

    it('should parse megabytes', () => {
      expect(parseBytes('1 MB')).toBe(1024 * 1024);
      expect(parseBytes('2.5MB')).toBe(2.5 * 1024 * 1024);
      expect(parseBytes('1M')).toBe(1024 * 1024);
    });

    it('should parse gigabytes', () => {
      expect(parseBytes('1 GB')).toBe(1024 ** 3);
      expect(parseBytes('1G')).toBe(1024 ** 3);
    });

    it('should parse terabytes', () => {
      expect(parseBytes('1 TB')).toBe(1024 ** 4);
    });

    it('should be case insensitive', () => {
      expect(parseBytes('1 kb')).toBe(1024);
      expect(parseBytes('1 Kb')).toBe(1024);
      expect(parseBytes('1 KB')).toBe(1024);
    });

    it('should handle whitespace', () => {
      expect(parseBytes('  1 KB  ')).toBe(1024);
      expect(parseBytes('1  MB')).toBe(1024 * 1024);
    });

    it('should throw for invalid format', () => {
      expect(() => parseBytes('invalid')).toThrow('Invalid byte format');
      expect(() => parseBytes('MB')).toThrow('Invalid byte format');
      expect(() => parseBytes('')).toThrow('Invalid byte format');
    });

    it('should handle negative values', () => {
      expect(parseBytes('-1 KB')).toBe(-1024);
    });
  });

  describe('sIZE_THRESHOLDS', () => {
    it('should have correct values', () => {
      expect(SIZE_THRESHOLDS.SMALL).toBe(1024);
      expect(SIZE_THRESHOLDS.MEDIUM).toBe(100 * 1024);
      expect(SIZE_THRESHOLDS.LARGE).toBe(1024 * 1024);
    });
  });

  describe('categorizeSize', () => {
    it('should categorize small sizes', () => {
      expect(categorizeSize(100)).toBe('small');
      expect(categorizeSize(1023)).toBe('small');
    });

    it('should categorize medium sizes', () => {
      expect(categorizeSize(1024)).toBe('medium');
      expect(categorizeSize(50 * 1024)).toBe('medium');
    });

    it('should categorize large sizes', () => {
      expect(categorizeSize(100 * 1024)).toBe('large');
      expect(categorizeSize(500 * 1024)).toBe('large');
    });

    it('should categorize very large sizes', () => {
      expect(categorizeSize(1024 * 1024)).toBe('very-large');
      expect(categorizeSize(10 * 1024 * 1024)).toBe('very-large');
    });
  });

  describe('isLikelyLarge', () => {
    it('should return false for null/undefined', () => {
      expect(isLikelyLarge(null)).toBe(false);
      expect(isLikelyLarge(undefined)).toBe(false);
    });

    it('should detect large strings', () => {
      const smallStr = 'hello';
      const largeStr = 'x'.repeat(100 * 1024);

      expect(isLikelyLarge(smallStr)).toBe(false);
      expect(isLikelyLarge(largeStr)).toBe(true);
    });

    it('should detect large arrays', () => {
      const smallArr = [1, 2, 3];
      const largeArr = Array.from({ length: 10000 }, (_, i) => i);

      expect(isLikelyLarge(smallArr)).toBe(false);
      expect(isLikelyLarge(largeArr)).toBe(true);
    });

    it('should detect large objects', () => {
      const smallObj = { a: 1 };
      const largeObj = Object.fromEntries(
        Array.from({ length: 1000 }, (_, i) => [`key${i}`, i])
      );

      expect(isLikelyLarge(smallObj)).toBe(false);
      expect(isLikelyLarge(largeObj)).toBe(true);
    });

    it('should respect custom threshold', () => {
      const str = 'x'.repeat(1000);
      expect(isLikelyLarge(str, 1000)).toBe(true);
      expect(isLikelyLarge(str, 10000)).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isLikelyLarge(42)).toBe(false);
      expect(isLikelyLarge(true)).toBe(false);
    });
  });
});
