import { IPC_CHANNELS } from '@shared/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSqlProAPI } from './sql-pro-api';

describe('createSqlProAPI', () => {
  const invoke = vi.fn();
  const on = vi.fn();
  const off = vi.fn();
  const getPathForFile = vi.fn((file: File) => file.name);

  beforeEach(() => {
    invoke.mockReset();
    on.mockReset();
    off.mockReset();
    getPathForFile.mockClear();
  });

  it('forwards db.open to invoke with DB_OPEN channel', async () => {
    const api = createSqlProAPI({ invoke, on, off, getPathForFile });
    const req = {
      connectionId: 'c1',
      path: '/tmp/x.db',
      type: 'sqlite' as const,
    };
    invoke.mockResolvedValueOnce({ success: true });

    await api.db.open(req);

    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.DB_OPEN, req);
  });

  it('forwards file.exists to invoke with FILE_EXISTS channel', async () => {
    const api = createSqlProAPI({ invoke, on, off, getPathForFile });
    const req = { path: '/tmp/a.txt' };
    invoke.mockResolvedValueOnce({ exists: true });

    const result = await api.file.exists(req);

    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.FILE_EXISTS, req);
    expect(result).toEqual({ exists: true });
  });

  it('registers pg_notify listener and returns cleanup that calls off', () => {
    const api = createSqlProAPI({ invoke, on, off, getPathForFile });
    const cb = vi.fn();
    const cleanup = api.pgNotify.onEvent(cb);

    expect(on).toHaveBeenCalledTimes(1);
    expect(on).toHaveBeenCalledWith(
      IPC_CHANNELS.PG_NOTIFY_EVENT,
      expect.any(Function)
    );

    cleanup();
    expect(off).toHaveBeenCalledTimes(1);
    expect(off).toHaveBeenCalledWith(
      IPC_CHANNELS.PG_NOTIFY_EVENT,
      on.mock.calls[0][1]
    );
  });

  it('ssh.saveCredentials uses single payload object and SSH_SAVE_CREDENTIALS', async () => {
    const api = createSqlProAPI({ invoke, on, off, getPathForFile });
    invoke.mockResolvedValueOnce({ success: true });

    await api.ssh.saveCredentials('p1', { password: 'x' });

    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.SSH_SAVE_CREDENTIALS, {
      profileId: 'p1',
      credentials: { password: 'x' },
    });
  });
});
