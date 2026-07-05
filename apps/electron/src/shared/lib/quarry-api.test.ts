import { connectionChannels } from '@shared/domains/database/channels';
import { IPC_CHANNELS } from '@shared/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQuarryAPI } from './quarry-api';

describe('createQuarryAPI', () => {
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

  it('forwards db.open to invoke with the database open channel', async () => {
    const api = createQuarryAPI({ invoke, on, off, getPathForFile });
    const req = {
      connectionId: 'c1',
      path: '/tmp/x.db',
      type: 'sqlite' as const,
    };
    invoke.mockResolvedValueOnce({ success: true });

    await api.db.open(req);

    expect(invoke).toHaveBeenCalledWith(connectionChannels.open.name, req);
  });

  it('registers pg_notify listener and returns cleanup that calls off', () => {
    const api = createQuarryAPI({ invoke, on, off, getPathForFile });
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
    const api = createQuarryAPI({ invoke, on, off, getPathForFile });
    invoke.mockResolvedValueOnce({ success: true });

    await api.ssh.saveCredentials('p1', { password: 'x' });

    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.SSH_SAVE_CREDENTIALS, {
      profileId: 'p1',
      credentials: { password: 'x' },
    });
  });
});
