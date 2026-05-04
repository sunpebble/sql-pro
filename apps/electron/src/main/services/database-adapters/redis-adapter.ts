/**
 * Redis database adapter.
 * Uses Redis' RESP protocol over Node sockets so no native driver is required.
 */

import type {
  ColumnInfo,
  DatabaseConnectionConfig,
  GetColumnDistributionResponse,
  GetTableDataResponse,
  PendingChangeInfo,
  QueryPlanNode,
  QueryPlanStats,
  SchemaInfo,
  TableInfo,
  ValidationResult,
} from '@shared/types';
import type { Socket } from 'node:net';
import type { TLSSocket } from 'node:tls';
import type {
  AdapterConnectionInfo,
  DatabaseAdapter,
  OpenResult,
} from './types';
import { Buffer } from 'node:buffer';
import { createConnection } from 'node:net';
import { connect as createTlsConnection } from 'node:tls';

type RedisSocket = Socket | TLSSocket;
type RedisValue = string | number | null | RedisValue[];

interface RedisConnectionOptions {
  host: string;
  port: number;
  database: number;
  username?: string;
  password?: string;
  useTLS: boolean;
}

interface RedisConnectionInfo extends RedisConnectionOptions {
  id: string;
  client: RedisProtocolClient;
  displayName: string;
  isReadOnly: boolean;
}

interface ParsedRedisReply {
  value: RedisValue | RedisCommandError;
  offset: number;
}

const REDIS_NOT_SQL_ERROR =
  'Redis uses raw Redis commands here, not SQL statements';
const KEYS_TABLE_NAME = 'keys';
const DEFAULT_SCAN_COUNT = 1000;
const REDIS_VERSION_REGEX = /^redis_version:(.+)$/m;
const COMMAND_LINE_SPLIT_REGEX = /\r?\n/;
const WHITESPACE_REGEX = /\s/;
const READ_ONLY_COMMANDS = new Set([
  'DBSIZE',
  'EXISTS',
  'GET',
  'HGET',
  'HGETALL',
  'HLEN',
  'HSCAN',
  'INFO',
  'KEYS',
  'LINDEX',
  'LLEN',
  'LRANGE',
  'MEMORY',
  'MGET',
  'PING',
  'PTTL',
  'SCAN',
  'SCARD',
  'SELECT',
  'SMEMBERS',
  'SSCAN',
  'STRLEN',
  'TTL',
  'TYPE',
  'XLEN',
  'ZRANGE',
  'ZSCAN',
]);

let idCounter = 0;

function generateId(): string {
  idCounter += 1;
  return `redis_${idCounter}_${Math.random().toString(36).substring(2, 9)}`;
}

function encodeRedisCommand(args: Array<string | number>): Buffer {
  const chunks: Uint8Array[] = [Buffer.from(`*${args.length}\r\n`)];

  for (const arg of args) {
    const value = Buffer.from(String(arg));
    chunks.push(
      Buffer.from(`$${value.length}\r\n`),
      value,
      Buffer.from('\r\n')
    );
  }

  return Buffer.concat(chunks);
}

function findLineEnd(buffer: Buffer, offset: number): number {
  return buffer.indexOf('\r\n', offset);
}

function parseRedisReply(buffer: Buffer, offset = 0): ParsedRedisReply | null {
  if (offset >= buffer.length) return null;

  const prefix = String.fromCharCode(buffer[offset]);
  const lineEnd = findLineEnd(buffer, offset);
  if (lineEnd === -1) return null;

  const header = buffer.subarray(offset + 1, lineEnd).toString();
  const nextOffset = lineEnd + 2;

  switch (prefix) {
    case '+':
      return { value: header, offset: nextOffset };
    case '-':
      return {
        value: new RedisCommandError(header),
        offset: nextOffset,
      };
    case ':':
      return { value: Number(header), offset: nextOffset };
    case '$': {
      const length = Number(header);
      if (length === -1) return { value: null, offset: nextOffset };

      const dataStart = nextOffset;
      const dataEnd = dataStart + length;
      if (buffer.length < dataEnd + 2) return null;

      return {
        value: buffer.subarray(dataStart, dataEnd).toString(),
        offset: dataEnd + 2,
      };
    }
    case '*': {
      const length = Number(header);
      if (length === -1) return { value: null, offset: nextOffset };

      const values: RedisValue[] = [];
      let currentOffset = nextOffset;

      for (let index = 0; index < length; index++) {
        const parsed = parseRedisReply(buffer, currentOffset);
        if (!parsed) return null;
        if (parsed.value instanceof RedisCommandError) {
          values.push(parsed.value.message);
        } else {
          values.push(parsed.value);
        }
        currentOffset = parsed.offset;
      }

      return { value: values, offset: currentOffset };
    }
    default:
      return {
        value: new RedisCommandError(`Unsupported RESP prefix: ${prefix}`),
        offset: buffer.length,
      };
  }
}

class RedisCommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RedisCommandError';
  }
}

class RedisProtocolClient {
  private buffer = Buffer.alloc(0);
  private pending: Array<{
    resolve: (value: RedisValue) => void;
    reject: (error: Error) => void;
  }> = [];
  private closed = false;

  private constructor(private readonly socket: RedisSocket) {
    socket.on('data', (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      this.flushReplies();
    });

    socket.on('error', (error) => this.rejectAll(error));
    socket.on('close', () => {
      this.closed = true;
      this.rejectAll(new Error('Redis connection closed'));
    });
  }

  static async connect(
    options: RedisConnectionOptions
  ): Promise<RedisProtocolClient> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const onInitialError = (error: Error) => {
        if (!settled) {
          settled = true;
          reject(error);
        }
      };
      const onConnect = (socket: RedisSocket) => {
        settled = true;
        socket.off('error', onInitialError);
        resolve(new RedisProtocolClient(socket));
      };

      const socket = options.useTLS
        ? createTlsConnection(
            {
              host: options.host,
              port: options.port,
              rejectUnauthorized: false,
            },
            () => onConnect(socket)
          )
        : createConnection({ host: options.host, port: options.port }, () =>
            onConnect(socket)
          );

      socket.once('error', onInitialError);
    });
  }

  command(args: Array<string | number>): Promise<RedisValue> {
    if (this.closed) {
      return Promise.reject(new Error('Redis connection is closed'));
    }

    return new Promise((resolve, reject) => {
      this.pending.push({ resolve, reject });
      this.socket.write(encodeRedisCommand(args), (error) => {
        if (error) {
          const pending = this.pending.pop();
          pending?.reject(error);
        }
      });
    });
  }

  close(): void {
    this.closed = true;
    this.socket.destroy();
    this.rejectAll(new Error('Redis connection closed'));
  }

  private flushReplies(): void {
    while (this.pending.length > 0) {
      const parsed = parseRedisReply(this.buffer);
      if (!parsed) return;

      this.buffer = this.buffer.subarray(parsed.offset);
      const pending = this.pending.shift();
      if (!pending) return;

      if (parsed.value instanceof RedisCommandError) {
        pending.reject(parsed.value);
      } else {
        pending.resolve(parsed.value);
      }
    }
  }

  private rejectAll(error: Error): void {
    const pending = this.pending.splice(0);
    for (const waiter of pending) {
      waiter.reject(error);
    }
  }
}

function parseRedisDatabase(value: string | undefined): number {
  if (!value) return 0;
  const database = Number(value);
  return Number.isInteger(database) && database >= 0 ? database : Number.NaN;
}

function normalizeConfig(
  config: DatabaseConnectionConfig
): RedisConnectionOptions {
  const useTLS = config.ssl === true || typeof config.ssl === 'object';
  return {
    host: config.host || 'localhost',
    port: config.port || (useTLS ? 6380 : 6379),
    database: parseRedisDatabase(config.database),
    username: config.username || undefined,
    password: config.password || undefined,
    useTLS,
  };
}

function redisInfoVersion(info: RedisValue): string | undefined {
  if (typeof info !== 'string') return undefined;
  const match = REDIS_VERSION_REGEX.exec(info);
  return match?.[1]?.trim();
}

function redisValueToString(value: RedisValue): string | null {
  if (value === null) return null;
  if (Array.isArray(value)) return JSON.stringify(value);
  return String(value);
}

