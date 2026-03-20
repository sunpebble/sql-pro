import type { MockInstance } from 'vitest';
import { describe, expect, it, vi } from 'vitest';
import { SQLiteAdapter } from './sqlite-adapter';

describe('SQLiteAdapter executeQuery params handling', () => {
  it('uses executeSingleStatement for single statement with params', () => {
    const adapter = new SQLiteAdapter();

    (adapter as any).connections.set('conn', {
      id: 'conn',
      db: { exec: vi.fn() },
      path: ':memory:',
      filename: 'memory',
      isEncrypted: false,
      isReadOnly: false,
    });

    const splitSpy = vi.spyOn(
      adapter as never,
      'splitStatements' as never
    ) as unknown as MockInstance;
    splitSpy.mockReturnValue([
      'SELECT * FROM users WHERE id = ?',
    ]);
    const executeSingleStatementSpy = vi.spyOn(
      adapter as never,
      'executeSingleStatement' as never
    ) as unknown as MockInstance;
    executeSingleStatementSpy.mockReturnValue({
      success: true,
      columns: ['id'],
      rows: [{ id: 1 }],
    });

    const result = adapter.executeQuery(
      'conn',
      'SELECT * FROM users WHERE id = ?',
      [1]
    );

    expect(executeSingleStatementSpy).toHaveBeenCalledWith(
      'conn',
      'SELECT * FROM users WHERE id = ?',
      [1]
    );
    expect(result).toEqual({
      success: true,
      columns: ['id'],
      rows: [{ id: 1 }],
    });
  });

  it('executes multi-statements without params', () => {
    const execMock = vi.fn();
    const adapter = new SQLiteAdapter();

    (adapter as any).connections.set('conn', {
      id: 'conn',
      db: { exec: execMock },
      path: ':memory:',
      filename: 'memory',
      isEncrypted: false,
      isReadOnly: false,
    });

    const splitSpy = vi.spyOn(
      adapter as never,
      'splitStatements' as never
    ) as unknown as MockInstance;
    splitSpy.mockReturnValue([
      'INSERT INTO t VALUES (1)',
      'INSERT INTO t VALUES (2)',
    ]);
    const executeSingleStatementSpy = vi.spyOn(
      adapter as never,
      'executeSingleStatement' as never
    ) as unknown as MockInstance;
    executeSingleStatementSpy
      .mockReturnValueOnce({
        success: true,
        changes: 1,
        lastInsertRowid: 1,
      })
      .mockReturnValueOnce({
        success: true,
        changes: 1,
        lastInsertRowid: 2,
      });

    const result = adapter.executeQuery(
      'conn',
      'INSERT INTO t VALUES (1); INSERT INTO t VALUES (2);'
    );

    expect(execMock).toHaveBeenNthCalledWith(1, 'BEGIN TRANSACTION');
    expect(execMock).toHaveBeenNthCalledWith(2, 'COMMIT');
    expect(result).toEqual({
      success: true,
      changes: 2,
      lastInsertRowid: 2,
      executedStatements: 2,
    });
  });

  it('rejects multi-statements with params before any statement executes', () => {
    const execMock = vi.fn();
    const adapter = new SQLiteAdapter();

    (adapter as any).connections.set('conn', {
      id: 'conn',
      db: { exec: execMock },
      path: ':memory:',
      filename: 'memory',
      isEncrypted: false,
      isReadOnly: false,
    });

    const splitSpy = vi.spyOn(
      adapter as never,
      'splitStatements' as never
    ) as unknown as MockInstance;
    splitSpy.mockReturnValue([
      'SELECT 1',
      'SELECT 2',
    ]);
    const executeSingleStatementSpy = vi.spyOn(
      adapter as never,
      'executeSingleStatement' as never
    );

    const result = adapter.executeQuery('conn', 'SELECT 1; SELECT 2;', [1]);

    expect(result).toEqual({
      success: false,
      error: 'Query parameters are only supported for single statements',
    });
    expect(executeSingleStatementSpy).not.toHaveBeenCalled();
    expect(execMock).not.toHaveBeenCalled();
  });
});
