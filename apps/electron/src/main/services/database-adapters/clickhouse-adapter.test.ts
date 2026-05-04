import type { DatabaseConnectionConfig } from '@shared/types';
import { Buffer } from 'node:buffer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClickHouseAdapter } from './clickhouse-adapter';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('clickHouseAdapter', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('tests connections through the ClickHouse HTTP API', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        meta: [{ name: 'version', type: 'String' }],
        data: [{ version: '24.12.1.1' }],
      })
    );

    const adapter = new ClickHouseAdapter();
    const config: DatabaseConnectionConfig = {
      type: 'clickhouse',
      host: 'clickhouse.example.com',
      port: 8443,
      database: 'analytics',
      username: 'default',
      password: 'secret',
      ssl: true,
    };

    const result = await adapter.testConnection(config);

    expect(result).toMatchObject({
      success: true,
      serverVersion: 'ClickHouse 24.12.1.1',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://clickhouse.example.com:8443/?database=analytics',
      expect.objectContaining({
        method: 'POST',
        body: 'SELECT version() AS version FORMAT JSON',
      })
    );

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe(
      `Basic ${Buffer.from('default:secret').toString('base64')}`
    );
  });

  it('maps SELECT results from ClickHouse JSON responses', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        meta: [
          { name: 'id', type: 'UInt64' },
          { name: 'name', type: 'String' },
        ],
        data: [{ id: '1', name: 'Ada' }],
      })
    );

    const adapter = new ClickHouseAdapter();
    (adapter as any).connections.set('conn', {
      id: 'conn',
      host: 'localhost',
      port: 8123,
      database: 'default',
      username: 'default',
      password: '',
      useTLS: false,
      displayName: 'local',
      isReadOnly: false,
    });

    const result = await adapter.executeQueryAsync(
      'conn',
      'SELECT id, name FROM users'
    );

    expect(result).toEqual({
      success: true,
      columns: ['id', 'name'],
      rows: [{ id: '1', name: 'Ada' }],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8123/?database=default',
      expect.objectContaining({
        method: 'POST',
        body: 'SELECT id, name FROM users FORMAT JSON',
      })
    );
  });

  it('builds schema metadata from system tables and columns', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          meta: [
            { name: 'database', type: 'String' },
            { name: 'name', type: 'String' },
            { name: 'engine', type: 'String' },
            { name: 'total_rows', type: 'Nullable(UInt64)' },
          ],
          data: [
            {
              database: 'analytics',
              name: 'events',
              engine: 'MergeTree',
              total_rows: '42',
            },
            {
              database: 'analytics',
              name: 'daily_events',
              engine: 'View',
              total_rows: null,
            },
          ],
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          meta: [
            { name: 'name', type: 'String' },
            { name: 'type', type: 'String' },
            { name: 'default_expression', type: 'String' },
            { name: 'is_in_primary_key', type: 'UInt8' },
          ],
          data: [
            {
              name: 'id',
              type: 'UInt64',
              default_expression: '',
              is_in_primary_key: 1,
            },
          ],
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          meta: [
            { name: 'name', type: 'String' },
            { name: 'type', type: 'String' },
            { name: 'default_expression', type: 'String' },
            { name: 'is_in_primary_key', type: 'UInt8' },
          ],
          data: [
            {
              name: 'event_count',
              type: 'UInt64',
              default_expression: '',
              is_in_primary_key: 0,
            },
          ],
        })
      );

    const adapter = new ClickHouseAdapter();
    (adapter as any).connections.set('conn', {
      id: 'conn',
      host: 'localhost',
      port: 8123,
      database: 'analytics',
      username: 'default',
      password: '',
      useTLS: false,
      displayName: 'analytics',
      isReadOnly: false,
    });

    const result = await adapter.getSchemaAsync('conn');

    expect(result).toMatchObject({
      success: true,
      schemas: [
        {
          name: 'analytics',
          tables: [
            {
              name: 'events',
              rowCount: 42,
              primaryKey: ['id'],
            },
          ],
          views: [
            {
              name: 'daily_events',
              primaryKey: [],
            },
          ],
        },
      ],
    });
  });
});
