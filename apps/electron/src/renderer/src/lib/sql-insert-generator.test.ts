import { describe, expect, it } from 'vitest';
import {
  escapeIdentifier,
  escapeSQLValue,
  generateSQLInsert,
  generateSQLInsertRow,
} from './sql-insert-generator';

describe('sql-insert-generator', () => {
  describe('escapeIdentifier', () => {
    it('should wrap identifier in double quotes', () => {
      expect(escapeIdentifier('users')).toBe('"users"');
    });

    it('should escape double quotes by doubling them', () => {
      expect(escapeIdentifier('my"table')).toBe('"my""table"');
    });

    it('should handle identifiers with multiple double quotes', () => {
      expect(escapeIdentifier('a"b"c')).toBe('"a""b""c"');
    });

    it('should handle reserved keywords', () => {
      expect(escapeIdentifier('select')).toBe('"select"');
      expect(escapeIdentifier('from')).toBe('"from"');
    });

    it('should handle identifiers with spaces', () => {
      expect(escapeIdentifier('my table')).toBe('"my table"');
    });

    it('should handle empty identifier', () => {
      expect(escapeIdentifier('')).toBe('""');
    });
  });

  describe('escapeSQLValue', () => {
    describe('nULL handling', () => {
      it('should return NULL for null value', () => {
        expect(escapeSQLValue(null)).toBe('NULL');
      });

      it('should return NULL for undefined value', () => {
        expect(escapeSQLValue(undefined)).toBe('NULL');
      });
    });

    describe('string escaping', () => {
      it('should wrap strings in single quotes', () => {
        expect(escapeSQLValue('hello')).toBe("'hello'");
      });

      it('should escape single quotes by doubling them', () => {
        expect(escapeSQLValue("O'Brien")).toBe("'O''Brien'");
      });

      it('should handle multiple single quotes', () => {
        expect(escapeSQLValue("It's John's book")).toBe("'It''s John''s book'");
      });

      it('should handle empty string', () => {
        expect(escapeSQLValue('')).toBe("''");
      });

      it('should handle strings with special characters', () => {
        expect(escapeSQLValue('line1\nline2')).toBe("'line1\nline2'");
        expect(escapeSQLValue('tab\there')).toBe("'tab\there'");
      });
    });

    describe('numeric value handling', () => {
      it('should return integer as string', () => {
        expect(escapeSQLValue(42)).toBe('42');
      });

      it('should return negative integer as string', () => {
        expect(escapeSQLValue(-42)).toBe('-42');
      });

      it('should return float as string', () => {
        expect(escapeSQLValue(3.14159)).toBe('3.14159');
      });

      it('should return zero as string', () => {
        expect(escapeSQLValue(0)).toBe('0');
      });

      it('should handle BigInt values', () => {
        expect(escapeSQLValue(BigInt(9007199254740991))).toBe(
          '9007199254740991'
        );
      });
    });

    describe('boolean conversion', () => {
      it('should convert true to 1', () => {
        expect(escapeSQLValue(true)).toBe('1');
      });

      it('should convert false to 0', () => {
        expect(escapeSQLValue(false)).toBe('0');
      });
    });

    describe('date formatting', () => {
      it('should format Date to ISO string wrapped in quotes', () => {
        const date = new Date('2024-06-15T12:30:45.000Z');
        expect(escapeSQLValue(date)).toBe("'2024-06-15T12:30:45.000Z'");
      });

      it('should handle epoch date', () => {
        const date = new Date(0);
        expect(escapeSQLValue(date)).toBe("'1970-01-01T00:00:00.000Z'");
      });
    });

    describe('binary/BLOB handling', () => {
      it('should convert ArrayBuffer to hex literal', () => {
        const buffer = new ArrayBuffer(3);
        const view = new Uint8Array(buffer);
        view[0] = 0xab;
        view[1] = 0xcd;
        view[2] = 0xef;
        expect(escapeSQLValue(buffer)).toBe("X'abcdef'");
      });

      it('should convert Uint8Array to hex literal', () => {
        const bytes = new Uint8Array([0x01, 0x02, 0xff]);
        expect(escapeSQLValue(bytes)).toBe("X'0102ff'");
      });

      it('should handle empty ArrayBuffer', () => {
        const buffer = new ArrayBuffer(0);
        expect(escapeSQLValue(buffer)).toBe("X''");
      });

      it('should handle serialized Node.js Buffer object', () => {
        const serializedBuffer = {
          type: 'Buffer',
          data: [0xde, 0xad, 0xbe, 0xef],
        };
        expect(escapeSQLValue(serializedBuffer)).toBe("X'deadbeef'");
      });
    });

    describe('fallback handling', () => {
      it('should convert object to string and escape', () => {
        const obj = { toString: () => "test'value" };
        expect(escapeSQLValue(obj)).toBe("'test''value'");
      });
    });
  });

  describe('generateSQLInsertRow', () => {
    it('should generate INSERT statement for simple row', () => {
      const row = { name: 'John', age: 30 };
      const result = generateSQLInsertRow(row, { tableName: 'users' });
      expect(result).toBe(
        'INSERT INTO "users" ("name", "age") VALUES (\'John\', 30);'
      );
    });

    it('should escape table name with special characters', () => {
      const row = { value: 'test' };
      const result = generateSQLInsertRow(row, { tableName: 'my"table' });
      expect(result).toBe(
        'INSERT INTO "my""table" ("value") VALUES (\'test\');'
      );
    });

    it('should escape column names with special characters', () => {
      const row = { 'my"column': 'value' };
      const result = generateSQLInsertRow(row, { tableName: 'test' });
      expect(result).toBe(
        'INSERT INTO "test" ("my""column") VALUES (\'value\');'
      );
    });

    it('should handle NULL values in row', () => {
      const row = { name: 'John', email: null };
      const result = generateSQLInsertRow(row, { tableName: 'users' });
      expect(result).toBe(
        'INSERT INTO "users" ("name", "email") VALUES (\'John\', NULL);'
      );
    });

    it('should handle boolean values', () => {
      const row = { active: true, deleted: false };
      const result = generateSQLInsertRow(row, { tableName: 'flags' });
      expect(result).toBe(
        'INSERT INTO "flags" ("active", "deleted") VALUES (1, 0);'
      );
    });

    it('should handle Date values', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      const row = { created_at: date };
      const result = generateSQLInsertRow(row, { tableName: 'events' });
      expect(result).toBe(
        'INSERT INTO "events" ("created_at") VALUES (\'2024-01-15T10:30:00.000Z\');'
      );
    });

    it('should use specified columns in order', () => {
      const row = { id: 1, name: 'John', age: 30 };
      const result = generateSQLInsertRow(row, {
        tableName: 'users',
        columns: ['name', 'id'],
      });
      expect(result).toBe(
        'INSERT INTO "users" ("name", "id") VALUES (\'John\', 1);'
      );
    });

    it('should return empty string for empty columns', () => {
      const row = {};
      const result = generateSQLInsertRow(row, { tableName: 'users' });
      expect(result).toBe('');
    });

    it('should handle columns specified that are not in row (as NULL)', () => {
      const row = { name: 'John' };
      const result = generateSQLInsertRow(row, {
        tableName: 'users',
        columns: ['name', 'email'],
      });
      expect(result).toBe(
        'INSERT INTO "users" ("name", "email") VALUES (\'John\', NULL);'
      );
    });
  });

  describe('generateSQLInsert', () => {
    it('should generate INSERT statements for multiple rows', () => {
      const rows = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];
      const result = generateSQLInsert(rows, { tableName: 'users' });
      expect(result).toBe(
        'INSERT INTO "users" ("name", "age") VALUES (\'John\', 30);\n' +
          'INSERT INTO "users" ("name", "age") VALUES (\'Jane\', 25);'
      );
    });

    it('should return empty string for empty rows array', () => {
      const result = generateSQLInsert([], { tableName: 'users' });
      expect(result).toBe('');
    });

    it('should handle single row', () => {
      const rows = [{ name: 'John' }];
      const result = generateSQLInsert(rows, { tableName: 'users' });
      expect(result).toBe('INSERT INTO "users" ("name") VALUES (\'John\');');
    });

    it('should separate multiple statements with newlines', () => {
      const rows = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = generateSQLInsert(rows, { tableName: 'items' });
      const lines = result.split('\n');
      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('INSERT INTO "items" ("id") VALUES (1);');
      expect(lines[1]).toBe('INSERT INTO "items" ("id") VALUES (2);');
      expect(lines[2]).toBe('INSERT INTO "items" ("id") VALUES (3);');
    });

    it('should handle rows with mixed data types', () => {
      const rows = [
        {
          id: 1,
          name: "O'Reilly",
          active: true,
          score: 95.5,
          notes: null,
        },
      ];
      const result = generateSQLInsert(rows, { tableName: 'records' });
      expect(result).toBe(
        'INSERT INTO "records" ("id", "name", "active", "score", "notes") VALUES (1, \'O\'\'Reilly\', 1, 95.5, NULL);'
      );
    });

    it('should use specified columns for all rows', () => {
      const rows = [
        { id: 1, name: 'John', extra: 'ignored' },
        { id: 2, name: 'Jane', extra: 'also ignored' },
      ];
      const result = generateSQLInsert(rows, {
        tableName: 'users',
        columns: ['id', 'name'],
      });
      expect(result).toBe(
        'INSERT INTO "users" ("id", "name") VALUES (1, \'John\');\n' +
          'INSERT INTO "users" ("id", "name") VALUES (2, \'Jane\');'
      );
    });

    it('should handle table name with spaces', () => {
      const rows = [{ value: 'test' }];
      const result = generateSQLInsert(rows, { tableName: 'my table' });
      expect(result).toBe(
        'INSERT INTO "my table" ("value") VALUES (\'test\');'
      );
    });
  });
});
