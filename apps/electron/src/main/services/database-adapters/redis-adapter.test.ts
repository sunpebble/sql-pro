import type { AddressInfo, Socket } from 'node:net';
import { Buffer } from 'node:buffer';
import { createServer } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { RedisAdapter } from './redis-adapter';

function encodeSimpleString(value: string): Buffer {
  return Buffer.from(`+${value}\r\n`);
}

function encodeError(value: string): Buffer {
  return Buffer.from(`-${value}\r\n`);
}

function encodeInteger(value: number): Buffer {
  return Buffer.from(`:${value}\r\n`);
}

function encodeBulkString(value: string | null): Buffer {
  if (value === null) return Buffer.from('$-1\r\n');
  const bytes = Buffer.from(value);
  return Buffer.concat([
    Buffer.from(`$${bytes.length}\r\n`),
    bytes,
    Buffer.from('\r\n'),
  ]);
}

function encodeArray(values: Array<string | number | Buffer | null>): Buffer {
  const chunks: Uint8Array[] = [Buffer.from(`*${values.length}\r\n`)];
  for (const value of values) {
    if (Buffer.isBuffer(value)) {
      chunks.push(value);
    } else if (typeof value === 'number') {
      chunks.push(encodeInteger(value));
    } else {
      chunks.push(encodeBulkString(value));
    }
  }
  return Buffer.concat(chunks);
}

function parseCommand(
  buffer: Buffer
): { args: string[]; offset: number } | null {
  if (buffer[0] !== 42) return null;

  const firstLineEnd = buffer.indexOf('\r\n');
  if (firstLineEnd === -1) return null;

  const argCount = Number(buffer.subarray(1, firstLineEnd).toString());
  let offset = firstLineEnd + 2;
  const args: string[] = [];

  for (let index = 0; index < argCount; index++) {
    if (buffer[offset] !== 36) return null;

    const lengthLineEnd = buffer.indexOf('\r\n', offset);
    if (lengthLineEnd === -1) return null;

    const length = Number(
      buffer.subarray(offset + 1, lengthLineEnd).toString()
    );
    const dataStart = lengthLineEnd + 2;
    const dataEnd = dataStart + length;
    if (buffer.length < dataEnd + 2) return null;

    args.push(buffer.subarray(dataStart, dataEnd).toString());
    offset = dataEnd + 2;
  }

  return { args, offset };
}

class FakeRedisServer {
  readonly commands: string[][] = [];
  private server = createServer((socket) => this.handleSocket(socket));

  async start(): Promise<number> {
    await new Promise<void>((resolve) => {
      this.server.listen(0, '127.0.0.1', resolve);
    });
    return (this.server.address() as AddressInfo).port;
  }

  async stop(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  private handleSocket(socket: Socket): void {
    let buffer = Buffer.alloc(0);

    socket.on('data', (chunk) => {
      const bytes = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      buffer = Buffer.concat([buffer, bytes]);

      while (buffer.length > 0) {
        const parsed = parseCommand(buffer);
        if (!parsed) break;

        buffer = buffer.subarray(parsed.offset);
        this.commands.push(parsed.args);
        socket.write(this.respond(parsed.args));
      }
    });
  }

  private respond(args: string[]): Buffer {
    const command = args[0]?.toUpperCase();
    const key = command === 'MEMORY' ? args[2] : args[1];

    switch (command) {
      case 'PING':
        return encodeSimpleString('PONG');
      case 'INFO':
        return encodeBulkString('# Server\r\nredis_version:7.2.4\r\n');
      case 'SELECT':
        return encodeSimpleString('OK');
      case 'DBSIZE':
        return encodeInteger(2);
      case 'SCAN':
        return encodeArray(['0', encodeArray(['session:1', 'profile:1'])]);
      case 'TYPE':
        return encodeSimpleString(key === 'profile:1' ? 'hash' : 'string');
      case 'TTL':
        return encodeInteger(-1);
      case 'MEMORY':
        return encodeInteger(key === 'profile:1' ? 31 : 6);
      case 'GET':
        return encodeBulkString(key === 'session:1' ? 'active' : null);
      case 'HGETALL':
        return encodeArray(['name', 'Ada', 'role', 'admin']);
      default:
        return encodeError(`ERR unknown command '${command}'`);
    }
  }
}

describe('redis adapter', () => {
  let server: FakeRedisServer;
  let port: number;
  let adapter: RedisAdapter;

  beforeEach(async () => {
    server = new FakeRedisServer();
    port = await server.start();
    adapter = new RedisAdapter();
  });

  afterEach(async () => {
    adapter.closeAll();
    await server.stop();
  });

  it('tests a Redis connection and reports server version', async () => {
    const result = await adapter.testConnection({
      type: 'redis',
      host: '127.0.0.1',
      port,
      database: '2',
    });

    expect(result).toEqual({
      success: true,
      latencyMs: expect.any(Number),
      serverVersion: 'Redis 7.2.4',
    });
    expect(server.commands.map((command) => command[0])).toEqual([
      'SELECT',
      'PING',
      'INFO',
    ]);
  });

  it('maps Redis keys to a browsable keys table', async () => {
    const openResult = await adapter.open({
      type: 'redis',
      host: '127.0.0.1',
      port,
      database: '0',
    });
    expect(openResult.success).toBe(true);
    if (!openResult.success) return;

    const connectionId = openResult.connection.id;
    const schemaResult = await adapter.getSchemaAsync(connectionId);
    expect(schemaResult.success).toBe(true);
    if (!schemaResult.success) return;

    expect(schemaResult.tables).toMatchObject([
      {
        name: 'keys',
        schema: 'db0',
        rowCount: 2,
      },
    ]);

    const tableResult = await adapter.getTableDataAsync(
      connectionId,
      'keys',
      1,
      50
    );
    expect(tableResult.success).toBe(true);
    if (!tableResult.success) return;

    expect(tableResult.rows).toEqual([
      {
        key: 'session:1',
        type: 'string',
        ttl: -1,
        size: 6,
        value: 'active',
      },
      {
        key: 'profile:1',
        type: 'hash',
        ttl: -1,
        size: 31,
        value: JSON.stringify({ name: 'Ada', role: 'admin' }),
      },
    ]);
  });

  it('executes raw Redis commands in the query editor path', async () => {
    const openResult = await adapter.open({
      type: 'redis',
      host: '127.0.0.1',
      port,
      database: '0',
    });
    expect(openResult.success).toBe(true);
    if (!openResult.success) return;

    const result = await adapter.executeQueryAsync(
      openResult.connection.id,
      'HGETALL profile:1'
    );

    expect(result).toEqual({
      success: true,
      columns: ['name', 'role'],
      rows: [{ name: 'Ada', role: 'admin' }],
      changes: 0,
      lastInsertRowid: 0,
    });
  });
});