function arrayToObject(values: RedisValue): Record<string, unknown> {
  if (!Array.isArray(values)) return {};

  const object: Record<string, unknown> = {};
  for (let index = 0; index < values.length; index += 2) {
    const key = values[index];
    if (typeof key !== 'string') continue;
    object[key] = values[index + 1] ?? null;
  }
  return object;
}

function parseRedisCommandLine(line: string): string[] {
  const args: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;
  let escaping = false;

  for (const char of line.trim()) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }

    if (char === '\\') {
      escaping = true;
      continue;
    }

    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (WHITESPACE_REGEX.test(char)) {
      if (current) {
        args.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (escaping) current += '\\';
  if (quote) throw new Error('Unterminated quoted argument');
  if (current) args.push(current);

  return args;
}

function parseRedisCommands(query: string): string[][] {
  return query
    .split(COMMAND_LINE_SPLIT_REGEX)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map(parseRedisCommandLine)
    .filter((args) => args.length > 0);
}

function isReadOnlyRedisCommand(args: string[]): boolean {
  const command = args[0]?.toUpperCase();
  return !!command && READ_ONLY_COMMANDS.has(command);
}

function rowsFromRedisResult(
  command: string,
  result: RedisValue
): { columns: string[]; rows: Record<string, unknown>[] } {
  const normalizedCommand = command.toUpperCase();

  if (normalizedCommand === 'HGETALL' && Array.isArray(result)) {
    const row = arrayToObject(result);
    return { columns: Object.keys(row), rows: [row] };
  }

  if (normalizedCommand === 'SCAN' && Array.isArray(result)) {
    return {
      columns: ['cursor', 'keys'],
      rows: [
        {
          cursor: result[0],
          keys: JSON.stringify(result[1] ?? []),
        },
      ],
    };
  }

  if (Array.isArray(result)) {
    return {
      columns: ['index', 'value'],
      rows: result.map((value, index) => ({
        index,
        value: redisValueToString(value),
      })),
    };
  }

  return {
    columns: ['result'],
    rows: [{ result }],
  };
}

function buildKeysTable(database: number, rowCount: number): TableInfo {
  const columns: ColumnInfo[] = [
    {
      name: 'key',
      type: 'TEXT',
      nullable: false,
      defaultValue: null,
      isPrimaryKey: true,
    },
    {
      name: 'type',
      type: 'TEXT',
      nullable: false,
      defaultValue: null,
      isPrimaryKey: false,
    },
    {
      name: 'ttl',
      type: 'INTEGER',
      nullable: true,
      defaultValue: null,
      isPrimaryKey: false,
    },
    {
      name: 'size',
      type: 'INTEGER',
      nullable: true,
      defaultValue: null,
      isPrimaryKey: false,
    },
    {
      name: 'value',
      type: 'TEXT',
      nullable: true,
      defaultValue: null,
      isPrimaryKey: false,
    },
  ];

  return {
    name: KEYS_TABLE_NAME,
    type: 'table',
    schema: `db${database}`,
    rowCount,
    columns,
    primaryKey: ['key'],
    indexes: [],
    foreignKeys: [],
    triggers: [],
    sql: '',
  };
}

function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return -1;
  if (b === null || b === undefined) return 1;
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

export class RedisAdapter implements DatabaseAdapter {
  readonly type = 'redis' as const;
  private connections: Map<string, RedisConnectionInfo> = new Map();

  async open(config: DatabaseConnectionConfig): Promise<OpenResult> {
    const options = normalizeConfig(config);
    const validationError = this.validateOptions(options);
    if (validationError) {
      return {
        success: false,
        error: validationError,
        errorCode: 'CONNECTION_ERROR',
      };
    }

    try {
      const client = await this.createAuthenticatedClient(options);
      const id = generateId();
      const displayName =
        config.name || `${options.host}:${options.port}/db${options.database}`;

      const connection: RedisConnectionInfo = {
        id,
        client,
        displayName,
        isReadOnly: config.readOnly ?? false,
        ...options,
      };
      this.connections.set(id, connection);

      return {
        success: true,
        connection: {
          id,
          path: this.buildUrl(connection),
          filename: displayName,
          isEncrypted: options.useTLS,
          isReadOnly: connection.isReadOnly,
          databaseType: 'redis',
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to connect to Redis',
        errorCode: 'CONNECTION_ERROR',
        troubleshootingSteps: [
          'Verify Redis is reachable at the configured host and port',
          'Check the logical database index',
          'Verify username and password if ACL authentication is enabled',
          'Enable TLS only when the Redis endpoint expects TLS',
        ],
      };
    }
  }

  async testConnection(config: DatabaseConnectionConfig): Promise<
    | { success: true; latencyMs: number; serverVersion?: string }
    | {
        success: false;
        error: string;
        errorCode?: 'CONNECTION_ERROR';
        troubleshootingSteps?: string[];
      }
  > {
    const options = normalizeConfig(config);
    const validationError = this.validateOptions(options);
    if (validationError) {
      return {
        success: false,
        error: validationError,
        errorCode: 'CONNECTION_ERROR',
      };
    }

    let client: RedisProtocolClient | null = null;
    try {
      client = await this.createAuthenticatedClient(options);
      const startTime = performance.now();
      await client.command(['PING']);
      const info = await client.command(['INFO', 'server']);
      const latencyMs = Math.round(performance.now() - startTime);
      const version = redisInfoVersion(info);

      return {
        success: true,
        latencyMs,
        serverVersion: version ? `Redis ${version}` : 'Redis',
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to connect to Redis',
        errorCode: 'CONNECTION_ERROR',
        troubleshootingSteps: [
          'Verify Redis is reachable at the configured host and port',
          'Check the logical database index',
          'Verify username and password if ACL authentication is enabled',
          'Enable TLS only when the Redis endpoint expects TLS',
        ],
      };
    } finally {
      client?.close();
    }
  }

  close(
    connectionId: string
  ): { success: true } | { success: false; error: string } {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }

    connection.client.close();
    this.connections.delete(connectionId);
    return { success: true };
  }

  closeAll(): void {
    for (const connection of this.connections.values()) {
      connection.client.close();
    }
    this.connections.clear();
  }

  getConnection(connectionId: string): AdapterConnectionInfo | null {
    const connection = this.connections.get(connectionId);
    if (!connection) return null;

    return {
      id: connection.id,
      path: this.buildUrl(connection),
      filename: connection.displayName,
      isEncrypted: connection.useTLS,
      isReadOnly: connection.isReadOnly,
      databaseType: 'redis',
    };
  }

  getSchema(_connectionId: string):
    | {
        success: true;
        schemas: SchemaInfo[];
        tables: TableInfo[];
        views: TableInfo[];
      }
    | { success: false; error: string } {
    return { success: false, error: 'Use getSchemaAsync for Redis' };
  }

  async getSchemaAsync(connectionId: string): Promise<
    | {
        success: true;
        schemas: SchemaInfo[];
        tables: TableInfo[];
        views: TableInfo[];
      }
    | { success: false; error: string }
  > {
    const connection = this.connections.get(connectionId);
    if (!connection) return { success: false, error: 'Connection not found' };

    try {
      const rowCount = await this.commandNumber(connection, ['DBSIZE']);
      const table = buildKeysTable(connection.database, rowCount);
      const schema = {
        name: `db${connection.database}`,
        tables: [table],
        views: [],
      };

      return {
        success: true,
        schemas: [schema],
        tables: [table],
        views: [],
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load Redis schema',
      };
    }
  }

  getTableStructure(
    connectionId: string,
    tableName: string
  ):
    | { success: true; structure: TableInfo }
    | { success: false; error: string } {
    const connection = this.connections.get(connectionId);
    if (!connection) return { success: false, error: 'Connection not found' };
    if (tableName !== KEYS_TABLE_NAME) {
      return { success: false, error: `Redis table not found: ${tableName}` };
    }

    return {
      success: true,
      structure: buildKeysTable(connection.database, 0),
    };
  }

  async getTableStructureAsync(
    connectionId: string,
    tableName: string
  ): Promise<
    { success: true; structure: TableInfo } | { success: false; error: string }
  > {
    const connection = this.connections.get(connectionId);
    if (!connection) return { success: false, error: 'Connection not found' };
    if (tableName !== KEYS_TABLE_NAME) {
      return { success: false, error: `Redis table not found: ${tableName}` };
    }

    try {
      const rowCount = await this.commandNumber(connection, ['DBSIZE']);
      return {
        success: true,
        structure: buildKeysTable(connection.database, rowCount),
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load Redis table structure',
      };
    }
  }

  getTableData(
    _connectionId: string,
    _table: string,
    _page: number,
    _pageSize: number
  ): GetTableDataResponse {
    return { success: false, error: 'Use getTableDataAsync for Redis' };
  }

  async getTableDataAsync(
    connectionId: string,
    table: string,
    page: number,
    pageSize: number,
    sortColumn?: string,
    sortDirection?: 'asc' | 'desc',
    filters?: Array<{ column: string; operator: string; value: string }>
  ): Promise<GetTableDataResponse> {
    const connection = this.connections.get(connectionId);
    if (!connection) return { success: false, error: 'Connection not found' };
    if (table !== KEYS_TABLE_NAME) {
      return { success: false, error: `Redis table not found: ${table}` };
    }

    try {
      const keys = await this.scanKeys(connection);
      let rows = await this.rowsForKeys(connection, keys);
      rows = this.filterRows(rows, filters);

      if (sortColumn) {
        rows.sort((a, b) => {
          const result = compareValues(a[sortColumn], b[sortColumn]);
          return sortDirection === 'desc' ? -result : result;
        });
      }

      const offset = Math.max(0, page - 1) * pageSize;
      const pagedRows = rows.slice(offset, offset + pageSize);

      return {
        success: true,
        columns: buildKeysTable(connection.database, rows.length).columns,
        rows: pagedRows,
        totalRows: rows.length,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load Redis key data',
      };
    }
  }

  execute(
    _connectionId: string,
    _sql: string
  ):
    | { success: true; changes: number; lastInsertRowid: number }
    | { success: false; error: string } {
    return { success: false, error: 'Use executeAsync for Redis' };
  }

  async executeAsync(
    connectionId: string,
    sql: string
  ): Promise<
    | { success: true; changes: number; lastInsertRowid: number }
    | { success: false; error: string }
  > {
    const result = await this.executeQueryAsync(connectionId, sql);
    if (!result.success) return result;

    return {
      success: true,
      changes: result.changes || 0,
      lastInsertRowid: result.lastInsertRowid || 0,
    };
  }

  query(
    _connectionId: string,
    _sql: string
  ):
    | { success: true; columns: string[]; rows: unknown[][] }
    | { success: false; error: string } {
    return { success: false, error: 'Use queryAsync for Redis' };
  }

  async queryAsync(
    connectionId: string,
    sql: string
  ): Promise<
    | { success: true; columns: string[]; rows: unknown[][] }
    | { success: false; error: string }
  > {
    const result = await this.executeQueryAsync(connectionId, sql);
    if (!result.success) return result;

    return {
      success: true,
      columns: result.columns || [],
      rows: (result.rows || []).map((row) =>
        (result.columns || []).map((column) => row[column])
      ),
    };
  }

  executeQuery(
    _connectionId: string,
    _query: string
  ):
    | {
        success: true;
        columns?: string[];
        rows?: Record<string, unknown>[];
        changes?: number;
        lastInsertRowid?: number;
      }
    | { success: false; error: string } {
    return { success: false, error: 'Use executeQueryAsync for Redis' };
  }

  async executeQueryAsync(
    connectionId: string,
    query: string
  ): Promise<
    | {
        success: true;
        columns?: string[];
        rows?: Record<string, unknown>[];
        changes?: number;
        lastInsertRowid?: number;
      }
    | { success: false; error: string }
  > {
    const connection = this.connections.get(connectionId);
    if (!connection) return { success: false, error: 'Connection not found' };

    try {
      const commands = parseRedisCommands(query);
      if (commands.length === 0) {
        return { success: false, error: 'Enter at least one Redis command' };
      }

      let finalResult: RedisValue = null;
      let finalCommand = commands.at(-1)?.[0] || '';

      for (const command of commands) {
        if (connection.isReadOnly && !isReadOnlyRedisCommand(command)) {
          return {
            success: false,
            error: `Cannot run ${command[0]} on a read-only Redis connection`,
          };
        }

        finalCommand = command[0] || finalCommand;
        finalResult = await connection.client.command(command);
      }

      const mapped = rowsFromRedisResult(finalCommand, finalResult);
      return {
        success: true,
        ...mapped,
        changes: 0,
        lastInsertRowid: 0,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to execute Redis command',
      };
    }
  }

  validateQuery(_connectionId: string, sql: string): ValidationResult {
    try {
      const commands = parseRedisCommands(sql);
      if (commands.length === 0) {
        return { isValid: false, error: 'Enter at least one Redis command' };
      }
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : REDIS_NOT_SQL_ERROR,
      };
    }
  }

  explainQuery(
    _connectionId: string,
    _sql: string
  ):
    | { success: true; plan: QueryPlanNode; stats: QueryPlanStats }
    | { success: false; error: string } {
    return { success: false, error: 'Redis commands do not support EXPLAIN' };
  }

  validateChanges(
    connectionId: string,
    changes: PendingChangeInfo[]
  ):
    | { success: true; results: ValidationResult[] }
    | { success: false; error: string } {
    if (!this.connections.has(connectionId)) {
      return { success: false, error: 'Connection not found' };
    }

    return {
      success: true,
      results: changes.map((change) => ({
        changeId: change.id,
        isValid: false,
        error:
          'Inline editing is not supported for Redis keys. Use raw Redis commands instead.',
      })),
    };
  }

  applyChanges(
    _connectionId: string,
    _changes: PendingChangeInfo[]
  ):
    | { success: true; appliedCount: number }
    | { success: false; error: string } {
    return {
      success: false,
      error:
        'Inline editing is not supported for Redis keys. Use raw Redis commands instead.',
    };
  }

  getPendingChanges(
    connectionId: string
  ):
    | { success: true; changes: PendingChangeInfo[] }
    | { success: false; error: string } {
    if (!this.connections.has(connectionId)) {
      return { success: false, error: 'Connection not found' };
    }
    return { success: true, changes: [] };
  }

  getColumnDistribution(
    _connectionId: string,
    _table: string,
    _column: string
  ): GetColumnDistributionResponse {
    return {
      success: false,
      error: 'Use getColumnDistributionAsync for Redis',
    };
  }

  async getColumnDistributionAsync(
    connectionId: string,
    table: string,
    column: string,
    _schema?: string,
    limit?: number
  ): Promise<GetColumnDistributionResponse> {
    const connection = this.connections.get(connectionId);
    if (!connection) return { success: false, error: 'Connection not found' };
    if (table !== KEYS_TABLE_NAME) {
      return { success: false, error: `Redis table not found: ${table}` };
    }

    try {
      const keys = await this.scanKeys(connection);
      const rows = await this.rowsForKeys(connection, keys);
      const counts = new Map<string, { value: unknown; count: number }>();
      let nullCount = 0;

      for (const row of rows) {
        const value = row[column];
        if (value === null || value === undefined) {
          nullCount += 1;
          continue;
        }

        const key = String(value);
        const current = counts.get(key);
        if (current) {
          current.count += 1;
        } else {
          counts.set(key, { value, count: 1 });
        }
      }

      let distribution = Array.from(counts.values()).sort(
        (a, b) => b.count - a.count
      );
      if (limit && limit > 0) {
        distribution = distribution.slice(0, limit);
      }

      return {
        success: true,
        distribution: distribution.map((item) => ({
          value: item.value,
          count: item.count,
          percentage: rows.length > 0 ? (item.count / rows.length) * 100 : 0,
        })),
        totalRows: rows.length,
        distinctCount: counts.size,
        nullCount,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load Redis value distribution',
      };
    }
  }

  private async createAuthenticatedClient(
    options: RedisConnectionOptions
  ): Promise<RedisProtocolClient> {
    const client = await RedisProtocolClient.connect(options);

    try {
      if (options.password) {
        if (options.username) {
          await client.command(['AUTH', options.username, options.password]);
        } else {
          await client.command(['AUTH', options.password]);
        }
      }

      await client.command(['SELECT', options.database]);
      return client;
    } catch (error) {
      client.close();
      throw error;
    }
  }

  private validateOptions(options: RedisConnectionOptions): string | null {
    if (!options.host) return 'Redis host is required';
    if (!Number.isInteger(options.port) || options.port <= 0) {
      return 'Redis port must be a positive integer';
    }
    if (!Number.isInteger(options.database) || options.database < 0) {
      return 'Redis database must be a non-negative integer';
    }
    return null;
  }

  private buildUrl(connection: RedisConnectionOptions): string {
    const protocol = connection.useTLS ? 'rediss' : 'redis';
    return `${protocol}://${connection.host}:${connection.port}/${connection.database}`;
  }

  private async commandNumber(
    connection: RedisConnectionInfo,
    args: Array<string | number>
  ): Promise<number> {
    const value = await connection.client.command(args);
    return typeof value === 'number' ? value : Number(value) || 0;
  }

  private async scanKeys(connection: RedisConnectionInfo): Promise<string[]> {
    let cursor = '0';
    const keys: string[] = [];

    do {
      const result = await connection.client.command([
        'SCAN',
        cursor,
        'COUNT',
        DEFAULT_SCAN_COUNT,
      ]);
      if (!Array.isArray(result)) {
        throw new TypeError('Unexpected Redis SCAN response');
      }

      cursor = String(result[0] ?? '0');
      const batch = result[1];
      if (Array.isArray(batch)) {
        for (const key of batch) {
          if (typeof key === 'string') keys.push(key);
        }
      }
    } while (cursor !== '0');

    return keys;
  }

  private async rowsForKeys(
    connection: RedisConnectionInfo,
    keys: string[]
  ): Promise<Record<string, unknown>[]> {
    const rows: Record<string, unknown>[] = [];

    for (const key of keys) {
      const type = await this.commandString(connection, ['TYPE', key]);
      const ttl = await this.commandNumber(connection, ['TTL', key]);
      const size = await this.commandOptionalNumber(connection, [
        'MEMORY',
        'USAGE',
        key,
      ]);
      const value = await this.valuePreview(connection, key, type);

      rows.push({ key, type, ttl, size, value });
    }

    return rows;
  }

  private async commandString(
    connection: RedisConnectionInfo,
    args: Array<string | number>
  ): Promise<string> {
    const value = await connection.client.command(args);
    return typeof value === 'string' ? value : String(value ?? '');
  }

  private async commandOptionalNumber(
    connection: RedisConnectionInfo,
    args: Array<string | number>
  ): Promise<number | null> {
    try {
      const value = await connection.client.command(args);
      if (typeof value === 'number') return value;
      const numericValue = Number(value);
      return Number.isFinite(numericValue) ? numericValue : null;
    } catch {
      return null;
    }
  }

  private async valuePreview(
    connection: RedisConnectionInfo,
    key: string,
    type: string
  ): Promise<string | null> {
    switch (type) {
      case 'string':
        return redisValueToString(
          await connection.client.command(['GET', key])
        );
      case 'hash':
        return JSON.stringify(
          arrayToObject(await connection.client.command(['HGETALL', key]))
        );
      case 'list':
        return redisValueToString(
          await connection.client.command(['LRANGE', key, 0, 19])
        );
      case 'set':
        return redisValueToString(
          await connection.client.command(['SMEMBERS', key])
        );
      case 'zset':
        return redisValueToString(
          await connection.client.command(['ZRANGE', key, 0, 19, 'WITHSCORES'])
        );
      case 'stream': {
        const length = await this.commandNumber(connection, ['XLEN', key]);
        return `stream (${length} entries)`;
      }
      case 'none':
        return null;
      default:
        return type;
    }
  }

  private filterRows(
    rows: Record<string, unknown>[],
    filters?: Array<{ column: string; operator: string; value: string }>
  ): Record<string, unknown>[] {
    if (!filters || filters.length === 0) return rows;

    return rows.filter((row) =>
      filters.every((filter) => {
        const value = row[filter.column];
        const text = String(value ?? '');
        const expected = filter.value;
        const operator = filter.operator.toLowerCase();

        switch (operator) {
          case '=':
          case 'equals':
            return text === expected;
          case '!=':
          case 'not equals':
            return text !== expected;
          case 'contains':
          case 'like':
            return text.toLowerCase().includes(expected.toLowerCase());
          case 'starts_with':
          case 'starts with':
            return text.toLowerCase().startsWith(expected.toLowerCase());
          case 'ends_with':
          case 'ends with':
            return text.toLowerCase().endsWith(expected.toLowerCase());
          default:
            return true;
        }
      })
    );
  }
}

export const redisAdapter = new RedisAdapter();
