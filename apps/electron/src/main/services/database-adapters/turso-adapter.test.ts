import type { Client } from '@libsql/client';
import type { PendingChangeInfo } from '@shared/types';
import { describe, expect, it, vi } from 'vitest';
import { TursoAdapter } from './turso-adapter';

describe('tursoAdapter', () => {
  it('should batch changes in applyChangesAsync', async () => {
    const adapter = new TursoAdapter();
    const connectionId = 'test-connection';

    const mockBatch = vi.fn().mockResolvedValue([]);
    const mockExecute = vi
      .fn()
      .mockResolvedValue({ rows: [], columns: [], rowsAffected: 1 });
    const mockClient = {
      execute: mockExecute,
      batch: mockBatch,
      close: vi.fn(),
    } as unknown as Client;

    // Inject mock connection
    (adapter as any).connections.set(connectionId, {
      id: connectionId,
      client: mockClient,
      organization: 'test-org',
      database: 'test-db',
      branch: 'main',
      displayName: 'Test DB',
      platformService: {} as any,
      authToken: 'test-token',
    });

    const changes: PendingChangeInfo[] = [
      {
        id: '1',
        table: 'users',
        schema: 'main',
        rowId: 1,
        type: 'insert',
        oldValues: null,
        newValues: { id: 1, name: 'User 1' },
      },
      {
        id: '2',
        table: 'users',
        schema: 'main',
        rowId: 2,
        type: 'update',
        primaryKeyColumn: 'id',
        oldValues: { id: 2, name: 'Old' },
        newValues: { id: 2, name: 'New' },
      },
    ];

    const result = await adapter.applyChangesAsync(connectionId, changes);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.appliedCount).toBe(2);
    }

    // Should call batch once
    expect(mockBatch).toHaveBeenCalledTimes(1);
    // Should pass array of statements
    expect(mockBatch).toHaveBeenCalledWith(expect.any(Array), 'write');
    const batchArgs = mockBatch.mock.calls[0][0] as any[];
    expect(batchArgs).toHaveLength(2);
    expect(batchArgs[0].sql).toContain('INSERT INTO');
    expect(batchArgs[1].sql).toContain('UPDATE');
  });
});
